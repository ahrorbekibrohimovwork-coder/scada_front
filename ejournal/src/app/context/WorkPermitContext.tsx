import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import type {
  WorkPermit, PermitStatus, BrigadeMember, EDSSignature, DailyBriefing,
  ExtensionRecord, PermitVersion, AssistantCheckItem, NextDayRequest,
} from '../types';
import { INITIAL_PERMITS } from '../data/mockData';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';

let _ctr = INITIAL_PERMITS.length + 1;
const uid = () => `id_${++_ctr}_${Date.now()}`;

interface CreatePermitData {
  organization: string; department: string; task: string;
  workStartDateTime: string; workEndDateTime: string;
  safetyMeasures: string[]; specialInstructions: string;
  issuerId: string; dispatcherId: string; dispatcherAssistantId: string;
  admitterId: string; managerId?: string; observerId?: string; foremanId: string;
  brigadeMembers: BrigadeMember[];
}

interface WorkPermitContextValue {
  permits: WorkPermit[];
  getPermit: (id: string) => WorkPermit | undefined;
  createPermit: (data: CreatePermitData) => Promise<WorkPermit>;
  updateDraft: (id: string, data: Partial<WorkPermit>) => void;
  signByIssuer: (id: string, sig: EDSSignature) => void;
  returnToIssuer: (id: string, comment: string, sig: EDSSignature) => void;
  signByDispatcher: (id: string, sig: EDSSignature) => void;
  acknowledgeByAssistant: (id: string, sig: EDSSignature) => void;
  submitWorkplacesReady: (id: string) => void;
  returnToAssistant: (id: string, comment: string) => void;
  signByAdmitter: (id: string, liveParts: string, sig: EDSSignature) => void;
  returnToAdmitter: (id: string, comment: string, fromUserId: string, fromUserName: string) => void;
  approveWorkplace: (id: string, role: string, sig: EDSSignature) => void;
  createBriefing: (id: string, briefing: DailyBriefing) => void;
  signBriefingAdmitter: (id: string, briefingId: string, sig: EDSSignature) => void;
  signBriefingResponsible: (id: string, briefingId: string, sig: EDSSignature) => void;
  signBriefingMember: (id: string, briefingId: string, memberId: string, memberName: string, sig: EDSSignature) => void;
  endDailyWork: (id: string, briefingId: string, endDateTime: string, sig: EDSSignature) => void;
  requestNextDay: (id: string, userId: string, userName: string) => void;
  approveNextDay: (id: string, sig: EDSSignature) => void;
  updateBrigade: (id: string, members: BrigadeMember[], foremanSig: EDSSignature) => void;
  extendPermit: (id: string, newEndDateTime: string, issuerSig: EDSSignature) => void;
  initiateClosure: (id: string, notifyPerson: string, closureDateTime: string, sig: EDSSignature) => void;
  signClosureManager: (id: string, sig: EDSSignature) => void;
  cancelPermit: (id: string, userId: string, userName: string, reason: string) => void;
  saveRework: (id: string, safetyMeasures: string[], specialInstructions: string) => void;
  saveAssistantChecklist: (id: string, checklist: AssistantCheckItem[]) => void;
  getPermitsByUser: (userId: string, role: string) => WorkPermit[];
}

const Ctx = createContext<WorkPermitContextValue | null>(null);

function addEvent(permit: WorkPermit, userId: string, userName: string, action: string, comment?: string): WorkPermit {
  return {
    ...permit,
    events: [...permit.events, { id: uid(), timestamp: new Date().toISOString(), userId, userName, action, comment }],
    updatedAt: new Date().toISOString(),
  };
}

