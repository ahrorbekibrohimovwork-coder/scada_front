import React from 'react';

type Page = 'dashboard' | 'asodu' | 'ejournal' | 'video';

const ICONS: Record<Page, React.ReactNode> = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 flex-shrink-0">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  video: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 flex-shrink-0">
      <path d="M15 10l4.553-2.277A1 1 0 0 1 21 8.72v6.56a1 1 0 0 1-1.447.897L15 14" />
      <rect x="2" y="6" width="13" height="12" rx="2" />
    </svg>
  ),
  ejournal: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 flex-shrink-0">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <line x1="9" y1="9" x2="15" y2="9" />
      <line x1="9" y1="13" x2="15" y2="13" />
    </svg>
  ),
  asodu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 flex-shrink-0">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
};

interface SidebarItemProps {
  page: Page;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ page, label, active, onClick }) => (
  <div
    className={`flex items-center gap-3 px-4 py-3 mx-3 cursor-pointer transition-all rounded-xl ${
      active ? 'bg-[#2a3445] text-white' : 'opacity-60 hover:opacity-100 text-[#a0aec0]'
    }`}
    onClick={onClick}
  >
    <span className={active ? 'text-blue-400' : 'text-current'}>
      {ICONS[page]}
    </span>
    <span className={`text-sm font-medium transition-colors ${active ? 'text-white' : ''}`}>
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
        <img
          src="/svg_files/logo.png"
          alt="O'zbekgidroenergo"
          className="h-10 object-contain"
        />
      </div>

      <div className="flex flex-col gap-1">
        <SidebarItem page="dashboard" label="Дашборд"            active={activePage === 'dashboard'} onClick={() => onNavigate('dashboard')} />
        <SidebarItem page="video"     label="Видеоаналитика"      active={activePage === 'video'}     onClick={() => onNavigate('video')} />
        <SidebarItem
          page="ejournal"
          label="Электронный журнал"
          active={activePage === 'ejournal'}
          onClick={() => window.open('/ejournal/', '_blank')}
        />
        <SidebarItem page="asodu"     label="АСОДУ"               active={activePage === 'asodu'}     onClick={() => onNavigate('asodu')} />
      </div>

      <div className="mt-auto px-6 py-8">
        <div className="flex items-center gap-3 opacity-70 hover:opacity-100 transition-all cursor-pointer">
          <div className="w-5 h-5 border-2 border-red-500/50 rounded-full flex items-center justify-center text-red-500 text-xs flex-shrink-0">!</div>
          <span className="text-red-400 text-sm">События</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
export type { Page };
