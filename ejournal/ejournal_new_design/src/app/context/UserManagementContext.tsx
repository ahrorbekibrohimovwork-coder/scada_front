import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User } from '../types';

import { apiFetch } from '../lib/apiFetch';

interface CreateUserData {
  login: string;
  password: string;
  name: string;
  role?: string;
  electricalGroup: string;
  position: string;
  department: string;
  phone: string;
}

interface UserManagementContextValue {
  users: User[];
  createWorkerAccount: (data: CreateUserData) => Promise<User>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  getUserByLogin: (login: string) => User | undefined;
  refreshUsers: () => Promise<void>;
}

const Ctx = createContext<UserManagementContextValue | null>(null);

export function UserManagementProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);

  const refreshUsers = useCallback(async () => {
    try {
      const resp = await apiFetch('/api/auth/users');
      if (resp.ok) {
        const data = await resp.json();
        setUsers(data);
      }
    } catch (e) {
      console.error('Failed to fetch users', e);
    }
  }, []);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  const createWorkerAccount = useCallback(async (data: CreateUserData): Promise<User> => {
    const resp = await apiFetch('/api/auth/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, role: data.role || 'worker' }),
    });
    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.detail || 'Failed to create user');
    }
    const newUser = await resp.json();
    setUsers(prev => [...prev, newUser]);
    return newUser;
  }, []);

  const updateUser = useCallback(async (id: string, data: Partial<User>) => {
    const resp = await apiFetch(`/api/auth/update/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.detail || 'Failed to update user');
    }
    const updatedUser = await resp.json();
    setUsers(prev => prev.map(u => u.id === id ? updatedUser : u));
  }, []);

  const getUserByLogin = useCallback((login: string) => {
    return users.find(u => u.login === login);
  }, [users]);

  return (
    <Ctx.Provider value={{ users, createWorkerAccount, updateUser, getUserByLogin, refreshUsers }}>
      {children}
    </Ctx.Provider>
  );
}

export function useUserManagement() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useUserManagement must be used within UserManagementProvider');
  return ctx;
}
