import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  name?: string;
  company?: string;
  role: 'PUBLICO' | 'EXTERNO' | 'LIDER_TECNICO' | 'ADMIN';
  status: 'ACTIVE' | 'BLOCKED' | 'INACTIVE';
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;

  // Actions
  login: (token: string, refreshToken: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setTokens: (token: string, refreshToken: string) => void;
  refresh: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,

      login: (token, refreshToken, user) => {
        set({ token, refreshToken, user });
      },

      logout: () => {
        const { token } = get();
        if (token) {
          apiClient.post('/auth/logout').catch(() => {
            // Silent fail on logout
          });
        }
        set({ user: null, token: null, refreshToken: null });
      },

      setUser: (user) => set({ user }),

      setTokens: (token, refreshToken) => set({ token, refreshToken }),

      refresh: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          get().logout();
          return;
        }

        try {
          const response = await apiClient.post('/auth/refresh', {
            refreshToken,
          });
          const { accessToken, refreshToken: newRefreshToken, user } = response.data;
          set({ token: accessToken, refreshToken: newRefreshToken, user });
        } catch {
          get().logout();
        }
      },
    }),
    {
      name: 'vinculo-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);
