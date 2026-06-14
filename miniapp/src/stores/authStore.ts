import { create } from 'zustand'
import Taro from '@tarojs/taro'
import type { User } from '@/types'

const API_BASE = 'https://recipe-api.nianshu2022.cn'
const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean

  loadAuth: () => void
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  register: (email: string, password: string, nickname: string) => Promise<{ success: boolean; message: string }>
  logout: () => void
  getHeaders: () => Record<string, string>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  loading: false,

  loadAuth: () => {
    try {
      const token = Taro.getStorageSync(TOKEN_KEY)
      const user = Taro.getStorageSync(USER_KEY)
      if (token && user) {
        set({ token, user })
      }
    } catch {}
  },

  login: async (email, password) => {
    set({ loading: true })
    try {
      const res = await new Promise<{ statusCode: number; data: any }>((resolve, reject) => {
        Taro.request({
          url: `${API_BASE}/auth/login`,
          method: 'POST',
          data: { email, password },
          header: { 'Content-Type': 'application/json' },
          success: resolve,
          fail: reject,
        })
      })

      if (res.statusCode === 200 && res.data.token) {
        const { token, user } = res.data
        Taro.setStorageSync(TOKEN_KEY, token)
        Taro.setStorageSync(USER_KEY, user)
        set({ token, user, loading: false })
        return { success: true, message: '登录成功' }
      }
      set({ loading: false })
      return { success: false, message: res.data.message || '登录失败' }
    } catch (e) {
      set({ loading: false })
      return { success: false, message: `登录失败: ${e instanceof Error ? e.message : '网络错误'}` }
    }
  },

  register: async (email, password, nickname) => {
    set({ loading: true })
    try {
      const res = await new Promise<{ statusCode: number; data: any }>((resolve, reject) => {
        Taro.request({
          url: `${API_BASE}/auth/register`,
          method: 'POST',
          data: { email, password, nickname },
          header: { 'Content-Type': 'application/json' },
          success: resolve,
          fail: reject,
        })
      })

      if (res.statusCode === 200 && res.data.token) {
        const { token, user } = res.data
        Taro.setStorageSync(TOKEN_KEY, token)
        Taro.setStorageSync(USER_KEY, user)
        set({ token, user, loading: false })
        return { success: true, message: '注册成功' }
      }
      set({ loading: false })
      return { success: false, message: res.data.message || '注册失败' }
    } catch (e) {
      set({ loading: false })
      return { success: false, message: `注册失败: ${e instanceof Error ? e.message : '网络错误'}` }
    }
  },

  logout: () => {
    Taro.removeStorageSync(TOKEN_KEY)
    Taro.removeStorageSync(USER_KEY)
    set({ user: null, token: null })
  },

  getHeaders: () => {
    const { token } = get()
    return token ? { Authorization: `Bearer ${token}` } : {}
  },
}))
