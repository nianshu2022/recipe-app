import { create } from 'zustand'
import type { FridgeItem } from '@/types'
import { db } from '@/db'
import { generateId } from '@/utils/id'

interface FridgeState {
  items: FridgeItem[]
  loading: boolean

  loadItems: () => Promise<void>
  addItem: (item: Omit<FridgeItem, 'id' | 'userId' | 'syncStatus' | 'createdAt' | 'updatedAt'>) => Promise<FridgeItem>
  updateItem: (id: string, updates: Partial<FridgeItem>) => Promise<void>
  deleteItem: (id: string) => Promise<void>

  getExpiringSoon: (days?: number) => FridgeItem[]
  getExpired: () => FridgeItem[]
  getByCategory: (category: string) => FridgeItem[]
}

export const useFridgeStore = create<FridgeState>((set, get) => ({
  items: [],
  loading: false,

  loadItems: async () => {
    set({ loading: true })
    try {
      const items = await db.getAllFridgeItems()
      set({ items: items.filter((i) => !i.deletedAt), loading: false })
    } catch (e) {
      console.error('Failed to load fridge items:', e)
      set({ loading: false })
    }
  },

  addItem: async (data) => {
    const now = new Date().toISOString()
    const item: FridgeItem = {
      id: generateId(),
      userId: 'local',
      syncStatus: 'pending',
      createdAt: now,
      updatedAt: now,
      ...data,
    }
    await db.putFridgeItem(item)
    set((s) => ({ items: [...s.items, item] }))
    return item
  },

  updateItem: async (id, updates) => {
    const item = get().items.find((i) => i.id === id)
    if (!item) return
    const updated = { ...item, ...updates, updatedAt: new Date().toISOString(), syncStatus: 'pending' as const }
    await db.putFridgeItem(updated)
    set((s) => ({ items: s.items.map((i) => (i.id === id ? updated : i)) }))
  },

  deleteItem: async (id) => {
    const item = get().items.find((i) => i.id === id)
    if (!item) return
    const deleted = { ...item, deletedAt: new Date().toISOString(), syncStatus: 'pending' as const, updatedAt: new Date().toISOString() }
    await db.putFridgeItem(deleted)
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }))
  },

  getExpiringSoon: (days = 3) => {
    const now = new Date()
    const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
    return get().items.filter((i) => {
      if (!i.expiryDate) return false
      const exp = new Date(i.expiryDate)
      return exp >= now && exp <= threshold
    })
  },

  getExpired: () => {
    const now = new Date()
    return get().items.filter((i) => {
      if (!i.expiryDate) return false
      return new Date(i.expiryDate) < now
    })
  },

  getByCategory: (category) => {
    return get().items.filter((i) => i.category === category)
  },
}))
