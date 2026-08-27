import type { Recipe, DayPlan, MealPreferences, Category, FridgeItem } from '@/types'

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type PlanStrategy = 'quick' | 'balanced' | 'fridge'

export interface SmartPlanOptions {
  strategy?: PlanStrategy
  fridgeItems?: FridgeItem[]
  maxDuration?: number
  servings?: number
  includeSnack?: boolean
}

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
    'staple': 0.4,
    'drink': 0.25,
    'hot-dish': 0.2,
    'cold-dish': 0.1,
    'soup': 0.15,
    'dessert': 0.1,
  },
  lunch: {
    'hot-dish': 0.45,
    'staple': 0.25,
    'cold-dish': 0.15,
    'soup': 0.15,
    'dessert': 0.05,
    'drink': 0.05,
  },
  dinner: {
    'hot-dish': 0.4,
    'soup': 0.25,
    'cold-dish': 0.2,
    'staple': 0.15,
    'dessert': 0.05,
    'drink': 0.05,
  },
  snack: {
    'dessert': 0.4,
    'drink': 0.3,
    'cold-dish': 0.15,
    'staple': 0.1,
    'hot-dish': 0.05,
    'soup': 0.05,
  },
}

function calculateFridgeScore(recipe: Recipe, fridgeItems: FridgeItem[]): number {
  if (!fridgeItems || fridgeItems.length === 0) return 0
  const fridgeNames = fridgeItems.map((i) => i.name.toLowerCase())
  let matches = 0

  for (const ing of recipe.ingredients) {
    const ingName = ing.name.toLowerCase()
    if (fridgeNames.some((f) => ingName.includes(f) || f.includes(ingName))) {
      matches++
    }
  }

  return matches / Math.max(1, recipe.ingredients.length)
}

function scoreRecipeForStrategy(
  recipe: Recipe,
  strategy: PlanStrategy,
  slot: MealSlot,
  fridgeItems: FridgeItem[] = []
): number {
  let score = 10

  // 1. 基础餐别适宜度
  const categoryWeight = SLOT_WEIGHTS[slot][recipe.category] ?? 0.1
  score += categoryWeight * 20

  if (strategy === 'quick') {
    // 快手模式：时长越短、步骤越少、难度越低得分越高
    if (recipe.duration <= 15) score += 30
    else if (recipe.duration <= 25) score += 20
    else if (recipe.duration <= 35) score += 5
    else score -= 20

    if (recipe.difficulty === 'easy') score += 15
    if (recipe.difficulty === 'hard') score -= 25
  } else if (strategy === 'fridge') {
    // 冰箱清空模式：食材重合度得分极高
    const matchRatio = calculateFridgeScore(recipe, fridgeItems)
    score += matchRatio * 60
  } else if (strategy === 'balanced') {
    // 均衡模式：荤素热量均衡
    if (recipe.category === 'soup' || recipe.category === 'cold-dish') {
      score += 15
    }
  }

  return Math.max(1, score)
}

export function generateMealPlan(
  recipes: Recipe[],
  preferences: Partial<MealPreferences> = {},
  options: SmartPlanOptions = {}
): DayPlan[] {
  if (!recipes || recipes.length === 0) {
    return Array.from({ length: 7 }, () => ({}))
  }

  const prefs = { ...DEFAULT_PREFERENCES, ...preferences }
  const strategy = options.strategy || 'balanced'
  const fridgeItems = options.fridgeItems || []
  const maxDuration = options.maxDuration || prefs.maxDuration || 60

  // 过滤排除分类与超长耗时
  const eligibleRecipes = recipes.filter((r) => {
    if (prefs.excludeCategories?.includes(r.category)) return false
    if (strategy === 'quick' && r.duration > Math.min(30, maxDuration)) return false
    return r.duration <= maxDuration
  })

  const candidatePool = eligibleRecipes.length > 0 ? eligibleRecipes : recipes

  const days: DayPlan[] = []
  const globalUsedCount = new Map<string, number>()

  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const dayPlan: DayPlan = {}
    const dayUsed = new Set<string>()

    const isWeekend = dayIndex >= 5
    const slots: MealSlot[] = ['breakfast', 'lunch', 'dinner']
    if (options.includeSnack || preferences.preferSoup || isWeekend) {
      slots.push('snack')
    }

    for (const slot of slots) {
      // 评估候选菜品得分
      const scoredCandidates = candidatePool.map((recipe) => {
        let weight = scoreRecipeForStrategy(recipe, strategy, slot, fridgeItems)
        // 降低当天重复或全周多次出现的权重，增加多样性
        if (dayUsed.has(recipe.id)) weight *= 0.05
        const usedTimes = globalUsedCount.get(recipe.id) || 0
        weight /= Math.pow(1.8, usedTimes)
        return { recipe, weight: Math.max(0.1, weight) }
      })

      // 轮盘赌加权随机挑选
      const totalWeight = scoredCandidates.reduce((sum, item) => sum + item.weight, 0)
      let randomVal = Math.random() * totalWeight
      let selected = scoredCandidates[0].recipe

      for (const item of scoredCandidates) {
        randomVal -= item.weight
        if (randomVal <= 0) {
          selected = item.recipe
          break
        }
      }

      if (selected) {
        (dayPlan as Record<string, string[]>)[slot] = [selected.id]
        dayUsed.add(selected.id)
        globalUsedCount.set(selected.id, (globalUsedCount.get(selected.id) || 0) + 1)
      }
    }

    days.push(dayPlan)
  }

  return days
}

