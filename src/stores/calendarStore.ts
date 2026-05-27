import { create } from 'zustand'
import type { CookingRecord } from '@/types'
import { db } from '@/db'
import { generateId } from '@/utils/id'

interface CalendarState {
  records: CookingRecord[]
  loading: boolean
  selectedDate: string | null

  loadRecords: () => Promise<void>
  addRecord: (recipeId: string, servings: number, notes?: string) => Promise<void>
  deleteRecord: (id: string) => Promise<void>
  setSelectedDate: (date: string | null) => void
  getRecordsForDate: (date: string) => CookingRecord[]
  getRecordsForMonth: (year: number, month: number) => CookingRecord[]
  getMonthStats: (year: number, month: number) => {
    totalCooked: number
    uniqueRecipes: number
    topRecipe: string | null
    cookingDays: number
  }
  getDatesWithRecords: (year: number, month: number) => Set<string>
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  records: [],
  loading: false,
  selectedDate: null,

  loadRecords: async () => {
    set({ loading: true })
    try {
      const records = await db.getAllCookingRecords()
      set({ records: records.filter((r) => !r.deletedAt), loading: false })
    } catch (e) {
      console.error('Failed to load cooking records:', e)
      set({ loading: false })
    }
  },

  addRecord: async (recipeId, servings, notes) => {
    const now = new Date()
    const record: CookingRecord = {
      id: generateId(),
      userId: 'local',
      recipeId,
      date: now.toISOString().split('T')[0],
      servings,
      notes,
      syncStatus: 'pending',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
    await db.putCookingRecord(record)
    set((s) => ({ records: [...s.records, record] }))
  },

  deleteRecord: async (id) => {
    const record = get().records.find((r) => r.id === id)
    if (!record) return
    const deleted = { ...record, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    await db.putCookingRecord(deleted)
    set((s) => ({ records: s.records.filter((r) => r.id !== id) }))
  },

  setSelectedDate: (date) => set({ selectedDate: date }),

  getRecordsForDate: (date) => {
    return get().records.filter((r) => r.date === date)
  },

  getRecordsForMonth: (year, month) => {
    const prefix = `${year}-${String(month).padStart(2, '0')}`
    return get().records.filter((r) => r.date.startsWith(prefix))
  },

  getMonthStats: (year, month) => {
    const records = get().getRecordsForMonth(year, month)
    const recipeCounts = new Map<string, number>()
    const days = new Set<string>()

    for (const r of records) {
      recipeCounts.set(r.recipeId, (recipeCounts.get(r.recipeId) ?? 0) + 1)
      days.add(r.date)
    }

    let topRecipe: string | null = null
    let maxCount = 0
    for (const [recipeId, count] of recipeCounts) {
      if (count > maxCount) {
        maxCount = count
        topRecipe = recipeId
      }
    }

    return {
      totalCooked: records.length,
      uniqueRecipes: recipeCounts.size,
      topRecipe,
      cookingDays: days.size,
    }
  },

  getDatesWithRecords: (year, month) => {
    const records = get().getRecordsForMonth(year, month)
    return new Set(records.map((r) => r.date))
  },
}))
