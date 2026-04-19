import React from 'react';
import MonitorView from './MonitorView';
import SchemaView from './SchemaView';

interface StationDetailProps {
  station: {
    name: string;
    subName?: string;
  };
  mode: 'monitor' | 'schema';
  onModeChange: (mode: 'monitor' | 'schema') => void;
}

const StationDetail: React.FC<StationDetailProps> = ({ station, mode, onModeChange }) => {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center px-4">
        <div className="flex flex-col">
          <h1 className="text-[#333f4e] text-5xl font-light">{station.name}</h1>
          <span className="text-[#586872] text-2xl font-light">{station.subName}</span>
        </div>
        
        {/* Schema / Monitor Toggle */}
        <div className="flex bg-[#141e31]/60 rounded-full p-1 border border-white/5">
          <button 
            onClick={() => onModeChange('schema')}
            className={`px-8 py-2 rounded-full text-sm transition-all flex items-center gap-2 ${mode === 'schema' ? 'bg-[#2a3445] text-white shadow-lg' : 'text-[#3d4a58] hover:text-[#586872]'}`}
          >
            <span className="text-lg">🗺️</span> Схема
          </button>
          <button 
            onClick={() => onModeChange('monitor')}
            className={`px-8 py-2 rounded-full text-sm transition-all flex items-center gap-2 ${mode === 'monitor' ? 'bg-[#2a3445] text-white shadow-lg' : 'text-[#3d4a58] hover:text-[#586872]'}`}
          >
            <span className="text-lg">📊</span> Монитор
          </button>
        </div>
      </div>
      
      <div className="flex-1">
        {mode === 'monitor' ? <MonitorView /> : <SchemaView />}
      </div>
    </div>
  );
};

export default StationDetail;
