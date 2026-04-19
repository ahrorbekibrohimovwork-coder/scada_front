import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import type {
  WorkPermit, PermitStatus, BrigadeMember, EDSSignature, DailyBriefing, ExtensionRecord,
} from '../types';
import { INITIAL_PERMITS } from '../data/mockData';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';
let _counter = INITIAL_PERMITS.length + 1;
const uid = () => `id_${++_counter}_${Date.now()}`;

interface CreatePermitData {
  organization: string;
  department: string;
  task: string;
  workStartDateTime: string;
  workEndDateTime: string;
  safetyMeasures: string[];
  specialInstructions: string;
  issuerId: string;
  dispatcherId: string;
  dispatcherAssistantId: string;
  admitterId: string;
  managerId?: string;
  observerId?: string;
  foremanId: string;
  brigadeMembers: BrigadeMember[];
}

interface WorkPermitContextValue {
  permits: WorkPermit[];
  getPermit: (id: string) => WorkPermit | undefined;
  createPermit: (data: CreatePermitData) => Promise<WorkPermit>;
  registerExistingPermit: (id: string, data: CreatePermitData) => WorkPermit;
  // Issuer actions
  signByIssuer: (id: string, sig: EDSSignature) => void;
  updateDraft: (id: string, data: Partial<WorkPermit>) => void;
  // Dispatcher actions
  returnToIssuer: (id: string, comment: string, sig: EDSSignature) => void;
  signByDispatcher: (id: string, sig: EDSSignature) => void;
  // Assistant actions
  acknowledgeByAssistant: (id: string, sig: EDSSignature) => void;
  submitWorkplacesReady: (id: string) => void;
  returnToDispatcher: (id: string, comment: string, fromUserId: string, fromUserName: string) => void;
  // Admitter actions
  returnToAssistant: (id: string, comment: string) => void;
  signByAdmitter: (id: string, liveParts: string, sig: EDSSignature) => void;
  returnToAdmitter: (id: string, comment: string, fromUserId: string, fromUserName: string) => void;
  // Workplace verification (manager/observer/foreman)
  approveWorkplace: (id: string, role: string, sig: EDSSignature) => void;
  returnFromApproved: (id: string, comment: string, fromUserId: string, fromUserName: string) => void;
  returnFromAdmitted: (id: string, comment: string, fromUserId: string, fromUserName: string) => void;
  // Daily briefing
  createBriefing: (id: string, briefing: DailyBriefing) => void;
  signBriefingAdmitter: (id: string, briefingId: string, sig: EDSSignature) => void;
  signBriefingResponsible: (id: string, briefingId: string, sig: EDSSignature) => void;
  signBriefingMember: (id: string, briefingId: string, memberId: string, memberName: string, sig: EDSSignature) => void;
  endDailyWork: (id: string, briefingId: string, endDateTime: string, sig: EDSSignature) => void;
  // Brigade changes
  updateBrigade: (id: string, members: BrigadeMember[], foremanSig: EDSSignature) => void;
  // Extension
  extendPermit: (id: string, newEndDateTime: string, issuerSig: EDSSignature) => void;
  // Closure
  initiateClosure: (id: string, notifyPerson: string, closureDateTime: string, sig: EDSSignature) => void;
  signClosureManager: (id: string, sig: EDSSignature) => void;
  // Cancel
  cancelPermit: (id: string, userId: string, userName: string, reason: string) => void;
  // Helper
  getPermitsByUser: (userId: string, role: string) => WorkPermit[];
}

const Ctx = createContext<WorkPermitContextValue | null>(null);

function addEvent(permit: WorkPermit, userId: string, userName: string, action: string, comment?: string): WorkPermit {
  return {
    ...permit,
    events: [
      ...permit.events,
      { id: uid(), timestamp: new Date().toISOString(), userId, userName, action, comment },
    ],
    updatedAt: new Date().toISOString(),
  };
}

function permitsCount(permits: WorkPermit[]) {
  return permits.length;
}

