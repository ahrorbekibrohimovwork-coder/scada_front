import React, { useState } from 'react';
import { X, User, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { useUserManagement } from '../../context/UserManagementContext';
import type { BrigadeRegistryEntry } from '../../types';

interface CreateAccountModalProps {
  registryEntry: BrigadeRegistryEntry;
  onClose: () => void;
}

export function CreateAccountModal({ registryEntry, onClose }: CreateAccountModalProps) {
  const { createWorkerAccount, getUserByLogin } = useUserManagement();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!login.trim()) {
      setError('Введите логин');
      return;
    }

    if (getUserByLogin(login)) {
      setError('Логин уже занят');
      return;
    }

    if (password.length < 4) {
      setError('Пароль должен содержать минимум 4 символа');
      return;
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    try {
      createWorkerAccount({
        login: login.trim(),
        password,
        name: registryEntry.name,
        electricalGroup: registryEntry.electricalGroup,
        position: registryEntry.position,
        department: registryEntry.department,
        phone: phone.trim(),
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError('Ошибка при создании учетной записи');
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Учетная запись создана</h3>
          <p className="text-sm text-gray-600">Сотрудник может войти в систему</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Создание учетной записи</h2>
            <p className="text-xs text-gray-600 mt-0.5">{registryEntry.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div className="p-3 bg-gray-50 border border-gray-200 rounded text-xs space-y-1">
            <p className="text-gray-600"><span className="font-medium text-gray-700">Должность:</span> {registryEntry.position}</p>
            <p className="text-gray-600"><span className="font-medium text-gray-700">Подразделение:</span> {registryEntry.department}</p>
            <p className="text-gray-600"><span className="font-medium text-gray-700">Группа:</span> {registryEntry.electricalGroup}</p>
          </div>

          <div>
            <label className="text-xs text-gray-600 mb-1 block">Логин*</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
              <input
                type="text"
                value={login}
                onChange={e => setLogin(e.target.value)}
                placeholder="Введите логин"
                required
                className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-800 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-600 mb-1 block">Пароль*</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Минимум 4 символа"
                required
                className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-800 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-600 mb-1 block">Подтверждение пароля*</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Повторите пароль"
                required
                className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-800 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-600 mb-1 block">Телефон</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+7 (___) ___-__-__"
              className="w-full px-4 py-2 border border-gray-200 rounded text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-800 focus:bg-white"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded">
              <AlertCircle size={13} className="text-red-500 flex-shrink-0" />
              <span className="text-red-600 text-xs">{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded text-sm font-medium transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-gray-900 hover:bg-black text-white rounded text-sm font-medium transition-colors"
            >
              Создать учетную запись
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
