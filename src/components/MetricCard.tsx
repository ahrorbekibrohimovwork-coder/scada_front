import React from 'react';

interface MetricCardProps {
  label: string;
  value: string;
  unit: string;
  percentage?: string;
  icon?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, unit, percentage, icon }) => {
  return (
    <div className="bg-[#141e31]/60 backdrop-blur-md border border-white/5 p-4 rounded-xl flex flex-col gap-1 hover:bg-[#141e31]/80 transition-all duration-300">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          {icon && <img src={icon} alt="" className="w-5 h-5 opacity-70" />}
          <span className="text-[#586872] text-sm font-medium">{label}</span>
        </div>
        <span className="text-[#2f3c4b] text-sm font-semibold">{unit}</span>
      </div>
      
      <div className="flex items-baseline justify-between mt-2">
        {percentage && (
          <div className="flex items-center gap-1">
            <span className="text-red-500 text-lg">↓</span>
            <span className="text-[#ff4962] text-xl font-bold">{percentage}</span>
          </div>
        )}
        <div className={`${!percentage ? 'w-full text-right' : ''}`}>
          <span className="text-[#818a98] text-4xl font-light tracking-tight">{value}</span>
        </div>
      </div>
      
      {/* Decorative pulse if it's a critical value (optional wow factor) */}
      <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-blue-500/0 via-blue-500/20 to-blue-500/0 rounded-r-xl" />
    </div>
  );
};

export default MetricCard;
