import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Zap, Eye, EyeOff, AlertCircle, User, Lock, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUserManagement } from '../context/UserManagementContext';
import { ROLE_LABELS } from '../types';

export function Login() {
  const { login } = useAuth();
  const { users } = useUserManagement();
  const navigate = useNavigate();
  const [loginVal, setLoginVal] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');

  // Use users from context for quick login, prioritize issuer
  const quickUsers = [...users].sort((a, b) => {
    if (a.role === 'issuer' && b.role !== 'issuer') return -1;
    if (a.role !== 'issuer' && b.role === 'issuer') return 1;
    return 0;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (login(loginVal, password)) navigate('/dashboard');
    else setError('Неверный логин или пароль');
  };

  const handleQuickLogin = (userLogin: string) => {
    const user = users.find(u => u.login === userLogin);
    if (user) {
      login(user.login, user.password);
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-800">
        <div className="w-7 h-7 bg-yellow-400 rounded flex items-center justify-center">
          <Zap size={14} className="text-gray-900" />
        </div>
        <div><span className="text-white text-sm font-semibold">Электронный Наряд-Допуск</span><span className="ml-3 text-gray-500 text-xs hidden sm:inline">Система учёта электротехнических работ </span></div>
      </div>

      <div className="flex-1 flex flex-col xl:flex-row gap-8 px-4 sm:px-6 xl:px-10 py-8 max-w-7xl mx-auto w-full">
        {/* Login form */}
        <div className="w-full xl:w-80 flex-shrink-0">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Shield size={16} className="text-gray-700" />
                <span className="text-gray-800 text-sm font-semibold">Вход в систему</span>
              </div>
              <p className="text-gray-500 text-xs">Введите учётные данные для авторизации</p>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Логин</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                  <input value={loginVal} onChange={e => setLoginVal(e.target.value)} type="text" required
                    placeholder="Введите логин"
                    className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-800 focus:bg-white" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Пароль</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                  <input value={password} onChange={e => setPassword(e.target.value)} type={showPwd ? 'text' : 'password'} required
                    placeholder="Введите пароль"
                    className="w-full pl-8 pr-9 py-2 border border-gray-200 rounded text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-800 focus:bg-white" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPwd ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded">
                  <AlertCircle size={13} className="text-red-500 flex-shrink-0" />
                  <span className="text-red-600 text-xs">{error}</span>
                </div>
              )}
              <button type="submit"
                className="w-full py-2.5 bg-gray-900 hover:bg-black text-white rounded text-sm font-medium transition-colors">
                Войти
              </button>
            </form>

            <div className="px-6 pb-5">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider mb-1">Тестовый доступ</p>
                <p className="text-xs text-gray-600">Все пароли: <code className="bg-gray-200 px-1.5 py-0.5 rounded text-gray-800 font-mono">1234</code></p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick login */}
        <div className="flex-1">
          <div className="mb-4">
            <h2 className="text-white text-base font-semibold mb-1">Быстрый вход</h2>
            <p className="text-gray-400 text-sm">Нажмите на карточку для входа в систему</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-800">
            {quickUsers.map((user) => (
              <button
                key={user.login}
                onClick={() => handleQuickLogin(user.login)}
                className="text-left bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg p-3.5 transition-all group"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{user.name}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{ROLE_LABELS[user.role] || user.role}</p>
                  </div>
                  {user.electricalGroup && (
                    <span className="text-yellow-400 text-[10px] font-mono font-semibold bg-gray-800 px-1.5 py-0.5 rounded flex-shrink-0">
                      ГР.{user.electricalGroup}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                  <code className="text-gray-600 text-[10px]">{user.login}</code>
                  <span className="text-gray-500 group-hover:text-white text-xs transition-colors">
                    Войти →
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 py-3 border-t border-gray-800 flex flex-wrap items-center justify-between gap-2">
        <span className="text-gray-600 text-xs">Система электронного наряда-допуска</span>
        <span className="text-gray-700 text-[10px] font-mono">ПТЭЭП · ПУЭ 7-е изд. · ПОТЭУ №328н</span>
      </div>
    </div>
  );
}
