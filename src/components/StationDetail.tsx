import React from 'react';
import MonitorView from './MonitorView';
import SchemaView from './SchemaView';

interface StationDetailProps {
  station: { name: string; subName?: string };
  mode: 'monitor' | 'schema';
  onModeChange: (mode: 'monitor' | 'schema') => void;
}

const StationDetail: React.FC<StationDetailProps> = ({ station, mode, onModeChange }) => {
  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-white text-2xl font-semibold leading-tight">{station.name}</h1>
            <span className="text-slate-400 text-sm">{station.subName}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-xs font-medium">Онлайн</span>
          </div>
        </div>

        {/* Toggle */}
        <div className="flex bg-[#141e31] rounded-xl p-1 border border-white/10">
          <button
            onClick={() => onModeChange('schema')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'schema'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
            Схема
          </button>
          <button
            onClick={() => onModeChange('monitor')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'monitor'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            Монитор
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 bg-[#141e31] rounded-2xl border border-white/10 p-4 overflow-hidden">
        {mode === 'monitor' ? <MonitorView /> : <SchemaView />}
      </div>
    </div>
  );
};

export default StationDetail;
