import React, { useState } from 'react';
import { Link } from 'react-router';
import { Search, Plus, Filter, FileText, Zap, ArrowUpRight, Calendar, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkPermit } from '../context/WorkPermitContext';
import { StatusBadge } from '../components/StatusBadge';
import type { PermitStatus } from '../types';
import { STATUS_LABELS } from '../types';

const ALL_STATUSES: PermitStatus[] = [
  'draft','pending_dispatcher','returned_to_issuer','pending_assistant',
  'preparing_workplaces','pending_admitter','returned_to_assistant',
  'admitter_checked','returned_to_admitter','workplace_approved',
  'admitted','in_progress','daily_ended','extended','closing','closed','cancelled',
];

export function WorkPermitList() {
  const { currentUser } = useAuth();
  const { getPermitsByUser } = useWorkPermit();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PermitStatus | 'all'>('all');

  if (!currentUser) return null;

  const myPermits = getPermitsByUser(currentUser.id, currentUser.role);

  const filtered = myPermits.filter(p => {
    const matchSearch = !search || [p.number, p.task, p.department, p.organization]
      .some(f => f?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const sorted = [...filtered].sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const fmtDT = (iso: string) => new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  const fmtD  = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const isOverdue = (p: typeof myPermits[0]) =>
    !['closed','cancelled','completed'].includes(p.status) && new Date(p.workEndDateTime) < new Date();

  const groupByStatus = (status: PermitStatus) => myPermits.filter(p => p.status === status).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-slate-900">Наряды-допуски</h1>
          <p className="text-slate-500 text-sm mt-0.5">{myPermits.length} нарядов в системе</p>
        </div>
        {currentUser.role === 'issuer' && (
          <Link to="/permits/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors whitespace-nowrap">
            <Plus size={16} /> Новый наряд
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по номеру, заданию, организации..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as PermitStatus | 'all')}
            className="pl-8 pr-8 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none cursor-pointer">
            <option value="all">Все статусы</option>
            {ALL_STATUSES.map(s => groupByStatus(s) > 0 ? (
              <option key={s} value={s}>{STATUS_LABELS[s]} ({groupByStatus(s)})</option>
            ) : null)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
        </div>
      </div>

      {/* Quick filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {ALL_STATUSES.filter(s => groupByStatus(s) > 0).map(s => (
          <button key={s} onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
            className={`text-xs px-3 py-1 rounded-full border transition-all ${
              statusFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}>
            {STATUS_LABELS[s]}: {groupByStatus(s)}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center py-20">
          <FileText size={48} className="text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium mb-1">Нарядов не найдено</p>
          <p className="text-slate-400 text-sm">Измените параметры поиска</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(p => {
            const overdue = isOverdue(p);
            return (
              <Link key={p.id} to={`/permits/${p.id}`}
                className={`bg-white rounded-xl border transition-all hover:shadow-md group block ${
                  overdue ? 'border-red-300' : 'border-slate-200 hover:border-blue-200'
                }`}>
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-slate-600 text-sm font-bold">№{p.number}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <StatusBadge status={p.status} size="sm" />
                        {overdue && <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">Просрочен</span>}
                        {p.extensions.length > 0 && <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">Продлён ×{p.extensions.length}</span>}
                      </div>
                      <p className="text-slate-700 text-sm line-clamp-2">{p.task}</p>
                      <p className="text-slate-500 text-xs mt-1">{p.organization} · {p.department}</p>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1 flex-shrink-0">
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                        <Calendar size={12} />
                        <span>до {fmtD(p.workEndDateTime)}</span>
                      </div>
                      <ArrowUpRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-x-6 gap-y-1">
                    <span className="text-slate-500 text-xs">Начало: <span className="text-slate-700">{fmtDT(p.workStartDateTime)}</span></span>
                    <span className="text-slate-500 text-xs">Окончание: <span className="text-slate-700">{fmtDT(p.workEndDateTime)}</span></span>
                    <span className="text-slate-500 text-xs">Бригада: <span className="text-slate-700">{p.brigadeMembers.filter(m => m.isActive).length + 1} чел.</span></span>
                    <span className="text-slate-500 text-xs">Обновлён: <span className="text-slate-700">{fmtDT(p.updatedAt)}</span></span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
