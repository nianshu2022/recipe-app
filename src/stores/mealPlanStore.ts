import { create } from 'zustand'
import type { MealPlan } from '@/types'
import { db } from '@/db'
import { generateId } from '@/utils/id'

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack'

const slotLabels: Record<MealSlot, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
}

const dayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

interface MealPlanState {
  currentPlan: MealPlan | null
  loading: boolean

  loadCurrentWeek: () => Promise<void>
  setMeal: (dayIndex: number, slot: MealSlot, recipeId: string) => Promise<void>
  setMeals: (dayIndex: number, slot: MealSlot, recipeIds: string[]) => Promise<void>
  removeMeal: (dayIndex: number, slot: MealSlot, recipeId: string) => Promise<void>
  clearPlan: () => Promise<void>
  removeRecipeFromPlan: (recipeId: string) => Promise<void>
  cleanupStaleRecipes: (validIds: Set<string>) => Promise<void>
  getWeekDates: () => Date[]
  getSlotLabel: (slot: MealSlot) => string
  getDayLabel: (index: number) => string
}

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export const useMealPlanStore = create<MealPlanState>((set, get) => ({
  currentPlan: null,
  loading: false,

  loadCurrentWeek: async () => {
    set({ loading: true })
    try {
      const plans = await db.getAllMealPlans()
      const monday = getMonday(new Date())
      const weekStart = monday.toISOString().split('T')[0]

      let plan = plans.find((p) => p.weekStart === weekStart && !p.deletedAt)
      if (!plan) {
        plan = {
          id: generateId(),
          userId: 'local',
          weekStart,
          days: Array.from({ length: 7 }, () => ({})),
          syncStatus: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        await db.putMealPlan(plan)
      }
      set({ currentPlan: plan, loading: false })
    } catch (e) {
      console.error('Failed to load meal plan:', e)
      set({ loading: false })
    }
  },

  cleanupStaleRecipes: async (validIds: Set<string>) => {
    const plan = get().currentPlan
    if (!plan) return
    let changed = false
    const days = plan.days.map((day) => {
      const updated: typeof day = {}
      for (const slot of ['breakfast', 'lunch', 'dinner', 'snack'] as const) {
        const arr = day[slot]
        if (arr) {
          const filtered = arr.filter((id) => validIds.has(id))
          if (filtered.length !== arr.length) changed = true
          if (filtered.length > 0) updated[slot] = filtered
        }
      }
      return updated
    })
    if (!changed) return
    const updated = {
      ...plan,
      days,
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending' as const,
    }
    await db.putMealPlan(updated)
    set({ currentPlan: updated })
  },

  setMeal: async (dayIndex, slot, recipeId) => {
    const plan = get().currentPlan
    if (!plan) return

    const days = [...plan.days]
    const current = days[dayIndex][slot] ?? []
    if (current.includes(recipeId)) return
    days[dayIndex] = { ...days[dayIndex], [slot]: [...current, recipeId] }

    const updated = {
      ...plan,
      days,
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending' as const,
    }
    await db.putMealPlan(updated)
    set({ currentPlan: updated })
  },

  setMeals: async (dayIndex, slot, recipeIds) => {
    const plan = get().currentPlan
    if (!plan || recipeIds.length === 0) return

    const days = [...plan.days]
    const current = days[dayIndex][slot] ?? []
    const newIds = recipeIds.filter((id) => !current.includes(id))
    if (newIds.length === 0) return
    days[dayIndex] = { ...days[dayIndex], [slot]: [...current, ...newIds] }

    const updated = {
      ...plan,
      days,
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending' as const,
    }
    await db.putMealPlan(updated)
    set({ currentPlan: updated })
  },

  removeMeal: async (dayIndex, slot, recipeId) => {
    const plan = get().currentPlan
    if (!plan) return

    const days = [...plan.days]
    const current = days[dayIndex][slot] ?? []
    days[dayIndex] = { ...days[dayIndex], [slot]: current.filter((id) => id !== recipeId) }

    const updated = {
      ...plan,
      days,
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending' as const,
    }
    await db.putMealPlan(updated)
    set({ currentPlan: updated })
  },

  clearPlan: async () => {
    const plan = get().currentPlan
    if (!plan) return
    const updated = {
      ...plan,
      days: Array.from({ length: 7 }, () => ({})),
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending' as const,
    }
    await db.putMealPlan(updated)
    set({ currentPlan: updated })
  },

  removeRecipeFromPlan: async (recipeId) => {
    const plan = get().currentPlan
    if (!plan) return
    const days = plan.days.map((day) => {
      const updated: typeof day = {}
      for (const slot of ['breakfast', 'lunch', 'dinner', 'snack'] as const) {
        const arr = day[slot]
        if (arr) {
          const filtered = arr.filter((id) => id !== recipeId)
          if (filtered.length > 0) updated[slot] = filtered
        }
      }
      return updated
    })
    if (JSON.stringify(days) === JSON.stringify(plan.days)) return
    const updated = {
      ...plan,
      days,
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending' as const,
    }
    await db.putMealPlan(updated)
    set({ currentPlan: updated })
  },

  getWeekDates: () => {
    const monday = getMonday(new Date())
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(d.getDate() + i)
      return d
    })
  },

  getSlotLabel: (slot) => slotLabels[slot],
  getDayLabel: (index) => dayLabels[index],
}))

export { slotLabels, dayLabels }
