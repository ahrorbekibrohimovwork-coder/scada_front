import React from 'react';

export const TransformerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 40 40" className={`w-10 h-10 ${className}`}>
    <circle cx="20" cy="15" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="20" cy="25" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M 15 15 L 20 10 L 25 15" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M 15 25 L 20 30 L 25 25" fill="none" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export const GeneratorIcon: React.FC<{ className?: string; label?: string }> = ({ className, label }) => (
  <div className={`flex flex-col items-center gap-1 ${className}`}>
    <div className="w-12 h-12 rounded-full border-2 border-green-500/50 flex items-center justify-center bg-[#0f172b] shadow-[0_0_15px_#22c55e33]">
      <div className="w-8 h-8 rounded-full border border-green-400 flex items-center justify-center">
        <span className="text-green-400 text-[10px] font-bold">G</span>
      </div>
    </div>
    {label && <span className="text-gray-500 text-[8px] font-bold uppercase">{label}</span>}
  </div>
);

export const FlowArrow: React.FC<{ direction?: 'up' | 'down'; color?: string; className?: string }> = ({ direction = 'down', color = 'text-red-500', className }) => (
  <svg viewBox="0 0 20 40" className={`w-4 h-8 ${color} ${className}`}>
     <path 
       d={direction === 'down' ? "M 10 0 L 10 30 M 5 25 L 10 32 L 15 25" : "M 10 40 L 10 10 M 5 15 L 10 8 L 15 15"} 
       fill="none" 
       stroke="currentColor" 
       strokeWidth="2.5" 
       strokeLinecap="round" 
       strokeLinejoin="round"
     />
  </svg>
);

export const BreakerIcon: React.FC<{ active?: boolean; className?: string }> = ({ active = true, className }) => (
  <div className={`w-3 h-3 rounded-sm border border-white/20 transition-all ${active ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'} ${className}`} />
);
