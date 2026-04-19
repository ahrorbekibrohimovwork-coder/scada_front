import React from 'react';

export interface SchemaMetric {
  label: string;
  value: string;
  unit: string;
  color?: string;
}

interface SchemaDataBoxProps {
  title: string;
  metrics: SchemaMetric[];
  columns?: number;
  className?: string;
}

const SchemaDataBox: React.FC<SchemaDataBoxProps> = ({ title, metrics, columns = 2, className }) => {
  return (
    <div className={`bg-[#141e31]/80 backdrop-blur-md border border-white/5 p-2 rounded flex flex-col gap-1 shadow-2xl ${className}`}>
      <h4 className="text-gray-500 text-[10px] font-bold uppercase tracking-tight border-b border-white/5 pb-0.5 mb-1">
        {title}
      </h4>
      <div className={`grid gap-x-4 gap-y-1`} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {metrics.map((m, i) => (
          <div key={i} className="flex flex-col">
            <span className="text-gray-600 text-[8px] uppercase leading-none mb-0.5">{m.label}</span>
            <div className={`text-[10px] font-medium leading-none ${m.color || 'text-blue-400'}`}>
              {m.value} <span className="text-gray-700 text-[8px] ml-0.5 font-normal">{m.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SchemaDataBox;
