import { create } from 'zustand'
import type { Recipe, Category, Difficulty } from '@/types'
import { db } from '@/db'
import { generateId } from '@/utils/id'
import { useMealPlanStore } from './mealPlanStore'

function filterRecipes(recipes: Recipe[], searchQuery: string, categoryFilter: Category | null, difficultyFilter: Difficulty | null) {
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
}

interface RecipeState {
  recipes: Recipe[]
  loading: boolean
  searchQuery: string
  categoryFilter: Category | null
  difficultyFilter: Difficulty | null
  filteredRecipes: Recipe[]

  // Actions
  loadRecipes: () => Promise<void>
  addRecipe: (recipe: Omit<Recipe, 'id' | 'syncStatus' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateRecipe: (id: string, updates: Partial<Recipe>) => Promise<void>
  deleteRecipe: (id: string) => Promise<void>
  setSearchQuery: (query: string) => void
  setCategoryFilter: (category: Category | null) => void
  setDifficultyFilter: (difficulty: Difficulty | null) => void
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: [],
  loading: false,
  searchQuery: '',
  categoryFilter: null,
  difficultyFilter: null,
  filteredRecipes: [],

  loadRecipes: async () => {
    set({ loading: true })
    try {
      const recipes = await db.getAllRecipes()
      const activeRecipes = recipes.filter((r) => !r.deletedAt)
      const { searchQuery, categoryFilter, difficultyFilter } = get()
      set({
        recipes: activeRecipes,
        filteredRecipes: filterRecipes(activeRecipes, searchQuery, categoryFilter, difficultyFilter),
        loading: false,
      })
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
    const { recipes, searchQuery, categoryFilter, difficultyFilter } = get()
    const newRecipes = [...recipes, recipe]
    set({
      recipes: newRecipes,
      filteredRecipes: filterRecipes(newRecipes, searchQuery, categoryFilter, difficultyFilter),
    })
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
    const { recipes, searchQuery, categoryFilter, difficultyFilter } = get()
    const newRecipes = recipes.map((r) => (r.id === id ? updated : r))
    set({
      recipes: newRecipes,
      filteredRecipes: filterRecipes(newRecipes, searchQuery, categoryFilter, difficultyFilter),
    })
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
    try {
      await db.putRecipe(deleted)
      await useMealPlanStore.getState().removeRecipeFromPlan(id)
    } catch (e) {
      console.error('Failed to delete recipe:', e)
      return
    }
    const { recipes, searchQuery, categoryFilter, difficultyFilter } = get()
    const newRecipes = recipes.filter((r) => r.id !== id)
    set({
      recipes: newRecipes,
      filteredRecipes: filterRecipes(newRecipes, searchQuery, categoryFilter, difficultyFilter),
    })
  },

  setSearchQuery: (query) => {
    const { recipes, categoryFilter, difficultyFilter } = get()
    set({
      searchQuery: query,
      filteredRecipes: filterRecipes(recipes, query, categoryFilter, difficultyFilter),
    })
  },
  setCategoryFilter: (category) => {
    const { recipes, searchQuery, difficultyFilter } = get()
    set({
      categoryFilter: category,
      filteredRecipes: filterRecipes(recipes, searchQuery, category, difficultyFilter),
    })
  },
  setDifficultyFilter: (difficulty) => {
    const { recipes, searchQuery, categoryFilter } = get()
    set({
      difficultyFilter: difficulty,
      filteredRecipes: filterRecipes(recipes, searchQuery, categoryFilter, difficulty),
    })
  },
}))
