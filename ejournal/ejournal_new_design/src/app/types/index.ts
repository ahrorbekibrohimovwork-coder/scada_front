export type UserRole =
  | 'issuer'
  | 'dispatcher'
  | 'dispatcher_assistant'
  | 'admitter'
  | 'manager'
  | 'observer'
  | 'foreman'
  | 'worker';

export const ROLE_LABELS: Record<UserRole, string> = {
  issuer:               'Выдающий наряд-допуск',
  dispatcher:           'Главный диспетчер',
  dispatcher_assistant: 'Помощник главного диспетчера',
  admitter:             'Допускающий',
  manager:              'Ответственный руководитель',
  observer:             'Наблюдающий',
  foreman:              'Производитель работ',
  worker:               'Член бригады',
};

export const ROLE_COLORS: Record<UserRole, { bg: string; text: string; border: string }> = {
  issuer:               { bg: 'bg-violet-100',  text: 'text-violet-800',  border: 'border-violet-200'  },
  dispatcher:           { bg: 'bg-sky-100',     text: 'text-sky-800',     border: 'border-sky-200'     },
  dispatcher_assistant: { bg: 'bg-cyan-100',    text: 'text-cyan-800',    border: 'border-cyan-200'    },
  admitter:             { bg: 'bg-teal-100',    text: 'text-teal-800',    border: 'border-teal-200'    },
  manager:              { bg: 'bg-blue-100',    text: 'text-blue-800',    border: 'border-blue-200'    },
  observer:             { bg: 'bg-amber-100',   text: 'text-amber-800',   border: 'border-amber-200'   },
  foreman:              { bg: 'bg-orange-100',  text: 'text-orange-800',  border: 'border-orange-200'  },
  worker:               { bg: 'bg-gray-100',    text: 'text-gray-700',    border: 'border-gray-200'    },
};

export interface User {
  id: string;
  login: string;
  password: string;
  name: string;
  shortName: string;
  role: UserRole;
  position: string;
  electricalGroup: string;
  department: string;
  phone: string;
}

export interface EDSSignature {
  userId: string;
  userName: string;
  userPosition: string;
  userGroup: string;
  timestamp: string;
}

export type PermitStatus =
  | 'draft'
  | 'pending_dispatcher'
  | 'returned_to_issuer'
  | 'rework'
  | 'pending_assistant'
  | 'preparing_workplaces'
  | 'pending_admitter'
  | 'returned_to_assistant'
  | 'admitter_checked'
  | 'returned_to_admitter'
  | 'workplace_approved'
  | 'admitted'
  | 'in_progress'
  | 'daily_ended'
  | 'extended'
  | 'closing'
  | 'closed'
  | 'cancelled';

export const STATUS_LABELS: Record<PermitStatus, string> = {
  draft:                'Черновик',
  pending_dispatcher:   'Ожидает диспетчера',
  returned_to_issuer:   'На доработке',
  rework:               'На доработке',
  pending_assistant:    'Ожидает помощника ГД',
  preparing_workplaces: 'Подготовка рабочих мест',
  pending_admitter:     'Ожидает допускающего',
  returned_to_assistant:'Возвращён помощнику ГД',
  admitter_checked:     'Проверка рабочих мест',
  returned_to_admitter: 'Возвращён допускающему',
  workplace_approved:   'Рабочие места одобрены',
  admitted:             'Допущен к работе',
  in_progress:          'В работе',
  daily_ended:          'Работы дня завершены',
  extended:             'Продлён',
  closing:              'Закрытие',
  closed:               'Закрыт',
  cancelled:            'Аннулирован',
};

