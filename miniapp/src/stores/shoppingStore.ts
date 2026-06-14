import { create } from 'zustand'
import { db } from '@/utils/storage'
import type { ShoppingList, ShoppingItem, Recipe } from '@/types'
import { genId } from '@/utils/id'

const CATEGORY_MAP: Record<string, string> = {
  // 蔬菜
  白菜: '蔬菜', 菠菜: '蔬菜', 生菜: '蔬菜', 韭菜: '蔬菜', 芹菜: '蔬菜',
  西兰花: '蔬菜', 花菜: '蔬菜', 胡萝卜: '蔬菜', 白萝卜: '蔬菜', 土豆: '蔬菜',
  番茄: '蔬菜', 西红柿: '蔬菜', 黄瓜: '蔬菜', 茄子: '蔬菜', 青椒: '蔬菜',
  辣椒: '蔬菜', 洋葱: '蔬菜', 葱: '蔬菜', 姜: '蔬菜', 蒜: '蔬菜',
  蘑菇: '蔬菜', 香菇: '蔬菜', 木耳: '蔬菜', 玉米: '蔬菜', 豆芽: '蔬菜',
  南瓜: '蔬菜', 冬瓜: '蔬菜', 丝瓜: '蔬菜', 苦瓜: '蔬菜', 莴笋: '蔬菜',
  // 水果
  苹果: '水果', 香蕉: '水果', 橙子: '水果', 柠檬: '水果', 草莓: '水果',
  蓝莓: '水果', 芒果: '水果', 菠萝: '水果', 猕猴桃: '水果', 西瓜: '水果',
  // 肉类
  猪肉: '肉类', 牛肉: '肉类', 鸡肉: '肉类', 鸭肉: '肉类', 羊肉: '肉类',
  排骨: '肉类', 五花肉: '肉类', 里脊: '肉类', 鸡胸: '肉类', 鸡腿: '肉类',
  培根: '肉类', 香肠: '肉类', 火腿: '肉类',
  // 海鲜
  虾: '海鲜', 鱼: '海鲜', 螃蟹: '海鲜', 贝: '海鲜', 鱿鱼: '海鲜',
  // 蛋奶
  鸡蛋: '蛋奶', 牛奶: '蛋奶', 酸奶: '蛋奶', 奶酪: '蛋奶', 黄油: '蛋奶',
  // 调料
  盐: '调料', 糖: '调料', 酱油: '调料', 醋: '调料', 料酒: '调料',
  蚝油: '调料', 豆瓣酱: '调料', 番茄酱: '调料', 花椒: '调料', 八角: '调料',
  桂皮: '调料', 香叶: '调料', 胡椒: '调料', 五香粉: '调料', 淀粉: '调料',
  // 主食
  大米: '主食', 面粉: '主食', 面条: '主食', 馒头: '主食', 面包: '主食',
  // 干货
  红枣: '干货', 枸杞: '干货', 桂圆: '干货', 银耳: '干货', 百合: '干货',
}

function guessCategory(name: string): string {
  for (const [key, category] of Object.entries(CATEGORY_MAP)) {
    if (name.includes(key)) return category
  }
  return '其他'
}

interface ShoppingState {
  lists: ShoppingList[]
  currentListId: string | null
  loading: boolean

  loadLists: () => Promise<void>
  getCurrentList: () => ShoppingList | undefined
  setCurrentList: (id: string) => void
  createList: (sourceRecipeIds?: string[]) => Promise<string>
  deleteList: (id: string) => Promise<void>
  addItem: (name: string, amount?: number, unit?: string) => Promise<void>
  toggleItem: (itemId: string) => Promise<void>
  deleteItem: (itemId: string) => Promise<void>
  clearChecked: () => Promise<void>
  generateFromRecipes: (recipes: Recipe[]) => Promise<string>
}

