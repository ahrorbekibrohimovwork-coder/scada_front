import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import {
  ChevronLeft, CheckCircle2, XCircle, AlertTriangle, Clock,
  Users, Shield, FileText, Activity, MessageSquare, ChevronDown, ChevronUp,
  Zap, RotateCcw, Plus, X, Calendar, Printer, ArrowRight, PlusCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkPermit } from '../context/WorkPermitContext';
import { StatusBadge } from '../components/StatusBadge';
import { RoleBadge } from '../components/RoleBadge';
import { EDSModal } from '../components/EDSModal';
import type { WorkPermit, BrigadeMember, EDSSignature, DailyBriefing } from '../types';

// ── helpers ──────────────────────────────────────────────────────────────────
const fmtDT = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtD = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

// ── small components ──────────────────────────────────────────────────────────
function PersonCard({
  label, user, sublabel, color = 'slate',
}: { label: string; user?: { name: string; position: string; electricalGroup: string }; sublabel?: string; color?: string }) {
  const u = user;
  const colors: Record<string, string> = {
    purple: 'bg-purple-50 border-purple-200', sky: 'bg-sky-50 border-sky-200',
    cyan: 'bg-cyan-50 border-cyan-200', teal: 'bg-teal-50 border-teal-200',
    blue: 'bg-blue-50 border-blue-200', yellow: 'bg-yellow-50 border-yellow-200',
    orange: 'bg-orange-50 border-orange-200', slate: 'bg-slate-50 border-slate-200',
  };
  return (
    <div className={`border rounded-lg p-3 ${colors[color] || colors.slate}`}>
      <p className="text-xs text-slate-500 font-medium mb-1">{label}</p>
      {u ? (
        <>
          <p className="text-slate-800 text-sm font-medium">{u.name}</p>
          <p className="text-slate-500 text-xs">{u.position} · Гр.ЭБ {u.electricalGroup}</p>
          {sublabel && <p className="text-slate-400 text-xs mt-1 italic">{sublabel}</p>}
        </>
      ) : <p className="text-slate-400 text-sm">Не назначен</p>}
    </div>
  );
}

