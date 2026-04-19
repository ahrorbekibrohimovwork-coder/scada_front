import React, { useState } from 'react';
import { GitBranch, Eye, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import type { PermitVersion, PermitStatus } from '../../types';
import { STATUS_LABELS, STATUS_COLORS } from '../../types';

interface Props {
  versions: PermitVersion[];
  currentVersion: number;
}

const statusIcon = (status: PermitStatus) => {
  if (['closed', 'in_progress', 'admitted', 'extended'].includes(status)) return <CheckCircle2 size={12} className="text-emerald-500" />;
  if (['rework', 'returned_to_issuer', 'cancelled'].includes(status)) return <AlertTriangle size={12} className="text-red-500" />;
  return <Clock size={12} className="text-gray-400" />;
};

export function VersionHistory({ versions, currentVersion }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [viewSnapshot, setViewSnapshot] = useState<PermitVersion | null>(null);

  const fmtDT = (iso: string) =>
    new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

  if (!versions || versions.length === 0) return null;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <GitBranch size={14} className="text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">История версий</span>
          <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">{versions.length}</span>
        </div>
        {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </button>

      {expanded && (
        <div className="divide-y divide-gray-100">
          {[...versions].reverse().map((v, idx) => {
            const isLatest = v.version === currentVersion;
            const sc = STATUS_COLORS[v.status];
            return (
              <div key={v.id} className={`flex items-start gap-3 px-4 py-3 ${isLatest ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'} transition-colors`}>
                {/* Timeline */}
                <div className="flex flex-col items-center mt-1 flex-shrink-0">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${isLatest ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-white text-gray-500'}`}>
                    {v.version}
                  </div>
                  {idx < versions.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" style={{ minHeight: '12px' }} />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {statusIcon(v.status)}
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border ${sc.bg} ${sc.text} ${sc.border}`}>
                        {STATUS_LABELS[v.status]}
                      </span>
                      {isLatest && <span className="text-[10px] text-blue-600 font-semibold bg-blue-100 px-1.5 py-0.5 rounded">ТЕКУЩАЯ</span>}
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">{fmtDT(v.createdAt)}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{v.description}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Автор: {v.authorName}</p>

                  {/* Snapshot preview */}
                  {v.snapshot?.safetyMeasures && v.snapshot.safetyMeasures.length > 0 && !isLatest && (
                    <button
                      onClick={() => setViewSnapshot(viewSnapshot?.id === v.id ? null : v)}
                      className="flex items-center gap-1 mt-2 text-[10px] text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      <Eye size={10} /> Просмотр снимка
                      {viewSnapshot?.id === v.id ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                    </button>
                  )}

                  {viewSnapshot?.id === v.id && v.snapshot?.safetyMeasures && (
                    <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded text-xs">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold mb-2">Меры безопасности (снимок версии {v.version})</p>
                      <ul className="space-y-1">
                        {v.snapshot.safetyMeasures.map((m, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-gray-600">
                            <span className="text-gray-300 flex-shrink-0">{i + 1}.</span> {m}
                          </li>
                        ))}
                      </ul>
                      <p className="text-[10px] text-amber-600 mt-2 flex items-center gap-1">
                        <Eye size={10} /> Только для просмотра
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