export const useShoppingStore = create<ShoppingState>((set, get) => ({
  lists: [],
  currentListId: null,
  loading: false,

  loadLists: async () => {
    set({ loading: true })
    try {
      const lists = await db.getAllShoppingLists()
      set({
        lists,
        loading: false,
        currentListId: lists.length > 0 ? lists[lists.length - 1].id : null,
      })
    } catch {
      set({ loading: false })
    }
  },

  getCurrentList: () => {
    const { lists, currentListId } = get()
    return lists.find((l) => l.id === currentListId)
  },

  setCurrentList: (id) => set({ currentListId: id }),

  createList: async (sourceRecipeIds = []) => {
    const list: ShoppingList = {
      id: genId(),
      userId: '',
      sourceRecipeIds,
      items: [],
      syncStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await db.putShoppingList(list)
    set((state) => ({
      lists: [...state.lists, list],
      currentListId: list.id,
    }))
    return list.id
  },

  deleteList: async (id) => {
    const list = get().lists.find((l) => l.id === id)
    if (!list) return
    const deleted = { ...list, deletedAt: new Date().toISOString() }
    await db.putShoppingList(deleted)
    set((state) => {
      const lists = state.lists.filter((l) => l.id !== id)
      return {
        lists,
        currentListId:
          state.currentListId === id
            ? lists.length > 0
              ? lists[lists.length - 1].id
              : null
            : state.currentListId,
      }
    })
  },

  addItem: async (name, amount = 1, unit = '') => {
    const { currentListId, lists } = get()
    const list = lists.find((l) => l.id === currentListId)
    if (!list) return

    const item: ShoppingItem = {
      id: genId(),
      name,
      amount,
      unit,
      category: guessCategory(name),
      checked: false,
    }
    const updated = {
      ...list,
      items: [...list.items, item],
      updatedAt: new Date().toISOString(),
    }
    await db.putShoppingList(updated)
    set((state) => ({
      lists: state.lists.map((l) => (l.id === updated.id ? updated : l)),
    }))
  },

  toggleItem: async (itemId) => {
    const { currentListId, lists } = get()
    const list = lists.find((l) => l.id === currentListId)
    if (!list) return

    const updated = {
      ...list,
      items: list.items.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item,
      ),
      updatedAt: new Date().toISOString(),
    }
    await db.putShoppingList(updated)
    set((state) => ({
      lists: state.lists.map((l) => (l.id === updated.id ? updated : l)),
    }))
  },

  deleteItem: async (itemId) => {
    const { currentListId, lists } = get()
    const list = lists.find((l) => l.id === currentListId)
    if (!list) return

    const updated = {
      ...list,
      items: list.items.filter((item) => item.id !== itemId),
      updatedAt: new Date().toISOString(),
    }
    await db.putShoppingList(updated)
    set((state) => ({
      lists: state.lists.map((l) => (l.id === updated.id ? updated : l)),
    }))
  },

  clearChecked: async () => {
    const { currentListId, lists } = get()
    const list = lists.find((l) => l.id === currentListId)
    if (!list) return

    const updated = {
      ...list,
      items: list.items.filter((item) => !item.checked),
      updatedAt: new Date().toISOString(),
    }
    await db.putShoppingList(updated)
    set((state) => ({
      lists: state.lists.map((l) => (l.id === updated.id ? updated : l)),
    }))
  },

  generateFromRecipes: async (recipes) => {
    const ingredientMap = new Map<
      string,
      { name: string; amount: number; unit: string }
    >()

    for (const recipe of recipes) {
      for (const ing of recipe.ingredients) {
        const key = `${ing.name}_${ing.unit}`
        const existing = ingredientMap.get(key)
        if (existing) {
          existing.amount += ing.amount
        } else {
          ingredientMap.set(key, {
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
          })
        }
      }
    }

    const items: ShoppingItem[] = [...ingredientMap.values()].map((ing) => ({
      id: genId(),
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      category: guessCategory(ing.name),
      checked: false,
    }))

    const list: ShoppingList = {
      id: genId(),
      userId: '',
      sourceRecipeIds: recipes.map((r) => r.id),
      items,
      syncStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await db.putShoppingList(list)
    set((state) => ({
      lists: [...state.lists, list],
      currentListId: list.id,
    }))
    return list.id
  },
}))
