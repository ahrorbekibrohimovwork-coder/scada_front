import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type {
  WorkPermit, PermitStatus, BrigadeMember, EDSSignature, DailyBriefing,
  AssistantCheckItem,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'https://scruffy-chaos-drift.ngrok-free.dev';

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
  loading: boolean;
  refresh: () => Promise<void>;
  getPermit: (id: string) => WorkPermit | undefined;
  createPermit: (data: CreatePermitData) => Promise<WorkPermit>;
  signByIssuer: (id: string, sig: EDSSignature) => Promise<void>;
  signByDispatcher: (id: string, sig: EDSSignature) => Promise<void>;
  acknowledgeByAssistant: (id: string, sig: EDSSignature) => Promise<void>;
  submitWorkplacesReady: (id: string) => Promise<void>;
  signByAdmitter: (id: string, liveParts: string, sig: EDSSignature) => Promise<void>;
  approveWorkplace: (id: string, role: string, sig: EDSSignature) => Promise<void>;
  createBriefing: (id: string, briefing: Partial<DailyBriefing>) => Promise<void>;
  signBriefingAdmitter: (id: string, briefingId: string, sig: EDSSignature) => Promise<void>;
  signBriefingResponsible: (id: string, briefingId: string, sig: EDSSignature) => Promise<void>;
  signBriefingMember: (id: string, briefingId: string, memberId: string, memberName: string, sig: EDSSignature) => Promise<void>;
  endDailyWork: (id: string, briefingId: string, endDateTime: string, sig: EDSSignature) => Promise<void>;
  extendPermit: (id: string, newEndDateTime: string, issuerSig: EDSSignature) => Promise<void>;
  initiateClosure: (id: string, notifyPerson: string, closureDateTime: string, sig: EDSSignature) => Promise<void>;
  signClosureManager: (id: string, sig: EDSSignature) => Promise<void>;
  cancelPermit: (id: string, userId: string, userName: string, reason: string) => Promise<void>;
  saveRework: (id: string, safetyMeasures: string[], specialInstructions: string) => Promise<void>;
  saveAssistantChecklist: (id: string, checklist: AssistantCheckItem[]) => Promise<void>;
  getPermitsByUser: (userId: string, role: string) => WorkPermit[];
}

const Ctx = createContext<WorkPermitContextValue | null>(null);

