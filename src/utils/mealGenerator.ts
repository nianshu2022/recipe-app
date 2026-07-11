import type { Recipe, DayPlan, MealPreferences, Category } from '@/types'

type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack'

const DEFAULT_PREFERENCES: MealPreferences = {
  servings: 2,
  excludeCategories: [],
  maxDifficulty: 'medium',
  maxDuration: 60,
  preferCold: true,
  preferSoup: true,
}

const SLOT_WEIGHTS: Record<MealSlot, Record<Category, number>> = {
  breakfast: {
    'hot-dish': 0.3,
    'cold-dish': 0.1,
    'soup': 0.2,
    'staple': 0.3,
    'dessert': 0.05,
    'drink': 0.05,
  },
  lunch: {
    'hot-dish': 0.4,
    'cold-dish': 0.2,
    'soup': 0.15,
    'staple': 0.15,
    'dessert': 0.05,
    'drink': 0.05,
  },
  dinner: {
    'hot-dish': 0.45,
    'cold-dish': 0.15,
    'soup': 0.2,
    'staple': 0.15,
    'dessert': 0.03,
    'drink': 0.02,
  },
  snack: {
    'hot-dish': 0.1,
    'cold-dish': 0.2,
    'soup': 0.1,
    'staple': 0.1,
    'dessert': 0.35,
    'drink': 0.15,
  },
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function filterRecipes(recipes: Recipe[], prefs: MealPreferences): Recipe[] {
  return recipes.filter((r) => {
    if (prefs.excludeCategories.includes(r.category)) return false
    const diffOrder = { easy: 0, medium: 1, hard: 2 }
    if (diffOrder[r.difficulty] > diffOrder[prefs.maxDifficulty]) return false
    if (r.duration > prefs.maxDuration) return false
    return true
  })
}

function selectForSlot(
  available: Recipe[],
  slot: MealSlot,
  usedIds: Set<string>,
): Recipe | null {
  const weighted: Recipe[] = []
  const weights = SLOT_WEIGHTS[slot]

  for (const recipe of available) {
    if (usedIds.has(recipe.id)) continue
    const weight = weights[recipe.category] ?? 0.1
    const count = Math.round(weight * 100)
    for (let i = 0; i < count; i++) {
      weighted.push(recipe)
    }
  }

  if (weighted.length === 0) {
    const unused = available.filter((r) => !usedIds.has(r.id))
    return unused.length > 0 ? unused[Math.floor(Math.random() * unused.length)] : null
  }

  return weighted[Math.floor(Math.random() * weighted.length)]
}

export function generateMealPlan(
  recipes: Recipe[],
  preferences: Partial<MealPreferences> = {},
): DayPlan[] {
  const prefs = { ...DEFAULT_PREFERENCES, ...preferences }
  const filtered = filterRecipes(recipes, prefs)

  if (filtered.length === 0) {
    return Array.from({ length: 7 }, () => ({}))
  }

  const days: DayPlan[] = []
  const allUsedIds = new Set<string>()

  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const dayPlan: DayPlan = {}
    const dayUsed = new Set<string>()

    const slots: MealSlot[] = ['breakfast', 'lunch', 'dinner']
    if (prefs.preferSoup) {
      slots.push('snack')
    }

    for (const slot of slots) {
      const recipe = selectForSlot(
        shuffleArray(filtered),
        slot,
        new Set([...allUsedIds, ...dayUsed])
      )
      if (recipe) {
        (dayPlan as Record<string, string[]>)[slot] = [recipe.id]
        dayUsed.add(recipe.id)
        allUsedIds.add(recipe.id)
      }
    }

    days.push(dayPlan)
  }

  return days
}
