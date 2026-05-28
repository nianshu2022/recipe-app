import { create } from 'zustand'
import type { ShoppingList, ShoppingItem } from '@/types'
import { db } from '@/utils/storage'
import { generateId } from '@/utils/id'
import { scaleIngredients } from '@/utils/scaling'

const categoryMap: Record<string, string> = {
  '番茄': '蔬菜', '西红柿': '蔬菜', '土豆': '蔬菜', '胡萝卜': '蔬菜', '洋葱': '蔬菜',
  '青椒': '蔬菜', '红椒': '蔬菜', '大蒜': '蔬菜', '生姜': '蔬菜', '大葱': '蔬菜',
  '小葱': '蔬菜', '白菜': '蔬菜', '生菜': '蔬菜', '黄瓜': '蔬菜', '茄子': '蔬菜',
  '西兰花': '蔬菜', '花菜': '蔬菜', '芹菜': '蔬菜', '韭菜': '蔬菜', '菠菜': '蔬菜',
  '豆芽': '蔬菜', '蘑菇': '蔬菜', '香菇': '蔬菜', '木耳': '蔬菜', '玉米': '蔬菜',
  '南瓜': '蔬菜', '冬瓜': '蔬菜', '丝瓜': '蔬菜', '苦瓜': '蔬菜',
  '猪肉': '肉类', '牛肉': '肉类', '羊肉': '肉类', '鸡肉': '肉类', '鸡胸肉': '肉类',
  '鸡腿': '肉类', '鸡翅': '肉类', '排骨': '肉类', '五花肉': '肉类', '里脊': '肉类',
  '肉末': '肉类', '肉丝': '肉类', '腊肉': '肉类', '培根': '肉类', '香肠': '肉类',
  '虾': '海鲜', '虾仁': '海鲜', '鱼': '海鲜', '鲈鱼': '海鲜', '三文鱼': '海鲜',
  '螃蟹': '海鲜', '蛤蜊': '海鲜', '鱿鱼': '海鲜', '带鱼': '海鲜',
  '鸡蛋': '蛋奶', '鸭蛋': '蛋奶', '牛奶': '蛋奶', '酸奶': '蛋奶', '奶酪': '蛋奶',
  '黄油': '蛋奶', '淡奶油': '蛋奶',
  '盐': '调料', '糖': '调料', '生抽': '调料', '老抽': '调料', '醋': '调料',
  '料酒': '调料', '蚝油': '调料', '豆瓣酱': '调料', '番茄酱': '调料', '芝麻油': '调料',
  '花椒': '调料', '八角': '调料', '桂皮': '调料', '干辣椒': '调料', '胡椒': '调料',
  '五香粉': '调料', '淀粉': '调料', '酱油': '调料',
  '食用油': '调料', '花生油': '调料', '橄榄油': '调料', '菜籽油': '调料',
  '米饭': '主食', '面条': '主食', '面粉': '主食', '饺子皮': '主食', '面包': '主食',
  '馒头': '主食', '年糕': '主食', '粉丝': '主食', '米粉': '主食',
  '豆腐': '豆制品', '豆干': '豆制品', '腐竹': '豆制品', '花生': '干货', '芝麻': '干货',
  '红枣': '干货', '枸杞': '干货', '桂圆': '干货',
}

function guessCategory(name: string): string {
  for (const [keyword, cat] of Object.entries(categoryMap)) {
    if (name.includes(keyword)) return cat
  }
  return '其他'
}

interface ShoppingState {
  lists: ShoppingList[]
  currentListId: string | null
  loading: boolean

  loadLists: () => Promise<void>
  generateFromRecipe: (recipeId: string, servings?: number) => Promise<ShoppingList | null>
  generateFromRecipes: (recipeIds: string[]) => Promise<ShoppingList | null>
  generateFromRecipesWithIngredients: (recipeIds: string[], recipes: { id: string; ingredients: { name: string; amount: number; unit: string }[] }[]) => Promise<ShoppingList | null>
  toggleItem: (listId: string, itemId: string) => Promise<void>
  addItem: (listId: string, name: string, amount?: number, unit?: string) => Promise<void>
  removeItem: (listId: string, itemId: string) => Promise<void>
  updateItem: (listId: string, itemId: string, updates: Partial<ShoppingItem>) => Promise<void>
  clearChecked: (listId: string) => Promise<void>
  deleteList: (listId: string) => Promise<void>
  setCurrentList: (id: string | null) => void
  getCurrentList: () => ShoppingList | null
}

