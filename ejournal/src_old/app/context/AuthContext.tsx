import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User } from '../types';
import { MOCK_USERS } from '../data/mockData';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';

interface AuthContextValue {
  currentUser: User | null;
  token: string | null;
  login: (login: string, password: string) => Promise<boolean>;
  logout: () => void;
  allUsers: User[];
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>(MOCK_USERS);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/auth/users`);
        if (!response.ok) {
          throw new Error(`Load users failed: ${response.status}`);
        }
        const data = await response.json();
        setAllUsers(Array.isArray(data) && data.length > 0 ? data : MOCK_USERS);
      } catch (error) {
        console.warn('Failed to load users from backend, using local mock users', error);
        setAllUsers(MOCK_USERS);
      }
    };
    void loadUsers();
  }, []);

  const login = useCallback(async (login: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
        setToken(data.token);
        return true;
      }
    } catch (error) {
      console.warn('Backend login failed, falling back to local mock users', error);
    }

    const user = MOCK_USERS.find(u => u.login === login && u.password === password);
    if (user) {
      setCurrentUser(user);
      setToken(null);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, token, login, logout, allUsers }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
