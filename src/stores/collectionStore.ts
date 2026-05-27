import { create } from 'zustand'
import type { Collection, Menu } from '@/types'
import { db } from '@/db'
import { generateId } from '@/utils/id'

interface CollectionState {
  collections: Collection[]
  menus: Menu[]
  loading: boolean

  // Collection actions
  loadCollections: () => Promise<void>
  addCollection: (name: string) => Promise<Collection>
  updateCollection: (id: string, updates: Partial<Collection>) => Promise<void>
  deleteCollection: (id: string) => Promise<void>
  toggleRecipeInCollection: (collectionId: string, recipeId: string) => Promise<void>

  // Menu actions
  loadMenus: () => Promise<void>
  addMenu: (name: string, recipeIds?: string[]) => Promise<Menu>
  updateMenu: (id: string, updates: Partial<Menu>) => Promise<void>
  deleteMenu: (id: string) => Promise<void>
  toggleRecipeInMenu: (menuId: string, recipeId: string) => Promise<void>

  // Query
  getCollectionsForRecipe: (recipeId: string) => Collection[]
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  collections: [],
  menus: [],
  loading: false,

  loadCollections: async () => {
    set({ loading: true })
    try {
      const collections = await db.getAllCollections()
      set({
        collections: collections.filter((c) => !c.deletedAt),
        loading: false,
      })
    } catch (e) {
      console.error('Failed to load collections:', e)
      set({ loading: false })
    }
  },

  addCollection: async (name) => {
    const now = new Date().toISOString()
    const collection: Collection = {
      id: generateId(),
      userId: 'local',
      name,
      recipeIds: [],
      syncStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    }
    await db.putCollection(collection)
    set((s) => ({ collections: [...s.collections, collection] }))
    return collection
  },

  updateCollection: async (id, updates) => {
    const col = get().collections.find((c) => c.id === id)
    if (!col) return
    const updated = { ...col, ...updates, updatedAt: new Date().toISOString(), syncStatus: 'pending' as const }
    await db.putCollection(updated)
    set((s) => ({ collections: s.collections.map((c) => (c.id === id ? updated : c)) }))
  },

  deleteCollection: async (id) => {
    const col = get().collections.find((c) => c.id === id)
    if (!col) return
    const deleted = { ...col, deletedAt: new Date().toISOString(), syncStatus: 'pending' as const, updatedAt: new Date().toISOString() }
    await db.putCollection(deleted)
    set((s) => ({ collections: s.collections.filter((c) => c.id !== id) }))
  },

  toggleRecipeInCollection: async (collectionId, recipeId) => {
    const col = get().collections.find((c) => c.id === collectionId)
    if (!col) return
    const has = col.recipeIds.includes(recipeId)
    const recipeIds = has
      ? col.recipeIds.filter((id) => id !== recipeId)
      : [...col.recipeIds, recipeId]
    await get().updateCollection(collectionId, { recipeIds })
  },

  // Menus
  loadMenus: async () => {
    try {
      const menus = await db.getAllMenus?.() ?? []
      set({ menus: menus.filter((m) => !m.deletedAt) })
    } catch {
      // db.getAllMenus may not exist yet
    }
  },

  addMenu: async (name, recipeIds = []) => {
    const now = new Date().toISOString()
    const menu: Menu = {
      id: generateId(),
      userId: 'local',
      name,
      recipeIds,
      syncStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    }
    set((s) => ({ menus: [...s.menus, menu] }))
    return menu
  },

  updateMenu: async (id, updates) => {
    set((s) => ({
      menus: s.menus.map((m) =>
        m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString(), syncStatus: 'pending' as const } : m,
      ),
    }))
  },

  deleteMenu: async (id) => {
    set((s) => ({ menus: s.menus.filter((m) => m.id !== id) }))
  },

  toggleRecipeInMenu: async (menuId, recipeId) => {
    const menu = get().menus.find((m) => m.id === menuId)
    if (!menu) return
    const has = menu.recipeIds.includes(recipeId)
    const recipeIds = has
      ? menu.recipeIds.filter((id) => id !== recipeId)
      : [...menu.recipeIds, recipeId]
    await get().updateMenu(menuId, { recipeIds })
  },

  getCollectionsForRecipe: (recipeId) => {
    return get().collections.filter((c) => c.recipeIds.includes(recipeId))
  },
}))
