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

const SLOT_LABELS = ['早餐', '午餐', '晚餐', '加餐'] as const
const DAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] as const

interface MealPlanState {
  plans: MealPlan[]
  currentWeekStart: string
  loading: boolean

  loadPlans: () => Promise<void>
  setCurrentWeekStart: (date: string) => void
  getCurrentPlan: () => MealPlan | undefined
  addRecipeToSlot: (
    dayIndex: number,
    slot: keyof DayPlan,
    recipeId: string,
  ) => Promise<void>
  removeRecipeFromSlot: (
    dayIndex: number,
    slot: keyof DayPlan,
    recipeId: string,
  ) => Promise<void>
  clearCurrentPlan: () => Promise<void>
  getPlannedRecipeIds: () => string[]
}

export { SLOT_LABELS, DAY_LABELS, getWeekStart }

export const useMealPlanStore = create<MealPlanState>((set, get) => ({
  plans: [],
  currentWeekStart: getWeekStart(new Date()),
  loading: false,

  loadPlans: async () => {
    set({ loading: true })
    try {
      const plans = await db.getAllMealPlans()
      set({ plans, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  setCurrentWeekStart: (date) => set({ currentWeekStart: date }),

  getCurrentPlan: () => {
    const { plans, currentWeekStart } = get()
    return plans.find((p) => p.weekStart === currentWeekStart)
  },

  addRecipeToSlot: async (dayIndex, slot, recipeId) => {
    const { plans, currentWeekStart } = get()
    let plan = plans.find((p) => p.weekStart === currentWeekStart)

    if (!plan) {
      plan = {
        id: `mp_${currentWeekStart}`,
        userId: '',
        weekStart: currentWeekStart,
        days: Array(7).fill({ breakfast: [], lunch: [], dinner: [], snack: [] }),
        syncStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }

    const days = [...plan.days]
    const day = { ...days[dayIndex] }
    const current = (day[slot] as string[]) || []
    if (!current.includes(recipeId)) {
      ;(day as Record<string, string[]>)[slot] = [...current, recipeId]
    }
    days[dayIndex] = day

    const updated = { ...plan, days, updatedAt: new Date().toISOString() }
    await db.putMealPlan(updated)
    set((state) => ({
      plans: state.plans.some((p) => p.id === updated.id)
        ? state.plans.map((p) => (p.id === updated.id ? updated : p))
        : [...state.plans, updated],
    }))
  },

  removeRecipeFromSlot: async (dayIndex, slot, recipeId) => {
    const { plans, currentWeekStart } = get()
    const plan = plans.find((p) => p.weekStart === currentWeekStart)
    if (!plan) return

    const days = [...plan.days]
    const day = { ...days[dayIndex] }
    const current = (day[slot] as string[]) || []
    ;(day as Record<string, string[]>)[slot] = current.filter(
      (id) => id !== recipeId,
    )
    days[dayIndex] = day

    const updated = { ...plan, days, updatedAt: new Date().toISOString() }
    await db.putMealPlan(updated)
    set((state) => ({
      plans: state.plans.map((p) => (p.id === updated.id ? updated : p)),
    }))
  },

  clearCurrentPlan: async () => {
    const { plans, currentWeekStart } = get()
    const plan = plans.find((p) => p.weekStart === currentWeekStart)
    if (!plan) return

    const updated = {
      ...plan,
      days: Array(7).fill({ breakfast: [], lunch: [], dinner: [], snack: [] }),
      updatedAt: new Date().toISOString(),
    }
    await db.putMealPlan(updated)
    set((state) => ({
      plans: state.plans.map((p) => (p.id === updated.id ? updated : p)),
    }))
  },

  getPlannedRecipeIds: () => {
    const plan = get().getCurrentPlan()
    if (!plan) return []
    const ids = new Set<string>()
    for (const day of plan.days) {
      for (const slot of ['breakfast', 'lunch', 'dinner', 'snack'] as const) {
        for (const id of (day[slot] as string[]) || []) {
          ids.add(id)
        }
      }
    }
    return [...ids]
  },
}))
