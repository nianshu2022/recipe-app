export type SyncStatus = 'synced' | 'pending' | 'conflict'

export type Difficulty = 'easy' | 'medium' | 'hard'

export type IngredientType = 'main' | 'sub' | 'seasoning'

export type Category =
  | 'cold-dish'
  | 'hot-dish'
  | 'soup'
  | 'staple'
  | 'dessert'
  | 'drink'

export interface Ingredient {
  id: string
  name: string
  amount: number
  unit: string
  type: IngredientType
  scalable: boolean
}

export interface Step {
  order: number
  description: string
  image?: string
  video?: string
  tip?: string
  timer?: number // minutes
}

export interface Nutrition {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
}

export interface Recipe {
  id: string
  userId: string
  name: string
  category: Category
  tags: string[]
  coverImage?: string
  difficulty: Difficulty
  duration: number // minutes
  servings: number
  ingredients: Ingredient[]
  steps: Step[]
  nutrition?: Nutrition
  syncStatus: SyncStatus
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface Collection {
  id: string
  userId: string
  name: string
  coverImage?: string
  recipeIds: string[]
  syncStatus: SyncStatus
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface Menu {
  id: string
  userId: string
  name: string
  recipeIds: string[]
  syncStatus: SyncStatus
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface DayPlan {
  breakfast?: string[]
  lunch?: string[]
  dinner?: string[]
  snack?: string[]
}

export interface MealPlan {
  id: string
  userId: string
  weekStart: string
  days: DayPlan[]
  syncStatus: SyncStatus
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface ShoppingItem {
  id: string
  name: string
  amount: number
  unit: string
  category: string
  checked: boolean
}

export interface ShoppingList {
  id: string
  userId: string
  sourceRecipeIds: string[]
  items: ShoppingItem[]
  syncStatus: SyncStatus
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface FridgeItem {
  id: string
  userId: string
  name: string
  brand?: string
  amount: number
  unit: string
  category: string
  imageUrl?: string
  nutriments?: {
    'energy-kcal_100g'?: number
    proteins_100g?: number
    carbohydrates_100g?: number
    fat_100g?: number
    fiber_100g?: number
  }
  purchaseDate: string
  expiryDate?: string
  syncStatus: SyncStatus
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface CookingRecord {
  id: string
  userId: string
  recipeId: string
  date: string
  servings: number
  notes?: string
  syncStatus: SyncStatus
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface User {
  id: string
  email: string
  nickname: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

export interface UserSettings {
  userId: string
  voiceControl: boolean
  nutritionSource: string
  syncEnabled: boolean
  theme: 'light' | 'dark' | 'system'
  updatedAt: string
}

export interface MealPlanTemplate {
  id: string
  userId: string
  name: string
  days: DayPlan[]
  syncStatus: SyncStatus
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface FamilyMember {
  id: string
  userId: string
  nickname: string
  email: string
  joinedAt: string
}

export interface FamilyGroup {
  id: string
  ownerId: string
  inviteCode: string
  members: FamilyMember[]
  createdAt: string
  updatedAt: string
}

export interface MealPreferences {
  servings: number
  excludeCategories: Category[]
  maxDifficulty: Difficulty
  maxDuration: number
  preferCold: boolean
  preferSoup: boolean
}
