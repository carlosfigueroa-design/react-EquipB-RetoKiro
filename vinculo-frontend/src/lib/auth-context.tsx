import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { api } from './api';

interface Aliado {
  id: string;
  email: string;
  companyName: string;
  type: string;
  status: string;
}

interface AuthContextType {
  aliado: Aliado | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [aliado, setAliado] = useState<Aliado | null>(() => {
    try {
      const stored = localStorage.getItem('vinculo_aliado');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('vinculo_token'),
  );

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.login(email, password);
    if (!result.access_token) {
      throw new Error('Respuesta inválida del servidor');
    }
    localStorage.setItem('vinculo_token', result.access_token);
    localStorage.setItem('vinculo_aliado', JSON.stringify(result.aliado));
    setToken(result.access_token);
    setAliado(result.aliado);
  }, []);

  const register = useCallback(async (data: any) => {
    const result = await api.register(data);
    // After successful registration, auto-login
    try {
      await api.login(data.email, data.password).then((loginResult) => {
        localStorage.setItem('vinculo_token', loginResult.access_token);
        localStorage.setItem('vinculo_aliado', JSON.stringify(loginResult.aliado));
        setToken(loginResult.access_token);
        setAliado(loginResult.aliado);
      });
    } catch {
      // Registration succeeded but auto-login failed — user can login manually
    }
    return result;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('vinculo_token');
    localStorage.removeItem('vinculo_aliado');
    setToken(null);
    setAliado(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ aliado, token, isAuthenticated: !!token, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
