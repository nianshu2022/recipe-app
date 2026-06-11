import { create } from 'zustand'
import type { Recipe, Category, Difficulty } from '@/types'
import { db } from '@/db'
import { generateId } from '@/utils/id'
import { emit } from '@/utils/events'

function filterRecipes(
  recipes: Recipe[],
  searchQuery: string,
  categoryFilter: Category | null,
  difficultyFilter: Difficulty | null,
): Recipe[] {
  if (!searchQuery && !categoryFilter && !difficultyFilter) return recipes

  const query = searchQuery?.toLowerCase()
  return recipes.filter((recipe) => {
    if (query) {
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
    const current = get()
    if (current.loading) return

    set({ loading: true })
    try {
      const recipes = await db.getAllRecipes()
      const activeRecipes = recipes.filter((r) => !r.deletedAt)
      set({
        recipes: activeRecipes,
        filteredRecipes: filterRecipes(activeRecipes, current.searchQuery, current.categoryFilter, current.difficultyFilter),
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
    const { recipes } = get()
    const newRecipes = [...recipes, recipe]
    set({
      recipes: newRecipes,
      filteredRecipes: filterRecipes(newRecipes, get().searchQuery, get().categoryFilter, get().difficultyFilter),
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
    const newRecipes = get().recipes.map((r) => (r.id === id ? updated : r))
    set({
      recipes: newRecipes,
      filteredRecipes: filterRecipes(newRecipes, get().searchQuery, get().categoryFilter, get().difficultyFilter),
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

    await db.putRecipe(deleted)
    const newRecipes = get().recipes.filter((r) => r.id !== id)
    set({
      recipes: newRecipes,
      filteredRecipes: filterRecipes(newRecipes, get().searchQuery, get().categoryFilter, get().difficultyFilter),
    })

    emit('recipe:deleted', { id })
  },

  setSearchQuery: (query) => {
    set({
      searchQuery: query,
      filteredRecipes: filterRecipes(get().recipes, query, get().categoryFilter, get().difficultyFilter),
    })
  },

  setCategoryFilter: (category) => {
    set({
      categoryFilter: category,
      filteredRecipes: filterRecipes(get().recipes, get().searchQuery, category, get().difficultyFilter),
    })
  },

  setDifficultyFilter: (difficulty) => {
    set({
      difficultyFilter: difficulty,
      filteredRecipes: filterRecipes(get().recipes, get().searchQuery, get().categoryFilter, difficulty),
    })
  },
}))
