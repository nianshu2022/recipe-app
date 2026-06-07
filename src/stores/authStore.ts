import { create } from 'zustand'
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  isLoggedIn as checkLoggedIn,
  getCurrentUser,
  fullSync,
} from '@/utils/sync'

interface AuthState {
  isLoggedIn: boolean
  user: { id: string; email: string; nickname: string } | null
  loading: boolean

  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, nickname?: string) => Promise<boolean>
  logout: () => void
  syncNow: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isLoggedIn: checkLoggedIn(),
  user: getCurrentUser(),
  loading: false,

  login: async (email, password) => {
    set({ loading: true })
    try {
      const ok = await apiLogin(email, password)
      if (ok) {
        set({ isLoggedIn: true, user: getCurrentUser(), loading: false })
        // Auto-sync after login
        try { await fullSync() } catch (e) { console.warn('Post-login sync failed:', e) }
      } else {
        set({ loading: false })
      }
      return ok
    } catch (e) {
      console.error('Login error:', e)
      set({ loading: false })
      return false
    }
  },

  register: async (email, password, nickname) => {
    set({ loading: true })
    try {
      const ok = await apiRegister(email, password, nickname)
      if (ok) {
        set({ isLoggedIn: true, user: getCurrentUser(), loading: false })
      } else {
        set({ loading: false })
      }
      return ok
    } catch (e) {
      console.error('Register error:', e)
      set({ loading: false })
      return false
    }
  },

  logout: () => {
    apiLogout()
    set({ isLoggedIn: false, user: null })
  },

  syncNow: async () => {
    if (!get().isLoggedIn) return
    try {
      await fullSync()
    } catch (e) {
      console.error('Sync failed:', e)
    }
  },
}))