export function WorkPermitProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, token } = useAuth();
  const [permits, setPermits] = useState<WorkPermit[]>(INITIAL_PERMITS);

  const loadPermits = useCallback(async () => {
    if (!currentUser) return;
    try {
      const url = new URL(`${API_BASE}/api/permits/my`);
      url.searchParams.set('role', currentUser.role);
      url.searchParams.set('userId', currentUser.id);
      const response = await fetch(url.toString(), {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok) {
        throw new Error(`Load permits failed: ${response.status}`);
      }
      const data = await response.json();
      setPermits(data);
    } catch (error) {
      console.warn('Failed to load permits from backend, using local mock data', error);
      setPermits(INITIAL_PERMITS);
    }
  }, [currentUser, token]);

  useEffect(() => {
    if (!currentUser) {
      setPermits(INITIAL_PERMITS);
      return;
    }
    void loadPermits();
  }, [currentUser, loadPermits]);

  const update = useCallback((id: string, fn: (p: WorkPermit) => WorkPermit) => {
    setPermits(prev => prev.map(p => p.id === id ? fn(p) : p));
  }, []);

  const persistAction = async (id: string, action: string, signature?: EDSSignature, briefingId?: string, comment?: string, newEndTime?: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/permits/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ 
          permit_id: parseInt(id), 
          action, 
          new_end_time: newEndTime,
          signature,
          briefing_id: briefingId,
          comment
        }),
      });
      if (!response.ok) throw new Error('Failed to persist action');
    } catch (error) {
      console.error('Persistence error:', error);
    }
  };

  const persistBrigade = useCallback(async (permitId: string, members: BrigadeMember[]) => {
    try {
      const response = await fetch(`${API_BASE}/api/permits/brigade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          permit_id: Number(permitId),
          members: members.filter(m => m.isActive).map(member => ({
            name: member.name,
            role: member.direction || undefined,
            group_number: member.group,
          })),
        }),
      });
      if (!response.ok) {
        throw new Error(`Persist brigade failed: ${response.status}`);
      }
    } catch (error) {
      console.warn('Failed to persist brigade update', error);
    }
  }, [token]);

  const getPermit = useCallback((id: string) => permits.find(p => p.id === id), [permits]);

  const createPermit = useCallback(async (data: CreatePermitData): Promise<WorkPermit> => {
    const now = new Date().toISOString();
    const payload = {
      ...data,
      workStartDateTime: new Date(data.workStartDateTime).toISOString(),
      workEndDateTime: new Date(data.workEndDateTime).toISOString(),
      safetyMeasures: data.safetyMeasures,
      specialInstructions: data.specialInstructions,
      brigadeMembers: data.brigadeMembers,
    };

    try {
      const response = await fetch(`${API_BASE}/api/permits/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`Create permit failed: ${response.status}`);
      }
      const permit = await response.json();
      setPermits(prev => [...prev, permit]);
      return permit;
    } catch (error) {
      console.warn('Backend create failed, saving locally', error);
      const np: WorkPermit = {
        id: uid(),
        number: String(permits.length + 1),
        status: 'draft',
        ...data,
        dailyBriefings: [],
        extensions: [],
        returnComments: [],
        events: [{ id: uid(), timestamp: now, userId: data.issuerId, userName: '', action: 'Черновик наряда-допуска создан' }],
        createdAt: now,
        updatedAt: now,
      };
      setPermits(prev => [...prev, np]);
      return np;
    }
  }, [permits.length, token]);

  const registerExistingPermit = useCallback((id: string, data: CreatePermitData): WorkPermit => {
    const now = new Date().toISOString();
    const permit: WorkPermit = {
      id,
      number: id,
      status: 'draft',
      ...data,
      dailyBriefings: [],
      extensions: [],
      returnComments: [],
      events: [{ id: uid(), timestamp: now, userId: data.issuerId, userName: '', action: 'Наряд-допуск сохранён и подготовлен к выдаче' }],
      createdAt: now,
      updatedAt: now,
    };

    setPermits(prev => {
      const exists = prev.some(p => p.id === id);
      if (exists) {
        return prev.map(p => p.id === id ? { ...p, ...permit } : p);
      }
      return [...prev, permit];
    });

    return permit;
  }, []);

  const updateDraft = useCallback((id: string, data: Partial<WorkPermit>) => {
    update(id, p => ({ ...p, ...data, updatedAt: new Date().toISOString() }));
  }, [update]);

  const signByIssuer = useCallback((id: string, sig: EDSSignature) => {
    void persistAction(id, 'issuer_sign', sig);
    update(id, p => addEvent({
      ...p, status: 'pending_dispatcher', issuerSignature: sig,
    }, sig.userId, sig.userName, 'Наряд-допуск подписан ЭЦП выдающим. Направлен главному диспетчеру.'));
  }, [update]);

  const returnToIssuer = useCallback((id: string, comment: string, sig: EDSSignature) => {
    void persistAction(id, 'dispatcher_return', sig, undefined, comment);
    update(id, p => addEvent({
      ...p,
      status: 'returned_to_issuer',
      returnComments: [...p.returnComments, {
        id: uid(), fromUserId: sig.userId, fromUserName: sig.userName,
        comment, timestamp: new Date().toISOString(), step: 'dispatcher_to_issuer',
      }],
    }, sig.userId, sig.userName, 'Наряд-допуск возвращён выдающему на корректировку', comment));
  }, [update]);

  const signByDispatcher = useCallback((id: string, sig: EDSSignature) => {
    void persistAction(id, 'dispatcher_sign', sig);
    update(id, p => addEvent({
      ...p, status: 'pending_assistant', dispatcherSignature: sig,
    }, sig.userId, sig.userName, 'Разрешение на подготовку рабочих мест подписано ЭЦП (Главный диспетчер)'));
  }, [update]);

  const acknowledgeByAssistant = useCallback((id: string, sig: EDSSignature) => {
    void persistAction(id, 'assistant_ack', sig);
    update(id, p => addEvent({
      ...p, status: 'preparing_workplaces', dispatcherAssistantSignature: sig,
    }, sig.userId, sig.userName, 'Получение разрешения подтверждено ЭЦП (Помощник ГД). Приступает к подготовке рабочих мест.'));
  }, [update]);

  const submitWorkplacesReady = useCallback((id: string) => {
    void persistAction(id, 'assistant_ready');
    update(id, p => addEvent({
      ...p, status: 'pending_admitter',
    }, p.dispatcherAssistantId, '', 'Рабочие места подготовлены и сданы на проверку допускающему'));
  }, [update]);

  const returnToDispatcher = useCallback((id: string, comment: string, sig: EDSSignature) => {
    void persistAction(id, 'assistant_return_to_dispatcher', sig, undefined, comment);
    update(id, p => addEvent({
      ...p,
      status: 'pending_dispatcher',
      dispatcherAssistantSignature: undefined,
      returnComments: [...p.returnComments, {
        id: uid(), fromUserId: sig.userId, fromUserName: sig.userName,
        comment, timestamp: new Date().toISOString(), step: 'assistant_to_dispatcher',
      }],
    }, sig.userId, sig.userName, 'Наряд-допуск возвращён главному диспетчеру на доработку', comment));
  }, [update]);

  const returnToAssistant = useCallback((id: string, comment: string, sig: EDSSignature) => {
    void persistAction(id, 'admitter_return', sig, undefined, comment);
    update(id, p => addEvent({
      ...p,
      status: 'returned_to_assistant',
      returnComments: [...p.returnComments, {
        id: uid(), fromUserId: sig.userId, fromUserName: sig.userName,
        comment, timestamp: new Date().toISOString(), step: 'admitter_to_assistant',
      }],
    }, sig.userId, sig.userName, 'Рабочие места возвращены помощнику ГД на доработку', comment));
  }, [update]);

  const signByAdmitter = useCallback((id: string, liveParts: string, sig: EDSSignature) => {
    void persistAction(id, 'admitter_sign', sig);
    update(id, p => addEvent({
      ...p, status: 'admitter_checked', liveParts, admitterWorkplaceSignature: sig,
    }, sig.userId, sig.userName, 'Рабочие места проверены допускающим. Части под напряжением зафиксированы. Подписано ЭЦП.'));
  }, [update]);

  const returnToAdmitter = useCallback((id: string, comment: string, sig: EDSSignature) => {
    void persistAction(id, 'verifier_return', sig, undefined, comment);
    update(id, p => addEvent({
      ...p,
      status: 'returned_to_admitter',
      returnComments: [...p.returnComments, {
        id: uid(), fromUserId: sig.userId, fromUserName: sig.userName,
        comment, timestamp: new Date().toISOString(), step: 'verifier_to_admitter',
      }],
    }, sig.userId, sig.userName, 'Рабочие места возвращены допускающему на корректировку', comment));
  }, [update]);

  const approveWorkplace = useCallback((id: string, role: 'manager' | 'observer' | 'foreman', sig: EDSSignature) => {
    void persistAction(id, 'verifier_approve', sig);
    update(id, p => addEvent({
      ...p,
      status: 'workplace_approved',
      workplaceVerifierRole: role,
      workplaceVerifierSignature: sig,
    }, sig.userId, sig.userName, `Рабочие места проверены и одобрены. Подписано ЭЦП (${sig.userName}).`));
  }, [update]);

  const returnFromApproved = useCallback((id: string, comment: string, sig: EDSSignature) => {
    void persistAction(id, 'admitter_return_from_approved', sig, undefined, comment);
    update(id, p => addEvent({
      ...p,
      status: 'admitter_checked',
      returnComments: [...p.returnComments, {
        id: uid(), fromUserId: sig.userId, fromUserName: sig.userName,
        comment, timestamp: new Date().toISOString(), step: 'return_from_approved',
      }],
    }, sig.userId, sig.userName, 'Наряд-допуск возвращён на этап проверки рабочих мест', comment));
  }, [update]);

  const returnFromAdmitted = useCallback((id: string, comment: string, sig: EDSSignature) => {
    void persistAction(id, 'responsible_return_from_admitted', sig, undefined, comment);
    update(id, p => addEvent({
      ...p,
      status: 'workplace_approved',
      returnComments: [...p.returnComments, {
        id: uid(), fromUserId: sig.userId, fromUserName: sig.userName,
        comment, timestamp: new Date().toISOString(), step: 'return_from_admitted',
      }],
    }, sig.userId, sig.userName, 'Наряд-допуск возвращён на этап инструктажа', comment));
  }, [update]);

  const createBriefing = useCallback((id: string, briefing: DailyBriefing) => {
    update(id, p => ({
      ...p,
      dailyBriefings: [...p.dailyBriefings, briefing],
      updatedAt: new Date().toISOString(),
    }));
  }, [update]);

  const signBriefingAdmitter = useCallback((id: string, briefingId: string, sig: EDSSignature) => {
    void persistAction(id, 'briefing_admitter_sign', sig, briefingId);
    update(id, p => ({
      ...p,
      dailyBriefings: p.dailyBriefings.map(b =>
        b.id === briefingId ? { ...b, admitterSignature: sig } : b
      ),
      status: 'admitted' as PermitStatus,
      updatedAt: new Date().toISOString(),
      events: [...p.events, {
        id: uid(), timestamp: new Date().toISOString(),
        userId: sig.userId, userName: sig.userName,
        action: `Инструктаж проведён, допуск оформлен. Подписано ЭЦП (Допускающий).`,
      }],
    }));
  }, [update]);

  const signBriefingResponsible = useCallback((id: string, briefingId: string, sig: EDSSignature) => {
    void persistAction(id, 'briefing_responsible_sign', sig, briefingId);
    update(id, p => {
      const updatedBriefings = p.dailyBriefings.map(b =>
        b.id === briefingId ? { ...b, responsibleSignature: sig } : b
      );
      const briefing = updatedBriefings.find(b => b.id === briefingId);
      const allBrigadeSigned = briefing?.isFirst
        ? p.brigadeMembers.filter(m => m.isActive).every(m =>
            briefing.brigadeSignatures.some(s => s.memberId === m.id)
          )
        : true;
      const shouldStartWork = briefing?.admitterSignature && briefing?.responsibleSignature && allBrigadeSigned;
      return {
        ...p,
        dailyBriefings: updatedBriefings,
        status: shouldStartWork ? 'in_progress' as PermitStatus : p.status,
        updatedAt: new Date().toISOString(),
        events: [...p.events, {
          id: uid(), timestamp: new Date().toISOString(),
          userId: sig.userId, userName: sig.userName,
          action: shouldStartWork
            ? `Инструктаж подтверждён ЭЦП (${sig.userName}). Наряд-допуск допущен к производству работ.`
            : `Инструктаж подтверждён ЭЦП (${sig.userName})`,
        }],
      };
    });
  }, [persistAction, update]);

  const signBriefingMember = useCallback((id: string, briefingId: string, memberId: string, memberName: string, sig: EDSSignature) => {
    update(id, p => {
      const updatedBriefings = p.dailyBriefings.map(b =>
        b.id === briefingId
          ? { ...b, brigadeSignatures: [...b.brigadeSignatures, { memberId, memberName, sig }] }
          : b
      );
      const briefing = updatedBriefings.find(b => b.id === briefingId);
      const allBrigadeSigned = briefing?.isFirst
        ? p.brigadeMembers.filter(m => m.isActive).every(m =>
            briefing.brigadeSignatures.some(s => s.memberId === m.id)
          )
        : true;
      const shouldStartWork = briefing?.admitterSignature && briefing?.responsibleSignature && allBrigadeSigned;
      if (shouldStartWork) {
        void persistAction(id, 'start_work');
      }
      return {
        ...p,
        dailyBriefings: updatedBriefings,
        status: shouldStartWork ? 'in_progress' as PermitStatus : p.status,
        updatedAt: new Date().toISOString(),
        events: [...p.events, {
          id: uid(), timestamp: new Date().toISOString(),
          userId: sig.userId, userName: sig.userName,
          action: shouldStartWork
            ? `Получение инструктажа подтверждено ЭЦП (${memberName}). Все подписи получены — наряд-допуск в работе.`
            : `Получение инструктажа подтверждено ЭЦП (${memberName})`,
        }],
      };
    });
  }, [persistAction, update]);

  const endDailyWork = useCallback((id: string, briefingId: string, endDateTime: string, sig: EDSSignature) => {
    void persistAction(id, 'end_daily');
    update(id, p => addEvent({
      ...p,
      status: 'daily_ended',
      dailyBriefings: p.dailyBriefings.map(b =>
        b.id === briefingId ? { ...b, endDateTime, endSignature: sig } : b
      ),
    }, sig.userId, sig.userName, `Ежедневные работы завершены. Дата/время: ${new Date(endDateTime).toLocaleString('ru-RU')}. Подписано ЭЦП.`));
  }, [persistAction, update]);

  const updateBrigade = useCallback((id: string, members: BrigadeMember[], foremanSig: EDSSignature) => {
    void persistBrigade(id, members);
    update(id, p => addEvent({
      ...p,
      brigadeMembers: members,
    }, foremanSig.userId, foremanSig.userName, 'Состав бригады изменён. Подписано ЭЦП производителем работ.'));
  }, [persistBrigade, update]);

  const extendPermit = useCallback((id: string, newEndDateTime: string, issuerSig: EDSSignature) => {
    void persistAction(id, 'extend', { new_end_time: newEndDateTime });
    const ext: ExtensionRecord = {
      id: uid(), requestedByName: issuerSig.userName, newEndDateTime, issuerSignature: issuerSig,
    };
    update(id, p => addEvent({
      ...p,
      workEndDateTime: newEndDateTime,
      status: 'in_progress',
      extensions: [...p.extensions, ext],
    }, issuerSig.userId, issuerSig.userName, `Наряд-допуск продлён до ${new Date(newEndDateTime).toLocaleString('ru-RU')}. Подписано ЭЦП.`));
  }, [persistAction, update]);

  const initiateClosure = useCallback((id: string, notifyPerson: string, closureDateTime: string, sig: EDSSignature) => {
    void persistAction(id, 'foreman_close');
    update(id, p => {
      const updated = addEvent({
        ...p,
        status: p.managerId ? 'closing' : 'closed',
        closureNotifyPerson: notifyPerson,
        closureDateTime,
        foremanClosureSignature: sig,
      }, sig.userId, sig.userName, 'Закрытие наряда-допуска инициировано. Подписано ЭЦП производителем работ.');
      return updated;
    });
  }, [persistAction, update]);

  const signClosureManager = useCallback((id: string, sig: EDSSignature) => {
    void persistAction(id, 'manager_close');
    update(id, p => addEvent({
      ...p, status: 'closed', managerClosureSignature: sig,
    }, sig.userId, sig.userName, 'Закрытие подтверждено ЭЦП (Ответственный руководитель). Наряд-допуск закрыт.'));
  }, [persistAction, update]);

  const cancelPermit = useCallback((id: string, userId: string, userName: string, reason: string) => {
    void persistAction(id, 'cancel');
    update(id, p => addEvent({
      ...p, status: 'cancelled',
    }, userId, userName, 'Наряд-допуск аннулирован', reason));
  }, [persistAction, update]);

  const getPermitsByUser = useCallback((userId: string, role: string): WorkPermit[] => {
    const roleMatch = (permitUserId?: string) => !permitUserId || permitUserId === userId;
    switch (role) {
      case 'issuer':               return permits;
      case 'dispatcher':           return permits.filter(p => roleMatch(p.dispatcherId));
      case 'dispatcher_assistant': return permits.filter(p => roleMatch(p.dispatcherAssistantId));
      case 'admitter':             return permits.filter(p => roleMatch(p.admitterId));
      case 'manager':              return permits.filter(p => roleMatch(p.managerId));
      case 'observer':             return permits.filter(p => roleMatch(p.observerId));
      case 'foreman':              return permits.filter(p => roleMatch(p.foremanId));
      case 'worker':               return permits.filter(p => p.brigadeMembers.some(m => m.userId === userId && m.isActive));
      default: return [];
    }
  }, [permits]);

  return (
    <Ctx.Provider value={{
      permits, getPermit, createPermit, registerExistingPermit, updateDraft, signByIssuer,
      returnToIssuer, signByDispatcher, acknowledgeByAssistant,
      submitWorkplacesReady, returnToDispatcher, returnToAssistant, signByAdmitter,
      returnToAdmitter, approveWorkplace, returnFromApproved, returnFromAdmitted,
      createBriefing,
      signBriefingAdmitter, signBriefingResponsible, signBriefingMember,
      endDailyWork, updateBrigade, extendPermit, initiateClosure,
      signClosureManager, cancelPermit, getPermitsByUser,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useWorkPermit() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useWorkPermit');
  return c;
}
