import React from 'react';

type Page = 'dashboard' | 'asodu' | 'ejournal' | 'video';

interface SidebarItemProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ label, active, onClick }) => (
  <div
    className={`flex items-center gap-4 px-6 py-3 cursor-pointer transition-all ${active ? 'bg-[#2a3445] rounded-full mx-3' : 'opacity-60 hover:opacity-100'}`}
    onClick={onClick}
  >
    <div className="w-5 h-5 border border-white/20 rounded-sm flex items-center justify-center">
      <div className="w-2 h-2 bg-blue-400 rounded-sm opacity-50" />
    </div>
    <span className={`text-lg transition-colors ${active ? 'text-white font-medium' : 'text-[#a0aec0]'}`}>
      {label}
    </span>
  </div>
);

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate }) => {
  return (
    <div className="w-[269px] min-h-screen bg-[#141e31] flex flex-col py-8 fixed left-0 top-0 z-10">
      <div className="px-6 mb-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-xl font-bold">UGE</div>
          <span className="text-[#1171c6] font-bold tracking-tight text-sm">O'ZBEKGIDROENERGO</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <SidebarItem label="Дашборд" active={activePage === 'dashboard'} onClick={() => onNavigate('dashboard')} />
        <SidebarItem label="Видеоаналитика" active={activePage === 'video'} onClick={() => onNavigate('video')} />
        <SidebarItem
          label="Электронный журнал"
          active={activePage === 'ejournal'}
          onClick={() => window.open('/ejournal/', '_blank')}
        />
        <SidebarItem label="АСОДУ" active={activePage === 'asodu'} onClick={() => onNavigate('asodu')} />
      </div>

      <div className="mt-auto px-6 py-8">
        <div className="flex items-center gap-4 opacity-70 hover:opacity-100 transition-all cursor-pointer">
          <div className="w-6 h-6 border-2 border-red-500/50 rounded-full flex items-center justify-center text-red-500 text-xs">!</div>
          <span className="text-red-400">События</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
export type { Page };
