import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User } from '../types';
import { useUserManagement } from './UserManagementContext';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'https://scruffy-chaos-drift.ngrok-free.dev';

interface AuthContextValue {
  currentUser: User | null;
  token: string | null;
  login: (login: string, password: string) => Promise<boolean>;
  logout: () => void;
  allUsers: User[];
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { users, refreshUsers } = useUserManagement();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Restore session
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      fetch(`${API_BASE}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })
      .then(r => r.ok ? r.json() : null)
      .then(user => {
        if (user) {
          setCurrentUser(user);
          setToken(savedToken);
        } else {
          localStorage.removeItem('auth_token');
        }
      })
      .catch(() => {});
    }
  }, []);

  const login = useCallback(async (login: string, password: string): Promise<boolean> => {
    try {
      const resp = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setCurrentUser(data.user);
        setToken(data.token);
        localStorage.setItem('auth_token', data.token);
        await refreshUsers();
        return true;
      }
    } catch (e) {
      console.error('Login failed', e);
    }
    return false;
  }, [refreshUsers]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, token, login, logout, allUsers: users }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
