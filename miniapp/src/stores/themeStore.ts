import { create } from 'zustand'
import Taro from '@tarojs/taro'

type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  loadTheme: () => void
  setTheme: (theme: Theme) => void
}

const THEME_KEY = 'app_theme'

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'light',

  loadTheme: () => {
    try {
      const saved = Taro.getStorageSync(THEME_KEY) as Theme
      if (saved) set({ theme: saved })
    } catch {}
  },

  setTheme: (theme) => {
    Taro.setStorageSync(THEME_KEY, theme)
    set({ theme })
  },
}))
