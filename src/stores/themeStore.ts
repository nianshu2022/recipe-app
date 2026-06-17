import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => {
      const mql = window.matchMedia('(prefers-color-scheme: dark)')
      const onChange = () => {
        const current = useThemeStore.getState().theme
        if (current === 'system') {
          const r = getSystemTheme()
          applyTheme(r)
          useThemeStore.setState({ resolved: r })
        }
      }
      mql.addEventListener('change', onChange)

      return {
        theme: 'system' as Theme,
        resolved: getSystemTheme(),
        setTheme: (theme) => {
          const resolved = resolveTheme(theme)
          applyTheme(resolved)
          set({ theme, resolved })
        },
      }
    },
    {
      name: 'theme-storage',
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            const resolved = resolveTheme(state.theme)
            applyTheme(resolved)
            state.resolved = resolved
          }
        }
      },
    },
  ),
)
