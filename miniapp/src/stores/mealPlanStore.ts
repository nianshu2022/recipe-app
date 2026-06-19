import { create } from 'zustand'
import { db } from '@/utils/storage'
import type { MealPlan, DayPlan } from '@/types'

function getWeekStart(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

const SLOT_LABELS = ['早餐', '午餐', '晚餐', '加餐'] as const
const DAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] as const

type SlotKey = keyof DayPlan

interface MealPlanState {
  currentPlan: MealPlan | null
  loading: boolean

  loadCurrentWeek: () => Promise<void>
  setMeals: (dayIndex: number, slot: SlotKey, recipeIds: string[]) => Promise<void>
  removeMeal: (dayIndex: number, slot: SlotKey, recipeId: string) => Promise<void>
  clearPlan: () => Promise<void>
  getWeekDates: () => Date[]
}

export { SLOT_LABELS, DAY_LABELS, getWeekStart }

export const useMealPlanStore = create<MealPlanState>((set, get) => ({
  currentPlan: null,
  loading: false,

  loadCurrentWeek: async () => {
    set({ loading: true })
    try {
      const plans = await db.getAllMealPlans()
      const monday = getMonday(new Date())
      const weekStart = monday.toISOString().split('T')[0]

      let plan = plans.find((p) => p.weekStart === weekStart)
      if (!plan) {
        plan = {
          id: `mp_${weekStart}`,
          userId: '',
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

  setMeals: async (dayIndex, slot, recipeIds) => {
    const plan = get().currentPlan
    if (!plan || recipeIds.length === 0) return

    const days = [...plan.days]
    const current = (days[dayIndex][slot] as string[]) || []
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
    const current = (days[dayIndex][slot] as string[]) || []
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

  getWeekDates: () => {
    const monday = getMonday(new Date())
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(d.getDate() + i)
      return d
    })
  },
}))
