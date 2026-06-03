import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authApi, AuthData, UserProfile } from '../services/api';

const TOKEN_KEY = 'smartreceipt.token';

interface AuthContextType {
  token: string | null;
  user: UserProfile | null;
  isBootstrapping: boolean;
  isAuthenticating: boolean;
  login: (body: { email: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  register: (body: { fullName: string; email: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function profileFromAuth(data: AuthData): UserProfile {
  return {
    id: data.userId,
    fullName: data.fullName,
    email: data.email,
    createdAt: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const clearAuth = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const applyAuth = useCallback(async (data: AuthData) => {
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(profileFromAuth(data));
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    const response = await authApi.me(token);
    if (response.success && response.data) {
      setUser(response.data);
    }
  }, [token]);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        if (!storedToken) return;

        const response = await authApi.me(storedToken);
        if (response.success && response.data) {
          if (!mounted) return;
          setToken(storedToken);
          setUser(response.data);
        } else {
          await SecureStore.deleteItemAsync(TOKEN_KEY);
        }
      } catch {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      } finally {
        if (mounted) setIsBootstrapping(false);
      }
    }

    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (body: { email: string; password: string }) => {
    setIsAuthenticating(true);
    try {
      const response = await authApi.login(body);
      if (response.success && response.data) {
        await applyAuth(response.data);
        return { success: true };
      }
      return { success: false, error: response.message ?? 'Login failed.' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Could not connect to server.' };
    } finally {
      setIsAuthenticating(false);
    }
  }, [applyAuth]);

  const register = useCallback(async (body: { fullName: string; email: string; password: string }) => {
    setIsAuthenticating(true);
    try {
      const response = await authApi.register(body);
      if (response.success && response.data) {
        await applyAuth(response.data);
        return { success: true };
      }
      return { success: false, error: response.message ?? 'Registration failed.' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Could not connect to server.' };
    } finally {
      setIsAuthenticating(false);
    }
  }, [applyAuth]);

  const value = useMemo<AuthContextType>(() => ({
    token,
    user,
    isBootstrapping,
    isAuthenticating,
    login,
    register,
    logout: clearAuth,
    refreshProfile,
  }), [clearAuth, isAuthenticating, isBootstrapping, login, refreshProfile, register, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
