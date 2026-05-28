import Taro from '@tarojs/taro'
import type {
  Recipe,
  Collection,
  Menu,
  MealPlan,
  ShoppingList,
  FridgeItem,
  CookingRecord,
} from '@/types'

const KEYS = {
  recipes: 'db_recipes',
  collections: 'db_collections',
  menus: 'db_menus',
  mealPlans: 'db_mealPlans',
  shoppingLists: 'db_shoppingLists',
  fridgeItems: 'db_fridgeItems',
  cookingRecords: 'db_cookingRecords',
} as const

function getAll<T>(key: string): T[] {
  try {
    return Taro.getStorageSync(key) || []
  } catch {
    return []
  }
}

function putAll<T extends { id: string }>(key: string, item: T): void {
  const list = getAll<T>(key)
  const index = list.findIndex((i) => i.id === item.id)
  if (index >= 0) {
    list[index] = item
  } else {
    list.push(item)
  }
  Taro.setStorageSync(key, list)
}

function deleteById(key: string, id: string): void {
  const list = getAll<{ id: string }>(key)
  Taro.setStorageSync(
    key,
    list.filter((i) => i.id !== id),
  )
}

export const db = {
  // Recipes
  async getAllRecipes(): Promise<Recipe[]> {
    return getAll<Recipe>(KEYS.recipes)
  },
  async getRecipe(id: string): Promise<Recipe | undefined> {
    return getAll<Recipe>(KEYS.recipes).find((r) => r.id === id)
  },
  async putRecipe(recipe: Recipe): Promise<string> {
    putAll(KEYS.recipes, recipe)
    return recipe.id
  },
  async deleteRecipe(id: string): Promise<void> {
    deleteById(KEYS.recipes, id)
  },

  // Collections
  async getAllCollections(): Promise<Collection[]> {
    return getAll<Collection>(KEYS.collections)
  },
  async putCollection(c: Collection): Promise<string> {
    putAll(KEYS.collections, c)
    return c.id
  },
  async deleteCollection(id: string): Promise<void> {
    deleteById(KEYS.collections, id)
  },

  // Menus
  async getAllMenus(): Promise<Menu[]> {
    return getAll<Menu>(KEYS.menus)
  },
  async putMenu(m: Menu): Promise<string> {
    putAll(KEYS.menus, m)
    return m.id
  },
  async deleteMenu(id: string): Promise<void> {
    deleteById(KEYS.menus, id)
  },

  // Cooking Records
  async getAllCookingRecords(): Promise<CookingRecord[]> {
    return getAll<CookingRecord>(KEYS.cookingRecords)
  },
  async putCookingRecord(r: CookingRecord): Promise<string> {
    putAll(KEYS.cookingRecords, r)
    return r.id
  },

  // Shopping Lists
  async getAllShoppingLists(): Promise<ShoppingList[]> {
    return getAll<ShoppingList>(KEYS.shoppingLists)
  },
  async putShoppingList(l: ShoppingList): Promise<string> {
    putAll(KEYS.shoppingLists, l)
    return l.id
  },

  // Fridge Items
  async getAllFridgeItems(): Promise<FridgeItem[]> {
    return getAll<FridgeItem>(KEYS.fridgeItems)
  },
  async putFridgeItem(i: FridgeItem): Promise<string> {
    putAll(KEYS.fridgeItems, i)
    return i.id
  },

  // Meal Plans
  async getAllMealPlans(): Promise<MealPlan[]> {
    return getAll<MealPlan>(KEYS.mealPlans)
  },
  async putMealPlan(p: MealPlan): Promise<string> {
    putAll(KEYS.mealPlans, p)
    return p.id
  },
}
