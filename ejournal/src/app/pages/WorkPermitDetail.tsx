import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import {
  ChevronLeft, CheckCircle2, XCircle, AlertTriangle, Clock, Users, Shield,
  FileText, Activity, MessageSquare, Zap, RotateCcw, Plus, X, Calendar,
  Printer, Info, RefreshCw, ChevronRight, Edit3, GitBranch, Lock, Download,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkPermit } from '../context/WorkPermitContext';
import { StatusBadge } from '../components/StatusBadge';
import { RoleBadge } from '../components/RoleBadge';
import { EDSModal } from '../components/EDSModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ToastStack, useToast } from '../components/ToastStack';
import { SignatureCell } from '../components/permit/SignatureCell';
import { DailyBriefingTable } from '../components/permit/DailyBriefingTable';
import { DailyWorkJournal } from '../components/permit/DailyWorkJournal';
import { DailyWorkJournalNew } from '../components/permit/DailyWorkJournalNew';
import { BrigadeManagementModal } from '../components/permit/BrigadeManagementModal';
import { WorkCompletionFlow } from '../components/permit/WorkCompletionFlow';
import { DailyWorkFlow } from '../components/permit/DailyWorkFlow';
import { ExtendPermitModal } from '../components/permit/ExtendPermitModal';
import { VersionHistory } from '../components/permit/VersionHistory';
import { ReworkPanel } from '../components/permit/ReworkPanel';
import { PrintPermitModal } from '../components/permit/PrintPermitModal';
import { SafetyMeasuresTable, SafetyMeasureRow, makeSafetyRow } from '../components/permit/SafetyMeasuresTable';
import { AssistantChecklist } from '../components/permit/AssistantChecklist';
import { MOCK_USERS } from '../data/mockData';
import type { WorkPermit, BrigadeMember, EDSSignature, DailyBriefing, AssistantCheckItem } from '../types';

const getUser = (id?: string) => MOCK_USERS.find(u => u.id === id);
const fmtDT = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

// ── Workflow stepper config ──────────────────────────────────────────────────
const STEPS = [
  { label: 'Выдача',               sub: 'Выдающий',       statuses: ['draft', 'rework', 'returned_to_issuer'] },
  { label: 'Разрешение ГД',        sub: 'Гл. диспетчер',  statuses: ['pending_dispatcher'] },
  { label: 'Подготовка РМ',        sub: 'Помощник ГД',    statuses: ['pending_assistant', 'preparing_workplaces', 'returned_to_assistant'] },
  { label: 'Проверка допуск.',     sub: 'Допускающий',    statuses: ['pending_admitter', 'returned_to_admitter'] },
  { label: 'Одобрение РМ',         sub: 'Рук./Набл./Произв.', statuses: ['admitter_checked'] },
  { label: 'Инструктаж',           sub: 'Допускающий',    statuses: ['workplace_approved', 'admitted'] },
  { label: 'Производство работ',   sub: 'Производитель',  statuses: ['in_progress', 'daily_ended', 'extended'] },
  { label: 'Закрытие',             sub: 'Произв./Рук.',   statuses: ['closing', 'closed', 'cancelled'] },
];

function getStepIndex(status: string): number {
  for (let i = 0; i < STEPS.length; i++) {
    if (STEPS[i].statuses.includes(status)) return i;
  }
  return 0;
}

// ── Signature status types ────────────────────────────────────────────────────
type SigStatus = 'signed' | 'pending' | 'not_assigned' | 'not_required';

function SigStatusCell({ status, sig }: { status: SigStatus; sig?: EDSSignature }) {
  const fmt = (iso: string) => new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
  });
  switch (status) {
    case 'signed':
      return (
        <div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={12} className="text-emerald-600 flex-shrink-0" />
            <span className="text-xs text-emerald-700 font-semibold">Подписано</span>
          </div>
          {sig && <p className="text-[10px] text-gray-400 font-mono mt-0.5 pl-[18px]">{fmt(sig.timestamp)}</p>}
        </div>
      );
    case 'pending':
      return (
        <div className="flex items-center gap-1.5">
          <Clock size={12} className="text-amber-500 flex-shrink-0" />
          <span className="text-xs text-amber-600">Ожидается</span>
        </div>
      );
    case 'not_assigned':
      return <span className="text-xs text-gray-300 italic">Не назначен</span>;
    case 'not_required':
      return <span className="text-xs text-gray-300">Не требуется</span>;
  }
}

// ── Personnel row ─────────────────────────────────────────────────────────────
function PersonRow({
  num, label, userId, sig, status, userName
}: {
  num: string; label: string; userId?: string; sig?: EDSSignature; status: SigStatus; userName?: string;
}) {
  const u = getUser(userId);
  return (
    <div className={`grid grid-cols-12 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${status === 'not_assigned' ? 'opacity-40' : ''}`}>
      <div className="col-span-1 px-3 py-2.5 flex items-center">
        <span className="text-[10px] text-gray-400 font-mono">{num}</span>
      </div>
      <div className="col-span-3 px-3 py-2.5 flex items-center">
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <div className="col-span-4 px-3 py-2.5">
        {(userName || u?.name || sig?.userName) ? (
          <div>
            <p className="text-sm text-gray-900 font-medium leading-tight">{userName || u?.name || sig?.userName}</p>
            {(u?.position || sig?.userPosition) && (
              <p className="text-[10px] text-gray-400">{u?.position || sig?.userPosition} · Гр.ЭБ {u?.electricalGroup || sig?.userGroup}</p>
            )}
          </div>
        ) : (
          <span className="text-gray-300 text-sm italic">Не назначен</span>
        )}
      </div>
      <div className="col-span-4 px-3 py-2.5">
        <SigStatusCell status={status} sig={sig} />
      </div>
    </div>
  );
}

// ── Confirm dialog configs ────────────────────────────────────────────────────
interface ConfirmCfg {
  type: 'confirm' | 'danger' | 'signature';
  title?: string;
  message: string;
  detail?: string;
  confirmLabel?: string;
}

const CONFIRM_CFGS: Record<string, ConfirmCfg> = {
  cancel: {
    type: 'danger',
    title: 'Аннулирование наряда-допуска',
    message: 'Вы уверены, что хотите аннулировать наряд-допуск?',
    detail: 'Это действие нельзя отменить. Аннулированный наряд не может быть восстановлен.',
    confirmLabel: 'Аннулировать',
  },
  issuer_sign:   { type: 'signature', title: 'Подтверждение действия',               message: 'Вы уверены, что хотите подписать наряд-допуск?' },
  re_sign:       { type: 'signature', title: 'Подтверждение действия',               message: 'Вы уверены, что хотите подписать наряд-допуск (повторная выдача после доработки)?' },
  disp_approve:  { type: 'signature', title: 'Подтверждение действия',               message: 'Вы уверены, что хотите подписать разрешение на подготовку рабочих мест?' },
  assist_ack:    { type: 'confirm',   title: 'Подтверждение получения разрешения',   message: 'Подтвердить получение разрешения на подготовку рабочих мест?' },
  admitter_sign: { type: 'signature', title: 'Подтверждение действия',               message: 'Подтвердить корректность подготовки рабочих мест и подписать?' },
  admitter_re:   { type: 'signature', title: 'Подтверждение действия',               message: 'Подтвердить повторную проверку рабочих мест и подписать?' },
  verify_wp:     { type: 'signature', title: 'Подтверждение действия',               message: 'Вы уверены, что хотите одобрить подготовленное рабочее место?' },
  brief_admitter:{ type: 'signature', title: 'Подтверждение действия',               message: 'Подтвердить проведение инструктажа и допуск к работе?' },
  brief_resp:    { type: 'signature', title: 'Подтверждение действия',               message: 'Подтвердить проведение инструктажа и допуск к работе?' },
  end_daily:     { type: 'confirm',   title: 'Завершение работ дня',                 message: 'Подтвердить завершение ежедневных работ? Бригада выведена с рабочего места.' },
  foreman_close: { type: 'signature', title: 'Закрытие наряда-допуска (шаг 1/2)',    message: 'Подтвердить закрытие наряда-допуска? Работы завершены, бригада выведена, заземления сняты.', detail: 'После вашей подписи потребуется подпись ответственного руководителя.' },
  manager_close: { type: 'signature', title: 'Подтверждение закрытия (шаг 2/2)',    message: 'Подтвердить закрытие наряда-допуска? Работы выполнены, напряжение может быть подано.', detail: 'Это финальный шаг. После вашей подписи наряд-допуск будет закрыт.' },
  extend_sign:   { type: 'confirm',   title: 'Продление наряда-допуска',             message: 'Подтвердить продление срока действия наряда-допуска?' },
  member_sign:       { type: 'signature', title: 'Подтверждение получения инструктажа', message: 'Подтвердить получение инструктажа и допуск к работе?' },
  member_sign_daily: { type: 'signature', title: 'Подтверждение получения инструктажа', message: 'Подтвердить получение ежедневного инструктажа?' },
  assist_ready:  { type: 'confirm',   title: 'Подтверждение готовности',             message: 'Рабочие места подготовлены? Подтвердите передачу допускающему.' },
};