// ── Permit Summary Card (shows what the user is signing) ──────────────────
function PermitSummaryCard({ permit, getUser }: { permit: WorkPermit; getUser: (id?: string) => any }) {
  const [expanded, setExpanded] = useState(true);

  const roleEntries = [
    { label: 'Выдающий', id: permit.issuerId, color: 'text-purple-600' },
    { label: 'Гл. диспетчер', id: permit.dispatcherId, color: 'text-sky-600' },
    { label: 'Помощник ГД', id: permit.dispatcherAssistantId, color: 'text-cyan-600' },
    { label: 'Допускающий', id: permit.admitterId, color: 'text-teal-600' },
    { label: 'Отв. руководитель', id: permit.managerId, color: 'text-blue-600' },
    { label: 'Наблюдающий', id: permit.observerId, color: 'text-yellow-600' },
    { label: 'Произв. работ', id: permit.foremanId, color: 'text-orange-600' },
  ];

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-100/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-blue-600" />
          <span className="text-slate-700 text-sm font-semibold">Сведения о наряде</span>
        </div>
        {expanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Main info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Наряд №</span>
              <span className="text-sm font-bold text-slate-800">{permit.number}</span>
              <StatusBadge status={permit.status} />
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <p className="text-xs text-slate-400 mb-0.5">Задание</p>
              <p className="text-slate-800 text-sm font-medium leading-snug">{permit.task}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <p className="text-xs text-slate-400">Организация</p>
                <p className="text-slate-700 text-xs font-medium">{permit.organization}</p>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <p className="text-xs text-slate-400">Подразделение</p>
                <p className="text-slate-700 text-xs font-medium">{permit.department}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <p className="text-xs text-slate-400">Начало</p>
                <p className="text-slate-700 text-xs font-medium">{fmtDT(permit.workStartDateTime)}</p>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <p className="text-xs text-slate-400">Окончание</p>
                <p className="text-slate-700 text-xs font-medium">{fmtDT(permit.workEndDateTime)}</p>
              </div>
            </div>
          </div>

          {/* Personnel list */}
          <div>
            <p className="text-xs text-slate-500 font-medium mb-1.5">Назначенный персонал</p>
            <div className="space-y-1">
              {roleEntries.filter(r => r.id).map(r => {
                const u = getUser(r.id);
                return (
                  <div key={r.label} className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-slate-100">
                    <span className={`text-xs font-medium ${r.color}`}>{r.label}</span>
                    <span className="text-xs text-slate-700">{u?.name || '—'}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Brigade count */}
          {permit.brigadeMembers.filter(m => m.isActive).length > 0 && (
            <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
              <Users size={12} className="text-slate-500" />
              <span className="text-xs text-slate-600">
                Бригада: {permit.brigadeMembers.filter(m => m.isActive).length} чел.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Signature Chain (vertical timeline) ───────────────────────────────────────
function SignatureChain({ permit, getUser }: { permit: WorkPermit; getUser: (id?: string) => any }) {
  const getVerifierLabel = () => {
    if (permit.managerId) return 'Ответственный руководитель';
    if (permit.observerId) return 'Наблюдающий';
    return 'Производитель работ';
  };

  const steps = [
    {
      label: 'Выдающий наряд',
      sig: permit.issuerSignature,
      userId: permit.issuerId,
      icon: '①',
      colorDone: 'from-purple-500 to-purple-600',
      colorPending: 'bg-purple-100 text-purple-400 border-purple-200',
    },
    {
      label: 'Главный диспетчер',
      sig: permit.dispatcherSignature,
      userId: permit.dispatcherId,
      icon: '②',
      colorDone: 'from-sky-500 to-sky-600',
      colorPending: 'bg-sky-100 text-sky-400 border-sky-200',
    },
    {
      label: 'Помощник ГД',
      sig: permit.dispatcherAssistantSignature,
      userId: permit.dispatcherAssistantId,
      icon: '③',
      colorDone: 'from-cyan-500 to-cyan-600',
      colorPending: 'bg-cyan-100 text-cyan-400 border-cyan-200',
    },
    {
      label: 'Допускающий (РМ)',
      sig: permit.admitterWorkplaceSignature,
      userId: permit.admitterId,
      icon: '④',
      colorDone: 'from-teal-500 to-teal-600',
      colorPending: 'bg-teal-100 text-teal-400 border-teal-200',
    },
    {
      label: getVerifierLabel(),
      sig: permit.workplaceVerifierSignature,
      userId: permit.managerId || permit.observerId || permit.foremanId,
      icon: '⑤',
      colorDone: 'from-blue-500 to-blue-600',
      colorPending: 'bg-blue-100 text-blue-400 border-blue-200',
    },
    ...(permit.foremanClosureSignature ? [{
      label: 'Закрытие (произв.)',
      sig: permit.foremanClosureSignature,
      userId: permit.foremanId,
      icon: '⑥',
      colorDone: 'from-orange-500 to-orange-600',
      colorPending: 'bg-orange-100 text-orange-400 border-orange-200',
    }] : []),
    ...(permit.managerClosureSignature ? [{
      label: 'Закрытие (рук.)',
      sig: permit.managerClosureSignature,
      userId: permit.managerId,
      icon: '⑦',
      colorDone: 'from-slate-600 to-slate-700',
      colorPending: 'bg-slate-100 text-slate-400 border-slate-200',
    }] : []),
  ];

  // Find the first unsigned step (the current one)
  const currentStepIdx = steps.findIndex(s => !s.sig);

  return (
    <div className="space-y-0">
      {steps.map((step, i) => {
        const isSigned = !!step.sig;
        const isCurrent = i === currentStepIdx;
        const isFuture = currentStepIdx >= 0 && i > currentStepIdx;
        const user = getUser(step.userId);
        const isLast = i === steps.length - 1;

        return (
          <div key={i} className="flex gap-3">
            {/* Timeline column */}
            <div className="flex flex-col items-center">
              {/* Circle */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all duration-500 ${
                isSigned
                  ? `bg-gradient-to-br ${step.colorDone} text-white shadow-md`
                  : isCurrent
                    ? `border-2 ${step.colorPending} animate-pulse`
                    : 'bg-slate-100 text-slate-300 border border-slate-200'
              }`}>
                {isSigned ? <CheckCircle2 size={16} /> : step.icon}
              </div>
              {/* Line */}
              {!isLast && (
                <div className={`w-0.5 flex-1 min-h-[24px] transition-all duration-500 ${
                  isSigned ? 'bg-gradient-to-b from-green-400 to-green-300' : 'bg-slate-200 border-l border-dashed border-slate-300'
                }`} style={{ width: isSigned ? '2px' : '0px', borderWidth: isSigned ? '0' : '1.5px' }} />
              )}
            </div>

            {/* Content */}
            <div className={`flex-1 pb-4 ${isLast ? 'pb-0' : ''}`}>
              <p className={`text-xs font-semibold mb-0.5 ${
                isSigned ? 'text-slate-700' : isCurrent ? 'text-blue-700' : 'text-slate-400'
              }`}>{step.label}</p>

              {isSigned && step.sig ? (
                <div className="p-2.5 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-slate-800 text-xs font-medium">{step.sig.userName}</p>
                  <p className="text-slate-500 text-xs">{step.sig.userPosition} · Гр.ЭБ {step.sig.userGroup}</p>
                  <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                    <CheckCircle2 size={10} /> {fmtDT(step.sig.timestamp)}
                  </p>
                </div>
              ) : isCurrent ? (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-blue-700 text-xs font-medium">Ожидается подпись</span>
                  </div>
                  {user && (
                    <p className="text-slate-600 text-xs">{user.name}</p>
                  )}
                </div>
              ) : (
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-slate-400 text-xs">
                    {user ? user.name : 'Ожидание'}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Workflow Step tracker ─────────────────────────────────────────────────────
const WORKFLOW_STEPS = [
  { key: 'draft',                label: '① Оформление и выдача',             role: 'Выдающий'         },
  { key: 'pending_dispatcher',   label: '② Разрешение ГД',                   role: 'Главный диспетчер'},
  { key: 'pending_assistant',    label: '③ Подготовка рабочих мест',          role: 'Помощник ГД'      },
  { key: 'pending_admitter',     label: '④ Проверка допускающим',             role: 'Допускающий'      },
  { key: 'admitter_checked',     label: '⑤ Одобрение рабочих мест',          role: 'Рук./Набл./Произв.'},
  { key: 'workplace_approved',   label: '⑥ Инструктаж и допуск к работе',    role: 'Допускающий'      },
  { key: 'in_progress',          label: '⑦ Производство работ',              role: 'Производитель'    },
  { key: 'closing',              label: '⑧ Закрытие наряда',                 role: 'Произв./Рук.'     },
];

const STATUS_STEP: Record<string, number> = {
  draft: 0, returned_to_issuer: 0,
  pending_dispatcher: 1,
  pending_assistant: 2, preparing_workplaces: 2, returned_to_assistant: 2,
  pending_admitter: 3, returned_to_admitter: 4,
  admitter_checked: 4,
  workplace_approved: 5, admitted: 5,
  in_progress: 6, daily_ended: 6, extended: 6,
  closing: 7, closed: 7, cancelled: 7,
};

// ══════════════════════════════════════════════════════════════════════════════
export function WorkPermitDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, allUsers } = useAuth();
  const ctx = useWorkPermit();

  const [tab, setTab] = useState<'info' | 'safety' | 'brigade' | 'briefings' | 'history'>('info');
  const [showModal, setShowModal] = useState<null | string>(null);
  const [returnComment, setReturnComment] = useState('');
  const [livePartsText, setLivePartsText] = useState('');
  const [extendDate, setExtendDate] = useState('');
  const [closureNotify, setClosureNotify] = useState('');
  const [closureDateTime, setClosureDateTime] = useState('');
  const [newBriefingLocation, setNewBriefingLocation] = useState('');
  const [newBriefingDateTime, setNewBriefingDateTime] = useState(
    new Date().toISOString().slice(0, 16)
  );

  // Brigade edit state
  const [editingBrigade, setEditingBrigade] = useState(false);
  const [brigadeEdits, setBrigadeEdits] = useState<BrigadeMember[]>([]);

  const permit = ctx.getPermit(id!);

  if (!permit) return (
    <div className="p-6 text-center">
      <p className="text-slate-500 mb-3">Наряд не найден</p>
      <Link to="/permits" className="text-blue-600 text-sm">← К списку</Link>
    </div>
  );
  if (!currentUser) return null;

  const role = currentUser.role;
  const uid = currentUser.id;
  const getUser = (userId?: string) => allUsers.find(u => u.id === userId);
  const isAssignedRole = (permitUserId?: string) => !permitUserId || permitUserId === uid;
  const isIssuer   = role === 'issuer'               && isAssignedRole(permit.issuerId);
  const isDisp     = role === 'dispatcher'            && isAssignedRole(permit.dispatcherId);
  const isAssist   = role === 'dispatcher_assistant'  && isAssignedRole(permit.dispatcherAssistantId);
  const isAdmitter = role === 'admitter'              && isAssignedRole(permit.admitterId);
  const isManager  = role === 'manager'               && isAssignedRole(permit.managerId);
  const isObserver = role === 'observer'              && isAssignedRole(permit.observerId);
  const isForeman  = role === 'foreman'               && isAssignedRole(permit.foremanId);
  const isMember   = role === 'worker'                && permit.brigadeMembers.some(m => m.userId === uid && m.isActive);

  const S = permit.status;
  const lastBriefing = permit.dailyBriefings[permit.dailyBriefings.length - 1];

  const makeSig = (): EDSSignature => ({
    userId: uid, userName: currentUser.name,
    userPosition: currentUser.position, userGroup: currentUser.electricalGroup,
    timestamp: new Date().toISOString(),
  });

  // ── Action handlers ──────────────────────────────────────────────────────
  const doSign = (modalKey: string, sig: EDSSignature, _comment: string) => {
    setShowModal(null);
    if (modalKey === 'issuer_sign')       ctx.signByIssuer(permit.id, sig);
    if (modalKey === 'disp_approve')      ctx.signByDispatcher(permit.id, sig);
    if (modalKey === 'assist_ack')        ctx.acknowledgeByAssistant(permit.id, sig);
    if (modalKey === 'assist_ready')      ctx.submitWorkplacesReady(permit.id);
    if (modalKey === 'admitter_sign') {
      ctx.signByAdmitter(permit.id, livePartsText, sig);
    }
    if (modalKey === 'verify_workplace')  {
      const verifierRole = isManager ? 'manager' : isObserver ? 'observer' : 'foreman';
      ctx.approveWorkplace(permit.id, verifierRole, sig);
    }
    if (modalKey === 'briefing_admitter') {
      const briefId = lastBriefing?.id;
      if (briefId) ctx.signBriefingAdmitter(permit.id, briefId, sig);
    }
    if (modalKey === 'briefing_responsible') {
      const briefId = lastBriefing?.id;
      if (briefId) ctx.signBriefingResponsible(permit.id, briefId, sig);
    }
    if (modalKey === 'end_daily') {
      const briefId = lastBriefing?.id;
      if (briefId) ctx.endDailyWork(permit.id, briefId, new Date().toISOString(), sig);
    }
    if (modalKey === 'foreman_close') {
      ctx.initiateClosure(permit.id, closureNotify, closureDateTime, sig);
    }
    if (modalKey === 'manager_close')     ctx.signClosureManager(permit.id, sig);
    if (modalKey === 'extend_permit') {
      if (extendDate) ctx.extendPermit(permit.id, new Date(extendDate).toISOString(), sig);
    }
  };

  const doReturn = (step: string) => {
    if (!returnComment.trim()) return;
    setShowModal(null);
    if (step === 'disp_return')  ctx.returnToIssuer(permit.id, returnComment, makeSig());
    if (step === 'assist_return_to_disp') ctx.returnToDispatcher(permit.id, returnComment, uid, currentUser.name);
    if (step === 'admit_return') ctx.returnToAssistant(permit.id, returnComment);
    if (step === 'verify_return') ctx.returnToAdmitter(permit.id, returnComment, uid, currentUser.name);
    if (step === 'return_from_approved') ctx.returnFromApproved(permit.id, returnComment, uid, currentUser.name);
    if (step === 'return_from_admitted') ctx.returnFromAdmitted(permit.id, returnComment, uid, currentUser.name);
    setReturnComment('');
  };

  const handleCreateBriefing = () => {
    const brief: DailyBriefing = {
      id: `db_${Date.now()}`,
      isFirst: permit.dailyBriefings.length === 0,
      workLocationName: newBriefingLocation,
      briefingDateTime: new Date(newBriefingDateTime).toISOString(),
      brigadeSignatures: [],
    };
    ctx.createBriefing(permit.id, brief);
    setNewBriefingLocation('');
    setTab('briefings');
  };

  const handleMemberBriefingSign = (briefId: string, memberId: string, memberName: string) => {
    ctx.signBriefingMember(permit.id, briefId, memberId, memberName, makeSig());
  };

  const startBrigadeEdit = () => {
    setBrigadeEdits([...permit.brigadeMembers]);
    setEditingBrigade(true);
  };

  const saveBrigadeEdit = () => {
    const original = permit.brigadeMembers.filter(m => m.isActive).length;
    const newCount = brigadeEdits.filter(m => m.isActive).length;
    const removed  = permit.brigadeMembers.filter(m => m.isActive && !brigadeEdits.find(e => e.id === m.id && e.isActive)).length;
    const added    = brigadeEdits.filter(m => !permit.brigadeMembers.find(e => e.id === m.id)).length;
    const changed  = removed + added;
    if (original > 0 && changed / original > 0.5) {
      alert('Изменение состава бригады более чем на 50%! Наряд-допуск должен быть закрыт.');
      setEditingBrigade(false); return;
    }
    ctx.updateBrigade(permit.id, brigadeEdits, makeSig());
    setEditingBrigade(false);
  };

  // ── Which actions are available? ─────────────────────────────────────────
  const actions: { key: string; label: string; color: string; icon: any; show: boolean; onClick?: () => void }[] = [
    // Issuer
    { key: 'issuer_sign',    label: 'Подписать ЭЦП и выдать',        color: 'blue',   icon: CheckCircle2, show: isIssuer && S === 'draft' && !!permit.issuerSignature === false },
    { key: 're_sign',        label: 'Исправить и подписать ЭЦП',     color: 'blue',   icon: CheckCircle2, show: isIssuer && S === 'returned_to_issuer' },
    // Dispatcher
    { key: 'disp_approve',   label: 'Подписать разрешение ЭЦП',      color: 'sky',    icon: CheckCircle2, show: isDisp && S === 'pending_dispatcher' },
    { key: 'disp_return',    label: 'Вернуть на корректировку',       color: 'red',    icon: RotateCcw,    show: isDisp && S === 'pending_dispatcher', onClick: () => setShowModal('disp_return_form') },
    // Assistant
    { key: 'assist_ack',     label: 'Подтвердить получение ЭЦП',     color: 'cyan',   icon: CheckCircle2, show: isAssist && S === 'pending_assistant' },
    { key: 'assist_return_to_disp', label: 'Вернуть гл. диспетчеру',  color: 'red',    icon: RotateCcw,    show: isAssist && S === 'pending_assistant', onClick: () => setShowModal('assist_return_to_disp_form') },
    { key: 'assist_ready',   label: 'Сдать рабочие места допускающему', color: 'teal', icon: CheckCircle2, show: isAssist && S === 'preparing_workplaces', onClick: () => { ctx.submitWorkplacesReady(permit.id); } },
    { key: 'assist_return',  label: 'Исправить рабочие места',        color: 'cyan',   icon: RotateCcw,    show: isAssist && S === 'returned_to_assistant', onClick: () => { ctx.submitWorkplacesReady(permit.id); } },
    // Admitter
    { key: 'admitter_sign',  label: 'Подписать проверку рабочих мест ЭЦП', color: 'teal', icon: CheckCircle2, show: isAdmitter && S === 'pending_admitter' },
    { key: 'admit_return',   label: 'Вернуть помощнику ГД',           color: 'red',    icon: RotateCcw,    show: isAdmitter && S === 'pending_admitter', onClick: () => setShowModal('admit_return_form') },
    { key: 'admitter_re',    label: 'Исправить и подписать ЭЦП',      color: 'teal',   icon: CheckCircle2, show: isAdmitter && S === 'returned_to_admitter' },
    // Briefing actions
    { key: 'create_briefing',label: 'Создать запись инструктажа',     color: 'amber',  icon: Plus,         show: isAdmitter && S === 'workplace_approved' && !lastBriefing?.admitterSignature, onClick: () => setTab('briefings') },
    { key: 'create_briefing_new', label: 'Открыть новый день (Инструктаж)', color: 'blue', icon: PlusCircle, show: isAdmitter && S === 'daily_ended', onClick: () => setTab('briefings') },
    { key: 'briefing_admitter', label: 'Подписаться под инструктажем ЭЦП',   color: 'amber',  icon: CheckCircle2, show: isAdmitter && (S === 'workplace_approved' || S === 'daily_ended' || S === 'admitted') && !!lastBriefing && !lastBriefing.admitterSignature },
    // Return from workplace_approved (admitter can return to verifier)
    { key: 'return_from_approved', label: 'Вернуть на проверку рабочих мест', color: 'red', icon: RotateCcw, show: isAdmitter && S === 'workplace_approved' && !lastBriefing?.admitterSignature, onClick: () => setShowModal('return_from_approved_form') },
    // Workplace verifiers
    { key: 'verify_workplace', label: 'Подтвердить рабочие места ЭЦП', color: 'blue',  icon: CheckCircle2, show: (isManager || isObserver || isForeman) && S === 'admitter_checked' && !permit.workplaceVerifierSignature && (() => { if (isManager && !!permit.managerId) return true; if (isObserver && !permit.managerId && !!permit.observerId) return true; if (isForeman && !permit.managerId && !permit.observerId) return true; return false; })() },
    { key: 'verify_return',  label: 'Вернуть допускающему',           color: 'red',    icon: RotateCcw,    show: (isManager || isObserver || isForeman) && S === 'admitter_checked' && (() => { if (isManager && !!permit.managerId) return true; if (isObserver && !permit.managerId && !!permit.observerId) return true; if (isForeman && !permit.managerId && !permit.observerId) return true; return false; })(), onClick: () => setShowModal('verify_return_form') },
    // Responsible sign briefing
    { key: 'briefing_responsible', label: 'Подтвердить инструктаж ЭЦП', color: 'orange', icon: CheckCircle2, show: (isForeman || isObserver) && S === 'admitted' && !!lastBriefing && !!lastBriefing.admitterSignature && !lastBriefing.responsibleSignature },
    // Return from admitted (responsible can return to workplace_approved)
    { key: 'return_from_admitted', label: 'Вернуть на этап инструктажа', color: 'red', icon: RotateCcw, show: (isForeman || isObserver) && S === 'admitted' && !!lastBriefing && !lastBriefing.responsibleSignature, onClick: () => setShowModal('return_from_admitted_form') },
    // Foreman: end daily work
    { key: 'end_daily',      label: 'Завершить работы дня ЭЦП', color: 'orange', icon: CheckCircle2, show: (isForeman || isObserver) && (S === 'in_progress' || S === 'admitted') && !!lastBriefing?.admitterSignature && !!lastBriefing?.responsibleSignature && !lastBriefing?.endSignature },
    // Brigade members sign first briefing
    { key: 'member_sign',    label: 'ПОДПИСАТЬ ИНСТРУКТАЖ ЭЦП', color: 'green',   icon: CheckCircle2, show: isMember && !!lastBriefing?.isFirst && !!lastBriefing?.admitterSignature && !lastBriefing?.brigadeSignatures.find(s => s.memberId === permit.brigadeMembers.find(m => m.userId === uid)?.id), onClick: () => {
      const member = permit.brigadeMembers.find(m => m.userId === uid);
      if (member && lastBriefing) handleMemberBriefingSign(lastBriefing.id, member.id, member.name);
    } },
    // Foreman: closure
    { key: 'foreman_close',  label: 'Инициировать закрытие наряда',   color: 'slate',  icon: XCircle,      show: isForeman && (S === 'daily_ended' || S === 'in_progress'), onClick: () => setShowModal('closure_form') },
    // Manager close confirmation
    { key: 'manager_close',  label: 'Подтвердить закрытие ЭЦП',       color: 'blue',   icon: CheckCircle2, show: isManager && S === 'closing' },
    // Extend
    { key: 'extend_permit',  label: 'Продлить наряд-допуск',          color: 'purple', icon: Clock,        show: isIssuer && (S === 'daily_ended' || S === 'in_progress'), onClick: () => setShowModal('extend_form') },
    // Cancel
    { key: 'cancel',         label: 'Аннулировать наряд',              color: 'red',    icon: XCircle,      show: isIssuer && !['closed','cancelled','closing'].includes(S), onClick: () => setShowModal('cancel_form') },
  ];

  const visibleActions = actions.filter(a => a.show);
  const EDS_MODALS = ['issuer_sign','re_sign','disp_approve','assist_ack','admitter_sign','admitter_re','verify_workplace','briefing_admitter','briefing_responsible','end_daily','foreman_close','manager_close','extend_permit'];

  const stepIdx = STATUS_STEP[S] ?? 0;

  const colorsMap: Record<string, string> = {
    blue:   'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200',
    sky:    'bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-200',
    cyan:   'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-200',
    teal:   'bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-200',
    amber:  'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200',
    orange: 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-200',
    green:  'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200 animate-bounce-subtle',
    purple: 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200',
    slate:  'bg-slate-700 hover:bg-slate-800 text-white shadow-lg shadow-slate-200',
    gray:   'bg-gray-600 hover:bg-gray-700 text-white',
    red:    'border border-red-300 text-red-600 hover:bg-red-50',
  };

  const TABS = [
    { id: 'info',      label: 'Сведения',    icon: FileText },
    { id: 'safety',    label: 'Меры безоп.', icon: Shield   },
    { id: 'brigade',   label: 'Бригада',     icon: Users    },
    { id: 'briefings', label: 'Инструктажи', icon: Calendar },
    { id: 'history',   label: 'История',     icon: Activity },
  ] as const;

  const lastReturn = [...permit.returnComments].reverse()[0];

  // ── Determine who should verify workplaces ───────────────────────────────
  const getVerifierLabel = () => {
    if (permit.managerId) return 'Ответственный руководитель';
    if (permit.observerId) return 'Наблюдающий';
    return 'Производитель работ';
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 flex-shrink-0">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-slate-900">Наряд-допуск № {permit.number}</h1>
            <StatusBadge status={S} />
          </div>
          <p className="text-slate-500 text-sm mt-0.5 line-clamp-1">{permit.task}</p>
        </div>
        <button className="hidden sm:flex p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
          <Printer size={18} />
        </button>
      </div>

      {/* ── Workflow stepper ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5 overflow-x-auto">
        <div className="flex items-start min-w-max gap-0">
          {WORKFLOW_STEPS.map((step, i) => {
            const done = i < stepIdx;
            const active = i === stepIdx;
            const cancelled = S === 'cancelled';
            return (
              <React.Fragment key={step.key}>
                <div className="flex flex-col items-center w-24">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    cancelled && i >= stepIdx ? 'bg-red-100 text-red-500 border-2 border-red-300'
                    : done   ? 'bg-green-500 text-white'
                    : active ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : 'bg-slate-100 text-slate-400'
                  }`}>
                    {done ? <CheckCircle2 size={16} /> : i + 1}
                  </div>
                  <p className={`text-center text-xs mt-1.5 leading-tight ${
                    active ? 'text-blue-700 font-semibold' : done ? 'text-green-600' : 'text-slate-400'
                  }`}>{step.label}</p>
                  <p className={`text-center text-xs mt-0.5 ${active ? 'text-blue-500' : 'text-slate-300'}`}>{step.role}</p>
                </div>
                {i < WORKFLOW_STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mt-4 mx-1 ${done ? 'bg-green-400' : 'bg-slate-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── Return comment banner ── */}
      {(S === 'returned_to_issuer' || S === 'returned_to_assistant' || S === 'returned_to_admitter') && lastReturn && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-700 text-sm font-medium">Возвращён на доработку</p>
              <p className="text-red-600 text-sm mt-0.5">{lastReturn.comment}</p>
              <p className="text-red-400 text-xs mt-1">от {lastReturn.fromUserName} · {fmtDT(lastReturn.timestamp)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left: Actions ── */}
        <div className="space-y-4">
          {/* Summary card for signers (always visible) */}
          <PermitSummaryCard permit={permit} getUser={getUser} />

          {/* Actions block */}
          {visibleActions.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-slate-700 text-sm font-semibold mb-3">Доступные действия</h3>
              <div className="space-y-2">
                {visibleActions.map(a => (
                  <button
                    key={a.key}
                    onClick={a.onClick ?? (EDS_MODALS.includes(a.key) ? () => setShowModal(a.key) : undefined)}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-all ${colorsMap[a.color] || colorsMap.slate}`}
                  >
                    <a.icon size={15} className="flex-shrink-0" />
                    <span className="text-left">{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Next step hint */}
          {visibleActions.length === 0 && !['closed','cancelled'].includes(S) && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-amber-600" />
                <span className="text-amber-700 text-sm font-medium">Чья очередь?</span>
              </div>
              <div className="text-amber-700 text-xs space-y-1.5">
                {S === 'pending_dispatcher'   && <p>Ожидается разрешение Гл. диспетчера: <span className="font-semibold">{getUser(permit.dispatcherId)?.name}</span></p>}
                {S === 'pending_assistant'    && <p>Ожидается подтверждение Помощника ГД: <span className="font-semibold">{getUser(permit.dispatcherAssistantId)?.name}</span></p>}
                {S === 'preparing_workplaces' && <p>Помощник ГД готовит рабочие места: <span className="font-semibold">{getUser(permit.dispatcherAssistantId)?.name}</span></p>}
                {S === 'pending_admitter'     && <p>Ожидается проверка Допускающего: <span className="font-semibold">{getUser(permit.admitterId)?.name}</span></p>}
                {S === 'admitter_checked'     && <p>Ожидается одобрение: <span className="font-semibold">{getVerifierLabel()} ({getUser(permit.managerId || permit.observerId || permit.foremanId)?.name})</span></p>}
                {S === 'workplace_approved'   && (
                  <>
                    <p>Ожидается инструктаж от Допускающего: <span className="font-semibold">{getUser(permit.admitterId)?.name}</span></p>
                    <p className="text-[10px] opacity-70">Допускающий должен создать запись инструктажа и подписать её.</p>
                  </>
                )}
                {S === 'admitted' && (
                  <div className="space-y-1">
                    {!lastBriefing?.responsibleSignature ? (
                      <p>Ожидается подпись Производителя/Наблюдающего: <span className="font-semibold">{getUser(permit.observerId || permit.foremanId)?.name}</span></p>
                    ) : (
                      <p>Ожидаются подписи членов бригады.</p>
                    )}
                    {lastBriefing?.isFirst && (
                      <div className="mt-2 p-1.5 bg-amber-100/50 rounded border border-amber-200/50">
                        <p className="font-medium mb-1">Прогресс подписей бригады:</p>
                        {permit.brigadeMembers.filter(m => m.isActive).map(m => {
                          const signed = lastBriefing.brigadeSignatures.some(s => s.memberId === m.id);
                          return (
                            <div key={m.id} className="flex items-center gap-1.5 text-[10px]">
                              {signed ? <CheckCircle2 size={10} className="text-green-600" /> : <Clock size={10} className="text-amber-500" />}
                              <span className={signed ? 'text-green-700' : 'text-amber-800'}>{m.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                {S === 'in_progress'          && <p className="text-green-700 font-medium">Работа разрешена. Наряд в производстве.</p>}
                {S === 'daily_ended'          && (
                  <div className="space-y-1">
                    <p>Ежедневные работы завершены.</p>
                    <p className="font-medium">Что дальше?</p>
                    <p>• Для продолжения завтра: <span className="font-semibold text-blue-700">Допускающий</span> должен открыть новый день.</p>
                    <p>• Если работа окончена: <span className="font-semibold text-slate-700">Производитель</span> должен закрыть наряд.</p>
                  </div>
                )}
                {S === 'closing'              && <p>Ожидается подпись закрытия Руководителем: <span className="font-semibold">{getUser(permit.managerId)?.name}</span></p>}
              </div>
            </div>
          )}

          {/* Extend form */}
          {showModal === 'extend_form' && (
            <div className="bg-white rounded-xl border border-purple-200 p-4">
              <p className="text-slate-700 text-sm font-medium mb-3">Продление наряда (макс. +15 дней)</p>
              <label className="text-xs text-slate-500 mb-1 block">Новая дата окончания</label>
              <input type="datetime-local" value={extendDate} onChange={e => setExtendDate(e.target.value)}
                max={new Date(new Date(permit.workEndDateTime).getTime() + 15 * 86400000).toISOString().slice(0,16)}
                min={new Date().toISOString().slice(0,16)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-3" />
              <div className="flex gap-2">
                <button onClick={() => setShowModal(null)} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600">Отмена</button>
                <button onClick={() => { if (extendDate) setShowModal('extend_permit'); }} className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm">Далее →</button>
              </div>
            </div>
          )}

          {/* Closure form */}
          {showModal === 'closure_form' && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-slate-700 text-sm font-medium mb-3">Закрытие наряда-допуска</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Кому сообщается о закрытии *</label>
                  <input value={closureNotify} onChange={e => setClosureNotify(e.target.value)}
                    placeholder="Ф.И.О. лица" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Дата и время завершения работ *</label>
                  <input type="datetime-local" value={closureDateTime} onChange={e => setClosureDateTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowModal(null)} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600">Отмена</button>
                  <button onClick={() => { if (closureNotify && closureDateTime) setShowModal('foreman_close'); }}
                    className="flex-1 py-2 bg-slate-700 text-white rounded-lg text-sm">Подписать ЭЦП</button>
                </div>
              </div>
            </div>
          )}

          {/* Dates summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-slate-700 text-sm font-semibold mb-3">Сроки действия</h3>
            <div className="space-y-2">
              {[
                { label: 'Начало работ',    value: fmtDT(permit.workStartDateTime) },
                { label: 'Окончание работ', value: fmtDT(permit.workEndDateTime) },
                { label: 'Выдан (ЭЦП)',     value: fmtDT(permit.issuerSignature?.timestamp) },
                { label: 'Разрешение ГД',   value: fmtDT(permit.dispatcherSignature?.timestamp) },
                { label: 'Допуск к работе', value: permit.dailyBriefings[0]?.admitterSignature ? fmtDT(permit.dailyBriefings[0].briefingDateTime) : '—' },
                ...(permit.extensions.length > 0 ? [{ label: `Продлён до`, value: fmtDT(permit.workEndDateTime) }] : []),
                ...(permit.closureDateTime ? [{ label: 'Закрыт', value: fmtDT(permit.closureDateTime) }] : []),
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-2 text-xs">
                  <span className="text-slate-500">{label}</span>
                  <span className="text-slate-800 text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Tabs ── */}
        <div className="lg:col-span-2">
          <div className="flex gap-0.5 bg-slate-100 p-1 rounded-xl mb-4 overflow-x-auto">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs transition-all whitespace-nowrap ${
                  tab === t.id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}>
                <t.icon size={13} />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            {/* ─ Info tab ─ */}
            {tab === 'info' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Организация',     value: permit.organization  },
                    { label: 'Подразделение',    value: permit.department    },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-slate-400 text-xs mb-0.5">{label}</p>
                      <p className="text-slate-800 text-sm font-medium">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-slate-400 text-xs mb-1">Поручается (наименование работ)</p>
                  <p className="text-slate-800 text-sm">{permit.task}</p>
                </div>

                {/* Personnel grid */}
                <div>
                  <h4 className="text-slate-700 text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <Users size={14} /> Ответственный персонал
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <PersonCard label="① Выдающий наряд-допуск"   user={getUser(permit.issuerId)}              color="purple" />
                    <PersonCard label="② Главный диспетчер"        user={getUser(permit.dispatcherId)}          color="sky"    />
                    <PersonCard label="③ Помощник ГД"              user={getUser(permit.dispatcherAssistantId)} color="cyan"   />
                    <PersonCard label="④ Допускающий"              user={getUser(permit.admitterId)}            color="teal"   />
                    <PersonCard label="⑤ Отв. руководитель"        user={getUser(permit.managerId)}             color="blue"   sublabel={!permit.managerId ? 'Не назначен' : undefined} />
                    <PersonCard label="⑥ Наблюдающий"             user={getUser(permit.observerId)}            color="yellow" sublabel={!permit.observerId ? 'Не назначен' : undefined} />
                    <PersonCard label="⑦ Производитель работ"     user={getUser(permit.foremanId)}             color="orange" />
                  </div>
                </div>

                {/* EDS signatures chain (vertical timeline) */}
                <div>
                  <h4 className="text-slate-700 text-sm font-semibold mb-3 flex items-center gap-1.5">
                    <Shield size={14} /> Цепочка подписей ЭЦП
                  </h4>
                  <SignatureChain permit={permit} getUser={getUser} />
                </div>

                {/* Closure info */}
                {permit.closureNotifyPerson && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-slate-400 text-xs mb-1">Закрытие — уведомлено лицо</p>
                    <p className="text-slate-800 text-sm">{permit.closureNotifyPerson}</p>
                    <p className="text-slate-500 text-xs mt-0.5">Дата закрытия: {fmtDT(permit.closureDateTime)}</p>
                  </div>
                )}

                {/* Live parts */}
                {permit.liveParts && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-amber-700 text-xs font-medium mb-0.5 flex items-center gap-1">
                      <AlertTriangle size={12} /> Части, находящиеся под напряжением
                    </p>
                    <p className="text-slate-800 text-sm">{permit.liveParts}</p>
                  </div>
                )}
              </div>
            )}

            {/* ─ Safety tab ─ */}
            {tab === 'safety' && (
              <div className="space-y-4">
                <h3 className="text-slate-800 flex items-center gap-2">
                  <Shield size={16} className="text-blue-600" /> Меры по подготовке рабочих мест
                </h3>
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-700 text-xs">
                  Ответственный за выполнение мер — помощник главного диспетчера. Проверяет — допускающий.
                </div>
                {permit.safetyMeasures.length === 0
                  ? <p className="text-slate-400 text-center py-8 text-sm">Меры не указаны</p>
                  : (
                    <div className="space-y-2">
                      {permit.safetyMeasures.map((m, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-semibold ${
                            ['admitter_checked','workplace_approved','admitted','in_progress','daily_ended','extended','closing','closed'].includes(S)
                              ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {['admitter_checked','workplace_approved','admitted','in_progress','daily_ended','extended','closing','closed'].includes(S)
                              ? <CheckCircle2 size={12} /> : i + 1}
                          </div>
                          <p className="text-slate-700 text-sm">{m}</p>
                        </div>
                      ))}
                    </div>
                  )
                }
                {permit.specialInstructions && (
                  <div className="p-3 bg-orange-50 border border-orange-100 rounded-lg">
                    <p className="text-orange-700 text-xs font-medium mb-1">Особые указания</p>
                    <p className="text-slate-700 text-sm">{permit.specialInstructions}</p>
                  </div>
                )}
              </div>
            )}

            {/* ─ Brigade tab ─ */}
            {tab === 'brigade' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-slate-800 flex items-center gap-2">
                    <Users size={16} className="text-blue-600" /> Состав бригады
                  </h3>
                  {isForeman && ['in_progress','admitted','daily_ended'].includes(S) && !editingBrigade && (
                    <button onClick={startBrigadeEdit} className="text-xs px-3 py-1.5 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50">
                      Изменить состав
                    </button>
                  )}
                  {editingBrigade && (
                    <div className="flex gap-2">
                      <button onClick={() => setEditingBrigade(false)} className="text-xs px-3 py-1.5 border border-slate-300 text-slate-600 rounded-lg">Отмена</button>
                      <button onClick={saveBrigadeEdit} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg">Сохранить ЭЦП</button>
                    </div>
                  )}
                </div>

                {/* Foreman */}
                {(() => { const f = getUser(permit.foremanId); if (!f) return null; return (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-orange-200 flex items-center justify-center text-sm font-semibold text-orange-800">
                      {f.name.split(' ').map((s: string) => s[0]).slice(0,2).join('')}
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-800 text-sm font-medium">{f.name}</p>
                      <p className="text-slate-500 text-xs">{f.position} · Гр.ЭБ {f.electricalGroup}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-md">Производитель работ</span>
                  </div>
                ); })()}

                {!editingBrigade ? (
                  permit.brigadeMembers.filter(m => m.isActive).length === 0
                    ? <div className="py-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                        <Users size={28} className="mx-auto mb-2 opacity-40" />
                        <p className="text-sm">Членов бригады нет</p>
                      </div>
                    : permit.brigadeMembers.filter(m => m.isActive).map(m => (
                      <div key={m.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700">
                          {m.name.split(' ').map(s => s[0]).slice(0,2).join('')}
                        </div>
                        <div className="flex-1">
                          <p className="text-slate-800 text-sm font-medium">{m.name}</p>
                          <p className="text-slate-500 text-xs">Гр.ЭБ {m.group} · {m.direction}</p>
                        </div>
                        {lastBriefing?.brigadeSignatures.find(s => s.memberId === m.id) && (
                          <CheckCircle2 size={14} className="text-green-500" />
                        )}
                      </div>
                    ))
                ) : (
                  <div className="space-y-2">
                    {brigadeEdits.filter(m => m.isActive).map(m => (
                      <div key={m.id} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                        <input value={m.name} disabled={!!m.userId} onChange={e => setBrigadeEdits(p => p.map(bm => bm.id === m.id ? { ...bm, name: e.target.value } : bm))}
                          className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-sm" />
                        <select value={m.group} onChange={e => setBrigadeEdits(p => p.map(bm => bm.id === m.id ? { ...bm, group: e.target.value } : bm))}
                          className="px-2 py-1.5 border border-slate-200 rounded text-sm">
                          {['I','II','III','IV','V'].map(g => <option key={g}>{g}</option>)}
                        </select>
                        <button onClick={() => setBrigadeEdits(p => p.map(bm => bm.id === m.id ? { ...bm, isActive: false, removedAt: new Date().toISOString() } : bm))}
                          className="text-red-400 hover:text-red-600"><X size={14} /></button>
                      </div>
                    ))}
                    <button onClick={() => setBrigadeEdits(p => [...p, { id: `bm_e_${Date.now()}`, name: '', group: 'III', direction: '', addedAt: new Date().toISOString(), isActive: true }])}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                      <Plus size={14} /> Добавить члена
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ─ Briefings tab ─ */}
            {tab === 'briefings' && (
              <div className="space-y-4">
                <h3 className="text-slate-800 flex items-center gap-2">
                  <Calendar size={16} className="text-blue-600" /> Ежедневный инструктаж и допуск
                </h3>

                {/* New briefing form (admitter) */}
                {isAdmitter && S === 'workplace_approved' && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-amber-700 text-sm font-medium mb-3">Создать запись о проведении инструктажа</p>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Наименование места работы *</label>
                        <input value={newBriefingLocation} onChange={e => setNewBriefingLocation(e.target.value)}
                          placeholder="Укажите место производства работ" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Дата и время инструктажа *</label>
                        <input type="datetime-local" value={newBriefingDateTime} onChange={e => setNewBriefingDateTime(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                      </div>
                      <button onClick={handleCreateBriefing} disabled={!newBriefingLocation.trim()}
                        className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm disabled:opacity-50">
                        Создать запись инструктажа
                      </button>
                    </div>
                  </div>
                )}

                {permit.dailyBriefings.length === 0
                  ? <div className="py-10 text-center text-slate-400">
                      <Calendar size={32} className="mx-auto mb-2 opacity-40" />
                      <p className="text-sm">Инструктажей ещё не проводилось</p>
                    </div>
                  : permit.dailyBriefings.map((b, idx) => (
                    <div key={b.id} className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 px-4 py-3 flex items-center justify-between">
                        <div>
                          <span className="text-slate-700 text-sm font-medium">
                            {b.isFirst ? '① Первичный допуск' : `Допуск #${idx + 1}`}
                          </span>
                          <span className="ml-2 text-slate-500 text-xs">{fmtDT(b.briefingDateTime)}</span>
                        </div>
                        {b.endDateTime && (
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                            Завершён {fmtDT(b.endDateTime)}
                          </span>
                        )}
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <p className="text-xs text-slate-500 mb-0.5">Место работы</p>
                          <p className="text-slate-800 text-sm">{b.workLocationName}</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className={`border rounded-lg p-3 ${b.admitterSignature ? 'border-green-200 bg-green-50' : 'border-dashed border-slate-200'}`}>
                            {b.admitterSignature ? (
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <CheckCircle2 size={13} className="text-green-600" />
                                  <span className="text-green-700 text-xs font-medium">Допускающий</span>
                                </div>
                                <p className="text-slate-800 text-xs font-medium">{b.admitterSignature.userName}</p>
                                <p className="text-slate-500 text-xs">{b.admitterSignature.userPosition} · Гр.ЭБ {b.admitterSignature.userGroup}</p>
                                <p className="text-slate-500 text-xs">{fmtDT(b.admitterSignature.timestamp)}</p>
                              </div>
                            ) : (
                              <div className="text-center text-slate-400 text-xs">Допускающий: ожидается подпись</div>
                            )}
                          </div>
                          <div className={`border rounded-lg p-3 ${b.responsibleSignature ? 'border-green-200 bg-green-50' : 'border-dashed border-slate-200'}`}>
                            {b.responsibleSignature ? (
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <CheckCircle2 size={13} className="text-green-600" />
                                  <span className="text-green-700 text-xs font-medium">{permit.observerId ? 'Наблюдающий' : 'Производитель работ'}</span>
                                </div>
                                <p className="text-slate-800 text-xs font-medium">{b.responsibleSignature.userName}</p>
                                <p className="text-slate-500 text-xs">{b.responsibleSignature.userPosition} · Гр.ЭБ {b.responsibleSignature.userGroup}</p>
                                <p className="text-slate-500 text-xs">{fmtDT(b.responsibleSignature.timestamp)}</p>
                              </div>
                            ) : (
                              <div className="text-center text-slate-400 text-xs">{permit.observerId ? 'Наблюдающий' : 'Производитель работ'}: ожидается подпись</div>
                            )}
                          </div>
                        </div>

                        {/* Admitter sign */}
                        {isAdmitter && !b.admitterSignature && (
                          <button onClick={() => setShowModal('briefing_admitter')}
                            className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm flex items-center justify-center gap-2">
                            <Shield size={14} /> Подписать инструктаж ЭЦП
                          </button>
                        )}
                        {/* Responsible sign */}
                        {(isForeman || isObserver) && b.admitterSignature && !b.responsibleSignature && (
                          <button onClick={() => setShowModal('briefing_responsible')}
                            className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm flex items-center justify-center gap-2">
                            <Shield size={14} /> Подписать ЭЦП (подтверждение инструктажа)
                          </button>
                        )}

                        {/* Brigade signatures (first briefing only) */}
                        {b.isFirst && (
                          <div>
                            <p className="text-xs text-slate-500 font-medium mb-2">Подписи членов бригады (первичный допуск)</p>
                            {permit.brigadeMembers.filter(m => m.isActive).map(m => {
                              const signed = b.brigadeSignatures.find(s => s.memberId === m.id);
                              const isMe = m.userId === uid;
                              return (
                                <div key={m.id} className={`flex items-center justify-between p-2 mb-1 rounded-lg border ${signed ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
                                  <div>
                                    <p className="text-slate-700 text-xs font-medium">{m.name}</p>
                                    {signed && <p className="text-green-600 text-xs">{fmtDT(signed.sig.timestamp)}</p>}
                                  </div>
                                  {signed
                                    ? <CheckCircle2 size={14} className="text-green-500" />
                                    : (isMe && b.admitterSignature
                                        ? <button onClick={() => handleMemberBriefingSign(b.id, m.id, m.name)}
                                            className="text-xs px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                                            Подписать ЭЦП
                                          </button>
                                        : <span className="text-xs text-slate-400">Ожидание</span>
                                      )
                                  }
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* End daily work */}
                        {b.endSignature
                          ? (
                            <div className="border border-green-200 bg-green-50 rounded-lg p-3 space-y-0.5">
                              <div className="flex items-center gap-1.5 mb-1">
                                <CheckCircle2 size={13} className="text-green-600" />
                                <span className="text-green-700 text-xs font-medium">Окончание работ дня</span>
                              </div>
                              <p className="text-slate-800 text-xs font-medium">{b.endSignature.userName}</p>
                              <p className="text-slate-500 text-xs">{b.endSignature.userPosition} · Гр.ЭБ {b.endSignature.userGroup}</p>
                              <p className="text-slate-500 text-xs">{fmtDT(b.endSignature.timestamp)}</p>
                            </div>
                          )
                          : (isForeman || isObserver) && b.admitterSignature && b.responsibleSignature && (
                            <button onClick={() => setShowModal('end_daily')}
                              className="w-full py-2 border border-orange-300 text-orange-600 hover:bg-orange-50 rounded-lg text-sm flex items-center justify-center gap-2">
                              <Clock size={14} /> Завершить ежедневные работы ЭЦП
                            </button>
                          )
                        }
                      </div>
                    </div>
                  ))
                }

                {/* New briefing for next day */}
                {isAdmitter && S === 'in_progress' && lastBriefing?.endSignature && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-blue-700 text-sm font-medium mb-3">Создать инструктаж на следующий день</p>
                    <div className="space-y-3">
                      <input value={newBriefingLocation} onChange={e => setNewBriefingLocation(e.target.value)}
                        placeholder="Наименование места работы" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                      <input type="datetime-local" value={newBriefingDateTime} onChange={e => setNewBriefingDateTime(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                      <button onClick={handleCreateBriefing} disabled={!newBriefingLocation.trim()}
                        className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50">
                        Создать запись
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─ History tab ─ */}
            {tab === 'history' && (
              <div className="space-y-3">
                <h3 className="text-slate-800 flex items-center gap-2">
                  <Activity size={16} className="text-blue-600" /> Журнал событий
                </h3>
                {[...permit.events].reverse().map((ev, i) => (
                  <div key={ev.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-700 text-xs font-semibold">
                          {ev.userName?.split(' ').map(s => s[0]).slice(0,2).join('') || '?'}
                        </span>
                      </div>
                      {i < permit.events.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 mt-1" />}
                    </div>
                    <div className="flex-1 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-slate-800 text-sm font-medium">{ev.action}</p>
                          {ev.userName && <p className="text-slate-500 text-xs">{ev.userName}</p>}
                        </div>
                        <p className="text-slate-400 text-xs whitespace-nowrap">{fmtDT(ev.timestamp)}</p>
                      </div>
                      {ev.comment && (
                        <div className="mt-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-1.5">
                          <MessageSquare size={12} className="text-slate-400 flex-shrink-0 mt-0.5" />
                          <p className="text-slate-600 text-xs">{ev.comment}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Return comment forms ── */}
      {showModal === 'disp_return_form' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-slate-900 mb-2">Возврат на корректировку</h3>
            <p className="text-slate-500 text-sm mb-4">Укажите причину возврата наряда выдающему для исправления мер безопасности.</p>
            <textarea value={returnComment} onChange={e => setReturnComment(e.target.value)} rows={4}
              placeholder="Комментарий с указанием ошибок..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="flex gap-3">
              <button onClick={() => setShowModal(null)} className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm">Отмена</button>
              <button onClick={() => doReturn('disp_return')} disabled={!returnComment.trim()}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm disabled:opacity-50">Вернуть</button>
            </div>
          </div>
        </div>
      )}

      {/* Assistant return to dispatcher */}
      {showModal === 'assist_return_to_disp_form' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-slate-900 mb-2">Возврат главному диспетчеру</h3>
            <p className="text-slate-500 text-sm mb-4">Укажите причину возврата наряда-допуска главному диспетчеру на доработку.</p>
            <textarea value={returnComment} onChange={e => setReturnComment(e.target.value)} rows={4}
              placeholder="Замечания для главного диспетчера..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="flex gap-3">
              <button onClick={() => setShowModal(null)} className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm">Отмена</button>
              <button onClick={() => doReturn('assist_return_to_disp')} disabled={!returnComment.trim()}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm disabled:opacity-50">Вернуть</button>
            </div>
          </div>
        </div>
      )}

      {showModal === 'admit_return_form' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-slate-900 mb-2">Возврат помощнику ГД</h3>
            <p className="text-slate-500 text-sm mb-4">Укажите замечания по подготовке рабочих мест.</p>
            <textarea value={returnComment} onChange={e => setReturnComment(e.target.value)} rows={4}
              placeholder="Замечания по подготовке рабочих мест..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="flex gap-3">
              <button onClick={() => setShowModal(null)} className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm">Отмена</button>
              <button onClick={() => doReturn('admit_return')} disabled={!returnComment.trim()}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm disabled:opacity-50">Вернуть</button>
            </div>
          </div>
        </div>
      )}

      {showModal === 'verify_return_form' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-slate-900 mb-2">Возврат допускающему</h3>
            <p className="text-slate-500 text-sm mb-4">Укажите замечания по подготовке рабочих мест для допускающего.</p>
            <textarea value={returnComment} onChange={e => setReturnComment(e.target.value)} rows={4}
              placeholder="Замечания к рабочим местам..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="flex gap-3">
              <button onClick={() => setShowModal(null)} className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm">Отмена</button>
              <button onClick={() => doReturn('verify_return')} disabled={!returnComment.trim()}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm disabled:opacity-50">Вернуть</button>
            </div>
          </div>
        </div>
      )}

      {/* Return from workplace_approved */}
      {showModal === 'return_from_approved_form' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-slate-900 mb-2">Вернуть на проверку рабочих мест</h3>
            <p className="text-slate-500 text-sm mb-4">Укажите причину возврата на предыдущий этап проверки.</p>
            <textarea value={returnComment} onChange={e => setReturnComment(e.target.value)} rows={4}
              placeholder="Причина возврата..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="flex gap-3">
              <button onClick={() => setShowModal(null)} className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm">Отмена</button>
              <button onClick={() => doReturn('return_from_approved')} disabled={!returnComment.trim()}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm disabled:opacity-50">Вернуть</button>
            </div>
          </div>
        </div>
      )}

      {/* Return from admitted */}
      {showModal === 'return_from_admitted_form' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-slate-900 mb-2">Вернуть на этап инструктажа</h3>
            <p className="text-slate-500 text-sm mb-4">Укажите причину возврата на этап инструктажа и допуска к работе.</p>
            <textarea value={returnComment} onChange={e => setReturnComment(e.target.value)} rows={4}
              placeholder="Причина возврата..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="flex gap-3">
              <button onClick={() => setShowModal(null)} className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm">Отмена</button>
              <button onClick={() => doReturn('return_from_admitted')} disabled={!returnComment.trim()}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm disabled:opacity-50">Вернуть</button>
            </div>
          </div>
        </div>
      )}

      {showModal === 'cancel_form' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-slate-900 mb-2">Аннулирование наряда-допуска</h3>
            <p className="text-slate-500 text-sm mb-4">Укажите причину аннулирования. Действие необратимо.</p>
            <textarea value={returnComment} onChange={e => setReturnComment(e.target.value)} rows={4}
              placeholder="Причина аннулирования..."
              className="w-full px-3 py-2 border border-red-200 bg-red-50 rounded-lg text-sm mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-red-500" />
            <div className="flex gap-3">
              <button onClick={() => setShowModal(null)} className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm">Отмена</button>
              <button onClick={() => { ctx.cancelPermit(permit.id, uid, currentUser.name, returnComment); setShowModal(null); }}
                disabled={!returnComment.trim()}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm disabled:opacity-50">Аннулировать</button>
            </div>
          </div>
        </div>
      )}

      {/* Admitter sign modal — with live parts field */}
      {showModal === 'admitter_sign' && currentUser && (
        <EDSModal
          user={currentUser}
          title="Проверка рабочих мест (Допускающий)"
          description="Подтвердите проверку рабочих мест. При наличии частей под напряжением — внесите сведения ниже."
          extraFields={
            <div>
              <label className="text-sm text-slate-700 mb-1.5 block">Части, находящиеся под напряжением</label>
              <textarea value={livePartsText} onChange={e => setLivePartsText(e.target.value)} rows={2}
                placeholder="Укажите, какие части под напряжением (или «Нет»)"
                className="w-full px-3 py-2 border border-amber-200 bg-amber-50 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
          }
          onSign={sig => doSign('admitter_sign', sig, '')}
          onCancel={() => setShowModal(null)}
          signLabel="Подписать ЭЦП"
        />
      )}

      {/* Extend modal */}
      {showModal === 'extend_permit' && currentUser && (
        <EDSModal
          user={currentUser}
          title="Продление наряда-допуска"
          description={`Подтвердите продление. Новая дата окончания: ${extendDate ? new Date(extendDate).toLocaleString('ru-RU') : '—'}. Максимально допустимое продление — 15 дней.`}
          onSign={sig => doSign('extend_permit', sig, '')}
          onCancel={() => setShowModal(null)}
          signLabel="Подписать продление ЭЦП"
        />
      )}

      {/* Closure EDS modal */}
      {showModal === 'foreman_close' && currentUser && (
        <EDSModal
          user={currentUser}
          title="Закрытие наряда-допуска"
          description={`Бригада выведена с рабочего места. Заземления сняты. Уведомляется: ${closureNotify}. Время завершения: ${closureDateTime ? new Date(closureDateTime).toLocaleString('ru-RU') : '—'}.`}
          onSign={sig => doSign('foreman_close', sig, '')}
          onCancel={() => setShowModal(null)}
          signLabel="Закрыть наряд ЭЦП"
        />
      )}

      {/* Generic EDS modals */}
      {currentUser && EDS_MODALS.filter(k => !['admitter_sign','extend_permit','foreman_close'].includes(k)).map(key => (
        showModal === key && (
          <EDSModal
            key={key}
            user={currentUser}
            title={{
              issuer_sign:         'Выдача наряда-допуска',
              re_sign:             'Повторная выдача наряда-допуска',
              disp_approve:        'Разрешение на подготовку рабочих мест',
              assist_ack:          'Получение разрешения (Помощник ГД)',
              admitter_re:         'Повторная проверка рабочих мест',
              verify_workplace:    'Подтверждение рабочих мест',
              briefing_admitter:   'Проведение инструктажа и допуск к работе',
              briefing_responsible:'Подтверждение инструктажа',
              end_daily:           'Окончание ежедневных работ',
              manager_close:       'Подтверждение закрытия наряда-допуска',
            }[key] || key}
            description={{
              issuer_sign:         'Подтвердите выдачу наряда-допуска. После подписания документ будет направлен главному диспетчеру.',
              re_sign:             'Исправлено по замечаниям. Подтвердите повторную выдачу наряда-допуска.',
              disp_approve:        'Подтвердите выдачу разрешения на подготовку рабочих мест. Документ будет направлен помощнику ГД.',
              assist_ack:          'Подтвердите получение разрешения на подготовку рабочих мест. После подписания приступайте к подготовке.',
              admitter_re:         'Замечания устранены. Подтвердите повторную проверку рабочих мест.',
              verify_workplace:    'Подтвердите, что рабочие места подготовлены корректно и в соответствии с мерами безопасности.',
              briefing_admitter:   'Подтвердите проведение ежедневного инструктажа. После вашей подписи производитель работ/наблюдающий подтвердит инструктаж.',
              briefing_responsible:'Подтвердите получение инструктажа и допуск к работе. После подписания всеми — наряд перейдёт в статус «В работе».',
              end_daily:           'Подтвердите завершение ежедневных работ. Бригада выведена с рабочего места.',
              manager_close:       'Подтвердите закрытие наряда-допуска. Работы выполнены, напряжение может быть подано.',
            }[key] || ''}
            onSign={sig => doSign(key, sig, '')}
            onCancel={() => setShowModal(null)}
            signLabel="Подписать ЭЦП"
          />
        )
      ))}

      {/* Extend form trigger */}
      {showModal === 'extend_permit' && !extendDate && setShowModal(null) && null}
      {visibleActions.find(a => a.key === 'extend_permit') && showModal === null && extendDate === '' && null}

      {/* Foreman close form trigger - show form inline before EDS */}
      {isForeman && (S === 'daily_ended' || S === 'in_progress') && showModal === null && (
        <div style={{ display: 'none' }} />
      )}
    </div>
  );
}
