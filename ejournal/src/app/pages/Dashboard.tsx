import React from 'react';
import { Link } from 'react-router';
import { FileText, CheckCircle2, AlertTriangle, Plus, ChevronRight, Activity, ArrowRight, Clock, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkPermit } from '../context/WorkPermitContext';
import { StatusBadge } from '../components/StatusBadge';
import { RoleBadge } from '../components/RoleBadge';
import type { WorkPermit } from '../types';
import { ROLE_LABELS } from '../types';

const PENDING_BY_ROLE: Record<string, (p: WorkPermit) => boolean> = {
  issuer:               p => ['returned_to_issuer', 'rework', 'daily_ended', 'closing'].includes(p.status),
  dispatcher:           p => p.status === 'pending_dispatcher',
  dispatcher_assistant: p => ['pending_assistant', 'preparing_workplaces', 'returned_to_assistant'].includes(p.status),
  admitter:             p => ['pending_admitter', 'returned_to_admitter', 'workplace_approved'].includes(p.status),
  manager:              p => ['admitter_checked', 'closing'].includes(p.status),
  observer:             p => ['admitter_checked', 'admitted'].includes(p.status),
  foreman:              p => ['admitter_checked', 'admitted', 'in_progress', 'daily_ended'].includes(p.status),
  worker:               p => ['admitted'].includes(p.status),
};

const fmtDT = (iso: string) => new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

export function Dashboard() {
  const { currentUser } = useAuth();
  const { getPermitsByUser } = useWorkPermit();

  if (!currentUser) return null;
  const myPermits = getPermitsByUser(currentUser.id, currentUser.role);
  const pendingFn = PENDING_BY_ROLE[currentUser.role] || (() => false);
  const pending   = myPermits.filter(pendingFn);
  const active    = myPermits.filter(p => ['admitted','in_progress','daily_ended'].includes(p.status));
  const closed    = myPermits.filter(p => p.status === 'closed');
  const rework    = myPermits.filter(p => ['rework','returned_to_issuer'].includes(p.status));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-gray-900 text-xl font-semibold tracking-tight">Рабочий стол</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {currentUser.role === 'issuer' && (
          <Link to="/permits/new"
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white rounded text-sm font-medium transition-colors">
            <Plus size={14} /> Новый наряд
          </Link>
        )}
      </div>

      {/* Role card */}
      <div className="bg-gray-900 rounded-lg p-5 mb-6 flex flex-col sm:flex-row items-start gap-4">
        <div className="w-10 h-10 rounded bg-yellow-400/20 flex items-center justify-center flex-shrink-0">
          <Shield size={20} className="text-yellow-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <RoleBadge role={currentUser.role} />
            <span className="text-gray-400 text-xs">Группа ЭБ:</span>
            <span className="text-yellow-400 text-xs font-mono font-semibold">{currentUser.electricalGroup}</span>
          </div>
          <p className="text-white text-sm font-medium">{currentUser.name}</p>
          <p className="text-gray-400 text-xs mt-0.5">{currentUser.position} · {currentUser.department}</p>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-right">
          <div>
            <p className="text-white text-xs font-mono">{currentUser.login}</p>
            <p className="text-gray-500 text-[10px]">учётная запись</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Всего нарядов',    value: myPermits.length, icon: FileText,      color: 'text-gray-700',    bg: 'bg-gray-100'    },
          { label: 'Требует действий', value: pending.length,   icon: AlertTriangle, color: 'text-red-700',     bg: 'bg-red-50',     border: pending.length > 0 ? 'border-red-200' : '' },
          { label: 'В работе',         value: active.length,    icon: Activity,      color: 'text-emerald-700', bg: 'bg-emerald-50'  },
          { label: 'На доработке',     value: rework.length,    icon: Clock,         color: 'text-orange-700',  bg: 'bg-orange-50'   },
        ].map(s => (
          <div key={s.label} className={`bg-white border rounded-lg p-4 ${s.border || 'border-gray-200'}`}>
            <div className={`w-8 h-8 rounded flex items-center justify-center ${s.bg} mb-3`}>
              <s.icon size={16} className={s.color} />
            </div>
            <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Pending list */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className={pending.length > 0 ? 'text-red-500' : 'text-gray-400'} />
                <p className="text-sm font-semibold text-gray-800">
                  {pending.length > 0 ? `Требуют действия (${pending.length})` : active.length > 0 ? `В работе (${active.length})` : myPermits.length > 0 ? `Все наряды (${myPermits.length})` : 'Активные наряды'}
                </p>
              </div>
              <Link to="/permits" className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1">
                Все <ChevronRight size={12} />
              </Link>
            </div>

            {(() => { const list = pending.length > 0 ? pending : active.length > 0 ? active : myPermits; return list.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-gray-400">
                <CheckCircle2 size={32} className="mb-2 opacity-30" />
                <p className="text-sm">Нет нарядов, требующих действий</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {list.slice(0, 8).map(p => (
                  <Link key={p.id} to={`/permits/${p.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group">
                    <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-600 text-[11px] font-mono font-semibold">НД-{p.number}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <StatusBadge status={p.status} size="xs" />
                      </div>
                      <p className="text-gray-700 text-sm truncate">{p.task}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{p.department}</p>
                    </div>
                    <ArrowRight size={13} className="text-gray-300 group-hover:text-gray-600 flex-shrink-0 transition-colors" />
                  </Link>
                ))}
              </div>
            ); })()}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
              <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">Функции роли</p>
            </div>
            <div className="p-4 space-y-2.5">
              {({
                issuer: ['Оформить и подписать наряд ЭЦП','Продлить (макс. 15 дней)','Закрыть наряд-допуск','Аннулировать при необходимости'],
                dispatcher: ['Проверить меры безопасности','Подписать разрешение ЭЦП','Вернуть на доработку с комментарием'],
                dispatcher_assistant: ['Подтвердить получение ЭЦП','Подготовить рабочие места','Сдать допускающему'],
                admitter: ['Проверить рабочие места','Зафиксировать части под напряжением','Проводить ежедневный инструктаж','Оформить допуск к работе'],
                manager: ['Проверить рабочие места','Подписать одобрение ЭЦП','Подтвердить закрытие наряда'],
                observer: ['Проверить рабочие места','Подписать инструктаж ЭЦП','Подтвердить окончание работ'],
                foreman: ['Руководить бригадой','Подписать допуск ЭЦП','Изменять состав бригады','Инициировать закрытие наряда'],
                worker: ['Подписать первичный допуск ЭЦП','Соблюдать меры безопасности'],
              }[currentUser.role] || []).map((t: string) => (
                <div key={t} className="flex items-start gap-2">
                  <CheckCircle2 size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600 text-xs">{t}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider mb-3">Нормативная база</p>
            {['ПТЭЭП (Приказ №204н)','ПУЭ, 7-е издание','ПОТЭУ (Приказ №328н)','ГОСТ 12.1.019-2017'].map(doc => (
              <div key={doc} className="flex items-center gap-2 mb-1.5">
                <span className="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                <span className="text-gray-600 text-xs">{doc}</span>
              </div>
            ))}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-gray-500 text-xs flex items-center gap-1.5">
                <Clock size={11} className="text-gray-400" />
                Максимальное продление наряда: <span className="font-semibold text-gray-700">15 дней</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
