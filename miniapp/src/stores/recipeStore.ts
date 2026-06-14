import { create } from 'zustand'
import { db } from '@/utils/storage'
import type { Recipe, Category, Difficulty } from '@/types'

interface RecipeState {
  recipes: Recipe[]
  loading: boolean
  searchQuery: string
  selectedCategory: Category | 'all'
  selectedDifficulty: Difficulty | 'all'

  loadRecipes: () => Promise<void>
  addRecipe: (recipe: Recipe) => Promise<void>
  updateRecipe: (recipe: Recipe) => Promise<void>
  deleteRecipe: (id: string) => Promise<void>
  setSearchQuery: (query: string) => void
  setSelectedCategory: (category: Category | 'all') => void
  setSelectedDifficulty: (difficulty: Difficulty | 'all') => void
  getFilteredRecipes: () => Recipe[]
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: [],
  loading: false,
  searchQuery: '',
  selectedCategory: 'all',
  selectedDifficulty: 'all',

  loadRecipes: async () => {
    set({ loading: true })
    try {
      const recipes = await db.getAllRecipes()
      set({ recipes, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  addRecipe: async (recipe) => {
    await db.putRecipe(recipe)
    set((state) => ({ recipes: [...state.recipes, recipe] }))
  },

  updateRecipe: async (recipe) => {
    await db.putRecipe(recipe)
    set((state) => ({
      recipes: state.recipes.map((r) => (r.id === recipe.id ? recipe : r)),
    }))
  },

  deleteRecipe: async (id) => {
    await db.deleteRecipe(id)
    set((state) => ({
      recipes: state.recipes.filter((r) => r.id !== id),
    }))
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSelectedDifficulty: (difficulty) => set({ selectedDifficulty: difficulty }),

  getFilteredRecipes: () => {
    const { recipes, searchQuery, selectedCategory, selectedDifficulty } = get()
    const query = searchQuery.toLowerCase().trim()

    return recipes.filter((recipe) => {
      if (recipe.deletedAt) return false

      if (query) {
        const matchName = recipe.name.toLowerCase().includes(query)
        const matchTags = recipe.tags.some((t) =>
          t.toLowerCase().includes(query),
        )
        if (!matchName && !matchTags) return false
      }

      if (selectedCategory !== 'all' && recipe.category !== selectedCategory)
        return false

      if (
        selectedDifficulty !== 'all' &&
        recipe.difficulty !== selectedDifficulty
      )
        return false

      return true
    })
  },
}))
