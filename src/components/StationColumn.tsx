import React from 'react';
import MetricCard from './MetricCard';
import StatusSwitch from './StatusSwitch';

interface StationColumnProps {
  name: string;
  subName?: string;
  metrics: {
    label: string;
    value: string;
    unit: string;
    percentage?: string;
    icon?: string;
  }[];
}

const StationColumn: React.FC<StationColumnProps> = ({ name, subName, metrics }) => {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="text-[#333f4e] text-3xl font-light hover:text-blue-400 transition-colors cursor-pointer">{name}</h2>
        {subName && <span className="text-[#586872] text-xl font-light">{subName}</span>}
      </div>
      
      <div className="flex flex-col gap-3">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>
      
      <div className="mt-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-1 px-4">
           <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[10px] text-[#586872]">!</div>
           <span className="text-[#586872] text-base">Состояние работы генератора</span>
        </div>
        <div className="flex gap-3 px-1">
          <StatusSwitch label="G-1" initialActive={true} />
          <StatusSwitch label="G-2" initialActive={false} />
        </div>
      </div>
      
      {/* Footer Add Button */}
      <button className="mt-4 h-24 rounded-xl border-2 border-dashed border-white/5 bg-[#141e31]/20 flex items-center justify-center hover:bg-[#141e31]/40 transition-colors group">
        <span className="text-4xl text-[#232e3f] group-hover:text-[#333f4e] transition-colors">+</span>
      </button>
    </div>
  );
};

export default StationColumn;
