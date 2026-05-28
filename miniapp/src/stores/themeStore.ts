import { create } from 'zustand'
import Taro from '@tarojs/taro'

type Theme = 'light' | 'dark' | 'system'

function getSystemTheme(): 'light' | 'dark' {
  try {
    const info = Taro.getAppBaseInfo()
    return info.theme === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  return theme === 'system' ? getSystemTheme() : theme
}

interface ThemeState {
  theme: Theme
  resolved: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}

export const useThemeStore = create<ThemeState>((set) => {
  let saved: Theme = 'system'
  try {
    saved = (Taro.getStorageSync('theme') as Theme) || 'system'
  } catch {
    // ignore
  }
  const resolved = resolveTheme(saved)

  return {
    theme: saved,
    resolved,
    setTheme: (theme) => {
      Taro.setStorageSync('theme', theme)
      const r = resolveTheme(theme)
      set({ theme, resolved: r })
    },
  }
})
