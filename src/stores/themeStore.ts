import { create } from 'zustand'

type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  resolved: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  return theme === 'system' ? getSystemTheme() : theme
}

function applyTheme(resolved: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}

export const useThemeStore = create<ThemeState>((set) => {
  const saved = (localStorage.getItem('theme') as Theme) || 'system'
  const resolved = resolveTheme(saved)

  // Apply on init
  applyTheme(resolved)

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const current = useThemeStore.getState().theme
    if (current === 'system') {
      const r = getSystemTheme()
      applyTheme(r)
      useThemeStore.setState({ resolved: r })
    }
  })

  return {
    theme: saved,
    resolved,
    setTheme: (theme) => {
      localStorage.setItem('theme', theme)
      const resolved = resolveTheme(theme)
      applyTheme(resolved)
      set({ theme, resolved })
    },
  }
})
