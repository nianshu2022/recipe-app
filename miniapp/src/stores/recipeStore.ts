import { create } from 'zustand'
import type { Recipe, Category, Difficulty } from '@/types'
import { db } from '@/utils/storage'
import { generateId } from '@/utils/id'
import { useMealPlanStore } from './mealPlanStore'

interface RecipeState {
  recipes: Recipe[]
  loading: boolean
  searchQuery: string
  categoryFilter: Category | null
  difficultyFilter: Difficulty | null

  loadRecipes: () => Promise<void>
  addRecipe: (recipe: Omit<Recipe, 'id' | 'syncStatus' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateRecipe: (id: string, updates: Partial<Recipe>) => Promise<void>
  deleteRecipe: (id: string) => Promise<void>
  setSearchQuery: (query: string) => void
  setCategoryFilter: (category: Category | null) => void
  setDifficultyFilter: (difficulty: Difficulty | null) => void

  filteredRecipes: () => Recipe[]
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: [],
  loading: false,
  searchQuery: '',
  categoryFilter: null,
  difficultyFilter: null,

  loadRecipes: async () => {
    set({ loading: true })
    try {
      const recipes = await db.getAllRecipes()
      const activeRecipes = recipes.filter((r) => !r.deletedAt)
      set({ recipes: activeRecipes, loading: false })
    } catch (error) {
      console.error('Failed to load recipes:', error)
      set({ loading: false })
    }
  },

  addRecipe: async (recipeData) => {
    const now = new Date().toISOString()
    const recipe: Recipe = {
      ...recipeData,
      id: generateId(),
      syncStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    }
    await db.putRecipe(recipe)
    set((state) => ({ recipes: [...state.recipes, recipe] }))
  },

  updateRecipe: async (id, updates) => {
    const recipe = get().recipes.find((r) => r.id === id)
    if (!recipe) return

    const updated: Recipe = {
      ...recipe,
      ...updates,
      syncStatus: 'pending',
      updatedAt: new Date().toISOString(),
    }
    await db.putRecipe(updated)
    set((state) => ({
      recipes: state.recipes.map((r) => (r.id === id ? updated : r)),
    }))
  },

  deleteRecipe: async (id) => {
    const recipe = get().recipes.find((r) => r.id === id)
    if (!recipe) return

    const deleted: Recipe = {
      ...recipe,
      deletedAt: new Date().toISOString(),
      syncStatus: 'pending',
      updatedAt: new Date().toISOString(),
    }
    await db.putRecipe(deleted)
    await useMealPlanStore.getState().removeRecipeFromPlan(id)
    set((state) => ({
      recipes: state.recipes.filter((r) => r.id !== id),
    }))
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setCategoryFilter: (category) => set({ categoryFilter: category }),
  setDifficultyFilter: (difficulty) => set({ difficultyFilter: difficulty }),

  filteredRecipes: () => {
    const { recipes, searchQuery, categoryFilter, difficultyFilter } = get()
    return recipes.filter((recipe) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchName = recipe.name.toLowerCase().includes(query)
        const matchTags = recipe.tags.some((t) => t.toLowerCase().includes(query))
        const matchIngredients = recipe.ingredients.some((i) =>
          i.name.toLowerCase().includes(query),
        )
        if (!matchName && !matchTags && !matchIngredients) return false
      }
      if (categoryFilter && recipe.category !== categoryFilter) return false
      if (difficultyFilter && recipe.difficulty !== difficultyFilter) return false
      return true
    })
  },
}))