function addVersion(permit: WorkPermit, status: PermitStatus, authorName: string, description: string): WorkPermit {
  const v: PermitVersion = {
    id: uid(),
    version: (permit.versions?.length ?? 0) + 1,
    status,
    createdAt: new Date().toISOString(),
    authorName,
    description,
    snapshot: { safetyMeasures: [...permit.safetyMeasures], specialInstructions: permit.specialInstructions },
  };
  return { ...permit, versions: [...(permit.versions ?? []), v] };
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
      const resp = await fetch(url.toString(), {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (resp.ok) {
        setPermits(await resp.json());
      }
    } catch (e) {
      console.warn('Failed to load permits', e);
    }
  }, [currentUser, token]);

  useEffect(() => {
    if (currentUser) loadPermits();
  }, [currentUser, loadPermits]);

  const update = useCallback((id: string, fn: (p: WorkPermit) => WorkPermit) => {
    setPermits(prev => prev.map(p => p.id === id ? fn(p) : p));
  }, []);

  const persistAction = async (id: string, action: string, signature?: EDSSignature, briefingId?: string, comment?: string, newEndTime?: string, extra?: Record<string, unknown>) => {
    try {
      const resp = await fetch(`${API_BASE}/api/permits/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ permit_id: parseInt(id), action, signature, briefing_id: briefingId, comment, new_end_time: newEndTime, ...extra }),
      });
      if (resp.ok) {
        await loadPermits(); // Reload from server to be sure
      }
    } catch (e) { console.error('Persist action failed', e); }
  };

  const getPermit = useCallback((id: string) => permits.find(p => p.id === id), [permits]);

  const createPermit = useCallback(async (data: CreatePermitData): Promise<WorkPermit> => {
    try {
      const resp = await fetch(`${API_BASE}/api/permits/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(data),
      });
      if (resp.ok) {
        const p = await resp.json();
        setPermits(prev => [...prev, p]);
        return p;
      }
    } catch (e) {}
    
    // Fallback
    const now = new Date().toISOString();
    const np: WorkPermit = {
      id: uid(), number: String(permits.length + 1), status: 'draft', ...data,
      dailyBriefings: [], extensions: [], returnComments: [], versions: [],
      events: [{ id: uid(), timestamp: now, userId: data.issuerId, userName: '', action: 'Черновик создан' }],
      createdAt: now, updatedAt: now,
    };
    setPermits(prev => [...prev, np]);
    return np;
  }, [permits.length, token]);

  const updateDraft = useCallback((id: string, data: Partial<WorkPermit>) => {
    update(id, p => ({ ...p, ...data, updatedAt: new Date().toISOString() }));
  }, [update]);

  const signByIssuer = useCallback((id: string, sig: EDSSignature) => {
    persistAction(id, 'issuer_sign', sig);
    update(id, p => {
      const isRework = p.status === 'rework';
      let updated = addEvent({
        ...p, status: 'pending_dispatcher', issuerSignature: sig,
      }, sig.userId, sig.userName, isRework ? 'Наряд доработан и повторно подписан ЭЦП (Выдающий)' : 'Наряд-допуск подписан ЭЦП (Выдающий). Направлен главному диспетчеру.');
      updated = addVersion(updated, 'pending_dispatcher', sig.userName, isRework ? 'Доработан, подписан повторно' : 'Первоначальная выдача наряда-допуска');
      return updated;
    });
  }, [update]);

  const returnToIssuer = useCallback((id: string, comment: string, sig: EDSSignature) => {
    persistAction(id, 'dispatcher_return', sig, undefined, comment);
    update(id, p => {
      let updated = addEvent({
        ...p,
        status: 'rework',
        returnComments: [...p.returnComments, {
          id: uid(), fromUserId: sig.userId, fromUserName: sig.userName,
          comment, timestamp: new Date().toISOString(), step: 'dispatcher_to_issuer',
        }],
      }, sig.userId, sig.userName, 'Наряд-допуск возвращён на доработку', comment);
      updated = addVersion(updated, 'rework', sig.userName, `Возвращён на доработку: ${comment.slice(0, 60)}...`);
      return updated;
    });
  }, [update]);

  const signByDispatcher = useCallback((id: string, sig: EDSSignature) => {
    persistAction(id, 'dispatcher_sign', sig);
    update(id, p => addEvent({ ...p, status: 'pending_assistant', dispatcherSignature: sig },
      sig.userId, sig.userName, 'Разрешение на подготовку рабочих мест подписано ЭЦП (Главный диспетчер)'));
  }, [update]);

  const acknowledgeByAssistant = useCallback((id: string, sig: EDSSignature) => {
    persistAction(id, 'assistant_ack', sig);
    update(id, p => addEvent({ ...p, status: 'preparing_workplaces', dispatcherAssistantSignature: sig },
      sig.userId, sig.userName, 'Получение разрешения подтверждено ЭЦП (Помощник ГД)'));
  }, [update]);

  const submitWorkplacesReady = useCallback((id: string) => {
    persistAction(id, 'assistant_ready');
    update(id, p => addEvent({ ...p, status: 'pending_admitter' }, p.dispatcherAssistantId, '', 'Рабочие места подготовлены и сданы допускающему'));
  }, [update]);

  const returnToAssistant = useCallback((id: string, comment: string) => {
    persistAction(id, 'admitter_return', undefined, undefined, comment);
    update(id, p => addEvent({
      ...p, status: 'returned_to_assistant',
      returnComments: [...p.returnComments, { id: uid(), fromUserId: p.admitterId, fromUserName: '', comment, timestamp: new Date().toISOString(), step: 'admitter_to_assistant' }],
    }, p.admitterId, '', 'Рабочие места возвращены помощнику ГД на доработку', comment));
  }, [update]);

  const signByAdmitter = useCallback((id: string, liveParts: string, sig: EDSSignature) => {
    persistAction(id, 'admitter_sign', sig);
    update(id, p => addEvent({ ...p, status: 'admitter_checked', liveParts, admitterWorkplaceSignature: sig },
      sig.userId, sig.userName, 'Рабочие места проверены допускающим. Подписано ЭЦП.'));
  }, [update]);

  const returnToAdmitter = useCallback((id: string, comment: string, fromUserId: string, fromUserName: string) => {
    persistAction(id, 'verifier_return', undefined, undefined, comment);
    update(id, p => addEvent({
      ...p, status: 'returned_to_admitter',
      returnComments: [...p.returnComments, { id: uid(), fromUserId, fromUserName, comment, timestamp: new Date().toISOString(), step: 'verifier_to_admitter' }],
    }, fromUserId, fromUserName, 'Рабочие места возвращены допускающему', comment));
  }, [update]);

  const approveWorkplace = useCallback((id: string, role: string, sig: EDSSignature) => {
    persistAction(id, 'verifier_approve', sig, undefined, undefined, undefined, { verifier_role: role });
    update(id, p => addEvent({ ...p, status: 'workplace_approved', workplaceVerifierRole: role, workplaceVerifierSignature: sig },
      sig.userId, sig.userName, `Рабочие места одобрены. Подписано ЭЦП (${sig.userName}).`));
  }, [update]);

  const createBriefing = useCallback(async (id: string, briefing: DailyBriefing) => {
    try {
      const resp = await fetch(`${API_BASE}/api/permits/create_briefing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ permit_id: parseInt(id), work_location: briefing.workLocationName }),
      });
      if (resp.ok) {
        await loadPermits();
      }
    } catch (e) { console.error('Create briefing failed', e); }
  }, [loadPermits, token]);

  const signBriefingAdmitter = useCallback((id: string, briefingId: string, sig: EDSSignature) => {
    persistAction(id, 'briefing_admitter_sign', sig, briefingId);
    update(id, p => ({
      ...p,
      dailyBriefings: p.dailyBriefings.map(b => b.id === briefingId ? { ...b, admitterSignature: sig } : b),
      status: 'admitted' as PermitStatus,
      updatedAt: new Date().toISOString(),
      events: [...p.events, { id: uid(), timestamp: new Date().toISOString(), userId: sig.userId, userName: sig.userName, action: 'Инструктаж проведён, допуск оформлен. Подписано ЭЦП (Допускающий).' }],
    }));
  }, [update]);

  const signBriefingResponsible = useCallback((id: string, briefingId: string, sig: EDSSignature) => {
    persistAction(id, 'briefing_responsible_sign', sig, briefingId);
    update(id, p => {
      const briefing = p.dailyBriefings.find(b => b.id === briefingId);
      const allMembersSigned = !briefing?.isFirst ||
        p.brigadeMembers.filter(m => m.isActive).every(m =>
          briefing.brigadeSignatures.some(s => s.memberId === m.id)
        );
      const newStatus = allMembersSigned ? 'in_progress' : (briefing?.isFirst ? 'admitted' : 'in_progress');

      return {
        ...p,
        dailyBriefings: p.dailyBriefings.map(b => b.id === briefingId ? { ...b, responsibleSignature: sig } : b),
        status: newStatus as PermitStatus,
        updatedAt: new Date().toISOString(),
        events: [...p.events, { id: uid(), timestamp: new Date().toISOString(), userId: sig.userId, userName: sig.userName, action: `Инструктаж подтверждён ЭЦП (${sig.userName})` }],
      };
    });
  }, [update]);

  const signBriefingMember = useCallback((id: string, briefingId: string, memberId: string, memberName: string, sig: EDSSignature) => {
    persistAction(id, 'member_sign', sig, briefingId);
    update(id, p => {
      const briefing = p.dailyBriefings.find(b => b.id === briefingId);
      const updatedSignatures = [...(briefing?.brigadeSignatures || []), { memberId, memberName, sig }];
      const updatedMembers = p.brigadeMembers.map(m =>
        m.id === memberId && !m.firstBriefingSignature ? { ...m, firstBriefingSignature: sig } : m
      );
      const membersNeedingSignature = p.brigadeMembers.filter(m => m.isActive && !m.firstBriefingSignature);
      const allRequiredSigned = membersNeedingSignature.every(m => updatedSignatures.some(s => s.memberId === m.id));
      const newStatus = (briefing?.isFirst && briefing.admitterSignature && briefing.responsibleSignature && allRequiredSigned)
        ? 'in_progress' : p.status;

      return {
        ...p, status: newStatus, brigadeMembers: updatedMembers,
        dailyBriefings: p.dailyBriefings.map(b => b.id === briefingId ? { ...b, brigadeSignatures: updatedSignatures } : b),
        updatedAt: new Date().toISOString(),
        events: [...p.events, { id: uid(), timestamp: new Date().toISOString(), userId: sig.userId, userName: sig.userName, action: `Получение инструктажа подтверждено ЭЦП (${memberName})` }],
      };
    });
  }, [update]);

  const endDailyWork = useCallback((id: string, briefingId: string, endDateTime: string, sig: EDSSignature) => {
    persistAction(id, 'end_daily', sig, briefingId);
    update(id, p => addEvent({
      ...p, status: 'daily_ended',
      dailyBriefings: p.dailyBriefings.map(b => b.id === briefingId ? { ...b, endDateTime, endSignature: sig } : b),
    }, sig.userId, sig.userName, `Ежедневные работы завершены. Подписано ЭЦП.`));
  }, [update]);

  const requestNextDay = useCallback((id: string, userId: string, userName: string) => {
    persistAction(id, 'request_next_day', undefined, undefined, userName);
    update(id, p => {
      const dayNumber = p.dailyBriefings.length + 1;
      const request: NextDayRequest = {
        id: uid(), requestedBy: userId, requestedByName: userName, requestedAt: new Date().toISOString(),
        dayNumber, status: 'pending',
      };
      return addEvent({ ...p, nextDayRequest: request }, userId, userName, `Запрошено начало работ следующего дня (День ${dayNumber})`);
    });
  }, [update]);

  const approveNextDay = useCallback((id: string, sig: EDSSignature) => {
    persistAction(id, 'approve_next_day', sig);
    update(id, p => {
      if (!p.nextDayRequest || p.nextDayRequest.status !== 'pending') return p;
      const approvedRequest: NextDayRequest = {
        ...p.nextDayRequest, status: 'approved', approvedBy: sig.userId, approvedByName: sig.userName, approvedAt: new Date().toISOString(),
      };
      const newBriefing: DailyBriefing = {
        id: uid(), isFirst: false, brigadeSignatures: [],
        workLocationName: p.dailyBriefings[p.dailyBriefings.length - 1]?.workLocationName || '',
        briefingDateTime: new Date().toISOString(),
      };
      return addEvent({ ...p, nextDayRequest: approvedRequest, dailyBriefings: [...p.dailyBriefings, newBriefing], status: 'admitted' },
        sig.userId, sig.userName, `Одобрен запрос на начало следующего дня. Создан инструктаж День ${approvedRequest.dayNumber}. Подписано ЭЦП.`);
    });
  }, [update]);

  const updateBrigade = useCallback((id: string, members: BrigadeMember[], foremanSig: EDSSignature) => {
    fetch(`${API_BASE}/api/permits/brigade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ permit_id: parseInt(id), members: members.filter(m => m.isActive).map(m => ({ name: m.name, group_number: m.group, role: m.direction })) }),
    });
    update(id, p => addEvent({ ...p, brigadeMembers: members }, foremanSig.userId, foremanSig.userName, 'Состав бригады изменён. Подписано ЭЦП.'));
  }, [token, update]);

  const extendPermit = useCallback((id: string, newEndDateTime: string, issuerSig: EDSSignature) => {
    persistAction(id, 'extend', issuerSig, undefined, undefined, newEndDateTime);
    const ext: ExtensionRecord = { id: uid(), requestedByName: issuerSig.userName, newEndDateTime, issuerSignature: issuerSig };
    update(id, p => {
      let updated = addEvent({ ...p, workEndDateTime: newEndDateTime, status: 'in_progress', extensions: [...p.extensions, ext] },
        issuerSig.userId, issuerSig.userName, `Наряд-допуск продлён. Подписано ЭЦП.`);
      updated = addVersion(updated, 'extended', issuerSig.userName, `Продлён до ${new Date(newEndDateTime).toLocaleString('ru-RU')}`);
      return updated;
    });
  }, [update]);

  const initiateClosure = useCallback((id: string, notifyPerson: string, closureDateTime: string, sig: EDSSignature) => {
    persistAction(id, 'foreman_close', sig, undefined, notifyPerson);
    update(id, p => addEvent({
      ...p, status: p.managerId ? 'closing' : 'closed',
      closureNotifyPerson: notifyPerson, closureDateTime, foremanClosureSignature: sig,
    }, sig.userId, sig.userName, 'Закрытие наряда инициировано. Подписано ЭЦП производителем работ.'));
  }, [update]);

  const signClosureManager = useCallback((id: string, sig: EDSSignature) => {
    persistAction(id, 'manager_close', sig);
    update(id, p => addEvent({ ...p, status: 'closed', managerClosureSignature: sig },
      sig.userId, sig.userName, 'Закрытие подтверждено ЭЦП (Ответственный руководитель). Наряд-допуск закрыт.'));
  }, [update]);

  const cancelPermit = useCallback((id: string, userId: string, userName: string, reason: string) => {
    persistAction(id, 'cancel', undefined, undefined, reason);
    update(id, p => addEvent({ ...p, status: 'cancelled' }, userId, userName, 'Наряд-допуск аннулирован', reason));
  }, [update]);

  const saveRework = useCallback((id: string, safetyMeasures: string[], specialInstructions: string) => {
    fetch(`${API_BASE}/api/permits/save_rework`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ permit_id: parseInt(id), safety_measures: safetyMeasures, special_instructions: specialInstructions }),
    });
    update(id, p => ({
      ...p, safetyMeasures, specialInstructions, updatedAt: new Date().toISOString(),
      events: [...p.events, { id: uid(), timestamp: new Date().toISOString(), userId: p.issuerId, userName: '', action: 'Меры безопасности обновлены (доработка)' }],
    }));
  }, [token, update]);

  const saveAssistantChecklist = useCallback((id: string, checklist: AssistantCheckItem[]) => {
    fetch(`${API_BASE}/api/permits/save_checklist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ permit_id: parseInt(id), checklist }),
    });
    update(id, p => ({
      ...p, assistantChecklist: checklist, updatedAt: new Date().toISOString(),
      events: [...p.events, { id: uid(), timestamp: new Date().toISOString(), userId: p.dispatcherAssistantId, userName: '', action: 'Чек-лист мер безопасности обновлён (Помощник ГД)' }],
    }));
  }, [token, update]);

  const getPermitsByUser = useCallback((userId: string, role: string): WorkPermit[] => {
    // Since permits are already loaded from the server filtered for this user,
    // we return all of them. The server-side filtering is authoritative.
    return permits;
  }, [permits]);

  return (
    <Ctx.Provider value={{
      permits, getPermit, createPermit, updateDraft, signByIssuer, returnToIssuer,
      signByDispatcher, acknowledgeByAssistant, submitWorkplacesReady, returnToAssistant,
      signByAdmitter, returnToAdmitter, approveWorkplace, createBriefing, signBriefingAdmitter,
      signBriefingResponsible, signBriefingMember, endDailyWork, requestNextDay, approveNextDay,
      updateBrigade, extendPermit, initiateClosure, signClosureManager, cancelPermit, saveRework,
      saveAssistantChecklist, getPermitsByUser,
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