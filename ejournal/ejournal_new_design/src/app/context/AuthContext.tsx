import React, { createContext, useContext, useState, useCallback } from 'react';
import type { User } from '../types';
import { useUserManagement } from './UserManagementContext';

interface AuthContextValue {
  currentUser: User | null;
  login: (login: string, password: string) => boolean;
  logout: () => void;
  allUsers: User[];
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { users, getUserByLogin } = useUserManagement();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const login = useCallback((login: string, password: string): boolean => {
    const user = getUserByLogin(login);
    if (user && user.password === password) {
      setCurrentUser(user);
      return true;
    }
    return false;
  }, [getUserByLogin]);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, allUsers: users }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
