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
      upgrade(db, _oldVersion, _newVersion, transaction) {
        // Helper to create store only if it doesn't exist
        const createStore = <_T extends { keyPath: string }>(
          name: string,
          options: IDBObjectStoreParameters
        ) => {
          if (!db.objectStoreNames.contains(name)) {
            const store = db.createObjectStore(name, options)
            return store
          }
          return transaction.objectStore(name)
        }

        // Recipes
        const recipeStore = createStore('recipes', { keyPath: 'id' })
        if (!recipeStore.indexNames.contains('by-category')) {
          recipeStore.createIndex('by-category', 'category')
        }
        if (!recipeStore.indexNames.contains('by-updated')) {
          recipeStore.createIndex('by-updated', 'updatedAt')
        }

        // Collections
        const collectionStore = createStore('collections', { keyPath: 'id' })
        if (!collectionStore.indexNames.contains('by-updated')) {
          collectionStore.createIndex('by-updated', 'updatedAt')
        }

        // Menus
        const menuStore = createStore('menus', { keyPath: 'id' })
        if (!menuStore.indexNames.contains('by-updated')) {
          menuStore.createIndex('by-updated', 'updatedAt')
        }

        // Meal Plans
        const mealPlanStore = createStore('mealPlans', { keyPath: 'id' })
        if (!mealPlanStore.indexNames.contains('by-week')) {
          mealPlanStore.createIndex('by-week', 'weekStart')
        }

        // Shopping Lists
        const shoppingListStore = createStore('shoppingLists', { keyPath: 'id' })
        if (!shoppingListStore.indexNames.contains('by-updated')) {
          shoppingListStore.createIndex('by-updated', 'updatedAt')
        }

        // Cooking Records
        const cookingStore = createStore('cookingRecords', { keyPath: 'id' })
        if (!cookingStore.indexNames.contains('by-date')) {
          cookingStore.createIndex('by-date', 'date')
        }
        if (!cookingStore.indexNames.contains('by-recipe')) {
          cookingStore.createIndex('by-recipe', 'recipeId')
        }

        // Fridge Items
        const fridgeStore = createStore('fridgeItems', { keyPath: 'id' })
        if (!fridgeStore.indexNames.contains('by-expiry')) {
          fridgeStore.createIndex('by-expiry', 'expiryDate')
        }
        if (!fridgeStore.indexNames.contains('by-category')) {
          fridgeStore.createIndex('by-category', 'category')
        }
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
