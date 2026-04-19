import React from 'react';
import { Link } from 'react-router';
import {
  FileText, CheckCircle2, AlertTriangle, Plus, ChevronRight,
  Zap, Shield, Activity, ArrowUpRight, Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkPermit } from '../context/WorkPermitContext';
import { StatusBadge } from '../components/StatusBadge';
import { RoleBadge } from '../components/RoleBadge';
import type { WorkPermit, PermitStatus } from '../types';

const ROLE_DESC: Record<string, string> = {
  issuer:               'Вы оформляете и выдаёте наряды-допуски, подписываете их ЭЦП, закрываете и продлеваете.',
  dispatcher:           'Вы проверяете меры по подготовке рабочих мест и выдаёте разрешение на подготовку посредством ЭЦП.',
  dispatcher_assistant: 'Вы подтверждаете получение разрешения ЭЦП, подготавливаете рабочие места и сдаёте их допускающему.',
  admitter:             'Вы проверяете рабочие места, фиксируете части под напряжением, подписываете ЭЦП, проводите ежедневный инструктаж и допуск к работе.',
  manager:              'Вы проверяете подготовленные рабочие места, подписываете ЭЦП, несёте ответственность за безопасность, подписываете закрытие наряда.',
  observer:             'Вы проверяете рабочие места, осуществляете надзор за безопасностью, подписываете ежедневный инструктаж и окончание работ.',
  foreman:              'Вы руководите бригадой, подтверждаете инструктаж, управляете составом бригады и инициируете закрытие наряда.',
  worker:               'Вы выполняете работы по наряду и подписываете ЭЦП при первичном допуске к работе.',
};

const PENDING_BY_ROLE: Record<string, (p: WorkPermit) => boolean> = {
  issuer:               p => ['pending_dispatcher', 'returned_to_issuer', 'daily_ended', 'closing'].includes(p.status),
  dispatcher:           p => p.status === 'pending_dispatcher',
  dispatcher_assistant: p => ['pending_assistant', 'preparing_workplaces', 'returned_to_assistant'].includes(p.status),
  admitter:             p => ['pending_admitter', 'returned_to_admitter', 'workplace_approved'].includes(p.status),
  manager:              p => ['admitter_checked', 'closing'].includes(p.status),
  observer:             p => ['admitter_checked', 'admitted'].includes(p.status),
  foreman:              p => ['admitter_checked', 'admitted', 'in_progress', 'daily_ended'].includes(p.status),
  worker:               p => ['admitted'].includes(p.status),
};

