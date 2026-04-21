import React from 'react';
import VoiceButton from './VoiceButton';
import type { Page } from './Sidebar';

interface HeaderProps {
  activePage: Page;
  breadcrumbStation?: string;
  onBack?: () => void;
}

const Header: React.FC<HeaderProps> = ({ activePage, breadcrumbStation, onBack }) => {
  const isDashboard = activePage === 'dashboard';

  return (
    <header className="h-[90px] w-full flex items-center justify-between px-8 bg-[#141e31]/40 backdrop-blur-sm fixed top-0 left-[269px] z-20 border-b border-white/5 pr-[269px]">
      <div className="flex items-center gap-4">
        {activePage === 'video' ? (
          <span className="text-white font-bold text-base tracking-widest uppercase">
            Система видеоаналитики
          </span>
        ) : isDashboard ? (
          <span className="text-white font-bold text-base tracking-widest uppercase">
            Стратегическая панель мониторинга
          </span>
        ) : activePage === 'asodu' ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-blue-500/20 rounded-sm" />
            <span className="text-[#586872] text-lg font-medium">
              Филиал "Каскад Ташкентских ГЭС"
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-blue-500/20 rounded-sm" />
            <span
              className="text-[#364351] text-lg hover:text-[#586872] cursor-pointer transition-colors"
              onClick={onBack}
            >
              Филиал "Каскад Ташкентских ГЭС" /
            </span>
            {breadcrumbStation ? (
              <span className="text-[#586872] text-lg font-medium"> {breadcrumbStation} "Бозсу"</span>
            ) : (
              <span className="text-[#586872] text-lg font-medium"> ГЭС-1 "Бозсу"</span>
            )}
          </div>
        )}
      </div>

      {isDashboard && <VoiceButton />}
    </header>
  );
};

export default Header;
