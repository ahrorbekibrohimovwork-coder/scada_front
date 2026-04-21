import React from 'react';
import VoiceButton from './VoiceButton';

interface HeaderProps {
  breadcrumbStation?: string;
  onBack?: () => void;
}

const Header: React.FC<HeaderProps> = ({ breadcrumbStation, onBack }) => {
  return (
    <header className="h-[90px] w-full flex items-center justify-between px-8 bg-[#141e31]/40 backdrop-blur-sm fixed top-0 left-[269px] z-20 border-b border-white/5 pr-[269px]">
      <div className="flex items-center gap-4">
         <div className="flex items-center gap-2">
           <div className="w-4 h-3 bg-blue-500/20 rounded-sm" />
           <span
             className="text-[#364351] text-lg hover:text-[#586872] cursor-pointer transition-colors"
             onClick={onBack}
           >
             Филиал "Каскад Ташкентских ГЭС" /
           </span>
           {breadcrumbStation && (
             <span className="text-[#586872] text-lg font-medium"> {breadcrumbStation} "Бозсу"</span>
           )}
           {!breadcrumbStation && (
             <span className="text-[#586872] text-lg font-medium"> ГЭС-1 "Бозсу"</span>
           )}
         </div>
      </div>

      <VoiceButton />
    </header>
  );
};

export default Header;