export function Dashboard() {
  const { currentUser } = useAuth();
  const { getPermitsByUser } = useWorkPermit();

  if (!currentUser) return null;
  const myPermits = getPermitsByUser(currentUser.id, currentUser.role);

  const pendingFn = PENDING_BY_ROLE[currentUser.role] || (() => false);
  const pending   = myPermits.filter(pendingFn);
  const total     = myPermits.length;
  const active    = myPermits.filter(p => ['admitted','in_progress','daily_ended'].includes(p.status)).length;
  const closed    = myPermits.filter(p => p.status === 'closed').length;

  const fmtDT = (iso: string) => new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

  const statusColor: Record<PermitStatus, string> = {
    draft: 'bg-gray-100', pending_dispatcher: 'bg-sky-100', returned_to_issuer: 'bg-red-100',
    pending_assistant: 'bg-cyan-100', preparing_workplaces: 'bg-indigo-100', pending_admitter: 'bg-violet-100',
    returned_to_assistant: 'bg-red-100', admitter_checked: 'bg-teal-100', returned_to_admitter: 'bg-red-100',
    workplace_approved: 'bg-blue-100', admitted: 'bg-amber-100', in_progress: 'bg-orange-100',
    daily_ended: 'bg-lime-100', extended: 'bg-purple-100', closing: 'bg-yellow-100',
    closed: 'bg-slate-100', cancelled: 'bg-red-100',
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-slate-900">Добро пожаловать, {currentUser.shortName}</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {currentUser.role === 'issuer' && (
          <Link to="/permits/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors whitespace-nowrap">
            <Plus size={16} /> Новый наряд
          </Link>
        )}
      </div>

      {/* Role banner */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-5 mb-6 flex flex-col sm:flex-row items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-yellow-400/20 flex items-center justify-center flex-shrink-0">
          <Zap className="text-yellow-400" size={24} />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <RoleBadge role={currentUser.role} />
            <span className="text-slate-300 text-sm">Группа ЭБ: <span className="text-yellow-400 font-semibold">{currentUser.electricalGroup}</span></span>
          </div>
          <p className="text-slate-300 text-sm">{ROLE_DESC[currentUser.role]}</p>
          <p className="text-slate-400 text-xs mt-1">{currentUser.position} · {currentUser.department}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Всего нарядов', value: total,           icon: FileText,     color: 'text-blue-600',   bg: 'bg-blue-50'   },
          { label: 'Требует действий', value: pending.length, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'В работе',     value: active,           icon: Activity,     color: 'text-green-600',  bg: 'bg-green-50'  },
          { label: 'Закрытых',     value: closed,           icon: Shield,       color: 'text-slate-600',  bg: 'bg-slate-50'  },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.bg} mb-3`}>
              <s.icon size={18} className={s.color} />
            </div>
            <div className={`text-2xl font-semibold ${s.color}`}>{s.value}</div>
            <div className="text-slate-500 text-sm mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Pending actions */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-slate-800">
                {pending.length > 0 ? `Требуют вашего действия (${pending.length})` : 'Активные наряды'}
              </h2>
              <Link to="/permits" className="text-blue-600 text-sm hover:text-blue-700 flex items-center gap-1">
                Все <ChevronRight size={14} />
              </Link>
            </div>
            {(pending.length > 0 ? pending : myPermits.filter(p => !['closed','cancelled'].includes(p.status))).length === 0 ? (
              <div className="flex flex-col items-center py-12 text-slate-400">
                <CheckCircle2 size={40} className="mb-3 opacity-40" />
                <p className="text-sm">Нет нарядов, требующих действий</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {(pending.length > 0 ? pending : myPermits.filter(p => !['closed','cancelled'].includes(p.status))).slice(0, 6).map(p => (
                  <Link key={p.id} to={`/permits/${p.id}`}
                    className="flex items-start gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors group">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${statusColor[p.status] || 'bg-slate-100'}`}>
                      <span className="text-slate-700 text-xs font-semibold">№{p.number}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <StatusBadge status={p.status} size="sm" />
                      </div>
                      <p className="text-slate-700 text-sm line-clamp-1">{p.task}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{p.organization} · {p.department}</p>
                    </div>
                    <ArrowUpRight size={15} className="text-slate-300 group-hover:text-blue-500 flex-shrink-0 mt-1 transition-colors" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Workflow steps for current role */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-slate-800 mb-4 text-sm font-semibold">Участие в workflow</h3>
            <div className="space-y-2.5">
              {currentUser.role === 'issuer' && ['Оформить наряд-допуск','Подписать ЭЦП при выдаче','Продлить (до 15 дней)','Закрыть наряд'].map(t => (
                <div key={t} className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" /> {t}
                </div>
              ))}
              {currentUser.role === 'dispatcher' && ['Проверить меры безопасности','Подписать разрешение ЭЦП','Вернуть на корректировку'].map(t => (
                <div key={t} className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" /> {t}
                </div>
              ))}
              {currentUser.role === 'dispatcher_assistant' && ['Подтвердить получение разрешения ЭЦП','Подготовить рабочие места','Сдать допускающему'].map(t => (
                <div key={t} className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" /> {t}
                </div>
              ))}
              {currentUser.role === 'admitter' && ['Проверить рабочие места','Зафиксировать части под напряжением','Провести инструктаж','Допустить бригаду к работе'].map(t => (
                <div key={t} className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" /> {t}
                </div>
              ))}
              {currentUser.role === 'manager' && ['Проверить рабочие места','Подписать ЭЦП (одобрение)','Подписать закрытие наряда'].map(t => (
                <div key={t} className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" /> {t}
                </div>
              ))}
              {currentUser.role === 'observer' && ['Проверить рабочие места','Подписать инструктаж ЭЦП','Подписать окончание работ'].map(t => (
                <div key={t} className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" /> {t}
                </div>
              ))}
              {currentUser.role === 'foreman' && ['Подписать инструктаж ЭЦП','Управлять составом бригады','Завершить работы','Инициировать закрытие'].map(t => (
                <div key={t} className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" /> {t}
                </div>
              ))}
              {currentUser.role === 'worker' && ['Подписать первичный допуск ЭЦП','Соблюдать меры безопасности'].map(t => (
                <div key={t} className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" /> {t}
                </div>
              ))}
            </div>
          </div>

          {/* Regulatory */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-amber-600" />
              <span className="text-amber-800 text-sm font-medium">Нормативная база</span>
            </div>
            {['ПТЭЭП', 'ПУЭ (изд. 7)', 'ПОТЭУ (Приказ №328н)', 'ГОСТ 12.1.019'].map(doc => (
              <div key={doc} className="text-amber-700 text-xs flex items-center gap-1.5 mb-1">
                <span className="w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" /> {doc}
              </div>
            ))}
            <div className="mt-2 pt-2 border-t border-amber-200">
              <p className="text-amber-600 text-xs flex items-center gap-1">
                <Clock size={11} /> Макс. продление наряда: 15 дней
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
