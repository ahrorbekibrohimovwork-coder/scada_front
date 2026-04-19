import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { Zap, LayoutDashboard, FileText, FilePlus, LogOut, Menu, X, Bell, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkPermit } from '../context/WorkPermitContext';
import { ROLE_LABELS } from '../types';

export function Layout() {
  const { currentUser, logout } = useAuth();
  const { getPermitsByUser } = useWorkPermit();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const myPermits = currentUser ? getPermitsByUser(currentUser.id, currentUser.role) : [];
  const pendingCount = myPermits.filter(p => {
    const s = p.status;
    const role = currentUser?.role;
    if (role === 'issuer') return ['returned_to_issuer', 'rework', 'daily_ended', 'closing'].includes(s);
    if (role === 'dispatcher') return s === 'pending_dispatcher';
    if (role === 'dispatcher_assistant') return ['pending_assistant', 'preparing_workplaces', 'returned_to_assistant'].includes(s);
    if (role === 'admitter') return ['pending_admitter', 'returned_to_admitter', 'workplace_approved'].includes(s);
    if (role === 'manager') return ['admitter_checked', 'closing'].includes(s);
    if (role === 'observer') return ['admitter_checked', 'admitted'].includes(s);
    if (role === 'foreman') return ['admitter_checked', 'admitted', 'in_progress', 'daily_ended'].includes(s);
    if (role === 'worker') return ['admitted'].includes(s);
    return false;
  }).length;

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Рабочий стол' },
    { to: '/permits', icon: FileText, label: 'Наряды-допуски' },
    ...(currentUser?.role === 'issuer' ? [{ to: '/permits/new', icon: FilePlus, label: 'Новый наряд' }] : []),
    ...(['issuer', 'dispatcher'].includes(currentUser?.role ?? '') ? [{ to: '/accounts', icon: Users, label: 'Учетные записи' }] : []),
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Zap size={16} className="text-white" />
        </div>
        <div>
          <p className="text-white text-sm font-bold leading-tight">ЭНД</p>
          <p className="text-[#a0aec0] text-[10px] uppercase tracking-wider">Электронный наряд-допуск</p>
        </div>
      </div>

      {/* User */}
      {currentUser && (
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-300 text-xs font-semibold">
                {currentUser.name.split(' ').map(s => s[0]).slice(0, 2).join('')}
              </span>
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{currentUser.shortName}</p>
              <p className="text-[#a0aec0] text-[10px] truncate">{ROLE_LABELS[currentUser.role]}</p>
            </div>
            <div className="flex-shrink-0">
              <span className="text-blue-400 text-[10px] font-mono font-semibold bg-white/10 px-1.5 py-0.5 rounded">
                ГР.{currentUser.electricalGroup}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-1">
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                isActive
                  ? 'bg-[#2a3445] text-white font-medium'
                  : 'text-[#a0aec0] hover:text-white hover:bg-white/5'
              }`
            }>
            <item.icon size={15} className="flex-shrink-0" />
            <span>{item.label}</span>
            {item.to === '/permits' && pendingCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-[10px] font-semibold rounded-full w-4 h-4 flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-white/10">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[#a0aec0] hover:text-red-400 hover:bg-red-400/10 transition-all text-sm">
          <LogOut size={15} />
          <span>Выйти</span>
        </button>
        <p className="text-white/20 text-[10px] text-center mt-2 px-3">ПТЭЭП · ПУЭ · ПОТЭУ №328н</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#0f172b] overflow-hidden text-white">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-56 bg-[#141e31] flex-shrink-0 border-r border-white/5">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 w-56 bg-[#141e31] flex flex-col transform transition-transform lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button className="absolute top-3 right-3 text-[#a0aec0] hover:text-white" onClick={() => setSidebarOpen(false)}>
          <X size={18} />
        </button>
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-[#141e31] border-b border-white/5 flex items-center px-4 gap-3 flex-shrink-0">
          <button className="lg:hidden p-1.5 rounded text-[#a0aec0] hover:bg-white/10" onClick={() => setSidebarOpen(true)}>
            <Menu size={18} />
          </button>
          <div className="flex-1" />
          {pendingCount > 0 && (
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 cursor-pointer">
                <Bell size={15} className="text-[#a0aec0]" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-semibold">
                {pendingCount}
              </span>
            </div>
          )}
          {currentUser && (
            <div className="flex items-center gap-2 pl-3 border-l border-white/10">
              <div className="w-7 h-7 rounded-lg bg-blue-600/30 flex items-center justify-center">
                <span className="text-blue-300 text-[10px] font-semibold">
                  {currentUser.name.split(' ').map(s => s[0]).slice(0, 2).join('')}
                </span>
              </div>
              <span className="text-sm text-[#a0aec0] hidden sm:inline">{currentUser.shortName}</span>
            </div>
          )}
        </header>

        <main className="flex-1 overflow-y-auto bg-[#0f172b]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
