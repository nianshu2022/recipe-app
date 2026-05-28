import { create } from 'zustand'
import type { MealPlan } from '@/types'
import { db } from '@/utils/storage'
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
  setMeal: (dayIndex: number, slot: MealSlot, recipeId: string | undefined) => Promise<void>
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

  setMeal: async (dayIndex, slot, recipeId) => {
    const plan = get().currentPlan
    if (!plan) return

    const days = [...plan.days]
    days[dayIndex] = { ...days[dayIndex], [slot]: recipeId }

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
    let changed = false
    const days = plan.days.map((day) => {
      const updated = { ...day }
      for (const slot of ['breakfast', 'lunch', 'dinner', 'snack'] as const) {
        if (updated[slot] === recipeId) {
          delete updated[slot]
          changed = true
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

  cleanupStaleRecipes: async (validIds: Set<string>) => {
    const plan = get().currentPlan
    if (!plan) return
    let changed = false
    const days = plan.days.map((day) => {
      const updated = { ...day }
      for (const slot of ['breakfast', 'lunch', 'dinner', 'snack'] as const) {
        if (updated[slot] && !validIds.has(updated[slot]!)) {
          delete updated[slot]
          changed = true
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
