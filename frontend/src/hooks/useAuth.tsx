import React, { createContext, useContext, useState, useCallback } from 'react';
import type { User, UserRole } from '../types';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, _password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, _password: string, role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Demo users — clearly labelled as demo, no real auth occurs here
const DEMO_USERS: Record<string, User> = {
  'citizen@demo.com': { id: 'u-301', name: 'Ramesh Sharma', email: 'citizen@demo.com', role: 'citizen', createdAt: '2024-01-01' },
  'lawyer@demo.com': { id: 'u-101', name: 'Adv. Priya Venkatesh', email: 'lawyer@demo.com', role: 'lawyer', createdAt: '2024-01-01', isVerified: true },
  'admin@demo.com': { id: 'u-001', name: 'Admin Kumar', email: 'admin@demo.com', role: 'admin', createdAt: '2024-01-01' },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = sessionStorage.getItem('cm_user');
      return saved ? (JSON.parse(saved) as User) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback(async (email: string, _password: string, role: UserRole) => {
    // NOTE: This is a frontend-only demo login. Real authentication must be handled by the backend.
    await new Promise((r) => setTimeout(r, 600)); // simulate network
    const found = DEMO_USERS[email];
    const demoUser: User = found ?? {
      id: 'u-demo-' + Date.now(),
      name: email.split('@')[0],
      email,
      role,
      createdAt: new Date().toISOString(),
    };
    sessionStorage.setItem('cm_user', JSON.stringify(demoUser));
    setUser(demoUser);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('cm_user');
    setUser(null);
  }, []);

  const register = useCallback(async (name: string, email: string, _password: string, role: UserRole) => {
    await new Promise((r) => setTimeout(r, 600));
    const newUser: User = { id: 'u-new-' + Date.now(), name, email, role, createdAt: new Date().toISOString() };
    sessionStorage.setItem('cm_user', JSON.stringify(newUser));
    setUser(newUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading: false, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
