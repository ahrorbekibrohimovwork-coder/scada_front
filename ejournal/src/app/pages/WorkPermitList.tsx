import React, { useState } from 'react';
import { Link } from 'react-router';
import { Search, Plus, Filter, FileText, ArrowRight, Calendar, ChevronDown, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkPermit } from '../context/WorkPermitContext';
import { StatusBadge } from '../components/StatusBadge';
import type { PermitStatus } from '../types';
import { STATUS_LABELS } from '../types';

const ALL_STATUSES: PermitStatus[] = [
  'draft','rework','pending_dispatcher','returned_to_issuer','pending_assistant',
  'preparing_workplaces','pending_admitter','returned_to_assistant',
  'admitter_checked','returned_to_admitter','workplace_approved',
  'admitted','in_progress','daily_ended','extended','closing','closed','cancelled',
];

const fmtDT = (iso: string) => new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
const fmtD  = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

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
  }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const groupByStatus = (s: PermitStatus) => myPermits.filter(p => p.status === s).length;
  const isOverdue = (p: typeof myPermits[0]) =>
    !['closed','cancelled'].includes(p.status) && new Date(p.workEndDateTime) < new Date();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-gray-900 text-xl font-semibold tracking-tight">Наряды-допуски</h1>
          <p className="text-gray-500 text-sm mt-0.5">{myPermits.length} нарядов</p>
        </div>
        {currentUser.role === 'issuer' && (
          <Link to="/permits/new"
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white rounded text-sm font-medium transition-colors">
            <Plus size={14} /> Новый наряд
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по номеру, заданию, подразделению..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-800 bg-white" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
            className="pl-8 pr-8 py-2 border border-gray-200 rounded text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-800 bg-white appearance-none cursor-pointer">
            <option value="all">Все статусы ({myPermits.length})</option>
            {ALL_STATUSES.filter(s => groupByStatus(s) > 0).map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]} ({groupByStatus(s)})</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={12} />
        </div>
      </div>

      {/* Quick status chips */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {ALL_STATUSES.filter(s => groupByStatus(s) > 0).map(s => (
          <button key={s} onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
            className={`text-[11px] px-2.5 py-1 rounded-full border font-medium transition-all ${
              statusFilter === s
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}>
            {STATUS_LABELS[s]} · {groupByStatus(s)}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg flex flex-col items-center justify-center py-16">
          <FileText size={36} className="text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm font-medium mb-1">Нарядов не найдено</p>
          <p className="text-gray-400 text-xs">Измените параметры поиска</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['НД', 'Статус', 'Задание', 'Подразделение', 'Начало', 'Окончание', 'Обновлён', ''].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] text-gray-400 uppercase font-semibold tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(p => {
                  const overdue = isOverdue(p);
                  return (
                    <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${overdue ? 'bg-red-50/30' : ''}`}>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded">НД-{p.number}</span>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={p.status} size="xs" /></td>
                      <td className="px-4 py-3 max-w-[240px]">
                        <p className="text-gray-800 text-sm leading-tight line-clamp-2">{p.task}</p>
                        {overdue && <span className="text-[10px] text-red-600 flex items-center gap-1 mt-0.5"><AlertTriangle size={9} /> Просрочен</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{p.department}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs font-mono">{fmtD(p.workStartDateTime)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-mono ${overdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>{fmtD(p.workEndDateTime)}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs font-mono">{fmtDT(p.updatedAt)}</td>
                      <td className="px-4 py-3">
                        <Link to={`/permits/${p.id}`}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors whitespace-nowrap">
                          Открыть <ArrowRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden divide-y divide-gray-100">
            {filtered.map(p => {
              const overdue = isOverdue(p);
              return (
                <Link key={p.id} to={`/permits/${p.id}`}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group ${overdue ? 'bg-red-50/30' : ''}`}>
                  <div className="w-9 h-9 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-mono font-semibold text-gray-600">НД-{p.number}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <StatusBadge status={p.status} size="xs" />
                      {overdue && <span className="text-[10px] text-red-600 flex items-center gap-1"><AlertTriangle size={9} /> просрочен</span>}
                    </div>
                    <p className="text-gray-700 text-sm truncate">{p.task}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{p.department} · до {fmtD(p.workEndDateTime)}</p>
                  </div>
                  <ArrowRight size={13} className="text-gray-300 group-hover:text-gray-600 flex-shrink-0 transition-colors" />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
