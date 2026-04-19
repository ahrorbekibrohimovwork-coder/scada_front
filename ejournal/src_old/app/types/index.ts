export type UserRole =
  | 'issuer'               // Выдающий наряд-допуск
  | 'dispatcher'           // Главный диспетчер (лицо выдающее разрешение)
  | 'dispatcher_assistant' // Помощник главного диспетчера
  | 'admitter'             // Допускающий
  | 'manager'              // Ответственный руководитель работ
  | 'observer'             // Наблюдающий
  | 'foreman'              // Производитель работ
  | 'worker';              // Член бригады

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
  issuer:               { bg: 'bg-purple-100',  text: 'text-purple-800',  border: 'border-purple-200'  },
  dispatcher:           { bg: 'bg-sky-100',     text: 'text-sky-800',     border: 'border-sky-200'     },
  dispatcher_assistant: { bg: 'bg-cyan-100',    text: 'text-cyan-800',    border: 'border-cyan-200'    },
  admitter:             { bg: 'bg-teal-100',    text: 'text-teal-800',    border: 'border-teal-200'    },
  manager:              { bg: 'bg-blue-100',    text: 'text-blue-800',    border: 'border-blue-200'    },
  observer:             { bg: 'bg-yellow-100',  text: 'text-yellow-800',  border: 'border-yellow-200'  },
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

// EDS signature record
export interface EDSSignature {
  userId: string;
  userName: string;
  userPosition: string;
  userGroup: string;
  timestamp: string;
}

export type PermitStatus =
  | 'draft'                // Черновик - оформляется выдающим
  | 'pending_dispatcher'   // Выдан, ожидает главного диспетчера
  | 'returned_to_issuer'   // Возвращён выдающему на корректировку
  | 'pending_assistant'    // Подписан ГД, ожидает помощника
  | 'preparing_workplaces' // Помощник подтвердил, готовит рабочие места
  | 'pending_admitter'     // Рабочие места готовы, ожидает допускающего
  | 'returned_to_assistant'// Допускающий вернул помощнику на доработку
  | 'admitter_checked'     // Допускающий проверил, ожидает рук./набл./произв.
  | 'returned_to_admitter' // Рук./набл./произв. вернул допускающему
  | 'workplace_approved'   // Рабочие места одобрены, ожидает инструктажа
  | 'admitted'             // Допущен к работе (после инструктажа)
  | 'in_progress'          // Работы ведутся
  | 'daily_ended'          // Ежедневные работы завершены
  | 'extended'             // Продлён (возврат к in_progress)
  | 'closing'              // Производитель инициировал закрытие
  | 'closed'               // Закрыт
  | 'cancelled';           // Аннулирован

export const STATUS_LABELS: Record<PermitStatus, string> = {
  draft:                'Черновик',
  pending_dispatcher:   'Ожидает диспетчера',
  returned_to_issuer:   'Возвращён на доработку',
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

export const STATUS_COLORS: Record<PermitStatus, { bg: string; text: string; dot: string }> = {
  draft:                { bg: 'bg-gray-100',   text: 'text-gray-700',   dot: 'bg-gray-400'   },
  pending_dispatcher:   { bg: 'bg-sky-100',    text: 'text-sky-700',    dot: 'bg-sky-500'    },
  returned_to_issuer:   { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500'    },
  pending_assistant:    { bg: 'bg-cyan-100',   text: 'text-cyan-700',   dot: 'bg-cyan-500'   },
  preparing_workplaces: { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  pending_admitter:     { bg: 'bg-violet-100', text: 'text-violet-700', dot: 'bg-violet-500' },
  returned_to_assistant:{ bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500'    },
  admitter_checked:     { bg: 'bg-teal-100',   text: 'text-teal-700',   dot: 'bg-teal-500'   },
  returned_to_admitter: { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500'    },
  workplace_approved:   { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
  admitted:             { bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500'  },
  in_progress:          { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  daily_ended:          { bg: 'bg-lime-100',   text: 'text-lime-700',   dot: 'bg-lime-500'   },
  extended:             { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  closing:              { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  closed:               { bg: 'bg-slate-100',  text: 'text-slate-600',  dot: 'bg-slate-400'  },
  cancelled:            { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500'    },
};

export interface BrigadeMember {
  id: string;
  userId?: string;
  name: string;
  group: string;       // электрическая группа
  direction: string;   // направление работ
  addedAt: string;
  removedAt?: string;
  isActive: boolean;
  admissionSignature?: EDSSignature; // подпись при первичном допуске
}

export interface DailyBriefing {
  id: string;
  isFirst: boolean;
  workLocationName: string;
  briefingDateTime: string;
  admitterSignature?: EDSSignature;
  responsibleSignature?: EDSSignature; // наблюдающий или производитель работ
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

export interface ReturnComment {
  id: string;
  fromUserId: string;
  fromUserName: string;
  comment: string;
  timestamp: string;
  step: string;
}

export interface PermitEvent {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  comment?: string;
}

export interface WorkPermit {
  id: string;
  number: string;           // sequential: 1, 2, 3...
  status: PermitStatus;

  // Основные сведения
  organization: string;
  department: string;
  task: string;             // "поручается"
  workStartDateTime: string;// DD.MM.YY HH:MM (хранится как ISO)
  workEndDateTime: string;
  safetyMeasures: string[]; // меры по подготовке рабочих мест
  specialInstructions: string; // особые указания

  // Персонал (issuerId - текущий пользователь)
  issuerId: string;
  dispatcherId: string;
  dispatcherAssistantId: string;
  admitterId: string;
  managerId?: string;
  observerId?: string;
  foremanId: string;

  // Бригада
  brigadeMembers: BrigadeMember[];

  // ЭЦП подписи по этапам
  issuerSignature?: EDSSignature;
  dispatcherSignature?: EDSSignature;
  dispatcherAssistantSignature?: EDSSignature;
  // Допускающий: проверка рабочих мест
  liveParts?: string;        // части под напряжением
  admitterWorkplaceSignature?: EDSSignature;
  // Руководитель/Наблюдающий/Производитель: проверка рабочих мест
  workplaceVerifierRole?: string;
  workplaceVerifierSignature?: EDSSignature;

  // Ежедневные инструктажи
  dailyBriefings: DailyBriefing[];

  // Продление
  extensions: ExtensionRecord[];

  // Закрытие
  closureNotifyPerson?: string;
  closureDateTime?: string;
  foremanClosureSignature?: EDSSignature;
  managerClosureSignature?: EDSSignature;

  // Комментарии при возвратах
  returnComments: ReturnComment[];

  // Журнал событий
  events: PermitEvent[];

  createdAt: string;
  updatedAt: string;
}
