import type { Ingredient, Nutrition } from '@/types'

// Nutrition data per 100g (approximate values)
const nutritionDB: Record<string, { cal: number; protein: number; carbs: number; fat: number; fiber: number }> = {
  // Meat
  '猪肉': { cal: 242, protein: 13.2, carbs: 0, fat: 20.6, fiber: 0 },
  '牛肉': { cal: 125, protein: 19.9, carbs: 0, fat: 4.2, fiber: 0 },
  '羊肉': { cal: 203, protein: 14.6, carbs: 0, fat: 15.6, fiber: 0 },
  '鸡肉': { cal: 167, protein: 19.3, carbs: 0, fat: 9.4, fiber: 0 },
  '鸡胸肉': { cal: 133, protein: 31, carbs: 0, fat: 1.2, fiber: 0 },
  '排骨': { cal: 278, protein: 16.7, carbs: 0, fat: 23.1, fiber: 0 },
  '五花肉': { cal: 395, protein: 14.0, carbs: 0, fat: 37.0, fiber: 0 },
  // Seafood
  '虾': { cal: 87, protein: 16.8, carbs: 1.5, fat: 2.2, fiber: 0 },
  '虾仁': { cal: 48, protein: 10.4, carbs: 0, fat: 0.7, fiber: 0 },
  '鱼': { cal: 96, protein: 18.0, carbs: 0, fat: 2.5, fiber: 0 },
  '三文鱼': { cal: 208, protein: 20.4, carbs: 0, fat: 13.4, fiber: 0 },
  // Eggs & Dairy
  '鸡蛋': { cal: 144, protein: 13.3, carbs: 1.1, fat: 9.5, fiber: 0 },
  '牛奶': { cal: 54, protein: 3.0, carbs: 3.6, fat: 3.2, fiber: 0 },
  // Vegetables
  '番茄': { cal: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2 },
  '土豆': { cal: 77, protein: 2.0, carbs: 17.5, fat: 0.1, fiber: 2.2 },
  '胡萝卜': { cal: 41, protein: 0.9, carbs: 9.6, fat: 0.2, fiber: 2.8 },
  '洋葱': { cal: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7 },
  '青椒': { cal: 22, protein: 0.9, carbs: 4.6, fat: 0.2, fiber: 1.7 },
  '黄瓜': { cal: 15, protein: 0.7, carbs: 2.9, fat: 0.1, fiber: 0.5 },
  '白菜': { cal: 13, protein: 1.0, carbs: 2.2, fat: 0.1, fiber: 1.0 },
  '西兰花': { cal: 34, protein: 2.8, carbs: 6.6, fat: 0.4, fiber: 2.6 },
  '豆腐': { cal: 76, protein: 8.1, carbs: 1.9, fat: 3.7, fiber: 0.3 },
  // Staple
  '米饭': { cal: 116, protein: 2.6, carbs: 25.9, fat: 0.3, fiber: 0.3 },
  '面条': { cal: 110, protein: 3.4, carbs: 22.4, fat: 0.5, fiber: 1.0 },
  '面粉': { cal: 366, protein: 11.2, carbs: 73.6, fat: 1.5, fiber: 2.1 },
  // Seasonings (per 100ml/g, but amounts are usually small)
  '食用油': { cal: 884, protein: 0, carbs: 0, fat: 100, fiber: 0 },
  '生抽': { cal: 53, protein: 5.6, carbs: 5.0, fat: 0.1, fiber: 0 },
  '糖': { cal: 400, protein: 0, carbs: 100, fat: 0, fiber: 0 },
}

// Unit conversion to grams (approximate)
const unitToGrams: Record<string, number> = {
  'g': 1,
  'kg': 1000,
  'ml': 1,
  'L': 1000,
  '勺': 15,
  '汤匙': 15,
  '茶匙': 5,
  '碗': 200,
  '杯': 240,
  '个': 60,
  '块': 50,
  '片': 10,
  '棵': 200,
  '根': 100,
  '盒': 250,
  '袋': 100,
  '适量': 0,
  '少许': 0,
}

function estimateGrams(amount: number, unit: string): number {
  const factor = unitToGrams[unit] ?? 50 // default 50g
  return amount * factor
}

export function estimateNutrition(ingredients: Ingredient[]): Nutrition {
  let totalCal = 0
  let totalProtein = 0
  let totalCarbs = 0
  let totalFat = 0
  let totalFiber = 0

  for (const ing of ingredients) {
    const data = nutritionDB[ing.name]
    if (!data) continue

    const grams = estimateGrams(ing.amount, ing.unit)
    if (grams <= 0) continue

    const ratio = grams / 100
    totalCal += data.cal * ratio
    totalProtein += data.protein * ratio
    totalCarbs += data.carbs * ratio
    totalFat += data.fat * ratio
    totalFiber += data.fiber * ratio
  }

  return {
    calories: Math.round(totalCal),
    protein: Math.round(totalProtein * 10) / 10,
    carbs: Math.round(totalCarbs * 10) / 10,
    fat: Math.round(totalFat * 10) / 10,
    fiber: Math.round(totalFiber * 10) / 10,
  }
}

export function getCalorieLevel(cal: number): { label: string; color: string } {
  if (cal < 300) return { label: '低卡', color: 'bg-emerald-50 text-emerald-700' }
  if (cal <= 600) return { label: '适中', color: 'bg-amber-50 text-amber-700' }
  return { label: '高卡', color: 'bg-red-50 text-red-700' }
}

export function getMacroPercentages(nutrition: Nutrition) {
  const proteinCal = nutrition.protein * 4
  const carbsCal = nutrition.carbs * 4
  const fatCal = nutrition.fat * 9
  const total = proteinCal + carbsCal + fatCal
  if (total === 0) return { protein: 0, carbs: 0, fat: 0 }
  const protein = Math.round((proteinCal / total) * 100)
  const carbs = Math.round((carbsCal / total) * 100)
  // Derive fat from remainder to ensure sum is exactly 100
  const fat = 100 - protein - carbs
  return { protein, carbs, fat }
}
