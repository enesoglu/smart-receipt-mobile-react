import React, { createContext, useContext, useState, ReactNode } from 'react';
import { authApi, AuthData } from '../services/api';

interface AuthContextType {
  token: string | null;
  userId: number | null;
  username: string | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  const setAuth = (data: AuthData) => {
    setToken(data.token);
    setUserId(data.userId);
    setUsername(data.username);
  };

  const clearAuth = () => {
    setToken(null);
    setUserId(null);
    setUsername(null);
  };

  const login = async (usernameInput: string, password: string) => {
    try {
      const res = await authApi.login(usernameInput, password);
      if (res.success && res.data) {
        setAuth(res.data);
        return { success: true };
      }
      return { success: false, error: res.message ?? 'Login failed' };
    } catch {
      return { success: false, error: 'Could not connect to server' };
    }
  };

  const register = async (usernameInput: string, password: string) => {
    try {
      const res = await authApi.register(usernameInput, password);
      if (res.success && res.data) {
        setAuth(res.data);
        return { success: true };
      }
      return { success: false, error: res.message ?? 'Registration failed' };
    } catch {
      return { success: false, error: 'Could not connect to server' };
    }
  };

  return (
    <AuthContext.Provider value={{ token, userId, username, login, register, logout: clearAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