export function WorkPermitProvider({ children }: { children: React.ReactNode }) {
  const [permits, setPermits] = useState<WorkPermit[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/api/permits/`);
      if (r.ok) {
        const data = await r.json();
        setPermits(data);
      }
    } catch (e) {
      console.error('Failed to fetch permits', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getPermit = useCallback((id: string) => permits.find(p => String(p.id) === String(id)), [permits]);

  const createPermit = useCallback(async (data: CreatePermitData): Promise<WorkPermit> => {
    const r = await fetch(`${API_BASE}/api/permits/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!r.ok) throw new Error('Failed to create permit');
    const np = await r.json();
    setPermits(prev => [np, ...prev]);
    return np;
  }, []);

  const apiAction = useCallback(async (permit_id: string, action: string, extra: any = {}) => {
    const r = await fetch(`${API_BASE}/api/permits/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permit_id: parseInt(permit_id), action, ...extra }),
    });
    if (!r.ok) throw new Error(`Action ${action} failed`);
    await refresh();
  }, [refresh]);

  const signByIssuer = useCallback((id: string, sig: EDSSignature) => 
    apiAction(id, 'issuer_sign', { signature: sig }), [apiAction]);

  const signByDispatcher = useCallback((id: string, sig: EDSSignature) => 
    apiAction(id, 'dispatcher_sign', { signature: sig }), [apiAction]);

  const acknowledgeByAssistant = useCallback((id: string, sig: EDSSignature) => 
    apiAction(id, 'assistant_ack', { signature: sig }), [apiAction]);

  const submitWorkplacesReady = useCallback((id: string) => 
    apiAction(id, 'assistant_ready'), [apiAction]);

  const signByAdmitter = useCallback((id: string, liveParts: string, sig: EDSSignature) => 
    apiAction(id, 'admitter_sign', { signature: sig, comment: liveParts }), [apiAction]);

  const approveWorkplace = useCallback((id: string, role: string, sig: EDSSignature) => 
    apiAction(id, 'verifier_approve', { signature: sig }), [apiAction]);

  const createBriefing = useCallback(async (id: string, briefing: Partial<DailyBriefing>) => {
    const r = await fetch(`${API_BASE}/api/permits/create_briefing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permit_id: parseInt(id), work_location: briefing.workLocationName }),
    });
    if (!r.ok) throw new Error('Failed to create briefing');
    await refresh();
  }, [refresh]);

  const signBriefingAdmitter = useCallback((id: string, briefingId: string, sig: EDSSignature) => 
    apiAction(id, 'briefing_admitter_sign', { briefing_id: briefingId, signature: sig }), [apiAction]);

  const signBriefingResponsible = useCallback((id: string, briefingId: string, sig: EDSSignature) => 
    apiAction(id, 'briefing_responsible_sign', { briefing_id: briefingId, signature: sig }), [apiAction]);

  const signBriefingMember = useCallback((id: string, briefingId: string, memberId: string, memberName: string, sig: EDSSignature) => 
    apiAction(id, 'member_sign', { briefing_id: briefingId, signature: sig, comment: memberName }), [apiAction]);

  const endDailyWork = useCallback((id: string, briefingId: string, endDateTime: string, sig: EDSSignature) => 
    apiAction(id, 'end_daily', { briefing_id: briefingId, signature: sig }), [apiAction]);

  const extendPermit = useCallback((id: string, newEndDateTime: string, issuerSig: EDSSignature) => 
    apiAction(id, 'extend', { new_end_time: newEndDateTime, signature: issuerSig }), [apiAction]);

  const initiateClosure = useCallback((id: string, notifyPerson: string, closureDateTime: string, sig: EDSSignature) => 
    apiAction(id, 'foreman_close', { signature: sig, comment: notifyPerson }), [apiAction]);

  const signClosureManager = useCallback((id: string, sig: EDSSignature) => 
    apiAction(id, 'manager_close', { signature: sig }), [apiAction]);

  const cancelPermit = useCallback((id: string, userId: string, userName: string, reason: string) => 
    apiAction(id, 'cancel', { comment: reason, signature: { userId, userName, timestamp: new Date().toISOString() } }), [apiAction]);

  const saveRework = useCallback(async (id: string, safetyMeasures: string[], specialInstructions: string) => {
    const r = await fetch(`${API_BASE}/api/permits/save_rework`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permit_id: parseInt(id), safety_measures: safetyMeasures, special_instructions: specialInstructions }),
    });
    if (!r.ok) throw new Error('Failed to save rework');
    await refresh();
  }, [refresh]);

  const saveAssistantChecklist = useCallback(async (id: string, checklist: AssistantCheckItem[]) => {
    const r = await fetch(`${API_BASE}/api/permits/save_checklist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permit_id: parseInt(id), checklist }),
    });
    if (!r.ok) throw new Error('Failed to save checklist');
    await refresh();
  }, [refresh]);

  const getPermitsByUser = useCallback((userId: string, role: string): WorkPermit[] => {
    // Client-side filtering as fallback or for UI responsiveness
    switch (role) {
      case 'issuer':               return permits.filter(p => p.issuerId === userId);
      case 'dispatcher':           return permits.filter(p => p.dispatcherId === userId);
      case 'dispatcher_assistant': return permits.filter(p => p.dispatcherAssistantId === userId);
      case 'admitter':             return permits.filter(p => p.admitterId === userId);
      case 'manager':              return permits.filter(p => p.managerId === userId);
      case 'observer':             return permits.filter(p => p.observerId === userId);
      case 'foreman':              return permits.filter(p => p.foremanId === userId);
      case 'worker':               return permits.filter(p => p.brigadeMembers.some(m => m.userId === userId && m.isActive));
      default: return [];
    }
  }, [permits]);

  return (
    <Ctx.Provider value={{
      permits, loading, refresh, getPermit, createPermit, signByIssuer, 
      signByDispatcher, acknowledgeByAssistant, submitWorkplacesReady, 
      signByAdmitter, approveWorkplace, createBriefing, signBriefingAdmitter,
      signBriefingResponsible, signBriefingMember, endDailyWork, 
      extendPermit, initiateClosure, signClosureManager, cancelPermit, saveRework,
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