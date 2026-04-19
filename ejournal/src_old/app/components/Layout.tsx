import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { Zap, LayoutDashboard, FileText, FilePlus, LogOut, Menu, X, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { RoleBadge } from './RoleBadge';
import { useWorkPermit } from '../context/WorkPermitContext';

export function Layout() {
  const { currentUser, logout } = useAuth();
  const { getPermitsByUser } = useWorkPermit();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const myPermits = currentUser ? getPermitsByUser(currentUser.id, currentUser.role) : [];
  const pendingCount = myPermits.filter(p => {
    const s = p.status;
    const role = currentUser?.role;
    if (role === 'issuer') return ['pending_dispatcher', 'returned_to_issuer', 'daily_ended', 'closing'].includes(s);
    if (role === 'dispatcher') return s === 'pending_dispatcher';
    if (role === 'dispatcher_assistant') return ['pending_assistant', 'preparing_workplaces', 'returned_to_assistant'].includes(s);
    if (role === 'admitter') return ['pending_admitter', 'returned_to_admitter', 'workplace_approved'].includes(s);
    if (role === 'manager') return ['admitter_checked', 'closing'].includes(s);
    if (role === 'observer') return ['admitter_checked'].includes(s);
    if (role === 'foreman') return ['admitter_checked', 'admitted', 'in_progress', 'daily_ended'].includes(s);
    if (role === 'worker') return ['admitted', 'in_progress'].includes(s);
    return false;
  }).length;

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Рабочий стол' },
    { to: '/permits', icon: FileText, label: 'Наряды-допуски' },
    ...(currentUser?.role === 'issuer'
      ? [{ to: '/permits/new', icon: FilePlus, label: 'Новый наряд' }]
      : []),
  ];

  const NavContent = () => (
    <>
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700">
        <div className="w-9 h-9 rounded-lg bg-yellow-400 flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-slate-900" />
        </div>
        <div className="overflow-hidden">
          <div className="text-white font-semibold text-sm leading-tight">Наряд-Допуск</div>
          <div className="text-slate-400 text-xs">Электротехнические работы</div>
        </div>
      </div>

      {currentUser && (
        <div className="px-4 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-semibold">
                {currentUser.name.split(' ').map(s => s[0]).slice(0, 2).join('')}
              </span>
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">{currentUser.shortName}</div>
              <div className="mt-0.5"><RoleBadge role={currentUser.role} /></div>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1.5 px-2 py-1 bg-slate-700/60 rounded-md">
            <span className="text-slate-400 text-xs">Группа ЭБ:</span>
            <span className="text-yellow-400 text-xs font-semibold">{currentUser.electricalGroup}</span>
          </div>
        </div>
      )}

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`
            }
          >
            <item.icon size={18} className="flex-shrink-0" />
            <span className="text-sm">{item.label}</span>
            {item.to === '/permits' && pendingCount > 0 && (
              <span className="ml-auto bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-red-500/20 hover:text-red-400 transition-all"
        >
          <LogOut size={18} />
          <span className="text-sm">Выйти</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className="hidden lg:flex lg:flex-col w-64 bg-slate-800 flex-shrink-0">
        <NavContent />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 flex flex-col transform transition-transform lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button className="absolute top-4 right-4 text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
          <X size={20} />
        </button>
        <NavContent />
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3 flex items-center gap-4 flex-shrink-0">
          <button className="lg:hidden p-1.5 rounded-md text-slate-500 hover:bg-slate-100" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          {pendingCount > 0 && (
            <div className="relative">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-500">
                <Bell size={16} />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs">
                {pendingCount}
              </span>
            </div>
          )}
          {currentUser && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-slate-500 flex items-center justify-center">
                <span className="text-white text-xs font-semibold">
                  {currentUser.name.split(' ').map(s => s[0]).slice(0, 2).join('')}
                </span>
              </div>
              <span className="text-sm text-slate-700">{currentUser.shortName}</span>
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
