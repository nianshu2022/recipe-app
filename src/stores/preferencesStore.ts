import { create } from 'zustand'
import type { MealPreferences, Category, Difficulty } from '@/types'

const STORAGE_KEY = 'recipe-app-preferences'

function getStoredPreferences(): MealPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {
    servings: 2,
    excludeCategories: [],
    maxDifficulty: 'medium',
    maxDuration: 60,
    preferCold: true,
    preferSoup: true,
  }
}

interface PreferencesState {
  preferences: MealPreferences

  updateServings: (servings: number) => void
  toggleExcludeCategory: (category: Category) => void
  setMaxDifficulty: (difficulty: Difficulty) => void
  setMaxDuration: (duration: number) => void
  setPreferCold: (prefer: boolean) => void
  setPreferSoup: (prefer: boolean) => void
  resetPreferences: () => void
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  preferences: getStoredPreferences(),

  updateServings: (servings) => {
    const updated = { ...get().preferences, servings: Math.max(1, Math.min(10, servings)) }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    set({ preferences: updated })
  },

  toggleExcludeCategory: (category) => {
    const current = get().preferences.excludeCategories
    const updated = current.includes(category)
      ? current.filter((c) => c !== category)
      : [...current, category]
    const prefs = { ...get().preferences, excludeCategories: updated }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
    set({ preferences: prefs })
  },

  setMaxDifficulty: (difficulty) => {
    const prefs = { ...get().preferences, maxDifficulty: difficulty }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
    set({ preferences: prefs })
  },

  setMaxDuration: (duration) => {
    const prefs = { ...get().preferences, maxDuration: duration }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
    set({ preferences: prefs })
  },

  setPreferCold: (prefer) => {
    const prefs = { ...get().preferences, preferCold: prefer }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
    set({ preferences: prefs })
  },

  setPreferSoup: (prefer) => {
    const prefs = { ...get().preferences, preferSoup: prefer }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
    set({ preferences: prefs })
  },

  resetPreferences: () => {
    const defaults: MealPreferences = {
      servings: 2,
      excludeCategories: [],
      maxDifficulty: 'medium',
      maxDuration: 60,
      preferCold: true,
      preferSoup: true,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults))
    set({ preferences: defaults })
  },
}))