// Toast messages per action
const TOAST_MSGS: Record<string, string> = {
  issuer_sign:       'Наряд-допуск подписан ЭЦП',
  re_sign:           'Наряд-допуск подписан повторно (после доработки)',
  disp_approve:      'Разрешение на подготовку рабочих мест подписано',
  assist_ack:        'Получение разрешения подтверждено',
  admitter_sign:     'Рабочие места проверены и подписаны ЭЦП',
  admitter_re:       'Повторная проверка рабочих мест подписана',
  verify_wp:         'Рабочее место одобрено',
  brief_admitter:    'Инструктаж проведён, бригада допущена',
  brief_resp:        'Инструктаж подтверждён (Производитель)',
  end_daily:         'Ежедневные работы завершены',
  foreman_close:     'Закрытие наряда инициировано',
  manager_close:     'Наряд-допуск закрыт',
  extend_sign:       'Срок действия наряда продлён',
  member_sign:       'Инструктаж подтверждён (первичный допуск)',
  member_sign_daily: 'Ежедневный инструктаж подтверждён',
  cancel:            'Наряд-допуск аннулирован',
};

// ═════════════════════════════════════════════════════════════════════════════
export function WorkPermitDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const ctx = useWorkPermit();
  const { toasts, push: pushToast, dismiss: dismissToast } = useToast();

  const [tab, setTab] = useState<'main' | 'safety' | 'brigade' | 'briefings' | 'history'>('main');
  const [modal, setModal] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<(ConfirmCfg & { key: string; afterConfirm: () => void }) | null>(null);
  const [returnComment, setReturnComment] = useState('');
  const [livePartsText, setLivePartsText] = useState('');
  const [extendDate, setExtendDate] = useState('');
  const [closureNotify, setClosureNotify] = useState('');
  const [closureDateTime, setClosureDateTime] = useState(new Date().toISOString().slice(0, 16));
  const [closureComment, setClosureComment] = useState('');
  const [showCompletionFlow, setShowCompletionFlow] = useState(false);
  const [showPrint, setShowPrint] = useState(false);

  const permit = ctx.getPermit(id!);
  if (!permit || !currentUser) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="text-center">
        <p className="text-gray-500 mb-2 text-sm">Наряд не найден</p>
        <Link to="/permits" className="text-blue-600 text-sm hover:underline">← К списку</Link>
      </div>
    </div>
  );

  // ── Safety measures rows (2-column) ──────────────────────────────────────
  // Encode: each string is "installation\x1Fmeasures" or plain string (legacy)
  const parseSafetyRows = (arr: string[]): SafetyMeasureRow[] =>
    arr.length === 0
      ? [makeSafetyRow(), makeSafetyRow()]
      : arr.map((s, i) => {
          const sep = s.indexOf('\x1F');
          return {
            id: `sm_existing_${i}`,
            installation: sep >= 0 ? s.slice(0, sep) : s,
            measures:     sep >= 0 ? s.slice(sep + 1) : '',
          };
        });

  const serializeSafetyRows = (rows: SafetyMeasureRow[]): string[] =>
    rows
      .filter(r => r.installation.trim() || r.measures.trim())
      .map(r => `${r.installation}\x1F${r.measures}`);

  const [safetyRows, setSafetyRows] = useState<SafetyMeasureRow[]>(() =>
    parseSafetyRows(permit.safetyMeasures)
  );

  const role = currentUser.role;
  const uid  = currentUser.id;
  const uname = (currentUser.name || '').trim().toLowerCase();
  const nameMatch = (permitName?: string | null) =>
    !!permitName && !!uname && permitName.trim().toLowerCase() === uname;
  const idOrName = (permitId?: string | null, permitName?: string | null) =>
    permitId === uid || nameMatch(permitName);
  const isIssuer   = role === 'issuer'               && idOrName(permit.issuerId,              permit.issuerName);
  const isDisp     = role === 'dispatcher'            && idOrName(permit.dispatcherId,          permit.dispatcherName);
  const isAssist   = role === 'dispatcher_assistant'  && idOrName(permit.dispatcherAssistantId, permit.dispatcherAssistantName);
  const isAdmitter = role === 'admitter'              && idOrName(permit.admitterId,            permit.admitterName);
  const isManager  = role === 'manager'               && idOrName(permit.managerId,             permit.managerName);
  const isObserver = role === 'observer'              && idOrName(permit.observerId,             permit.observerName);
  const isForeman  = role === 'foreman'               && idOrName(permit.foremanId,             permit.foremanName);
  const isMember   = role === 'worker'                && permit.brigadeMembers.some(m => (m.userId === uid || nameMatch(m.name)) && m.isActive);

  const S = permit.status;
  const lastBriefing  = permit.dailyBriefings[permit.dailyBriefings.length - 1];
  const firstBriefing = permit.dailyBriefings.find(b => b.isFirst);
  const lastReturn    = [...permit.returnComments].reverse()[0];
  const stepIdx       = getStepIndex(S);
  const isClosed      = S === 'closed';

  const makeSig = (): EDSSignature => ({
    userId: uid, userName: currentUser.name,
    userPosition: currentUser.position, userGroup: currentUser.electricalGroup,
    timestamp: new Date().toISOString(),
  });

  const getVerifierLabel = () =>
    permit.managerId ? 'Ответственный руководитель' : permit.observerId ? 'Наблюдающий' : 'Производитель работ';

  // ── Confirm dialog helper ─────────────────────────────────────────────────
  const confirm = (key: string, afterConfirm: () => void) => {
    const cfg = CONFIRM_CFGS[key];
    if (cfg) {
      setPendingConfirm({ ...cfg, key, afterConfirm });
    } else {
      afterConfirm();
    }
  };

  // ── EDS modal after confirm ───────────────────────────────────────────────
  const handleEDSSign = (modalKey: string, sig: EDSSignature) => {
    setModal(null);
    switch (modalKey) {
      case 'issuer_sign':
      case 're_sign':       ctx.signByIssuer(permit.id, sig); break;
      case 'disp_approve':  ctx.signByDispatcher(permit.id, sig); break;
      case 'assist_ack':    ctx.acknowledgeByAssistant(permit.id, sig); break;
      case 'admitter_sign':
      case 'admitter_re':   ctx.signByAdmitter(permit.id, livePartsText, sig); break;
      case 'verify_wp': {
        const vRole = isManager ? 'manager' : isObserver ? 'observer' : 'foreman';
        ctx.approveWorkplace(permit.id, vRole, sig);
        break;
      }
      case 'brief_admitter': if (lastBriefing) ctx.signBriefingAdmitter(permit.id, lastBriefing.id, sig); break;
      case 'brief_resp':     if (lastBriefing) ctx.signBriefingResponsible(permit.id, lastBriefing.id, sig); break;
      case 'end_daily':      if (lastBriefing) ctx.endDailyWork(permit.id, lastBriefing.id, new Date().toISOString(), sig); break;
      case 'foreman_close':  ctx.initiateClosure(permit.id, closureNotify, new Date(closureDateTime).toISOString(), sig); break;
      case 'manager_close':  ctx.signClosureManager(permit.id, sig); break;
      case 'extend_sign':    if (extendDate) ctx.extendPermit(permit.id, new Date(extendDate).toISOString(), sig); break;
    }
    const msg = TOAST_MSGS[modalKey];
    if (msg) pushToast(msg, 'success', 'Действие успешно выполнено');
  };

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const TABS = [
    { id: 'main',      label: 'Сведения',    icon: FileText   },
    { id: 'safety',    label: 'Меры безоп.', icon: Shield     },
    { id: 'brigade',   label: 'Бригада',     icon: Users      },
    { id: 'briefings', label: 'Инструктажи', icon: Calendar   },
    { id: 'history',   label: 'История',     icon: Activity   },
  ] as const;

  // ── Actions ───────────────────────────────────────────────────────────────
  type ActionCfg = {
    key: string; label: string;
    variant: 'primary' | 'secondary' | 'danger' | 'warning';
    icon: any; show: boolean;
    directAction?: () => void;
  };

  const EDS_KEYS = [
    'issuer_sign','re_sign','disp_approve','assist_ack',
    'admitter_sign','admitter_re','verify_wp',
    'brief_admitter','brief_resp','end_daily',
    'foreman_close','manager_close','extend_sign',
  ];

  const ACTIONS: ActionCfg[] = [
    // Issuer
    { key: 'issuer_sign', label: 'Подписать ЭЦП',              variant: 'primary',   icon: Shield,       show: isIssuer && S === 'draft' && !permit.issuerSignature },
    { key: 're_sign',     label: 'Подписать ЭЦП (доработка)',  variant: 'primary',   icon: Shield,       show: isIssuer && S === 'rework' },
    { key: 'cancel',      label: 'Аннулировать',               variant: 'danger',    icon: XCircle,      show: isIssuer && !['closed','cancelled'].includes(S), directAction: () => setModal('cancel_form') },
    // Dispatcher
    { key: 'disp_approve',label: 'Подписать разрешение ЭЦП',  variant: 'primary',   icon: Shield,       show: isDisp && S === 'pending_dispatcher' },
    { key: 'disp_return', label: 'Вернуть на доработку',       variant: 'danger',    icon: RotateCcw,    show: isDisp && S === 'pending_dispatcher', directAction: () => setModal('disp_return') },
    // Assistant
    { key: 'assist_ack',  label: 'Подтвердить получение ЭЦП', variant: 'primary',   icon: Shield,       show: isAssist && S === 'pending_assistant' },
    { key: 'assist_ready',label: 'Рабочие места готовы',       variant: 'secondary', icon: CheckCircle2, show: isAssist && S === 'preparing_workplaces', directAction: () => ctx.submitWorkplacesReady(permit.id) },
    { key: 'assist_fix',  label: 'Исправить и сдать',          variant: 'secondary', icon: CheckCircle2, show: isAssist && S === 'returned_to_assistant', directAction: () => ctx.submitWorkplacesReady(permit.id) },
    // Admitter
    { key: 'admitter_sign',label: 'Подписать проверку РМ ЭЦП',variant: 'primary',   icon: Shield,       show: isAdmitter && S === 'pending_admitter' },
    { key: 'admitter_re', label: 'Исправить и подписать ЭЦП', variant: 'primary',   icon: Shield,       show: isAdmitter && S === 'returned_to_admitter' },
    { key: 'admit_return',label: 'Вернуть помощнику ГД',       variant: 'danger',    icon: RotateCcw,    show: isAdmitter && S === 'pending_admitter', directAction: () => setModal('admit_return') },
    { key: 'brief_admitter',label:'Подписать инструктаж ЭЦП', variant: 'primary',   icon: Shield,       show: isAdmitter && S === 'workplace_approved' && !!lastBriefing && !lastBriefing.admitterSignature },
    // Verifiers
    { key: 'verify_wp',   label: 'Одобрить рабочие места ЭЦП',variant: 'primary',   icon: Shield,       show: (isManager || isObserver || isForeman) && S === 'admitter_checked' && (() => { if (isManager && !!permit.managerId) return true; if (isObserver && !permit.managerId) return true; if (isForeman && !permit.managerId && !permit.observerId) return true; return false; })() },
    { key: 'verify_ret',  label: 'Вернуть допускающему',       variant: 'danger',    icon: RotateCcw,    show: (isManager || isObserver || isForeman) && S === 'admitter_checked', directAction: () => setModal('verify_return') },
    // Briefing
    { key: 'brief_resp',  label: 'Подписать инструктаж ЭЦП',  variant: 'primary',   icon: Shield,       show: (isForeman || isObserver) && ['admitted','in_progress'].includes(S) && !!lastBriefing?.admitterSignature && !lastBriefing?.responsibleSignature },
    { key: 'end_daily',   label: 'Завершить работы дня ЭЦП',  variant: 'secondary', icon: Clock,        show: (isForeman || isObserver) && ['admitted','in_progress'].includes(S) && !!lastBriefing?.responsibleSignature && !lastBriefing?.endSignature },
    // Foreman
    { key: 'completion_flow',label:'Проверка завершения работ',variant:'secondary',  icon: ChevronRight, show: isForeman && ['daily_ended','in_progress'].includes(S), directAction: () => setShowCompletionFlow(true) },
    // Extend
    { key: 'extend_form', label: 'Продлить наряд',             variant: 'warning',   icon: RefreshCw,    show: isIssuer && ['daily_ended','in_progress'].includes(S), directAction: () => setModal('extend_form') },
    // Close
    { key: 'closure_form', label: permit.managerId ? 'Закрыть наряд (шаг 1/2)' : 'Закрыть наряд', variant: 'secondary', icon: XCircle, show: isForeman && ['daily_ended','in_progress'].includes(S), directAction: () => setModal('closure_form') },
    { key: 'manager_close', label: 'Подтвердить закрытие ЭЦП (шаг 2/2)', variant: 'primary', icon: Shield, show: isManager && S === 'closing' },
    // Member
    {
      key: 'member_sign', label: 'Подписать допуск ЭЦП', variant: 'primary', icon: Shield,
      show: isMember && !!firstBriefing && !!firstBriefing?.admitterSignature && !firstBriefing?.brigadeSignatures.find(s => s.memberId === permit.brigadeMembers.find(m => m.userId === uid)?.id),
      directAction: () => {
        const m = permit.brigadeMembers.find(bm => bm.userId === uid);
        if (m && firstBriefing) { ctx.signBriefingMember(permit.id, firstBriefing.id, m.id, m.name, makeSig()); pushToast(TOAST_MSGS['member_sign'], 'success', 'Действие успешно выполнено'); }
      },
    },
    {
      key: 'member_sign_daily', label: 'Подписать инструктаж ЭЦП', variant: 'primary', icon: Shield,
      show: isMember && !!lastBriefing && lastBriefing !== firstBriefing && !!lastBriefing?.admitterSignature && !lastBriefing?.brigadeSignatures.find(s => s.memberId === permit.brigadeMembers.find(m => m.userId === uid)?.id),
      directAction: () => {
        const m = permit.brigadeMembers.find(bm => bm.userId === uid);
        if (m && lastBriefing) { ctx.signBriefingMember(permit.id, lastBriefing.id, m.id, m.name, makeSig()); pushToast(TOAST_MSGS['member_sign_daily'], 'success', 'Действие успешно выполнено'); }
      },
    },
  ];

  const visibleActions = ACTIONS.filter(a => a.show);

  const btnCls = (v: string) => ({
    primary:   'bg-gray-900 hover:bg-black text-white',
    secondary: 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-300',
    danger:    'bg-white hover:bg-red-50 text-red-700 border border-red-300',
    warning:   'bg-white hover:bg-amber-50 text-amber-700 border border-amber-300',
  })[v] || 'bg-gray-900 text-white';

  // Central click handler — routes through confirm if needed
  const handleActionClick = (a: ActionCfg) => {
    const execAction = a.directAction ?? (EDS_KEYS.includes(a.key) ? () => setModal(a.key) : undefined);
    if (!execAction) return;
    const cfg = CONFIRM_CFGS[a.key];
    if (cfg) {
      setPendingConfirm({ ...cfg, key: a.key, afterConfirm: execAction });
    } else {
      execAction();
    }
  };

  const EDS_TITLES: Record<string, string> = {
    issuer_sign:    'Выдача наряда-допуска',
    re_sign:        'Повторная выдача (доработка)',
    disp_approve:   'Разрешение на подготовку рабочих мест',
    assist_ack:     'Подтверждение получения разрешения',
    admitter_sign:  'Проверка рабочих мест (Допускающий)',
    admitter_re:    'Повторная проверка рабочих мест',
    verify_wp:      `Одобрение рабочих мест (${getVerifierLabel()})`,
    brief_admitter: 'Проведение инструктажа и допуск к работе',
    brief_resp:     'Подтверждение инструктажа',
    end_daily:      'Окончание ежедневных работ',
    foreman_close:  'Закрытие наряда-допуска (Производитель)',
    manager_close:  'Подтверждение закрытия (Руководитель)',
    extend_sign:    'Продление наряда-допуска',
  };

  const EDS_DESCS: Record<string, string> = {
    issuer_sign:    'Подтвердите выдачу наряда-допуска. Документ будет направлен главному диспетчеру.',
    re_sign:        'Доработка завершена. Подтвердите повторную выдачу наряда-допуска главному диспетчеру.',
    disp_approve:   'Подтвердите разрешение на подготовку рабочих мест. Документ будет направлен помощнику ГД.',
    assist_ack:     'Подтвердите получение разрешения. После подписания приступайте к подготовке рабочих мест.',
    admitter_sign:  'Подтвердите проверку рабочих мест. Укажите части под напряжением (если имеются).',
    admitter_re:    'Замечания устранены. Подтвердите повторную проверку рабочих мест.',
    verify_wp:      'Подтвердите корректность подготовленных рабочих мест.',
    brief_admitter: 'Подтвердите проведение ежедневного инструктажа и допуск бригады к работе.',
    brief_resp:     'Подтвердите получение инструктажа и допуск к работе.',
    end_daily:      'Подтвердите завершение ежедневных работ. Бригада выведена с рабочего места.',
    foreman_close:  `Бригада выведена. Заземления сняты. Уведомляется: ${closureNotify}. Дата завершения: ${closureDateTime ? fmtDT(new Date(closureDateTime).toISOString()) : '—'}.`,
    manager_close:  'Подтвердите закрытие наряда-допуска. Работы выполнены, напряжение может быть подано.',
    extend_sign:    extendDate ? `Подтвердите продление наряда до ${fmtDT(new Date(extendDate).toISOString())}.` : 'Подтвердите продление наряда-допуска.',
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Top header bar ───────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4 h-14">
            <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition-colors">
              <ChevronLeft size={16} />
              <span className="text-sm">Назад</span>
            </button>
            <div className="h-4 w-px bg-gray-200" />
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-mono">НД-{permit.number}</span>
                <StatusBadge status={S} />
              </div>
              <span className="text-gray-800 text-sm font-medium truncate hidden sm:block">{permit.task}</span>
            </div>

            {/* Print button — only active when closed */}
            {isClosed ? (
              <button
                onClick={() => setShowPrint(true)}
                title="Открыть версию для печати"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors text-xs border border-gray-300"
              >
                <Printer size={13} />
                <span className="hidden sm:inline">Печать</span>
              </button>
            ) : (
              <div
                title="Печать доступна только после закрытия наряда"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-gray-400 text-xs cursor-not-allowed select-none border border-dashed border-gray-200"
              >
                <Lock size={12} />
                <span className="hidden sm:inline">Печать</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">

        {/* ── Return banner ── */}
        {(S === 'rework' || S === 'returned_to_issuer' || S === 'returned_to_assistant' || S === 'returned_to_admitter') && lastReturn && (
          <div className="mb-4 bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 flex items-start gap-3">
            <AlertTriangle size={15} className="text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-orange-800 text-sm font-semibold">Наряд возвращён на доработку</p>
              <p className="text-orange-700 text-sm mt-0.5">{lastReturn.comment}</p>
              <p className="text-orange-500 text-xs mt-1">от {lastReturn.fromUserName} · {fmtDT(lastReturn.timestamp)}</p>
            </div>
          </div>
        )}

        {/* ── Stepper ── */}
        <div className="bg-white border border-gray-200 rounded-lg mb-5 px-4 py-3 overflow-x-auto">
          <div className="flex items-center min-w-max gap-0">
            {STEPS.map((step, i) => {
              const done = i < stepIdx;
              const active = i === stepIdx;
              const cancelled = S === 'cancelled';
              return (
                <React.Fragment key={step.label}>
                  <div className="flex flex-col items-center w-20 flex-shrink-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-all ${
                      cancelled && i > stepIdx ? 'border-red-300 bg-red-50 text-red-400'
                      : done   ? 'border-emerald-500 bg-emerald-500 text-white'
                      : active ? 'border-gray-900 bg-gray-900 text-white'
                                : 'border-gray-200 bg-white text-gray-400'
                    }`}>
                      {done ? <CheckCircle2 size={13} /> : i + 1}
                    </div>
                    <p className={`text-center leading-tight mt-1.5 text-[10px] font-medium ${
                      active ? 'text-gray-900' : done ? 'text-emerald-600' : 'text-gray-400'
                    }`}>{step.label}</p>
                    <p className={`text-center text-[9px] mt-0.5 ${active ? 'text-gray-500' : 'text-gray-300'}`}>{step.sub}</p>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`h-px flex-1 min-w-[20px] mx-1 ${i < stepIdx ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">

          {/* ── Right column: Actions ── */}
          <div className="xl:col-span-1 xl:order-2 space-y-4">

            {/* Closing — manager must sign */}
            {S === 'closing' && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
                <Clock size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Ожидается подпись руководителя</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Производитель работ подписал закрытие.
                    Наряд будет закрыт после подписи ответственного руководителя {getUser(permit.managerId)?.shortName ? `(${getUser(permit.managerId)?.shortName})` : ''}.
                  </p>
                </div>
              </div>
            )}

            {/* Closed / Cancelled banner */}
            {(isClosed || S === 'cancelled') && (
              <div className={`rounded-lg border px-4 py-3 flex items-center gap-3 ${
                isClosed ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
              }`}>
                {isClosed
                  ? <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                  : <XCircle size={16} className="text-red-500 flex-shrink-0" />
                }
                <div>
                  <p className={`text-sm font-semibold ${isClosed ? 'text-emerald-800' : 'text-red-800'}`}>
                    {isClosed ? 'Наряд закрыт' : 'Наряд аннулирован'}
                  </p>
                  <p className={`text-xs mt-0.5 ${isClosed ? 'text-emerald-600' : 'text-red-600'}`}>
                    {isClosed ? 'Все действия завершены. Доступен просмотр и печать.' : 'Документ недействителен. Только просмотр.'}
                  </p>
                </div>
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">Доступные действия</p>
                {visibleActions.some(a => CONFIRM_CFGS[a.key]) && (
                  <div className="flex items-center gap-1 text-[9px] text-gray-400">
                    <Shield size={9} />
                    <span>Требует подтверждения</span>
                  </div>
                )}
              </div>
              {visibleActions.length > 0 ? (
                <div className="p-3 space-y-2">
                  {visibleActions.map(a => (
                    <button
                      key={a.key}
                      onClick={() => handleActionClick(a)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded text-sm font-medium transition-all ${btnCls(a.variant)}`}
                    >
                      <a.icon size={14} className="flex-shrink-0" />
                      <span className="text-left leading-tight flex-1">{a.label}</span>
                      {CONFIRM_CFGS[a.key] && (
                        <Shield size={10} className="opacity-30 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 flex flex-col items-center text-center">
                  {isClosed ? (
                    <>
                      <Printer size={18} className="text-gray-300 mb-2" />
                      <p className="text-xs text-gray-500 mb-3">Доступна версия для печати</p>
                      <button
                        onClick={() => setShowPrint(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs rounded hover:bg-black transition-colors"
                      >
                        <Printer size={12} /> Версия для печати
                      </button>
                    </>
                  ) : S === 'cancelled' ? (
                    <>
                      <XCircle size={18} className="text-red-300 mb-2" />
                      <p className="text-xs text-gray-500">Наряд аннулирован</p>
                    </>
                  ) : (
                    <>
                      <Clock size={18} className="text-gray-300 mb-2" />
                      <p className="text-xs text-gray-500">Ожидание действий другой роли</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Rework panel */}
            {isIssuer && S === 'rework' && (
              <ReworkPanel
                initialMeasures={permit.safetyMeasures}
                initialInstructions={permit.specialInstructions}
                lastComment={lastReturn?.comment || ''}
                onSave={(measures, instructions) => ctx.saveRework(permit.id, measures, instructions)}
                onSign={() => confirm('re_sign', () => setModal('re_sign'))}
              />
            )}

            {/* Dates summary */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">Сроки</p>
              </div>
              <div className="p-3 space-y-2">
                {[
                  { label: 'Начало работ',    v: fmtDT(permit.workStartDateTime) },
                  { label: 'Окончание работ', v: fmtDT(permit.workEndDateTime), overdue: new Date(permit.workEndDateTime) < new Date() && !['closed','cancelled'].includes(S) },
                  { label: 'Выдан (ЭЦП)',     v: fmtDT(permit.issuerSignature?.timestamp) },
                  { label: 'Первый допуск',   v: permit.dailyBriefings[0]?.admitterSignature ? fmtDT(permit.dailyBriefings[0].briefingDateTime) : '—' },
                  ...(permit.extensions.length > 0 ? [{ label: `Продлён (×${permit.extensions.length})`, v: fmtDT(permit.workEndDateTime) }] : []),
                  ...(permit.closureDateTime ? [{ label: 'Закрыт', v: fmtDT(permit.closureDateTime) }] : []),
                ].map(({ label, v, overdue }) => (
                  <div key={label} className="flex justify-between gap-2">
                    <span className="text-[11px] text-gray-500">{label}</span>
                    <span className={`text-[11px] font-mono font-medium ${overdue ? 'text-red-600' : 'text-gray-800'}`}>{v}{overdue ? ' ⚠' : ''}</span>
                  </div>
                ))}
              </div>
            </div>

            <VersionHistory versions={permit.versions ?? []} currentVersion={permit.versions?.length ?? 1} />
          </div>

          {/* ── Left column: Content ── */}
          <div className="xl:col-span-3 xl:order-1 space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex border-b border-gray-200 overflow-x-auto">
                {TABS.map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-all ${
                      tab === t.id ? 'border-gray-900 text-gray-900 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}>
                    <t.icon size={13} />
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="p-5">

                {/* ─ Main tab ─ */}
                {tab === 'main' && (
                  <div className="space-y-5">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider mb-3">Основные сведения</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        {[
                          { label: 'Организация',   value: permit.organization },
                          { label: 'Подразделение', value: permit.department },
                        ].map(({ label, value }) => (
                          <div key={label} className="bg-gray-50 border border-gray-100 rounded px-3 py-2">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                            <p className="text-sm text-gray-900">{value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="bg-gray-50 border border-gray-100 rounded px-3 py-2">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Поручается</p>
                        <p className="text-sm text-gray-900 leading-relaxed">{permit.task}</p>
                      </div>
                      {permit.liveParts && (
                        <div className="bg-amber-50 border border-amber-200 rounded px-3 py-2 mt-2 flex items-start gap-2">
                          <AlertTriangle size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[10px] text-amber-600 uppercase font-semibold">Части под напряжением</p>
                            <p className="text-sm text-amber-900">{permit.liveParts}</p>
                          </div>
                        </div>
                      )}
                      {permit.specialInstructions && (
                        <div className="bg-blue-50 border border-blue-100 rounded px-3 py-2 mt-2">
                          <p className="text-[10px] text-blue-600 uppercase font-semibold mb-0.5">Особые указания</p>
                          <p className="text-sm text-blue-900">{permit.specialInstructions}</p>
                        </div>
                      )}
                    </div>

                    {/* ── Personnel & Signatures table ── */}
                    {(() => {
                      const isTerminal = ['closed', 'cancelled'].includes(S);

                      // Compute sig status helper
                      const cs = (userId?: string, sig?: EDSSignature): SigStatus => {
                        if (!userId) return 'not_assigned';
                        if (sig) return 'signed';
                        return isTerminal ? 'not_required' : 'pending';
                      };

                      // Best sig for each composite role
                      const managerBestSig = permit.managerClosureSignature
                        || (permit.workplaceVerifierRole === 'manager' ? permit.workplaceVerifierSignature : undefined);
                      const observerBestSig = permit.workplaceVerifierRole === 'observer' ? permit.workplaceVerifierSignature : undefined;
                      const foremanBestSig = permit.foremanClosureSignature
                        || (permit.workplaceVerifierRole === 'foreman' ? permit.workplaceVerifierSignature : undefined);

                      // Observer: only expected to sign if no manager assigned (as verifier)
                      const observerStatus: SigStatus = !permit.observerId ? 'not_assigned'
                        : observerBestSig ? 'signed'
                        : isTerminal ? 'not_required'
                        : (permit.managerId) ? 'not_required'   // manager is primary verifier
                        : 'pending';

                      return (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">Ответственный персонал и подписи ЭЦП</p>
                            {isTerminal && (
                              <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border font-semibold ${
                                S === 'closed'
                                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                  : 'text-red-600 bg-red-50 border-red-200'
                              }`}>
                                {S === 'closed' ? <><CheckCircle2 size={10} /> Наряд закрыт</> : <><XCircle size={10} /> Аннулирован</>}
                              </span>
                            )}
                          </div>
                          <div className="border border-gray-200 rounded-lg overflow-hidden">
                            {/* Header */}
                            <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200">
                              {['', 'Роль', 'Лицо', 'Статус / ЭЦП'].map((h, i) => (
                                <div key={i} className={`px-3 py-2 ${i === 0 ? 'col-span-1' : i === 1 ? 'col-span-3' : i === 2 ? 'col-span-4' : 'col-span-4'}`}>
                                  <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">{h}</p>
                                </div>
                              ))}
                            </div>

                            {/* Rows — core workflow */}
                            <PersonRow num="①" label="Выдающий наряд-допуск"    userId={permit.issuerId}              sig={permit.issuerSignature}               status={cs(permit.issuerId, permit.issuerSignature)} userName={permit.issuerName} />
                            <PersonRow num="②" label="Главный диспетчер"         userId={permit.dispatcherId}          sig={permit.dispatcherSignature}           status={cs(permit.dispatcherId, permit.dispatcherSignature)} userName={permit.dispatcherName} />
                            <PersonRow num="③" label="Помощник ГД"               userId={permit.dispatcherAssistantId} sig={permit.dispatcherAssistantSignature}  status={cs(permit.dispatcherAssistantId, permit.dispatcherAssistantSignature)} userName={permit.dispatcherAssistantName} />
                            <PersonRow num="④" label="Допускающий"               userId={permit.admitterId}            sig={permit.admitterWorkplaceSignature}    status={cs(permit.admitterId, permit.admitterWorkplaceSignature)} userName={permit.admitterName} />

                            {/* Manager — verifier + closure */}
                            <PersonRow num="⑤" label="Отв. руководитель"
                              userId={permit.managerId}
                              sig={managerBestSig}
                              status={!permit.managerId ? 'not_assigned' : managerBestSig ? 'signed' : isTerminal ? 'not_required' : 'pending'}
                              userName={permit.managerName}
                            />

                            {/* Observer */}
                            <PersonRow num="⑥" label="Наблюдающий"
                              userId={permit.observerId}
                              sig={observerBestSig}
                              status={observerStatus}
                              userName={permit.observerName}
                            />

                            {/* Foreman */}
                            <PersonRow num="⑦" label="Производитель работ"
                              userId={permit.foremanId}
                              sig={foremanBestSig}
                              status={cs(permit.foremanId, foremanBestSig)}
                              userName={permit.foremanName}
                            />

                            {/* Extra rows for individual signature events */}
                            {permit.workplaceVerifierSignature && !['foreman','manager','observer'].includes(permit.workplaceVerifierRole || '') && (
                              <PersonRow num="✓" label={`Одобрение РМ (${getVerifierLabel()})`}
                                userId={permit.workplaceVerifierRole === 'manager' ? permit.managerId : permit.observerId}
                                sig={permit.workplaceVerifierSignature}
                                status="signed"
                              />
                            )}
                          </div>

                          {/* Closure detail block */}
                          {permit.closureNotifyPerson && (
                            <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
                              <div className="px-3 py-2 bg-slate-100 border-b border-slate-200 flex items-center gap-2">
                                <XCircle size={12} className="text-slate-500" />
                                <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide">Закрытие наряда-допуска</p>
                              </div>
                              <div className="px-3 py-2.5 space-y-1.5">
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-slate-500 w-32 flex-shrink-0">Уведомлено:</span>
                                  <span className="text-xs text-slate-800">{permit.closureNotifyPerson}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-slate-500 w-32 flex-shrink-0">Дата и время:</span>
                                  <span className="text-xs text-slate-800 font-mono">{fmtDT(permit.closureDateTime)}</span>
                                </div>
                                {permit.foremanClosureSignature && (
                                  <div className="flex items-center gap-3 pt-1 border-t border-slate-100">
                                    <span className="text-xs text-slate-500 w-32 flex-shrink-0">Произв. работ:</span>
                                    <SigStatusCell status="signed" sig={permit.foremanClosureSignature} />
                                  </div>
                                )}
                                {permit.managerClosureSignature && (
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs text-slate-500 w-32 flex-shrink-0">Рук. работ:</span>
                                    <SigStatusCell status="signed" sig={permit.managerClosureSignature} />
                                  </div>
                                )}
                                {permit.managerId && !permit.managerClosureSignature && S === 'closing' && (
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs text-slate-500 w-32 flex-shrink-0">Рук. работ:</span>
                                    <SigStatusCell status="pending" />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* ─ Safety tab ─ */}
                {tab === 'safety' && (
                  <SafetyTab
                    permit={permit}
                    S={S}
                    isIssuer={isIssuer}
                    isDisp={isDisp}
                    isAssist={isAssist}
                    isAdmitter={isAdmitter}
                    safetyRows={safetyRows}
                    setSafetyRows={setSafetyRows}
                    serializeSafetyRows={serializeSafetyRows}
                    ctx={ctx}
                    pushToast={pushToast}
                    setModal={setModal}
                    getVerifierLabel={getVerifierLabel}
                  />
                )}

                {/* ─ Brigade tab ─ */}
                {tab === 'brigade' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">Состав бригады</p>
                      {isForeman && ['in_progress', 'admitted', 'daily_ended'].includes(S) && (
                        <button
                          onClick={() => setModal('brigade_management')}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-medium rounded transition-colors"
                        >
                          <Users size={12} />
                          Изменить состав
                        </button>
                      )}
                    </div>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      {(() => {
                        const f = getUser(permit.foremanId); if (!f) return null;
                        return (
                          <div className="flex items-center gap-3 px-4 py-3 bg-orange-50 border-b border-orange-100">
                            <div className="w-8 h-8 rounded bg-orange-200 flex items-center justify-center text-xs font-semibold text-orange-800 flex-shrink-0">
                              {f.name.split(' ').map(s => s[0]).slice(0, 2).join('')}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-900 font-medium">{f.name}</p>
                              <p className="text-[10px] text-gray-500">{f.position} · Гр.ЭБ {f.electricalGroup}</p>
                            </div>
                            <span className="text-[10px] font-semibold text-orange-700 bg-orange-100 border border-orange-200 px-2 py-0.5 rounded uppercase">Производитель работ</span>
                          </div>
                        );
                      })()}
                      {permit.brigadeMembers.filter(m => m.isActive).length > 0 ? (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              {['Ф.И.О.', 'Группа ЭБ', 'Направление работ', 'Допуск ЭЦП'].map(h => (
                                <th key={h} className="px-3 py-2 text-left text-[10px] text-gray-400 uppercase tracking-wide font-semibold">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {permit.brigadeMembers.filter(m => m.isActive).map(m => {
                              const signed = permit.dailyBriefings[0]?.brigadeSignatures.find(s => s.memberId === m.id);
                               const brigSt: SigStatus = signed ? 'signed' : (['closed','cancelled'].includes(S) ? 'not_required' : 'pending');
                              return (
                                <tr key={m.id} className="hover:bg-gray-50">
                                  <td className="px-3 py-2.5">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-semibold text-gray-600 flex-shrink-0">
                                        {m.name.split(' ').map(s => s[0]).slice(0, 2).join('')}
                                      </div>
                                      <span className="text-gray-800">{m.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2.5"><span className="font-mono text-gray-600">{m.group}</span></td>
                                  <td className="px-3 py-2.5 text-gray-600">{m.direction || '—'}</td>
                                  <td className="px-3 py-2.5">
                                    {signed
                                      ? <SigStatusCell status="signed" sig={signed.sig} />
                                      : <SigStatusCell status={brigSt} />}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      ) : (
                        <div className="py-8 text-center text-gray-400">
                          <Users size={24} className="mx-auto mb-2 opacity-30" />
                          <p className="text-sm">Нет членов бригады</p>
                        </div>
                      )}
                    </div>
                    {permit.brigadeMembers.filter(m => !m.isActive).length > 0 && (
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider mb-2">Выведены из бригады</p>
                        <div className="space-y-1">
                          {permit.brigadeMembers.filter(m => !m.isActive).map(m => (
                            <div key={m.id} className="flex items-center gap-3 px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-500 line-through">
                              <X size={12} className="text-red-400 flex-shrink-0" />
                              {m.name} — Гр.ЭБ {m.group} — выведен {fmtDT(m.removedAt)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ─ Briefings tab ─ */}
                {tab === 'briefings' && (
                  <div className="space-y-4">
                    {/* Daily Work Flow Panel */}
                    {['in_progress', 'admitted', 'daily_ended'].includes(S) && (isForeman || isObserver || isAdmitter) && (
                      <DailyWorkFlow
                        permit={permit}
                        isForeman={isForeman}
                        isObserver={isObserver}
                        isAdmitter={isAdmitter}
                        onStartNewDay={() => {
                          // Create new briefing for next day
                          const nextDay = permit.dailyBriefings.length + 1;
                          const brief: DailyBriefing = {
                            id: `db_${Date.now()}`,
                            isFirst: false,
                            workLocationName: lastBriefing?.workLocationName || '',
                            briefingDateTime: new Date().toISOString(),
                            brigadeSignatures: [],
                          };
                          ctx.createBriefing(permit.id, brief);
                          pushToast(`Начат день ${nextDay}`, 'success', 'Добавлена новая запись инструктажа');
                        }}
                        onExtendPermit={() => setModal('extend_form')}
                        onEndDay={() => {
                          if (lastBriefing) {
                            ctx.endDailyWork(permit.id, lastBriefing.id, new Date().toISOString(), makeSig());
                            pushToast('Работы дня завершены', 'success');
                          }
                        }}
                        onCheckCompletion={() => setShowCompletionFlow(true)}
                        onRequestNextDay={() => {
                          if (currentUser) {
                            ctx.requestNextDay(permit.id, currentUser.id, currentUser.name);
                            pushToast('Запрос на следующий день отправлен', 'success', 'Ожидается одобрение допускающего');
                          }
                        }}
                        onApproveNextDay={() => {
                          ctx.approveNextDay(permit.id, makeSig());
                          pushToast('Следующий день одобрен', 'success', 'Создан новый инструктаж');
                        }}
                      />
                    )}

                    <DailyWorkJournalNew
                      briefings={permit.dailyBriefings}
                      brigadeMembers={permit.brigadeMembers}
                      currentUser={currentUser}
                      observerId={permit.observerId}
                      permitStatus={S}
                      canAddBriefing={isAdmitter && ['workplace_approved', 'in_progress', 'daily_ended'].includes(S)}
                      canSignAdmitter={isAdmitter && !!permit.dailyBriefings.find(b => !b.admitterSignature)}
                      canSignResponsible={(isForeman || isObserver)}
                      canSignMember={isMember}
                      canEndWork={isForeman || isObserver}
                      onAddBriefing={(location, dateTime) => {
                        const brief: DailyBriefing = {
                          id: `db_${Date.now()}`, isFirst: permit.dailyBriefings.length === 0,
                          workLocationName: location, briefingDateTime: dateTime, brigadeSignatures: [],
                        };
                        ctx.createBriefing(permit.id, brief);
                        pushToast('Новый день добавлен', 'success', 'Запись создана');
                      }}
                      onSignAdmitter={(briefingId) => {
                        ctx.signBriefingAdmitter(permit.id, briefingId, makeSig());
                        pushToast('Инструктаж подписан (Допускающий)', 'success', 'Действие успешно выполнено');
                      }}
                      onSignResponsible={(briefingId) => {
                        ctx.signBriefingResponsible(permit.id, briefingId, makeSig());
                        pushToast('Инструктаж подтверждён', 'success', 'Действие успешно выполнено');
                      }}
                      onSignMember={(briefingId, memberId, memberName) => {
                        ctx.signBriefingMember(permit.id, briefingId, memberId, memberName, makeSig());
                        pushToast(`Инструктаж подтверждён: ${memberName}`, 'success', 'Действие успешно выполнено');
                      }}
                      onEndWork={(briefingId, endDateTime) => {
                        ctx.endDailyWork(permit.id, briefingId, new Date(endDateTime).toISOString(), makeSig());
                        pushToast('Ежедневные работы завершены', 'success', 'Действие успешно выполнено');
                      }}
                    />
                  </div>
                )}

                {/* ─ History tab ─ */}
                {tab === 'history' && (
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider mb-4">Журнал событий</p>
                    <div className="space-y-0">
                      {[...permit.events].reverse().map((ev, i, arr) => (
                        <div key={ev.id} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-7 h-7 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                              <span className="text-gray-500 text-[10px] font-semibold">
                                {ev.userName?.split(' ').map(s => s[0]).slice(0, 2).join('') || '?'}
                              </span>
                            </div>
                            {i < arr.length - 1 && <div className="w-px flex-1 bg-gray-100 my-0.5" style={{ minHeight: '16px' }} />}
                          </div>
                          <div className="flex-1 pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-gray-800 text-sm">{ev.action}</p>
                                {ev.userName && <p className="text-gray-400 text-xs">{ev.userName}</p>}
                              </div>
                              <p className="text-gray-400 text-[10px] font-mono whitespace-nowrap flex-shrink-0">{fmtDT(ev.timestamp)}</p>
                            </div>
                            {ev.comment && (
                              <div className="mt-1.5 flex items-start gap-1.5 p-2 bg-gray-50 border border-gray-200 rounded">
                                <MessageSquare size={11} className="text-gray-400 flex-shrink-0 mt-0.5" />
                                <p className="text-gray-600 text-xs">{ev.comment}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ CONFIRM DIALOG ══════════ */}
      {pendingConfirm && (
        <ConfirmDialog
          open={true}
          type={pendingConfirm.type}
          title={pendingConfirm.title}
          message={pendingConfirm.message}
          detail={pendingConfirm.detail}
          confirmLabel={pendingConfirm.confirmLabel}
          permitNumber={permit.number}
          onConfirm={() => { pendingConfirm.afterConfirm(); setPendingConfirm(null); }}
          onCancel={() => setPendingConfirm(null)}
        />
      )}

      {/* ══════════ RETURN MODALS ══════════ */}
      {modal === 'disp_return' && (
        <ReturnModal title="Возврат на доработку" subtitle="Укажите замечания по мерам безопасности" comment={returnComment}
          setComment={setReturnComment} onCancel={() => setModal(null)}
          onConfirm={() => {
            ctx.returnToIssuer(permit.id, returnComment, makeSig());
            setModal(null); setReturnComment('');
            pushToast('Наряд возвращён на доработку', 'info');
          }} />
      )}
      {modal === 'admit_return' && (
        <ReturnModal title="Возврат помощнику ГД" subtitle="Укажите замечания по подготовке рабочих мест" comment={returnComment}
          setComment={setReturnComment} onCancel={() => setModal(null)}
          onConfirm={() => {
            ctx.returnToAssistant(permit.id, returnComment);
            setModal(null); setReturnComment('');
            pushToast('Возвращено помощнику ГД', 'info');
          }} />
      )}
      {modal === 'verify_return' && (
        <ReturnModal title="Возврат допускающему" subtitle="Укажите замечания по рабочим местам" comment={returnComment}
          setComment={setReturnComment} onCancel={() => setModal(null)}
          onConfirm={() => {
            ctx.returnToAdmitter(permit.id, returnComment, uid, currentUser.name);
            setModal(null); setReturnComment('');
            pushToast('Возвращено допускающему', 'info');
          }} />
      )}
      {modal === 'cancel_form' && (
        <ReturnModal title="Аннулирование наряда-допуска" subtitle="Укажите причину аннулирования. Действие необратимо." comment={returnComment}
          setComment={setReturnComment} onCancel={() => setModal(null)} danger
          onConfirm={() => {
            ctx.cancelPermit(permit.id, uid, currentUser.name, returnComment);
            setModal(null); setReturnComment('');
            pushToast('Наряд-допуск аннулирован', 'error', 'Документ недействителен');
          }} />
      )}

      {/* ══════════ EXTEND MODAL ══════════ */}
      {modal === 'extend_form' && (
        <ExtendPermitModal
          currentEndDateTime={permit.workEndDateTime}
          extensionCount={permit.extensions.length}
          onClose={() => setModal(null)}
          onExtend={(newEndDateTime) => {
            setExtendDate(newEndDateTime.slice(0, 16));
            setModal('extend_sign');
          }}
        />
      )}

      {/* ══════════ BRIGADE MANAGEMENT MODAL ══════════ */}
      {modal === 'brigade_management' && (
        <BrigadeManagementModal
          currentMembers={permit.brigadeMembers}
          onClose={() => setModal(null)}
          onSave={(members, sig) => {
            ctx.updateBrigade(permit.id, members, sig);
            setModal(null);
            pushToast('Состав бригады обновлён', 'success', 'Изменения подписаны ЭЦП');
          }}
          makeSig={makeSig}
        />
      )}

      {/* ══════════ CLOSURE MODAL ══════════ */}
      {modal === 'closure_form' && (() => {
        // Pre-closure validation items
        const admitterSigned = !!permit.admitterWorkplaceSignature;
        const briefingSigned = !!permit.dailyBriefings[0]?.admitterSignature;
        const managerRequired = !!permit.managerId;
        const managerUser = getUser(permit.managerId);

        const checks = [
          { label: 'Допускающий проверил рабочие места',   done: admitterSigned, required: true },
          { label: 'Инструктаж проведён (Допускающий)',     done: briefingSigned,  required: true },
        ];
        const allChecksPassed = checks.every(c => !c.required || c.done);
        const canSubmit = closureNotify.trim() && closureDateTime && allChecksPassed;

        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 bg-gray-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle size={15} className="text-white/70" />
                  <p className="text-white text-sm font-semibold">Закрытие наряда-допуска</p>
                  <span className="text-[10px] text-white/40 font-mono">НД-{permit.number}</span>
                </div>
                <button onClick={() => setModal(null)} className="text-white/50 hover:text-white"><X size={15} /></button>
              </div>

              <div className="p-5 space-y-4">

                {/* ── Pre-closure checklist ── */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                    <p className="text-[10px] text-gray-600 font-semibold uppercase tracking-wide">Проверка перед закрытием</p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {checks.map((c, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2">
                        {c.done
                          ? <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                          : <AlertTriangle size={14} className={`flex-shrink-0 ${c.required ? 'text-red-500' : 'text-amber-400'}`} />
                        }
                        <span className={`text-xs flex-1 ${c.done ? 'text-gray-700' : c.required ? 'text-red-700' : 'text-amber-700'}`}>
                          {c.label}
                        </span>
                        <span className={`text-[10px] font-semibold ${c.done ? 'text-emerald-600' : c.required ? 'text-red-500' : 'text-amber-500'}`}>
                          {c.done ? 'Выполнено' : c.required ? 'Не выполнено' : 'Необяз.'}
                        </span>
                      </div>
                    ))}

                    {/* Manager — informational (signs AFTER foreman) */}
                    <div className="flex items-center gap-3 px-3 py-2 bg-blue-50">
                      <Info size={14} className="text-blue-500 flex-shrink-0" />
                      <span className="text-xs text-blue-700 flex-1">
                        {managerRequired
                          ? <>Отв. руководитель <strong>{managerUser?.shortName}</strong> подпишет закрытие после вас</>
                          : 'Ответственный руководитель не назначен — закрытие одношаговое'
                        }
                      </span>
                      <span className={`text-[10px] font-semibold ${managerRequired ? 'text-blue-600' : 'text-gray-400'}`}>
                        {managerRequired ? 'После вас' : 'Не требуется'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Error if checks failed */}
                {!allChecksPassed && (
                  <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700">
                      Невозможно закрыть наряд: не все обязательные условия выполнены.
                      Обратитесь к допускающему.
                    </p>
                  </div>
                )}

                {/* ── Form fields ── */}
                <div className="bg-gray-50 border border-gray-200 rounded p-3 text-xs text-gray-600">
                  Работа полностью окончена, бригада выведена с рабочего места, заземления, установленные бригадой, сняты.
                </div>

                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Кому сообщается о закрытии *</label>
                  <input
                    type="text" value={closureNotify} onChange={e => setClosureNotify(e.target.value)}
                    placeholder="Ф.И.О. и должность"
                    className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Дата и время завершения работ *</label>
                  <input
                    type="datetime-local" value={closureDateTime} onChange={e => setClosureDateTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-gray-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Комментарий к закрытию</label>
                  <textarea
                    value={closureComment} onChange={e => setClosureComment(e.target.value)} rows={2}
                    placeholder="Дополнительные сведения (необязательно)..."
                    className="w-full px-3 py-2 border border-gray-200 rounded text-sm resize-none bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-800"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button onClick={() => setModal(null)} className="flex-1 py-2 border border-gray-300 text-gray-600 rounded text-sm hover:bg-gray-50">
                    Отмена
                  </button>
                  <button
                    onClick={() => { if (canSubmit) confirm('foreman_close', () => setModal('foreman_close')); }}
                    disabled={!canSubmit}
                    title={!allChecksPassed ? 'Не все условия закрытия выполнены' : !closureNotify ? 'Укажите кому сообщается' : ''}
                    className="flex-1 py-2 bg-gray-900 text-white rounded text-sm hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                  >
                    <Shield size={13} /> Подписать закрытие
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══════════ ADMITTER EDS (with live parts field) ══════════ */}
      {(modal === 'admitter_sign' || modal === 'admitter_re') && currentUser && (
        <EDSModal user={currentUser} title={EDS_TITLES[modal]} description={EDS_DESCS[modal]}
          extraFields={
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Части, находящиеся под напряжением</label>
              <textarea value={livePartsText} onChange={e => setLivePartsText(e.target.value)} rows={2}
                placeholder="Укажите части под напряжением (или «Нет»)"
                className="w-full px-3 py-2 border border-amber-200 bg-amber-50 rounded text-sm resize-none focus:outline-none focus:ring-1 focus:ring-amber-400" />
            </div>
          }
          onSign={sig => handleEDSSign(modal, sig)} onCancel={() => setModal(null)} />
      )}

      {/* ══════════ ALL OTHER EDS MODALS ══════════ */}
      {EDS_KEYS.filter(k => !['admitter_sign','admitter_re'].includes(k)).map(key =>
        modal === key && currentUser ? (
          <EDSModal key={key} user={currentUser}
            title={EDS_TITLES[key] || key}
            description={EDS_DESCS[key] || ''}
            onSign={sig => handleEDSSign(key, sig)}
            onCancel={() => setModal(null)} />
        ) : null
      )}

      {/* ══════════ WORK COMPLETION FLOW ══════════ */}
      {showCompletionFlow && (
        <WorkCompletionFlow
          workEndDateTime={permit.workEndDateTime}
          brigadeMembers={permit.brigadeMembers}
          managerId={permit.managerId}
          observerId={permit.observerId}
          hasExtensions={permit.extensions.length > 0}
          onClose={() => setShowCompletionFlow(false)}
          onExtend={() => { setShowCompletionFlow(false); setModal('extend_form'); }}
          onInitiateClosure={() => { setShowCompletionFlow(false); setModal('closure_form'); }}
          onUpdateBrigade={(members) => {
            ctx.updateBrigade(permit.id, members, makeSig());
            setShowCompletionFlow(false);
            pushToast('Состав бригады обновлён', 'success');
          }}
        />
      )}

      {/* ══════════ PRINT MODAL ══════════ */}
      {showPrint && (
        <PrintPermitModal permit={permit} onClose={() => setShowPrint(false)} />
      )}

      {/* ══════════ TOAST NOTIFICATIONS ══════════ */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

// ── SafetyTab ─────────────────────────────────────────────────────────────────
function SafetyTab({
  permit, S, isIssuer, isDisp, isAssist, isAdmitter,
  safetyRows, setSafetyRows, serializeSafetyRows, ctx, pushToast, setModal, getVerifierLabel,
}: {
  permit: WorkPermit;
  S: string;
  isIssuer: boolean; isDisp: boolean; isAssist: boolean; isAdmitter: boolean;
  safetyRows: SafetyMeasureRow[];
  setSafetyRows: (r: SafetyMeasureRow[]) => void;
  serializeSafetyRows: (r: SafetyMeasureRow[]) => string[];
  ctx: any;
  pushToast: (msg: string, type?: any, detail?: string) => void;
  setModal: (m: string | null) => void;
  getVerifierLabel: () => string;
}) {
  // Parse rows for checklist component
  const parsedRows = safetyRows.map(r => ({
    installation: r.installation,
    measures: r.measures,
  }));

  // Checklist state (live in component, saved to context on demand)
  const [checklist, setChecklist] = React.useState<AssistantCheckItem[]>(
    permit.assistantChecklist ?? []
  );

  // Can the assistant currently edit the checklist?
  const assistantCanEdit = isAssist && ['preparing_workplaces', 'returned_to_assistant'].includes(S);

  // Can the issuer edit the safety table?
  const issuerCanEdit = isIssuer && ['draft', 'rework'].includes(S);

  // Workflow banner text per status
  const flowStep = (() => {
    switch (S) {
      case 'draft': case 'rework': return { color: 'purple', role: 'Выдающий', action: 'заполняет таблицу мер', step: 1 };
      case 'pending_dispatcher':   return { color: 'sky',    role: 'Главный диспетчер', action: 'проверяет таблицу и выдаёт разрешение', step: 2 };
      case 'pending_assistant':    return { color: 'cyan',   role: 'Помощник ГД', action: 'получает разрешение', step: 3 };
      case 'preparing_workplaces': case 'returned_to_assistant':
        return { color: 'indigo', role: 'Помощник ГД', action: 'выполняет меры и заполняет чек-лист', step: 3 };
      case 'pending_admitter': case 'returned_to_admitter':
        return { color: 'violet', role: 'Допускающий', action: 'проверяет чек-лист', step: 4 };
      default:
        return { color: 'emerald', role: 'Завершено', action: 'меры выполнены и подтверждены', step: 5 };
    }
  })();

  const colorMap: Record<string, string> = {
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    sky:    'bg-sky-50 border-sky-200 text-sky-800',
    cyan:   'bg-cyan-50 border-cyan-200 text-cyan-800',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-800',
    violet: 'bg-violet-50 border-violet-200 text-violet-800',
    emerald:'bg-emerald-50 border-emerald-200 text-emerald-800',
  };

  return (
    <div className="space-y-4">

      {/* ── Workflow banner ── */}
      <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border text-xs ${colorMap[flowStep.color]}`}>
        {/* Steps */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {[
            { n: 1, label: 'Выдающий' },
            { n: 2, label: 'ГД' },
            { n: 3, label: 'Пом. ГД' },
            { n: 4, label: 'Допускающий' },
          ].map((st, i, arr) => (
            <React.Fragment key={st.n}>
              <div className={`flex flex-col items-center`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border ${
                  flowStep.step > st.n ? 'bg-emerald-500 border-emerald-500 text-white'
                  : flowStep.step === st.n ? 'bg-white border-current text-current'
                  : 'bg-white/50 border-current/30 text-current/30'
                }`}>{flowStep.step > st.n ? <CheckCircle2 size={10} /> : st.n}</div>
                <span className="text-[8px] mt-0.5 opacity-60">{st.label}</span>
              </div>
              {i < arr.length - 1 && (
                <div className={`w-4 h-px mb-3 ${flowStep.step > st.n ? 'bg-emerald-400' : 'bg-current/20'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="h-6 w-px bg-current/20 flex-shrink-0" />
        <div>
          <span className="font-semibold">{flowStep.role}</span>
          <span className="opacity-70"> — {flowStep.action}</span>
        </div>
      </div>

      {/* ── Section A: Safety measures table ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">
            Таблица мер по подготовке рабочих мест
          </p>
          {issuerCanEdit && (
            <span className="text-[10px] text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
              Доступно редактирование
            </span>
          )}
        </div>

        <SafetyMeasuresTable
          rows={safetyRows}
          locked={!issuerCanEdit}
          mode={issuerCanEdit ? 'edit' : 'view'}
          onChange={updated => {
            setSafetyRows(updated);
            ctx.updateDraft(permit.id, { safetyMeasures: serializeSafetyRows(updated) });
          }}
        />
      </div>

      {/* ── Section B: Special instructions ── */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Особые указания</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Дополнительные условия, ограничения и требования безопасности</p>
          </div>
          {issuerCanEdit && (
            <span className="text-[9px] text-gray-500 italic">Редактируется выдающим</span>
          )}
        </div>
        {issuerCanEdit ? (
          <div className="p-3">
            <textarea
              defaultValue={permit.specialInstructions}
              onChange={e => ctx.updateDraft(permit.id, { specialInstructions: e.target.value })}
              rows={3}
              placeholder="Укажите особые условия выполнения работ, дополнительные меры безопасности..."
              className="w-full px-3 py-2 border border-gray-200 rounded text-sm resize-none focus:outline-none focus:ring-1 focus:ring-gray-800 bg-gray-50"
            />
          </div>
        ) : (
          <div className="px-3 py-3">
            {permit.specialInstructions
              ? <p className="text-sm text-gray-800 leading-relaxed">{permit.specialInstructions}</p>
              : <p className="text-sm text-gray-400 italic">Особые указания не заданы</p>}
          </div>
        )}
      </div>

      {/* ── Section C: Assistant checklist ── */}
      {parsedRows.length > 0 && ['preparing_workplaces', 'returned_to_assistant', 'pending_admitter', 'returned_to_admitter', 'admitter_checked', 'workplace_approved', 'admitted', 'in_progress', 'daily_ended', 'extended', 'closing', 'closed'].includes(S) && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">
              Чек-лист выполнения мер
            </p>
            {assistantCanEdit && (
              <span className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                Заполняется помощником ГД
              </span>
            )}
          </div>

          <AssistantChecklist
            rows={parsedRows}
            checklist={checklist}
            readOnly={!assistantCanEdit}
            showSave={assistantCanEdit}
            onChange={setChecklist}
            onSave={cl => {
              ctx.saveAssistantChecklist(permit.id, cl);
              pushToast('Чек-лист сохранён', 'success', 'Данные переданы допускающему');
            }}
          />

          {/* Admitter notice */}
          {isAdmitter && ['pending_admitter', 'returned_to_admitter'].includes(S) && (
            <div className="mt-3 flex items-start gap-3 px-3 py-2.5 bg-violet-50 border border-violet-200 rounded-lg">
              <Shield size={13} className="text-violet-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-violet-800 font-semibold mb-0.5">Действия допускающего</p>
                <p className="text-xs text-violet-700">
                  Проверьте чек-лист помощника ГД. Если все меры выполнены — подпишите проверку рабочих мест ЭЦП.
                  Если есть замечания — верните помощнику ГД на доработку.
                </p>
              </div>
              <button
                onClick={() => setModal('admit_return')}
                className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-700 border border-red-300 bg-white hover:bg-red-50 rounded transition-colors"
              >
                <span>Вернуть Пом. ГД</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Pending checklist notice for assistant ── */}
      {isAssist && S === 'pending_assistant' && (
        <div className="flex items-start gap-3 px-3 py-3 bg-cyan-50 border border-cyan-200 rounded-lg">
          <Clock size={13} className="text-cyan-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-cyan-800 font-semibold mb-0.5">Ожидание разрешения</p>
            <p className="text-xs text-cyan-700">
              После подтверждения получения разрешения вы сможете приступить к выполнению мер и заполнению чек-листа.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ReturnModal ──────────────────────────────────────────────────────────────
function ReturnModal({ title, subtitle, comment, setComment, onCancel, onConfirm, danger }: {
  title: string; subtitle: string; comment: string; setComment: (v: string) => void;
  onCancel: () => void; onConfirm: () => void; danger?: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden">
        <div className={`px-5 py-4 flex items-center justify-between ${danger ? 'bg-red-700' : 'bg-gray-900'}`}>
          <div className="flex items-center gap-2">
            <RotateCcw size={14} className="text-white/70" />
            <p className="text-white text-sm font-semibold">{title}</p>
          </div>
          <button onClick={onCancel} className="text-white/50 hover:text-white"><X size={14} /></button>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-gray-600 text-sm">{subtitle}</p>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Комментарий *</label>
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={4}
              placeholder="Укажите причину..."
              className={`w-full px-3 py-2 border rounded text-sm resize-none focus:outline-none focus:ring-1 ${danger ? 'border-red-200 bg-red-50 focus:ring-red-500' : 'border-gray-200 bg-gray-50 focus:ring-gray-800'}`} />
            {!comment.trim() && <p className="text-red-500 text-xs mt-1">Обязательное поле</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={onCancel} className="flex-1 py-2 border border-gray-300 text-gray-600 rounded text-sm hover:bg-gray-50">Отмена</button>
            <button onClick={onConfirm} disabled={!comment.trim()}
              className={`flex-1 py-2 text-white rounded text-sm disabled:opacity-50 transition-colors ${danger ? 'bg-red-700 hover:bg-red-800' : 'bg-gray-900 hover:bg-black'}`}>
              {danger ? 'Аннулировать' : 'Вернуть на доработку'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
