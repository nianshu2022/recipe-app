import { create } from 'zustand'
import type { FridgeItem } from '@/types'
import { db } from '@/db'
import { generateId } from '@/utils/id'

const categoryPresets: Record<string, string[]> = {
  '蔬菜': ['番茄', '土豆', '胡萝卜', '洋葱', '青椒', '黄瓜', '白菜', '生菜', '西兰花', '芹菜', '蘑菇'],
  '肉类': ['猪肉', '牛肉', '鸡肉', '鸡胸肉', '排骨', '五花肉', '羊肉'],
  '海鲜': ['虾', '虾仁', '鱼', '三文鱼', '螃蟹', '蛤蜊'],
  '蛋奶': ['鸡蛋', '牛奶', '酸奶', '黄油', '奶酪'],
  '调料': ['盐', '糖', '生抽', '老抽', '醋', '料酒', '蚝油', '食用油'],
  '主食': ['米饭', '面条', '面粉', '面包', '馒头'],
  '豆制品': ['豆腐', '豆干', '腐竹'],
  '干货': ['花生', '红枣', '枸杞', '木耳', '粉丝'],
  '水果': ['苹果', '香蕉', '橙子', '葡萄', '草莓'],
}

interface FridgeState {
  items: FridgeItem[]
  loading: boolean
  categoryFilter: string | null

  loadItems: () => Promise<void>
  addItem: (name: string, amount: number, unit: string, category?: string, expiryDays?: number) => Promise<void>
  updateItem: (id: string, updates: Partial<FridgeItem>) => Promise<void>
  removeItem: (id: string) => Promise<void>
  consumeItem: (id: string, amount?: number) => Promise<void>
  setCategoryFilter: (cat: string | null) => void
  getExpiringSoon: (days?: number) => FridgeItem[]
  getExpired: () => FridgeItem[]
  getFilteredItems: () => FridgeItem[]
  getCategoryCounts: () => Record<string, number>
  getRecommendations: () => string[]
}

function guessCategory(name: string): string {
  for (const [cat, keywords] of Object.entries(categoryPresets)) {
    if (keywords.some((kw) => name.includes(kw))) return cat
  }
  return '其他'
}

export const useFridgeStore = create<FridgeState>((set, get) => ({
  items: [],
  loading: false,
  categoryFilter: null,

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

  addItem: async (name, amount, unit, category, expiryDays) => {
    const now = new Date()
    const item: FridgeItem = {
      id: generateId(),
      userId: 'local',
      name,
      amount,
      unit,
      category: category ?? guessCategory(name),
      purchaseDate: now.toISOString(),
      expiryDate: expiryDays
        ? new Date(now.getTime() + expiryDays * 86400000).toISOString()
        : undefined,
      syncStatus: 'pending',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
    await db.putFridgeItem(item)
    set((s) => ({ items: [...s.items, item] }))
  },

  updateItem: async (id, updates) => {
    const item = get().items.find((i) => i.id === id)
    if (!item) return
    const updated = { ...item, ...updates, updatedAt: new Date().toISOString(), syncStatus: 'pending' as const }
    await db.putFridgeItem(updated)
    set((s) => ({ items: s.items.map((i) => (i.id === id ? updated : i)) }))
  },

  removeItem: async (id) => {
    const item = get().items.find((i) => i.id === id)
    if (!item) return
    const deleted = { ...item, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    await db.putFridgeItem(deleted)
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }))
  },

  consumeItem: async (id, amount) => {
    const item = get().items.find((i) => i.id === id)
    if (!item) return
    if (amount && item.amount > amount) {
      await get().updateItem(id, { amount: item.amount - amount })
    } else {
      await get().removeItem(id)
    }
  },

  setCategoryFilter: (cat) => set({ categoryFilter: cat }),

  getExpiringSoon: (days = 3) => {
    const threshold = new Date(Date.now() + days * 86400000)
    return get().items.filter((i) => {
      if (!i.expiryDate) return false
      return new Date(i.expiryDate) <= threshold && new Date(i.expiryDate) > new Date()
    })
  },

  getExpired: () => {
    return get().items.filter((i) => {
      if (!i.expiryDate) return false
      return new Date(i.expiryDate) <= new Date()
    })
  },

  getFilteredItems: () => {
    const { items, categoryFilter } = get()
    if (!categoryFilter) return items
    return items.filter((i) => i.category === categoryFilter)
  },

  getCategoryCounts: () => {
    const counts: Record<string, number> = {}
    for (const item of get().items) {
      counts[item.category] = (counts[item.category] ?? 0) + 1
    }
    return counts
  },

  getRecommendations: () => {
    const itemNames = get().items.map((i) => i.name)
    // Simple recommendation based on what's in the fridge
    const recommendations: string[] = []
    if (itemNames.some((n) => n.includes('鸡蛋'))) recommendations.push('番茄炒蛋')
    if (itemNames.some((n) => n.includes('鸡胸肉'))) recommendations.push('宫保鸡丁')
    if (itemNames.some((n) => n.includes('豆腐'))) recommendations.push('麻婆豆腐')
    if (itemNames.some((n) => n.includes('虾'))) recommendations.push('清炒虾仁')
    if (itemNames.some((n) => n.includes('排骨'))) recommendations.push('红烧排骨')
    return recommendations.slice(0, 3)
  },
}))