export const useShoppingStore = create<ShoppingState>((set, get) => ({
  lists: [],
  currentListId: null,
  loading: false,

  loadLists: async () => {
    set({ loading: true })
    try {
      const lists = await db.getAllShoppingLists()
      set({ lists: lists.filter((l) => !l.deletedAt), loading: false })
    } catch (e) {
      console.error('Failed to load shopping lists:', e)
      set({ loading: false })
    }
  },

  generateFromRecipe: async (recipeId, targetServings) => {
    const recipes = await db.getAllRecipes()
    const recipe = recipes.find((r) => r.id === recipeId)
    if (!recipe) return null

    let ingredientsToUse = recipe.ingredients
    if (targetServings && targetServings !== recipe.servings) {
      ingredientsToUse = scaleIngredients(recipe.ingredients, recipe.servings, targetServings)
    }

    return get().generateFromRecipesWithIngredients([recipeId], [{ ...recipe, ingredients: ingredientsToUse }])
  },

  generateFromRecipes: async (recipeIds) => {
    return get().generateFromRecipesWithIngredients(recipeIds, (await db.getAllRecipes()).filter((r) => recipeIds.includes(r.id)))
  },

  generateFromRecipesWithIngredients: async (recipeIds, matchedRecipes) => {
    if (matchedRecipes.length === 0) return null

    const merged = new Map<string, { name: string; amount: number; unit: string; category: string }>()

    for (const recipe of matchedRecipes) {
      for (const ing of recipe.ingredients) {
        const key = `${ing.name}_${ing.unit}`
        const existing = merged.get(key)
        if (existing) {
          existing.amount += ing.amount
        } else {
          merged.set(key, {
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
            category: guessCategory(ing.name),
          })
        }
      }
    }

    const items: ShoppingItem[] = Array.from(merged.values()).map((m) => ({
      id: generateId(),
      name: m.name,
      amount: Math.round(m.amount * 100) / 100,
      unit: m.unit,
      category: m.category,
      checked: false,
    }))

    items.sort((a, b) => a.category.localeCompare(b.category))

    const now = new Date().toISOString()
    const list: ShoppingList = {
      id: generateId(),
      userId: 'local',
      sourceRecipeIds: recipeIds,
      items,
      syncStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    }

    await db.putShoppingList(list)
    set((s) => ({ lists: [...s.lists, list], currentListId: list.id }))
    return list
  },

  toggleItem: async (listId, itemId) => {
    const list = get().lists.find((l) => l.id === listId)
    if (!list) return
    const items = list.items.map((item) =>
      item.id === itemId ? { ...item, checked: !item.checked } : item,
    )
    items.sort((a, b) => (a.checked === b.checked ? 0 : a.checked ? 1 : -1))
    const updated = { ...list, items, updatedAt: new Date().toISOString() }
    await db.putShoppingList(updated)
    set((s) => ({ lists: s.lists.map((l) => (l.id === listId ? updated : l)) }))
  },

  addItem: async (listId, name, amount = 0, unit = '') => {
    const list = get().lists.find((l) => l.id === listId)
    if (!list) return
    const newItem: ShoppingItem = {
      id: generateId(),
      name,
      amount,
      unit,
      category: guessCategory(name),
      checked: false,
    }
    const items = [...list.items, newItem]
    const updated = { ...list, items, updatedAt: new Date().toISOString() }
    await db.putShoppingList(updated)
    set((s) => ({ lists: s.lists.map((l) => (l.id === listId ? updated : l)) }))
  },

  removeItem: async (listId, itemId) => {
    const list = get().lists.find((l) => l.id === listId)
    if (!list) return
    const items = list.items.filter((i) => i.id !== itemId)
    const updated = { ...list, items, updatedAt: new Date().toISOString() }
    await db.putShoppingList(updated)
    set((s) => ({ lists: s.lists.map((l) => (l.id === listId ? updated : l)) }))
  },

  updateItem: async (listId, itemId, updates) => {
    const list = get().lists.find((l) => l.id === listId)
    if (!list) return
    const items = list.items.map((i) => (i.id === itemId ? { ...i, ...updates } : i))
    const updated = { ...list, items, updatedAt: new Date().toISOString() }
    await db.putShoppingList(updated)
    set((s) => ({ lists: s.lists.map((l) => (l.id === listId ? updated : l)) }))
  },

  clearChecked: async (listId) => {
    const list = get().lists.find((l) => l.id === listId)
    if (!list) return
    const items = list.items.filter((i) => !i.checked)
    const updated = { ...list, items, updatedAt: new Date().toISOString() }
    await db.putShoppingList(updated)
    set((s) => ({ lists: s.lists.map((l) => (l.id === listId ? updated : l)) }))
  },

  deleteList: async (listId) => {
    const list = get().lists.find((l) => l.id === listId)
    if (!list) return
    const deleted = { ...list, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    await db.putShoppingList(deleted)
    set((s) => ({
      lists: s.lists.filter((l) => l.id !== listId),
      currentListId: s.currentListId === listId ? null : s.currentListId,
    }))
  },

  setCurrentList: (id) => set({ currentListId: id }),
  getCurrentList: () => {
    const { lists, currentListId } = get()
    return lists.find((l) => l.id === currentListId) ?? lists[0] ?? null
  },
}))
