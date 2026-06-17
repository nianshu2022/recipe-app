import { openDB, type IDBPDatabase } from 'idb'
import type { Recipe, Collection, Menu, MealPlan, ShoppingList, CookingRecord, FridgeItem } from '@/types'

const DB_NAME = 'recipe-app'
const DB_VERSION = 2

interface RecipeAppDB {
  recipes: {
    key: string
    value: Recipe
    indexes: { 'by-category': string; 'by-updated': string }
  }
  collections: {
    key: string
    value: Collection
    indexes: { 'by-updated': string }
  }
  menus: {
    key: string
    value: Menu
    indexes: { 'by-updated': string }
  }
  mealPlans: {
    key: string
    value: MealPlan
    indexes: { 'by-week': string }
  }
  shoppingLists: {
    key: string
    value: ShoppingList
    indexes: { 'by-updated': string }
  }
  cookingRecords: {
    key: string
    value: CookingRecord
    indexes: { 'by-date': string; 'by-recipe': string }
  }
  fridgeItems: {
    key: string
    value: FridgeItem
    indexes: { 'by-expiry': string; 'by-category': string }
  }
}

let dbPromise: Promise<IDBPDatabase<RecipeAppDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<RecipeAppDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const recipeStore = db.createObjectStore('recipes', { keyPath: 'id' })
        recipeStore.createIndex('by-category', 'category')
        recipeStore.createIndex('by-updated', 'updatedAt')

        const collectionStore = db.createObjectStore('collections', { keyPath: 'id' })
        collectionStore.createIndex('by-updated', 'updatedAt')

        const menuStore = db.createObjectStore('menus', { keyPath: 'id' })
        menuStore.createIndex('by-updated', 'updatedAt')

        const mealPlanStore = db.createObjectStore('mealPlans', { keyPath: 'id' })
        mealPlanStore.createIndex('by-week', 'weekStart')

        const shoppingListStore = db.createObjectStore('shoppingLists', { keyPath: 'id' })
        shoppingListStore.createIndex('by-updated', 'updatedAt')

        const cookingStore = db.createObjectStore('cookingRecords', { keyPath: 'id' })
        cookingStore.createIndex('by-date', 'date')
        cookingStore.createIndex('by-recipe', 'recipeId')

        const fridgeStore = db.createObjectStore('fridgeItems', { keyPath: 'id' })
        fridgeStore.createIndex('by-expiry', 'expiryDate')
        fridgeStore.createIndex('by-category', 'category')
      },
    })
  }
  return dbPromise
}

export const db = {
  // Recipes
  async getAllRecipes() {
    return (await getDB()).getAll('recipes')
  },
  async getRecipe(id: string) {
    return (await getDB()).get('recipes', id)
  },
  async putRecipe(recipe: Recipe) {
    return (await getDB()).put('recipes', recipe)
  },
  async deleteRecipe(id: string) {
    return (await getDB()).delete('recipes', id)
  },

  // Collections
  async getAllCollections() {
    return (await getDB()).getAll('collections')
  },
  async getCollection(id: string) {
    return (await getDB()).get('collections', id)
  },
  async putCollection(collection: Collection) {
    return (await getDB()).put('collections', collection)
  },
  async deleteCollection(id: string) {
    return (await getDB()).delete('collections', id)
  },

  // Menus
  async getAllMenus() {
    return (await getDB()).getAll('menus')
  },
  async putMenu(menu: Menu) {
    return (await getDB()).put('menus', menu)
  },
  async deleteMenu(id: string) {
    return (await getDB()).delete('menus', id)
  },

  // Cooking Records
  async getAllCookingRecords() {
    return (await getDB()).getAll('cookingRecords')
  },
  async getCookingRecord(id: string) {
    return (await getDB()).get('cookingRecords', id)
  },
  async putCookingRecord(record: CookingRecord) {
    return (await getDB()).put('cookingRecords', record)
  },

  // Shopping Lists
  async getAllShoppingLists() {
    return (await getDB()).getAll('shoppingLists')
  },
  async getShoppingList(id: string) {
    return (await getDB()).get('shoppingLists', id)
  },
  async putShoppingList(list: ShoppingList) {
    return (await getDB()).put('shoppingLists', list)
  },

  // Meal Plans
  async getAllMealPlans() {
    return (await getDB()).getAll('mealPlans')
  },
  async getMealPlan(id: string) {
    return (await getDB()).get('mealPlans', id)
  },
  async putMealPlan(plan: MealPlan) {
    return (await getDB()).put('mealPlans', plan)
  },

  // Fridge Items
  async getAllFridgeItems() {
    return (await getDB()).getAll('fridgeItems')
  },
  async getFridgeItem(id: string) {
    return (await getDB()).get('fridgeItems', id)
  },
  async putFridgeItem(item: FridgeItem) {
    return (await getDB()).put('fridgeItems', item)
  },
  async deleteFridgeItem(id: string) {
    return (await getDB()).delete('fridgeItems', id)
  },
}
