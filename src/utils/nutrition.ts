import type { Recipe, DayPlan, Nutrition, Ingredient } from '@/types'

export interface DailyNutrition {
  day: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
}

export interface WeeklyNutritionSummary {
  days: DailyNutrition[]
  totals: Nutrition
  averages: Nutrition
}

const EMPTY_NUTRITION: Nutrition = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
}

function getRecipeNutrition(recipe: Recipe, servings: number): Nutrition {
  if (!recipe.nutrition) {
    return { ...EMPTY_NUTRITION }
  }
  const scale = servings / recipe.servings
  return {
    calories: Math.round(recipe.nutrition.calories * scale),
    protein: Math.round(recipe.nutrition.protein * scale),
    carbs: Math.round(recipe.nutrition.carbs * scale),
    fat: Math.round(recipe.nutrition.fat * scale),
    fiber: Math.round(recipe.nutrition.fiber * scale),
  }
}

function sumNutrition(a: Nutrition, b: Nutrition): Nutrition {
  return {
    calories: a.calories + b.calories,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
    fiber: a.fiber + b.fiber,
  }
}

export function calculateDayNutrition(
  dayPlan: DayPlan,
  recipes: Recipe[],
  servings: number = 2,
): Nutrition {
  const allRecipeIds = [
    ...(dayPlan.breakfast ?? []),
    ...(dayPlan.lunch ?? []),
    ...(dayPlan.dinner ?? []),
    ...(dayPlan.snack ?? []),
  ]

  let total: Nutrition = { ...EMPTY_NUTRITION }

  for (const recipeId of allRecipeIds) {
    const recipe = recipes.find((r) => r.id === recipeId)
    if (recipe) {
      total = sumNutrition(total, getRecipeNutrition(recipe, servings))
    }
  }

  return total
}

export function calculateWeeklyNutrition(
  days: DayPlan[],
  recipes: Recipe[],
  servings: number = 2,
  dayLabels: string[] = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
): WeeklyNutritionSummary {
  const dailyNutritions: DailyNutrition[] = []
  let totals: Nutrition = { ...EMPTY_NUTRITION }

  for (let i = 0; i < 7; i++) {
    const dayPlan = days[i] ?? {}
    const nutrition = calculateDayNutrition(dayPlan, recipes, servings)

    dailyNutritions.push({
      day: dayLabels[i],
      ...nutrition,
    })

    totals = sumNutrition(totals, nutrition)
  }

  const averages: Nutrition = {
    calories: Math.round(totals.calories / 7),
    protein: Math.round(totals.protein / 7),
    carbs: Math.round(totals.carbs / 7),
    fat: Math.round(totals.fat / 7),
    fiber: Math.round(totals.fiber / 7),
  }

  return {
    days: dailyNutritions,
    totals,
    averages,
  }
}

// Nutrition database for common Chinese ingredients (per 100g)
const NUTRITION_DB: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  '鸡蛋': { calories: 144, protein: 13, carbs: 1, fat: 10 },
  '番茄': { calories: 18, protein: 1, carbs: 4, fat: 0 },
  '土豆': { calories: 77, protein: 2, carbs: 17, fat: 0 },
  '猪肉': { calories: 143, protein: 20, carbs: 0, fat: 6 },
  '牛肉': { calories: 250, protein: 26, carbs: 0, fat: 15 },
  '鸡肉': { calories: 167, protein: 19, carbs: 0, fat: 10 },
  '豆腐': { calories: 76, protein: 8, carbs: 2, fat: 4 },
  '米饭': { calories: 116, protein: 3, carbs: 26, fat: 0 },
  '面条': { calories: 138, protein: 4, carbs: 25, fat: 2 },
  '虾': { calories: 99, protein: 20, carbs: 1, fat: 1 },
  '鱼': { calories: 96, protein: 18, carbs: 0, fat: 2 },
  '青椒': { calories: 20, protein: 1, carbs: 4, fat: 0 },
  '胡萝卜': { calories: 41, protein: 1, carbs: 10, fat: 0 },
  '白菜': { calories: 13, protein: 2, carbs: 2, fat: 0 },
  '黄瓜': { calories: 15, protein: 1, carbs: 3, fat: 0 },
  '洋葱': { calories: 40, protein: 1, carbs: 9, fat: 0 },
  '大蒜': { calories: 149, protein: 6, carbs: 33, fat: 0 },
  '生姜': { calories: 80, protein: 2, carbs: 18, fat: 1 },
  '蘑菇': { calories: 22, protein: 3, carbs: 3, fat: 0 },
  '香菇': { calories: 34, protein: 3, carbs: 7, fat: 0 },
}

function getGramAmount(ingredient: Ingredient): number {
  const amount = ingredient.amount
  const unit = ingredient.unit.toLowerCase()

  if (unit === 'g' || unit === '克') return amount
  if (unit === 'kg' || unit === '千克') return amount * 1000
  if (unit === 'ml' || unit === '毫升') return amount
  if (unit === 'l' || unit === '升') return amount * 1000
  if (unit === '个' || unit === '只') return amount * 150
  if (unit === '块') return amount * 100
  if (unit === '片') return amount * 10
  if (unit === '根' || unit === '条') return amount * 100
  if (unit === '把' || unit === '束') return amount * 200
  if (unit === '勺' || unit === '汤匙') return amount * 15
  if (unit === '茶匙') return amount * 5
  if (unit === '杯') return amount * 240
  if (unit === '碗') return amount * 200

  return amount
}

export function estimateNutrition(ingredients: Ingredient[]): Nutrition {
  let total: Nutrition = { ...EMPTY_NUTRITION }

  for (const ingredient of ingredients) {
    const dbEntry = NUTRITION_DB[ingredient.name]
    if (!dbEntry) continue

    const grams = getGramAmount(ingredient)
    const scale = grams / 100

    total = {
      calories: total.calories + Math.round(dbEntry.calories * scale),
      protein: total.protein + Math.round(dbEntry.protein * scale),
      carbs: total.carbs + Math.round(dbEntry.carbs * scale),
      fat: total.fat + Math.round(dbEntry.fat * scale),
      fiber: total.fiber,
    }
  }

  return total
}

export function getCalorieLevel(calories: number): { label: string; color: string } {
  if (calories < 300) return { label: '低卡', color: 'text-emerald-500' }
  if (calories <= 600) return { label: '适中', color: 'text-amber-500' }
  return { label: '高卡', color: 'text-red-500' }
}

export function getMacroPercentages(nutrition: Nutrition): { protein: number; carbs: number; fat: number } {
  const proteinCal = nutrition.protein * 4
  const carbsCal = nutrition.carbs * 4
  const fatCal = nutrition.fat * 9
  const total = proteinCal + carbsCal + fatCal

  if (total === 0) return { protein: 0, carbs: 0, fat: 0 }

  return {
    protein: Math.round((proteinCal / total) * 100),
    carbs: Math.round((carbsCal / total) * 100),
    fat: Math.round((fatCal / total) * 100),
  }
}
