import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Zap, Eye, EyeOff, AlertCircle, User, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS, ROLE_COLORS } from '../types';
import type { User as AppUser } from '../types';

const ROLE_ORDER = [
  'issuer', 'dispatcher', 'dispatcher_assistant',
  'admitter', 'manager', 'observer', 'foreman', 'worker',
] as const;

export function Login() {
  const { login, allUsers } = useAuth();
  const navigate = useNavigate();
  const [loginVal, setLoginVal] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await login(loginVal, password);
    if (success) navigate('/dashboard');
    else setError('Неверный логин или пароль');
  };

  const quickLogin = async (u: { login: string }) => {
    const success = await login(u.login, '1234');
    if (success) navigate('/dashboard');
    else setError('Не удалось войти через быстрый доступ');
  };

  const orderedUsers = [...allUsers].sort((a, b) => {
    const roleCmp = ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role);
    if (roleCmp !== 0) return roleCmp;
    return a.name.localeCompare(b.name, 'ru');
  }) as AppUser[];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 sm:px-8 py-6">
        <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center">
          <Zap className="w-6 h-6 text-slate-900" />
        </div>
        <div>
          <div className="text-white font-semibold text-lg leading-tight">Электронный Наряд-Допуск</div>
          <div className="text-slate-400 text-xs">Система учёта электротехнических работ · ПТЭЭП / ПОТЭУ</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col xl:flex-row items-start justify-center gap-8 px-4 sm:px-6 py-6 max-w-7xl mx-auto w-full">

        {/* Login form */}
        <div className="w-full max-w-sm flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="mb-6">
              <h1 className="text-slate-900 mb-1">Вход в систему</h1>
              <p className="text-slate-500 text-sm">Введите учётные данные</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-slate-700 mb-1.5 block">Логин</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input value={loginVal} onChange={e => setLoginVal(e.target.value)} type="text"
                    placeholder="Логин" required
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900" />
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-700 mb-1.5 block">Пароль</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input value={password} onChange={e => setPassword(e.target.value)} type={showPwd ? 'text' : 'password'}
                    placeholder="Пароль" required
                    className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                  <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                  <span className="text-red-600 text-sm">{error}</span>
                </div>
              )}
              <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                Войти
              </button>
            </form>

            <div className="mt-5 pt-5 border-t border-slate-100">
              <p className="text-slate-400 text-xs text-center mb-1">Тестовые данные</p>
              <p className="text-slate-500 text-xs text-center">
                Все пароли: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">1234</code>
              </p>
            </div>
          </div>
        </div>

        {/* Quick access */}
        <div className="flex-1 w-full max-w-3xl">
          <div className="mb-4">
            <h2 className="text-white font-medium mb-1">Учётные записи участников наряда-допуска</h2>
            <p className="text-slate-400 text-sm">Нажмите на карточку для быстрого входа. Каждая роль имеет свои полномочия в workflow.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
            {orderedUsers.map(u => {
              const c = ROLE_COLORS[u.role];
              const roleNum: Record<string, string> = {
                issuer: '①',
                dispatcher: '②',
                dispatcher_assistant: '③',
                admitter: '④',
                manager: '⑤',
                observer: '⑥',
                foreman: '⑦',
                worker: '⑧',
              };
              const roleTasks: Record<string, string[]> = {
                issuer:               ['Оформляет наряд-допуск', 'Подписывает ЭЦП', 'Закрывает и продлевает'],
                dispatcher:           ['Проверяет меры безопасности', 'Выдаёт разрешение на подготовку', 'Возвращает на доработку'],
                dispatcher_assistant: ['Получает разрешение', 'Подготавливает рабочие места', 'Сдаёт допускающему'],
                admitter:             ['Проверяет рабочие места', 'Фиксирует части под напряжением', 'Проводит инструктаж и допуск'],
                manager:              ['Проверяет рабочие места', 'Подписывает закрытие наряда', 'Ответственный за безопасность'],
                observer:             ['Проверяет рабочие места', 'Надзор за безопасностью', 'Подписывает ежедневный допуск'],
                foreman:              ['Ведёт бригаду', 'Регистрирует начало/окончание', 'Инициирует закрытие наряда'],
                worker:               ['Выполняет работы', 'Подписывает первичный допуск', 'Соблюдает меры безопасности'],
              };
              return (
                <button key={u.id} onClick={() => quickLogin(u)}
                  className="text-left bg-slate-700/60 hover:bg-slate-700 border border-slate-600 hover:border-slate-400 rounded-xl p-4 transition-all group">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.bg}`}>
                      <span className={`text-sm font-bold ${c.text}`}>{roleNum[u.role]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-white text-sm font-medium">{u.shortName}</div>
                          <span className={`inline-block mt-0.5 text-xs px-2 py-0.5 rounded-md font-medium ${c.bg} ${c.text}`}>
                            {ROLE_LABELS[u.role]}
                          </span>
                        </div>
                        <span className="text-slate-500 text-xs whitespace-nowrap">Гр. {u.electricalGroup}</span>
                      </div>
                      <ul className="mt-2.5 space-y-1">
                        {roleTasks[u.role]?.map(t => (
                          <li key={t} className="text-slate-400 text-xs flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-slate-500 flex-shrink-0" />
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-600 flex items-center justify-between">
                    <code className="text-slate-500 text-xs">логин: {u.login} · пароль: 1234</code>
                    <span className="text-blue-400 text-xs group-hover:text-blue-300">Войти →</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-6 sm:px-8 py-4 border-t border-slate-700 flex flex-wrap items-center justify-between gap-2">
        <div className="text-slate-500 text-xs">Система электронного наряда-допуска для электротехнических работ</div>
        <div className="text-slate-500 text-xs">ПТЭЭП · ПУЭ · ПОТЭУ (Приказ №328н)</div>
      </div>
    </div>
  );
}
