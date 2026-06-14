import { create } from 'zustand'
import { db } from '@/utils/storage'
import type { Collection } from '@/types'
import { genId } from '@/utils/id'

interface CollectionState {
  collections: Collection[]
  loading: boolean

  loadCollections: () => Promise<void>
  createCollection: (name: string) => Promise<string>
  deleteCollection: (id: string) => Promise<void>
  toggleRecipeInCollection: (collectionId: string, recipeId: string) => Promise<void>
  isRecipeCollected: (recipeId: string) => boolean
  getCollectionById: (id: string) => Collection | undefined
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  collections: [],
  loading: false,

  loadCollections: async () => {
    set({ loading: true })
    try {
      const collections = await db.getAllCollections()
      set({ collections, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  createCollection: async (name) => {
    const collection: Collection = {
      id: genId(),
      userId: '',
      name,
      recipeIds: [],
      syncStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await db.putCollection(collection)
    set((state) => ({
      collections: [...state.collections, collection],
    }))
    return collection.id
  },

  deleteCollection: async (id) => {
    await db.deleteCollection(id)
    set((state) => ({
      collections: state.collections.filter((c) => c.id !== id),
    }))
  },

  toggleRecipeInCollection: async (collectionId, recipeId) => {
    const { collections } = get()
    const collection = collections.find((c) => c.id === collectionId)
    if (!collection) return

    const has = collection.recipeIds.includes(recipeId)
    const updated = {
      ...collection,
      recipeIds: has
        ? collection.recipeIds.filter((id) => id !== recipeId)
        : [...collection.recipeIds, recipeId],
      updatedAt: new Date().toISOString(),
    }
    await db.putCollection(updated)
    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === updated.id ? updated : c,
      ),
    }))
  },

  isRecipeCollected: (recipeId) => {
    return get().collections.some((c) => c.recipeIds.includes(recipeId))
  },

  getCollectionById: (id) => {
    return get().collections.find((c) => c.id === id)
  },
}))
