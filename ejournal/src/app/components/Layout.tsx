import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { Zap, LayoutDashboard, FileText, FilePlus, LogOut, Menu, X, Bell, ChevronRight, Users } from 'lucide-react';
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
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-700">
        <div className="w-8 h-8 bg-yellow-400 rounded flex items-center justify-center flex-shrink-0">
          <Zap size={16} className="text-gray-900" />
        </div>
        <div>
          <p className="text-white text-sm font-semibold leading-tight">ЭНД</p>
          <p className="text-gray-400 text-[10px] uppercase tracking-wider">Электронный наряд-допуск</p>
        </div>
      </div>

      {/* User */}
      {currentUser && (
        <div className="px-4 py-3 border-b border-gray-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-gray-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-semibold">
                {currentUser.name.split(' ').map(s => s[0]).slice(0, 2).join('')}
              </span>
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{currentUser.shortName}</p>
              <p className="text-gray-400 text-[10px] truncate">{ROLE_LABELS[currentUser.role]}</p>
            </div>
            <div className="flex-shrink-0">
              <span className="text-yellow-400 text-[10px] font-mono font-semibold bg-gray-700 px-1.5 py-0.5 rounded">
                ГР.{currentUser.electricalGroup}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded transition-all text-sm ${
                isActive ? 'bg-white text-gray-900 font-medium' : 'text-gray-300 hover:text-white hover:bg-gray-700'
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
      <div className="px-3 py-3 border-t border-gray-700">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all text-sm">
          <LogOut size={15} />
          <span>Выйти</span>
        </button>
        <p className="text-gray-600 text-[10px] text-center mt-2 px-3">ПТЭЭП · ПУЭ · ПОТЭУ №328н</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-56 bg-gray-900 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 w-56 bg-gray-900 flex flex-col transform transition-transform lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button className="absolute top-3 right-3 text-gray-500 hover:text-white" onClick={() => setSidebarOpen(false)}>
          <X size={18} />
        </button>
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-3 flex-shrink-0">
          <button className="lg:hidden p-1.5 rounded text-gray-500 hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
            <Menu size={18} />
          </button>
          <div className="flex-1" />
          {pendingCount > 0 && (
            <div className="relative flex-shrink-0">
              <div className="w-7 h-7 flex items-center justify-center">
                <Bell size={15} className="text-gray-500" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-semibold">
                {pendingCount}
              </span>
            </div>
          )}
          {currentUser && (
            <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
              <div className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center">
                <span className="text-gray-600 text-[10px] font-semibold">
                  {currentUser.name.split(' ').map(s => s[0]).slice(0, 2).join('')}
                </span>
              </div>
              <span className="text-sm text-gray-700 hidden sm:inline">{currentUser.shortName}</span>
            </div>
          )}
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}