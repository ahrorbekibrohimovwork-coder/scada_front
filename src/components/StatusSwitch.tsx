import React, { useState } from 'react';

interface StatusSwitchProps {
  label: string;
  initialActive?: boolean;
}

const StatusSwitch: React.FC<StatusSwitchProps> = ({ label, initialActive = true }) => {
  const [isActive, setIsActive] = useState(initialActive);

  return (
    <div className="flex items-center gap-3 bg-[#141e31]/40 border border-white/5 p-2 rounded-full flex-1 transition-all hover:bg-[#141e31]/60 cursor-pointer select-none"
         onClick={() => setIsActive(!isActive)}>
      <span className="text-xl font-medium text-[#818a98] ml-2">{label}</span>
      <div className={`relative w-16 h-8 rounded-full transition-all duration-300 ${isActive ? 'bg-[#23e864]/30 shadow-[0_0_15px_rgba(35,232,100,0.2)]' : 'bg-red-900/20'}`}>
        <div className={`absolute top-1 w-10 h-6 rounded-full transition-all duration-300 flex items-center justify-center ${isActive ? 'left-5 bg-[#23e864] shadow-[0_0_10px_#23e864]' : 'left-1 bg-red-600'}`}>
          <div className="w-1 h-2 border-r border-b border-white opacity-40 rotate-45 mb-1" />
        </div>
      </div>
    </div>
  );
};

export default StatusSwitch;
