import { create } from 'zustand'
import type { MealPlanTemplate, DayPlan } from '@/types'
import { db } from '@/db'
import { generateId } from '@/utils/id'

interface TemplateState {
  templates: MealPlanTemplate[]
  loading: boolean

  loadTemplates: () => Promise<void>
  saveTemplate: (name: string, days: DayPlan[]) => Promise<void>
  deleteTemplate: (id: string) => Promise<void>
  getTemplateDays: (id: string) => DayPlan[] | null
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  templates: [],
  loading: false,

  loadTemplates: async () => {
    set({ loading: true })
    try {
      const templates = await db.getAllMealPlanTemplates()
      set({ templates: templates.filter((t) => !t.deletedAt), loading: false })
    } catch (e) {
      console.error('Failed to load templates:', e)
      set({ loading: false })
    }
  },

  saveTemplate: async (name, days) => {
    const now = new Date().toISOString()
    const template: MealPlanTemplate = {
      id: generateId(),
      userId: 'local',
      name,
      days: JSON.parse(JSON.stringify(days)),
      syncStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    }
    await db.putMealPlanTemplate(template)
    set((state) => ({ templates: [...state.templates, template] }))
  },

  deleteTemplate: async (id) => {
    const now = new Date().toISOString()
    const template = get().templates.find((t) => t.id === id)
    if (template) {
      const deleted = { ...template, deletedAt: now, updatedAt: now }
      await db.putMealPlanTemplate(deleted)
      set((state) => ({
        templates: state.templates.filter((t) => t.id !== id),
      }))
    }
  },

  getTemplateDays: (id) => {
    const template = get().templates.find((t) => t.id === id)
    return template ? JSON.parse(JSON.stringify(template.days)) : null
  },
}))