export const STATUS_COLORS: Record<PermitStatus, { bg: string; text: string; dot: string; border: string }> = {
  draft:                { bg: 'bg-gray-100',    text: 'text-gray-600',    dot: 'bg-gray-400',    border: 'border-gray-300'    },
  pending_dispatcher:   { bg: 'bg-blue-50',     text: 'text-blue-700',    dot: 'bg-blue-500',    border: 'border-blue-200'    },
  returned_to_issuer:   { bg: 'bg-red-50',      text: 'text-red-700',     dot: 'bg-red-500',     border: 'border-red-200'     },
  rework:               { bg: 'bg-orange-50',   text: 'text-orange-700',  dot: 'bg-orange-500',  border: 'border-orange-200'  },
  pending_assistant:    { bg: 'bg-cyan-50',      text: 'text-cyan-700',    dot: 'bg-cyan-500',    border: 'border-cyan-200'    },
  preparing_workplaces: { bg: 'bg-indigo-50',   text: 'text-indigo-700',  dot: 'bg-indigo-500',  border: 'border-indigo-200'  },
  pending_admitter:     { bg: 'bg-violet-50',   text: 'text-violet-700',  dot: 'bg-violet-500',  border: 'border-violet-200'  },
  returned_to_assistant:{ bg: 'bg-red-50',      text: 'text-red-700',     dot: 'bg-red-500',     border: 'border-red-200'     },
  admitter_checked:     { bg: 'bg-teal-50',     text: 'text-teal-700',    dot: 'bg-teal-500',    border: 'border-teal-200'    },
  returned_to_admitter: { bg: 'bg-red-50',      text: 'text-red-700',     dot: 'bg-red-500',     border: 'border-red-200'     },
  workplace_approved:   { bg: 'bg-blue-50',     text: 'text-blue-700',    dot: 'bg-blue-500',    border: 'border-blue-200'    },
  admitted:             { bg: 'bg-amber-50',    text: 'text-amber-700',   dot: 'bg-amber-500',   border: 'border-amber-200'   },
  in_progress:          { bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' },
  daily_ended:          { bg: 'bg-lime-50',     text: 'text-lime-700',    dot: 'bg-lime-500',    border: 'border-lime-200'    },
  extended:             { bg: 'bg-purple-50',   text: 'text-purple-700',  dot: 'bg-purple-500',  border: 'border-purple-200'  },
  closing:              { bg: 'bg-yellow-50',   text: 'text-yellow-700',  dot: 'bg-yellow-500',  border: 'border-yellow-200'  },
  closed:               { bg: 'bg-slate-100',   text: 'text-slate-600',   dot: 'bg-slate-400',   border: 'border-slate-300'   },
  cancelled:            { bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500',     border: 'border-red-300'     },
};

export interface BrigadeMember {
  id: string;
  userId?: string;
  name: string;
  group: string;
  direction: string;
  addedAt: string;
  removedAt?: string;
  isActive: boolean;
  admissionSignature?: EDSSignature;
  firstBriefingSignature?: EDSSignature;
}

export interface BrigadeRegistryEntry {
  id: string;
  userId: string;
  name: string;
  electricalGroup: string;
  position: string;
  department: string;
}

export interface DailyBriefing {
  id: string;
  isFirst: boolean;
  workLocationName: string;
  briefingDateTime: string;
  admitterSignature?: EDSSignature;
  responsibleSignature?: EDSSignature;
  brigadeSignatures: { memberId: string; memberName: string; sig: EDSSignature }[];
  endDateTime?: string;
  endSignature?: EDSSignature;
}

export interface ExtensionRecord {
  id: string;
  requestedByName: string;
  newEndDateTime: string;
  issuerSignature: EDSSignature;
}

export interface NextDayRequest {
  id: string;
  requestedBy: string;
  requestedByName: string;
  requestedAt: string;
  dayNumber: number;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
}

export interface ReturnComment {
  id: string;
  fromUserId: string;
  fromUserName: string;
  comment: string;
  timestamp: string;
  step: string;
}

// ── Checklist item filled by the assistant ──────────────────────────────────
export interface AssistantCheckItem {
  rowIndex: number;       // index into safetyMeasures array
  checked: boolean;       // measure executed
  note: string;           // optional comment by assistant
  checkedAt?: string;     // timestamp when checked
}

export interface PermitEvent {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  comment?: string;
}

export interface PermitVersion {
  id: string;
  version: number;
  status: PermitStatus;
  createdAt: string;
  authorName: string;
  description: string;
  snapshot: Partial<WorkPermit>;
}

export interface WorkPermit {
  id: string;
  number: string;
  status: PermitStatus;

  organization: string;
  department: string;
  task: string;
  workStartDateTime: string;
  workEndDateTime: string;
  safetyMeasures: string[];
  specialInstructions: string;
  assistantChecklist?: AssistantCheckItem[];   // filled by dispatcher_assistant

  issuerId: string;
  dispatcherId: string;
  dispatcherAssistantId: string;
  admitterId: string;
  managerId?: string;
  observerId?: string;
  foremanId: string;

  brigadeMembers: BrigadeMember[];

  issuerSignature?: EDSSignature;
  dispatcherSignature?: EDSSignature;
  dispatcherAssistantSignature?: EDSSignature;
  liveParts?: string;
  admitterWorkplaceSignature?: EDSSignature;
  workplaceVerifierRole?: string;
  workplaceVerifierSignature?: EDSSignature;

  dailyBriefings: DailyBriefing[];
  extensions: ExtensionRecord[];
  nextDayRequest?: NextDayRequest;

  closureNotifyPerson?: string;
  closureDateTime?: string;
  foremanClosureSignature?: EDSSignature;
  managerClosureSignature?: EDSSignature;

  returnComments: ReturnComment[];
  events: PermitEvent[];
  versions: PermitVersion[];

  createdAt: string;
  updatedAt: string;
}