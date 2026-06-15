import { create } from 'zustand';
import type { User, UserRole } from '@shared/types';
import { auth as authApi } from '@/services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  initialize: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,

  login: async (username: string, password: string) => {
    const result = await authApi.login(username, password);
    set({
      user: result.user,
      token: result.token,
      isAuthenticated: true,
    });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
      });
    }
  },

  fetchCurrentUser: async () => {
    try {
      const user = await authApi.me();
      set({
        user,
        isAuthenticated: true,
      });
    } catch {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
      });
    }
  },

  initialize: async () => {
    set({ loading: true });
    try {
      await useAuthStore.getState().fetchCurrentUser();
    } finally {
      set({ loading: false });
    }
  },

  hasRole: (roles: UserRole[]) => {
    const { user } = get();
    if (!user) return false;
    return roles.includes(user.role);
  },
}));
