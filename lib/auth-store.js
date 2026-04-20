// ============================================================
// HELIOS MOBILE — AUTH STORE
// ============================================================

import { create } from 'zustand';
import { api, setAccessToken, setRefreshToken, getAccessToken } from './api';

export const useAuthStore = create((set, get) => ({
  user:            null,
  isAuthenticated: false,
  isLoading:       true,
  error:           null,

  // ── Login ──
  login: async (email, password) => {
    set({ error: null, isLoading: true });
    try {
      const data = await api.auth.login(email, password);
      await setAccessToken(data.accessToken);
      await setRefreshToken(data.refreshToken);
      set({
        user:            data.user,
        isAuthenticated: true,
        isLoading:       false,
        error:           null,
      });
      return data;
    } catch (err) {
      set({ isLoading: false, error: err.message || 'Login failed' });
      throw err;
    }
  },

  // ── Logout ──
  logout: async () => {
    try { await api.auth.logout(); } catch {}
    await setAccessToken(null);
    await setRefreshToken(null);
    set({ user: null, isAuthenticated: false, isLoading: false, error: null });
  },

  // ── Restore session ──
  restoreSession: async () => {
    set({ isLoading: true });
    try {
      const token = await getAccessToken();
      if (!token) { set({ isLoading: false }); return; }
      const user = await api.auth.me();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') {
        await setAccessToken(null);
        await setRefreshToken(null);
      }
      set({ isLoading: false, isAuthenticated: false });
    }
  },

  clearError: () => set({ error: null }),
}));
