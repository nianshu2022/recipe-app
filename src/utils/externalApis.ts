import type { Recipe, Ingredient } from '@/types'
import { generateId } from '@/utils/id'

// ─── TheMealDB ───────────────────────────────────────────────

const MEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1'

interface MealDbMeal {
  idMeal: string
  strMeal: string
  strCategory: string
  strArea: string
  strInstructions: string
  strMealThumb: string
  strTags: string | null
  [key: string]: string | null // strIngredient1~20, strMeasure1~20
}

const categoryMap: Record<string, Recipe['category']> = {
  Beef: 'hot-dish',
  Chicken: 'hot-dish',
  Lamb: 'hot-dish',
  Pork: 'hot-dish',
  Goat: 'hot-dish',
  Seafood: 'hot-dish',
  Pasta: 'staple',
  Rice: 'staple',
  Bread: 'staple',
  Side: 'cold-dish',
  Starter: 'cold-dish',
  Breakfast: 'staple',
  Dessert: 'dessert',
  Miscellaneous: 'hot-dish',
  Vegetarian: 'hot-dish',
  Vegan: 'hot-dish',
}

const unitTranslationMap: Record<string, string> = {
  g: '克',
  grams: '克',
  gram: '克',
  kg: '千克',
  kilograms: '千克',
  kilogram: '千克',
  ml: '毫升',
  mls: '毫升',
  l: '升',
  liters: '升',
  liter: '升',
  tsp: '茶匙',
  tsps: '茶匙',
  tbsp: '汤匙',
  tbsps: '汤匙',
  cup: '杯',
  cups: '杯',
  pinch: '少许',
  pinches: '少许',
  slice: '片',
  slices: '片',
  clove: '瓣',
  cloves: '瓣',
  can: '罐',
  cans: '罐',
  bag: '袋',
  bags: '袋',
  bottle: '瓶',
  bottles: '瓶',
}

function parseMealDbIngredients(meal: MealDbMeal): Ingredient[] {
  const ingredients: Ingredient[] = []
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`]?.trim()
    const measure = meal[`strMeasure${i}`]?.trim()
    if (!name) continue

    // 尝试从 measure 中解析数量和单位
    let amount = 0
    let unit = ''
    if (measure) {
      const match = measure.match(/^([\d./]+)\s*(.*)$/)
      if (match) {
        const raw = match[1]
        // 处理分数如 "3/4"
        if (raw.includes('/')) {
          const [num, den] = raw.split('/')
          amount = Number(num) / Number(den)
        } else {
          amount = Number(raw)
        }
        unit = match[2] || ''
      } else {
        unit = measure
      }
    }

    if (unit) {
      const normalizedUnit = unit.trim().toLowerCase().replace(/\.$/, '')
      if (unitTranslationMap[normalizedUnit]) {
        unit = unitTranslationMap[normalizedUnit]
      }
    }

    ingredients.push({
      id: generateId(),
      name,
      amount: isNaN(amount) ? 0 : amount,
      unit,
      type: i <= 8 ? 'main' : i <= 14 ? 'sub' : 'seasoning',
      scalable: true,
    })
  }
  return ingredients
}

function parseMealDbSteps(instructions: string): { order: number; description: string }[] {
  // 按换行或编号分割步骤
  const lines = instructions
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  // 合并过短的行
  const steps: string[] = []
  for (const line of lines) {
    // 去掉开头的编号如 "1." "Step 1"
    const cleaned = line.replace(/^(?:step\s*)?\d+[.):]?\s*/i, '').trim()
    if (cleaned.length < 3) continue
    steps.push(cleaned)
  }

  return steps.map((desc, i) => ({ order: i + 1, description: desc }))
}

export function convertMealDbToRecipe(meal: MealDbMeal): Recipe {
  const category = categoryMap[meal.strCategory] ?? 'hot-dish'
  const tags = meal.strTags
    ? meal.strTags.split(',').map((t) => t.trim()).filter(Boolean)
    : []
  tags.unshift('TheMealDB', meal.strArea)

  return {
    id: generateId(),
    userId: 'local',
    name: meal.strMeal,
    category,
    tags,
    coverImage: meal.strMealThumb,
    difficulty: 'medium',
    duration: 45,
    servings: 4,
    ingredients: parseMealDbIngredients(meal),
    steps: parseMealDbSteps(meal.strInstructions),
    syncStatus: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export async function fetchMealDbRandom(): Promise<MealDbMeal | null> {
  try {
    const res = await fetch(`${MEALDB_BASE}/random.php`)
    if (!res.ok) return null
    const data = await res.json()
    return data.meals?.[0] ?? null
  } catch {
    return null
  }
}

export async function fetchMealDbSearch(query: string): Promise<MealDbMeal[]> {
  try {
    const res = await fetch(`${MEALDB_BASE}/search.php?s=${encodeURIComponent(query)}`)
    if (!res.ok) return []
    const data = await res.json()
    return data.meals ?? []
  } catch {
    return []
  }
}

export async function fetchMealDbLookup(id: string): Promise<MealDbMeal | null> {
  try {
    const res = await fetch(`${MEALDB_BASE}/lookup.php?i=${encodeURIComponent(id)}`)
    if (!res.ok) return null
    const data = await res.json()
    return data.meals?.[0] ?? null
  } catch {
    return null
  }
}

// ─── Open Food Facts ─────────────────────────────────────────

interface OffProduct {
  product_name?: string
  brands?: string
  categories?: string
  image_url?: string
  nutriments?: {
    'energy-kcal_100g'?: number
    proteins_100g?: number
    carbohydrates_100g?: number
    fat_100g?: number
    fiber_100g?: number
  }
}

export interface OffResult {
  name: string
  brand: string
  category: string
  imageUrl: string | null
  nutriments: OffProduct['nutriments']
}

export async function fetchOpenFoodFacts(query: string): Promise<{ data: OffResult[]; error?: string }> {
  const apiUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&json=1&page_size=5`
  try {
    let res: Response
    try {
      res = await fetch(apiUrl)
    } catch {
      res = await fetch(`https://corsproxy.io/?${encodeURIComponent(apiUrl)}`)
    }
    if (!res.ok) return { data: [], error: `请求失败 (${res.status})` }
    const data = await res.json()
    const products: OffProduct[] = data.products ?? []
    const results = products
      .filter((p) => p.product_name)
      .map((p) => ({
        name: p.product_name!,
        brand: p.brands ?? '',
        category: p.categories?.split(',')[0]?.trim() ?? '',
        imageUrl: p.image_url ?? null,
        nutriments: p.nutriments,
      }))
    return { data: results }
  } catch (e) {
    return { data: [], error: e instanceof Error ? e.message : '网络请求失败' }
  }
}

export async function fetchProductByBarcode(barcode: string): Promise<{ data: OffResult | null; error?: string }> {
  const apiUrl = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`
  try {
    let res: Response
    try {
      res = await fetch(apiUrl)
    } catch {
      res = await fetch(`https://corsproxy.io/?${encodeURIComponent(apiUrl)}`)
    }
    if (!res.ok) return { data: null, error: `请求失败 (${res.status})` }
    const json = await res.json()
    if (json.status !== 1 || !json.product) {
      return { data: null }
    }
    const p = json.product
    return {
      data: {
        name: p.product_name || p.generic_name || '',
        brand: p.brands || '',
        category: p.categories?.split(',')[0]?.trim() || '',
        imageUrl: p.image_url || null,
        nutriments: p.nutriments,
      },
    }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : '网络请求失败' }
  }
}

// 本地常见食材列表
const LOCAL_INGREDIENTS: OffResult[] = [
  // ─── 肉类 ───
  { name: '猪肉', brand: '', category: '肉类', imageUrl: null, nutriments: { 'energy-kcal_100g': 242, proteins_100g: 27, carbohydrates_100g: 0, fat_100g: 14 } },
  { name: '牛肉', brand: '', category: '肉类', imageUrl: null, nutriments: { 'energy-kcal_100g': 250, proteins_100g: 26, carbohydrates_100g: 0, fat_100g: 15 } },
  { name: '鸡肉', brand: '', category: '肉类', imageUrl: null, nutriments: { 'energy-kcal_100g': 239, proteins_100g: 27, carbohydrates_100g: 0, fat_100g: 14 } },
  { name: '鸭肉', brand: '', category: '肉类', imageUrl: null, nutriments: { 'energy-kcal_100g': 201, proteins_100g: 23, carbohydrates_100g: 0, fat_100g: 11 } },
  { name: '羊肉', brand: '', category: '肉类', imageUrl: null, nutriments: { 'energy-kcal_100g': 294, proteins_100g: 25, carbohydrates_100g: 0, fat_100g: 21 } },
  { name: '排骨', brand: '', category: '肉类', imageUrl: null, nutriments: { 'energy-kcal_100g': 264, proteins_100g: 18, carbohydrates_100g: 0, fat_100g: 21 } },
  { name: '五花肉', brand: '', category: '肉类', imageUrl: null, nutriments: { 'energy-kcal_100g': 395, proteins_100g: 14, carbohydrates_100g: 0, fat_100g: 37 } },
  { name: '鸡胸肉', brand: '', category: '肉类', imageUrl: null, nutriments: { 'energy-kcal_100g': 165, proteins_100g: 31, carbohydrates_100g: 0, fat_100g: 3.6 } },
  { name: '鸡翅', brand: '', category: '肉类', imageUrl: null, nutriments: { 'energy-kcal_100g': 290, proteins_100g: 19, carbohydrates_100g: 0, fat_100g: 23 } },
  { name: '鸡腿', brand: '', category: '肉类', imageUrl: null, nutriments: { 'energy-kcal_100g': 181, proteins_100g: 20, carbohydrates_100g: 0, fat_100g: 11 } },
  { name: '培根', brand: '', category: '肉类', imageUrl: null, nutriments: { 'energy-kcal_100g': 541, proteins_100g: 37, carbohydrates_100g: 1.4, fat_100g: 42 } },
  { name: '里脊肉', brand: '', category: '肉类', imageUrl: null, nutriments: { 'energy-kcal_100g': 155, proteins_100g: 21, carbohydrates_100g: 0, fat_100g: 7.9 } },
  { name: '猪蹄', brand: '', category: '肉类', imageUrl: null, nutriments: { 'energy-kcal_100g': 260, proteins_100g: 23, carbohydrates_100g: 0, fat_100g: 18 } },
  { name: '牛腩', brand: '', category: '肉类', imageUrl: null, nutriments: { 'energy-kcal_100g': 280, proteins_100g: 22, carbohydrates_100g: 0, fat_100g: 20 } },
  { name: '牛排', brand: '', category: '肉类', imageUrl: null, nutriments: { 'energy-kcal_100g': 271, proteins_100g: 26, carbohydrates_100g: 0, fat_100g: 18 } },
  { name: '肉馅', brand: '', category: '肉类', imageUrl: null, nutriments: { 'energy-kcal_100g': 260, proteins_100g: 17, carbohydrates_100g: 0, fat_100g: 21 } },
  { name: '腊肉', brand: '', category: '肉类', imageUrl: null, nutriments: { 'energy-kcal_100g': 498, proteins_100g: 12, carbohydrates_100g: 2.6, fat_100g: 50 } },
  { name: '火腿', brand: '', category: '肉类', imageUrl: null, nutriments: { 'energy-kcal_100g': 214, proteins_100g: 17, carbohydrates_100g: 1.8, fat_100g: 15 } },
  { name: '猪肝', brand: '', category: '肉类', imageUrl: null, nutriments: { 'energy-kcal_100g': 129, proteins_100g: 19, carbohydrates_100g: 5, fat_100g: 3.5 } },
  // ─── 海鲜 ───
  { name: '虾', brand: '', category: '海鲜', imageUrl: null, nutriments: { 'energy-kcal_100g': 99, proteins_100g: 24, carbohydrates_100g: 0.2, fat_100g: 0.3 } },
  { name: '虾仁', brand: '', category: '海鲜', imageUrl: null, nutriments: { 'energy-kcal_100g': 93, proteins_100g: 20, carbohydrates_100g: 0.2, fat_100g: 1.1 } },
  { name: '鱼', brand: '', category: '海鲜', imageUrl: null, nutriments: { 'energy-kcal_100g': 96, proteins_100g: 20, carbohydrates_100g: 0, fat_100g: 1.5 } },
  { name: '三文鱼', brand: '', category: '海鲜', imageUrl: null, nutriments: { 'energy-kcal_100g': 208, proteins_100g: 20, carbohydrates_100g: 0, fat_100g: 13 } },
  { name: '鲈鱼', brand: '', category: '海鲜', imageUrl: null, nutriments: { 'energy-kcal_100g': 97, proteins_100g: 19, carbohydrates_100g: 0, fat_100g: 2 } },
  { name: '带鱼', brand: '', category: '海鲜', imageUrl: null, nutriments: { 'energy-kcal_100g': 127, proteins_100g: 18, carbohydrates_100g: 0, fat_100g: 5.6 } },
  { name: '鳕鱼', brand: '', category: '海鲜', imageUrl: null, nutriments: { 'energy-kcal_100g': 82, proteins_100g: 18, carbohydrates_100g: 0, fat_100g: 0.7 } },
  { name: '草鱼', brand: '', category: '海鲜', imageUrl: null, nutriments: { 'energy-kcal_100g': 113, proteins_100g: 17, carbohydrates_100g: 0, fat_100g: 5 } },
  { name: '鲫鱼', brand: '', category: '海鲜', imageUrl: null, nutriments: { 'energy-kcal_100g': 108, proteins_100g: 17, carbohydrates_100g: 0, fat_100g: 4.3 } },
  { name: '螃蟹', brand: '', category: '海鲜', imageUrl: null, nutriments: { 'energy-kcal_100g': 95, proteins_100g: 19, carbohydrates_100g: 0, fat_100g: 1.5 } },
  { name: '蛤蜊', brand: '', category: '海鲜', imageUrl: null, nutriments: { 'energy-kcal_100g': 74, proteins_100g: 12, carbohydrates_100g: 2.6, fat_100g: 1 } },
  { name: '鱿鱼', brand: '', category: '海鲜', imageUrl: null, nutriments: { 'energy-kcal_100g': 92, proteins_100g: 18, carbohydrates_100g: 1.6, fat_100g: 1.4 } },
  { name: '扇贝', brand: '', category: '海鲜', imageUrl: null, nutriments: { 'energy-kcal_100g': 69, proteins_100g: 14, carbohydrates_100g: 2.4, fat_100g: 0.6 } },
  { name: '海参', brand: '', category: '海鲜', imageUrl: null, nutriments: { 'energy-kcal_100g': 55, proteins_100g: 16, carbohydrates_100g: 0.5, fat_100g: 0.2 } },
  { name: '海带', brand: '', category: '海鲜', imageUrl: null, nutriments: { 'energy-kcal_100g': 12, proteins_100g: 1.7, carbohydrates_100g: 2, fat_100g: 0.1 } },
  { name: '紫菜', brand: '', category: '海鲜', imageUrl: null, nutriments: { 'energy-kcal_100g': 35, proteins_100g: 5.8, carbohydrates_100g: 4.4, fat_100g: 0.3 } },
  // ─── 蔬菜 ───
  { name: '白菜', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 13, proteins_100g: 1.5, carbohydrates_100g: 2.2, fat_100g: 0.1 } },
  { name: '菠菜', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 23, proteins_100g: 2.9, carbohydrates_100g: 3.6, fat_100g: 0.4 } },
  { name: '生菜', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 15, proteins_100g: 1.4, carbohydrates_100g: 2.9, fat_100g: 0.2 } },
  { name: '西兰花', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 34, proteins_100g: 2.8, carbohydrates_100g: 6.6, fat_100g: 0.4 } },
  { name: '花菜', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 25, proteins_100g: 1.9, carbohydrates_100g: 5, fat_100g: 0.3 } },
  { name: '胡萝卜', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 41, proteins_100g: 0.9, carbohydrates_100g: 10, fat_100g: 0.2 } },
  { name: '土豆', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 77, proteins_100g: 2, carbohydrates_100g: 17, fat_100g: 0.1 } },
  { name: '番茄', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 18, proteins_100g: 0.9, carbohydrates_100g: 3.9, fat_100g: 0.2 } },
  { name: '黄瓜', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 15, proteins_100g: 0.7, carbohydrates_100g: 3.6, fat_100g: 0.1 } },
  { name: '茄子', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 25, proteins_100g: 1, carbohydrates_100g: 5.9, fat_100g: 0.2 } },
  { name: '青椒', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 20, proteins_100g: 0.9, carbohydrates_100g: 4.6, fat_100g: 0.2 } },
  { name: '红椒', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 26, proteins_100g: 1, carbohydrates_100g: 6, fat_100g: 0.3 } },
  { name: '洋葱', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 40, proteins_100g: 1.1, carbohydrates_100g: 9.3, fat_100g: 0.1 } },
  { name: '大蒜', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 149, proteins_100g: 6.4, carbohydrates_100g: 33, fat_100g: 0.5 } },
  { name: '生姜', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 80, proteins_100g: 1.8, carbohydrates_100g: 18, fat_100g: 0.8 } },
  { name: '芹菜', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 16, proteins_100g: 0.7, carbohydrates_100g: 3, fat_100g: 0.2 } },
  { name: '韭菜', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 26, proteins_100g: 2.5, carbohydrates_100g: 4.6, fat_100g: 0.3 } },
  { name: '豆芽', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 31, proteins_100g: 3, carbohydrates_100g: 5.9, fat_100g: 0.1 } },
  { name: '蘑菇', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 22, proteins_100g: 3.1, carbohydrates_100g: 3.3, fat_100g: 0.3 } },
  { name: '香菇', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 34, proteins_100g: 2.2, carbohydrates_100g: 6.8, fat_100g: 0.5 } },
  { name: '金针菇', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 32, proteins_100g: 2.4, carbohydrates_100g: 6, fat_100g: 0.3 } },
  { name: '木耳', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 37, proteins_100g: 0.5, carbohydrates_100g: 65, fat_100g: 0.1 } },
  { name: '南瓜', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 26, proteins_100g: 1, carbohydrates_100g: 6.5, fat_100g: 0.1 } },
  { name: '冬瓜', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 12, proteins_100g: 0.4, carbohydrates_100g: 2.6, fat_100g: 0.2 } },
  { name: '苦瓜', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 17, proteins_100g: 1, carbohydrates_100g: 3.7, fat_100g: 0.2 } },
  { name: '丝瓜', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 20, proteins_100g: 1, carbohydrates_100g: 4.4, fat_100g: 0.2 } },
  { name: '莴笋', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 15, proteins_100g: 1.2, carbohydrates_100g: 2.8, fat_100g: 0.2 } },
  { name: '莲藕', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 74, proteins_100g: 2.6, carbohydrates_100g: 17, fat_100g: 0.2 } },
  { name: '山药', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 56, proteins_100g: 1.9, carbohydrates_100g: 12, fat_100g: 0.1 } },
  { name: '玉米', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 86, proteins_100g: 3.3, carbohydrates_100g: 19, fat_100g: 1.2 } },
  { name: '红薯', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 86, proteins_100g: 1.6, carbohydrates_100g: 20, fat_100g: 0.1 } },
  { name: '油麦菜', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 16, proteins_100g: 1.4, carbohydrates_100g: 2.1, fat_100g: 0.3 } },
  { name: '空心菜', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 19, proteins_100g: 2.6, carbohydrates_100g: 3.1, fat_100g: 0.2 } },
  { name: '茼蒿', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 20, proteins_100g: 1.9, carbohydrates_100g: 3.3, fat_100g: 0.3 } },
  { name: '香菜', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 23, proteins_100g: 2.1, carbohydrates_100g: 3.7, fat_100g: 0.5 } },
  { name: '大葱', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 30, proteins_100g: 1.8, carbohydrates_100g: 6.5, fat_100g: 0.3 } },
  { name: '小葱', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 27, proteins_100g: 1.6, carbohydrates_100g: 5.4, fat_100g: 0.3 } },
  { name: '小米椒', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 40, proteins_100g: 1.9, carbohydrates_100g: 8.8, fat_100g: 0.4 } },
  { name: '豆角', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 28, proteins_100g: 2, carbohydrates_100g: 5.5, fat_100g: 0.2 } },
  { name: '四季豆', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 31, proteins_100g: 1.8, carbohydrates_100g: 7, fat_100g: 0.1 } },
  { name: '毛豆', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 122, proteins_100g: 11, carbohydrates_100g: 9, fat_100g: 5 } },
  { name: '豌豆', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 81, proteins_100g: 5.4, carbohydrates_100g: 14, fat_100g: 0.4 } },
  { name: '秋葵', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 25, proteins_100g: 2, carbohydrates_100g: 4.3, fat_100g: 0.2 } },
  { name: '西葫芦', brand: '', category: '蔬菜', imageUrl: null, nutriments: { 'energy-kcal_100g': 17, proteins_100g: 1.2, carbohydrates_100g: 3.1, fat_100g: 0.3 } },
  // ─── 豆制品 ───
  { name: '豆腐', brand: '', category: '豆制品', imageUrl: null, nutriments: { 'energy-kcal_100g': 76, proteins_100g: 8, carbohydrates_100g: 1.9, fat_100g: 4.8 } },
  { name: '豆皮', brand: '', category: '豆制品', imageUrl: null, nutriments: { 'energy-kcal_100g': 409, proteins_100g: 44.6, carbohydrates_100g: 18.8, fat_100g: 17.4 } },
  { name: '豆腐干', brand: '', category: '豆制品', imageUrl: null, nutriments: { 'energy-kcal_100g': 140, proteins_100g: 16, carbohydrates_100g: 4.9, fat_100g: 5.6 } },
  { name: '腐竹', brand: '', category: '豆制品', imageUrl: null, nutriments: { 'energy-kcal_100g': 460, proteins_100g: 44.6, carbohydrates_100g: 22.3, fat_100g: 22.3 } },
  { name: '千张', brand: '', category: '豆制品', imageUrl: null, nutriments: { 'energy-kcal_100g': 262, proteins_100g: 24, carbohydrates_100g: 5, fat_100g: 16 } },
  { name: '豆浆', brand: '', category: '豆制品', imageUrl: null, nutriments: { 'energy-kcal_100g': 33, proteins_100g: 2.9, carbohydrates_100g: 1.6, fat_100g: 1.6 } },
  { name: '腐乳', brand: '', category: '豆制品', imageUrl: null, nutriments: { 'energy-kcal_100g': 133, proteins_100g: 12, carbohydrates_100g: 4.8, fat_100g: 8.2 } },
  { name: '豆豉', brand: '', category: '豆制品', imageUrl: null, nutriments: { 'energy-kcal_100g': 259, proteins_100g: 24, carbohydrates_100g: 30, fat_100g: 5.6 } },
  // ─── 干货/菌菇 ───
  { name: '银耳', brand: '', category: '干货', imageUrl: null, nutriments: { 'energy-kcal_100g': 200, proteins_100g: 10, carbohydrates_100g: 64, fat_100g: 1.4 } },
  { name: '莲子', brand: '', category: '干货', imageUrl: null, nutriments: { 'energy-kcal_100g': 350, proteins_100g: 17, carbohydrates_100g: 64, fat_100g: 2 } },
  { name: '红枣', brand: '', category: '干货', imageUrl: null, nutriments: { 'energy-kcal_100g': 264, proteins_100g: 3.2, carbohydrates_100g: 62, fat_100g: 0.5 } },
  { name: '枸杞', brand: '', category: '干货', imageUrl: null, nutriments: { 'energy-kcal_100g': 349, proteins_100g: 14, carbohydrates_100g: 64, fat_100g: 1.5 } },
  { name: '桂圆干', brand: '', category: '干货', imageUrl: null, nutriments: { 'energy-kcal_100g': 286, proteins_100g: 4.6, carbohydrates_100g: 65, fat_100g: 1 } },
  { name: '黄花菜', brand: '', category: '干货', imageUrl: null, nutriments: { 'energy-kcal_100g': 214, proteins_100g: 19, carbohydrates_100g: 35, fat_100g: 1.4 } },
  { name: '粉丝', brand: '', category: '干货', imageUrl: null, nutriments: { 'energy-kcal_100g': 338, proteins_100g: 0.5, carbohydrates_100g: 84, fat_100g: 0.1 } },
  { name: '粉条', brand: '', category: '干货', imageUrl: null, nutriments: { 'energy-kcal_100g': 337, proteins_100g: 0.5, carbohydrates_100g: 83, fat_100g: 0.1 } },
  { name: '紫菜干', brand: '', category: '干货', imageUrl: null, nutriments: { 'energy-kcal_100g': 250, proteins_100g: 27, carbohydrates_100g: 44, fat_100g: 1.5 } },
  { name: '虾皮', brand: '', category: '干货', imageUrl: null, nutriments: { 'energy-kcal_100g': 195, proteins_100g: 46, carbohydrates_100g: 0, fat_100g: 2.2 } },
  { name: '干贝', brand: '', category: '干货', imageUrl: null, nutriments: { 'energy-kcal_100g': 264, proteins_100g: 56, carbohydrates_100g: 5.1, fat_100g: 1.6 } },
  { name: '桂皮', brand: '', category: '干货', imageUrl: null, nutriments: { 'energy-kcal_100g': 247, proteins_100g: 3.9, carbohydrates_100g: 72, fat_100g: 2.7 } },
  // ─── 调料 ───
  { name: '盐', brand: '', category: '调料', imageUrl: null, nutriments: { 'energy-kcal_100g': 0, proteins_100g: 0, carbohydrates_100g: 0, fat_100g: 0 } },
  { name: '白糖', brand: '', category: '调料', imageUrl: null, nutriments: { 'energy-kcal_100g': 387, proteins_100g: 0, carbohydrates_100g: 100, fat_100g: 0 } },
  { name: '红糖', brand: '', category: '调料', imageUrl: null, nutriments: { 'energy-kcal_100g': 365, proteins_100g: 0.7, carbohydrates_100g: 95, fat_100g: 0 } },
  { name: '冰糖', brand: '', category: '调料', imageUrl: null, nutriments: { 'energy-kcal_100g': 397, proteins_100g: 0, carbohydrates_100g: 99, fat_100g: 0 } },
  { name: '蜂蜜', brand: '', category: '调料', imageUrl: null, nutriments: { 'energy-kcal_100g': 304, proteins_100g: 0.3, carbohydrates_100g: 82, fat_100g: 0 } },
  { name: '酱油', brand: '', category: '调料', imageUrl: null, nutriments: { 'energy-kcal_100g': 53, proteins_100g: 5.6, carbohydrates_100g: 5.4, fat_100g: 0.1 } },
  { name: '生抽', brand: '', category: '调料', imageUrl: null, nutriments: { 'energy-kcal_100g': 50, proteins_100g: 5.2, carbohydrates_100g: 5, fat_100g: 0.1 } },
  { name: '老抽', brand: '', category: '调料', imageUrl: null, nutriments: { 'energy-kcal_100g': 60, proteins_100g: 4, carbohydrates_100g: 8, fat_100g: 0.1 } },
  { name: '醋', brand: '', category: '调料', imageUrl: null, nutriments: { 'energy-kcal_100g': 18, proteins_100g: 0.4, carbohydrates_100g: 0.6, fat_100g: 0 } },
  { name: '陈醋', brand: '', category: '调料', imageUrl: null, nutriments: { 'energy-kcal_100g': 20, proteins_100g: 0.5, carbohydrates_100g: 0.8, fat_100g: 0 } },
  { name: '白醋', brand: '', category: '调料', imageUrl: null, nutriments: { 'energy-kcal_100g': 6, proteins_100g: 0.1, carbohydrates_100g: 0.9, fat_100g: 0 } },
  { name: '米醋', brand: '', category: '调料', imageUrl: null, nutriments: { 'energy-kcal_100g': 11, proteins_100g: 0.2, carbohydrates_100g: 2.2, fat_100g: 0 } },
  { name: '料酒', brand: '', category: '调料', imageUrl: null, nutriments: { 'energy-kcal_100g': 68, proteins_100g: 0.3, carbohydrates_100g: 2, fat_100g: 0 } },
  { name: '蚝油', brand: '', category: '调料', imageUrl: null, nutriments: { 'energy-kcal_100g': 104, proteins_100g: 3.3, carbohydrates_100g: 21, fat_100g: 0.3 } },
  { name: '豆瓣酱', brand: '', category: '调料', imageUrl: null, nutriments: { 'energy-kcal_100g': 178, proteins_100g: 12, carbohydrates_100g: 16, fat_100g: 6.8 } },
  { name: '甜面酱', brand: '', category: '调料', imageUrl: null, nutriments: { 'energy-kcal_100g': 136, proteins_100g: 5.5, carbohydrates_100g: 25, fat_100g: 1.3 } },
  { name: '芝麻酱', brand: '', category: '调料', imageUrl: null, nutriments: { 'energy-kcal_100g': 630, proteins_100g: 18, carbohydrates_100g: 16, fat_100g: 56 } },
  { name: '花生酱', brand: '', category: '调料', imageUrl: null, nutriments: { 'energy-kcal_100g': 594, proteins_100g: 25, carbohydrates_100g: 20, fat_100g: 51 } },
  { name: '番茄酱', brand: '', category: '调料', imageUrl: null, nutriments: { 'energy-kcal_100g': 82, proteins_100g: 1.6, carbohydrates_100g: 19, fat_100g: 0.2 } },
  { name: '芝麻油', brand: '', category: '调料', imageUrl: null, nutriments: { 'energy-kcal_100g': 884, proteins_100g: 0, carbohydrates_100g: 0, fat_100g: 100 } },
  { name: '辣椒油', brand: '', category: '调料', imageUrl: null, nutriments: { 'energy-kcal_100g': 870, proteins_100g: 0, carbohydrates_100g: 3, fat_100g: 95 } },
  { name: '花椒', brand: '', category: '调料', imageUrl: null, nutriments: { 'energy-kcal_100g': 296, proteins_100g: 6.7, carbohydrates_100g: 68, fat_100g: 3.3 } },
  { name: '八角', brand: '', category: '调料', imageUrl: null, nutriments: { 'energy-kcal_100g': 337, proteins_100g: 3.8, carbohydrates_100g: 76, fat_100g: 5.6 } },
  { name: '干辣椒', brand: '', category: '调料', imageUrl: null, nutriments: { 'energy-kcal_100g': 282, proteins_100g: 12, carbohydrates_100g: 52, fat_100g: 8.2 } },
  { name: '淀粉', brand: '', category: '调料', imageUrl: null, nutriments: { 'energy-kcal_100g': 358, proteins_100g: 0.3, carbohydrates_100g: 88, fat_100g: 0.1 } },
  { name: '胡椒粉', brand: '', category: '调料', imageUrl: null, nutriments: { 'energy-kcal_100g': 251, proteins_100g: 10, carbohydrates_100g: 64, fat_100g: 3.3 } },
  { name: '花椒粉', brand: '', category: '调料', imageUrl: null, nutriments: { 'energy-kcal_100g': 296, proteins_100g: 6.7, carbohydrates_100g: 68, fat_100g: 3.3 } },
  { name: '五香粉', brand: '', category: '调料', imageUrl: null, nutriments: { 'energy-kcal_100g': 298, proteins_100g: 10, carbohydrates_100g: 58, fat_100g: 6 } },
  { name: '孜然粉', brand: '', category: '调料', imageUrl: null, nutriments: { 'energy-kcal_100g': 322, proteins_100g: 17, carbohydrates_100g: 52, fat_100g: 10 } },
  { name: '咖喱粉', brand: '', category: '调料', imageUrl: null, nutriments: { 'energy-kcal_100g': 325, proteins_100g: 13, carbohydrates_100g: 56, fat_100g: 14 } },
  { name: '十三香', brand: '', category: '调料', imageUrl: null, nutriments: { 'energy-kcal_100g': 290, proteins_100g: 9, carbohydrates_100g: 55, fat_100g: 5.5 } },
  { name: '沙拉酱', brand: '', category: '调料', imageUrl: null, nutriments: { 'energy-kcal_100g': 680, proteins_100g: 1, carbohydrates_100g: 3, fat_100g: 74 } },
  { name: '食用油', brand: '', category: '调料', imageUrl: null, nutriments: { 'energy-kcal_100g': 884, proteins_100g: 0, carbohydrates_100g: 0, fat_100g: 100 } },
  { name: '橄榄油', brand: '', category: '调料', imageUrl: null, nutriments: { 'energy-kcal_100g': 884, proteins_100g: 0, carbohydrates_100g: 0, fat_100g: 100 } },
  // ─── 主食 ───
  { name: '大米', brand: '', category: '主食', imageUrl: null, nutriments: { 'energy-kcal_100g': 130, proteins_100g: 2.7, carbohydrates_100g: 28, fat_100g: 0.3 } },
  { name: '面粉', brand: '', category: '主食', imageUrl: null, nutriments: { 'energy-kcal_100g': 364, proteins_100g: 10, carbohydrates_100g: 76, fat_100g: 1.5 } },
  { name: '面条', brand: '', category: '主食', imageUrl: null, nutriments: { 'energy-kcal_100g': 138, proteins_100g: 4.5, carbohydrates_100g: 25, fat_100g: 2.1 } },
  { name: '馒头', brand: '', category: '主食', imageUrl: null, nutriments: { 'energy-kcal_100g': 221, proteins_100g: 7, carbohydrates_100g: 45, fat_100g: 1.1 } },
  { name: '米粉', brand: '', category: '主食', imageUrl: null, nutriments: { 'energy-kcal_100g': 108, proteins_100g: 2.5, carbohydrates_100g: 25, fat_100g: 0.3 } },
  { name: '河粉', brand: '', category: '主食', imageUrl: null, nutriments: { 'energy-kcal_100g': 110, proteins_100g: 2.2, carbohydrates_100g: 25, fat_100g: 0.3 } },
  { name: '年糕', brand: '', category: '主食', imageUrl: null, nutriments: { 'energy-kcal_100g': 154, proteins_100g: 3.3, carbohydrates_100g: 34, fat_100g: 0.3 } },
  { name: '饺子皮', brand: '', category: '主食', imageUrl: null, nutriments: { 'energy-kcal_100g': 260, proteins_100g: 8, carbohydrates_100g: 53, fat_100g: 1.2 } },
  { name: '方便面', brand: '', category: '主食', imageUrl: null, nutriments: { 'energy-kcal_100g': 452, proteins_100g: 9.5, carbohydrates_100g: 62, fat_100g: 19 } },
  { name: '糯米', brand: '', category: '主食', imageUrl: null, nutriments: { 'energy-kcal_100g': 348, proteins_100g: 7.3, carbohydrates_100g: 78, fat_100g: 1 } },
  { name: '小米', brand: '', category: '主食', imageUrl: null, nutriments: { 'energy-kcal_100g': 358, proteins_100g: 9, carbohydrates_100g: 73, fat_100g: 3.1 } },
  { name: '燕麦', brand: '', category: '主食', imageUrl: null, nutriments: { 'energy-kcal_100g': 367, proteins_100g: 15, carbohydrates_100g: 66, fat_100g: 6.7 } },
  { name: '面包', brand: '', category: '主食', imageUrl: null, nutriments: { 'energy-kcal_100g': 265, proteins_100g: 9, carbohydrates_100g: 49, fat_100g: 3.2 } },
  // ─── 蛋奶 ───
  { name: '鸡蛋', brand: '', category: '蛋奶', imageUrl: null, nutriments: { 'energy-kcal_100g': 155, proteins_100g: 13, carbohydrates_100g: 1.1, fat_100g: 11 } },
  { name: '鸭蛋', brand: '', category: '蛋奶', imageUrl: null, nutriments: { 'energy-kcal_100g': 180, proteins_100g: 13, carbohydrates_100g: 3.1, fat_100g: 13 } },
  { name: '鹌鹑蛋', brand: '', category: '蛋奶', imageUrl: null, nutriments: { 'energy-kcal_100g': 160, proteins_100g: 13, carbohydrates_100g: 0.4, fat_100g: 11 } },
  { name: '皮蛋', brand: '', category: '蛋奶', imageUrl: null, nutriments: { 'energy-kcal_100g': 171, proteins_100g: 14, carbohydrates_100g: 4.5, fat_100g: 10 } },
  { name: '牛奶', brand: '', category: '蛋奶', imageUrl: null, nutriments: { 'energy-kcal_100g': 42, proteins_100g: 3.4, carbohydrates_100g: 5, fat_100g: 1 } },
  { name: '酸奶', brand: '', category: '蛋奶', imageUrl: null, nutriments: { 'energy-kcal_100g': 59, proteins_100g: 3.5, carbohydrates_100g: 4.7, fat_100g: 3.3 } },
  { name: '芝士', brand: '', category: '蛋奶', imageUrl: null, nutriments: { 'energy-kcal_100g': 402, proteins_100g: 25, carbohydrates_100g: 1.3, fat_100g: 33 } },
  { name: '黄油', brand: '', category: '蛋奶', imageUrl: null, nutriments: { 'energy-kcal_100g': 717, proteins_100g: 0.9, carbohydrates_100g: 0.1, fat_100g: 81 } },
  { name: '奶油', brand: '', category: '蛋奶', imageUrl: null, nutriments: { 'energy-kcal_100g': 340, proteins_100g: 2.1, carbohydrates_100g: 2.8, fat_100g: 37 } },
  { name: '炼乳', brand: '', category: '蛋奶', imageUrl: null, nutriments: { 'energy-kcal_100g': 321, proteins_100g: 8, carbohydrates_100g: 54, fat_100g: 8.7 } },
  // ─── 坚果/干果 ───
  { name: '花生', brand: '', category: '坚果', imageUrl: null, nutriments: { 'energy-kcal_100g': 567, proteins_100g: 26, carbohydrates_100g: 16, fat_100g: 49 } },
  { name: '核桃', brand: '', category: '坚果', imageUrl: null, nutriments: { 'energy-kcal_100g': 654, proteins_100g: 15, carbohydrates_100g: 14, fat_100g: 65 } },
  { name: '杏仁', brand: '', category: '坚果', imageUrl: null, nutriments: { 'energy-kcal_100g': 579, proteins_100g: 21, carbohydrates_100g: 22, fat_100g: 50 } },
  { name: '腰果', brand: '', category: '坚果', imageUrl: null, nutriments: { 'energy-kcal_100g': 553, proteins_100g: 18, carbohydrates_100g: 30, fat_100g: 44 } },
  { name: '松子', brand: '', category: '坚果', imageUrl: null, nutriments: { 'energy-kcal_100g': 673, proteins_100g: 14, carbohydrates_100g: 13, fat_100g: 68 } },
  { name: '开心果', brand: '', category: '坚果', imageUrl: null, nutriments: { 'energy-kcal_100g': 560, proteins_100g: 20, carbohydrates_100g: 28, fat_100g: 45 } },
  { name: '瓜子', brand: '', category: '坚果', imageUrl: null, nutriments: { 'energy-kcal_100g': 575, proteins_100g: 24, carbohydrates_100g: 13, fat_100g: 50 } },
  { name: '黑芝麻', brand: '', category: '坚果', imageUrl: null, nutriments: { 'energy-kcal_100g': 559, proteins_100g: 18, carbohydrates_100g: 24, fat_100g: 46 } },
  { name: '白芝麻', brand: '', category: '坚果', imageUrl: null, nutriments: { 'energy-kcal_100g': 573, proteins_100g: 18, carbohydrates_100g: 22, fat_100g: 50 } },
  { name: '葡萄干', brand: '', category: '坚果', imageUrl: null, nutriments: { 'energy-kcal_100g': 299, proteins_100g: 3.1, carbohydrates_100g: 79, fat_100g: 0.5 } },
  // ─── 水果 ───
  { name: '苹果', brand: '', category: '水果', imageUrl: null, nutriments: { 'energy-kcal_100g': 52, proteins_100g: 0.3, carbohydrates_100g: 14, fat_100g: 0.2 } },
  { name: '香蕉', brand: '', category: '水果', imageUrl: null, nutriments: { 'energy-kcal_100g': 89, proteins_100g: 1.1, carbohydrates_100g: 23, fat_100g: 0.3 } },
  { name: '橙子', brand: '', category: '水果', imageUrl: null, nutriments: { 'energy-kcal_100g': 47, proteins_100g: 0.9, carbohydrates_100g: 12, fat_100g: 0.1 } },
  { name: '柠檬', brand: '', category: '水果', imageUrl: null, nutriments: { 'energy-kcal_100g': 29, proteins_100g: 1.1, carbohydrates_100g: 9.3, fat_100g: 0.3 } },
  { name: '葡萄', brand: '', category: '水果', imageUrl: null, nutriments: { 'energy-kcal_100g': 69, proteins_100g: 0.7, carbohydrates_100g: 18, fat_100g: 0.2 } },
  { name: '草莓', brand: '', category: '水果', imageUrl: null, nutriments: { 'energy-kcal_100g': 32, proteins_100g: 0.7, carbohydrates_100g: 7.7, fat_100g: 0.3 } },
  { name: '西瓜', brand: '', category: '水果', imageUrl: null, nutriments: { 'energy-kcal_100g': 30, proteins_100g: 0.6, carbohydrates_100g: 7.6, fat_100g: 0.2 } },
  { name: '芒果', brand: '', category: '水果', imageUrl: null, nutriments: { 'energy-kcal_100g': 60, proteins_100g: 0.8, carbohydrates_100g: 15, fat_100g: 0.4 } },
  { name: '猕猴桃', brand: '', category: '水果', imageUrl: null, nutriments: { 'energy-kcal_100g': 61, proteins_100g: 1.1, carbohydrates_100g: 15, fat_100g: 0.5 } },
  { name: '桃子', brand: '', category: '水果', imageUrl: null, nutriments: { 'energy-kcal_100g': 39, proteins_100g: 0.9, carbohydrates_100g: 10, fat_100g: 0.3 } },
  { name: '梨', brand: '', category: '水果', imageUrl: null, nutriments: { 'energy-kcal_100g': 57, proteins_100g: 0.4, carbohydrates_100g: 15, fat_100g: 0.1 } },
  { name: '荔枝', brand: '', category: '水果', imageUrl: null, nutriments: { 'energy-kcal_100g': 66, proteins_100g: 0.8, carbohydrates_100g: 17, fat_100g: 0.4 } },
  { name: '樱桃', brand: '', category: '水果', imageUrl: null, nutriments: { 'energy-kcal_100g': 50, proteins_100g: 1, carbohydrates_100g: 12, fat_100g: 0.3 } },
  { name: '柚子', brand: '', category: '水果', imageUrl: null, nutriments: { 'energy-kcal_100g': 38, proteins_100g: 0.8, carbohydrates_100g: 10, fat_100g: 0.1 } },
  { name: '火龙果', brand: '', category: '水果', imageUrl: null, nutriments: { 'energy-kcal_100g': 55, proteins_100g: 1.1, carbohydrates_100g: 13, fat_100g: 0.4 } },
  { name: '蓝莓', brand: '', category: '水果', imageUrl: null, nutriments: { 'energy-kcal_100g': 57, proteins_100g: 0.7, carbohydrates_100g: 14, fat_100g: 0.3 } },
  { name: '菠萝', brand: '', category: '水果', imageUrl: null, nutriments: { 'energy-kcal_100g': 50, proteins_100g: 0.5, carbohydrates_100g: 13, fat_100g: 0.1 } },
  { name: '山楂', brand: '', category: '水果', imageUrl: null, nutriments: { 'energy-kcal_100g': 95, proteins_100g: 0.5, carbohydrates_100g: 25, fat_100g: 0.6 } },
  { name: '榴莲', brand: '', category: '水果', imageUrl: null, nutriments: { 'energy-kcal_100g': 147, proteins_100g: 1.5, carbohydrates_100g: 27, fat_100g: 5.3 } },
  { name: '哈密瓜', brand: '', category: '水果', imageUrl: null, nutriments: { 'energy-kcal_100g': 34, proteins_100g: 0.8, carbohydrates_100g: 8.2, fat_100g: 0.2 } },
  // ─── 饮品 ───
  { name: '可乐', brand: '', category: '饮品', imageUrl: null, nutriments: { 'energy-kcal_100g': 42, proteins_100g: 0, carbohydrates_100g: 11, fat_100g: 0 } },
  { name: '啤酒', brand: '', category: '饮品', imageUrl: null, nutriments: { 'energy-kcal_100g': 43, proteins_100g: 0.5, carbohydrates_100g: 3.6, fat_100g: 0 } },
  { name: '椰汁', brand: '', category: '饮品', imageUrl: null, nutriments: { 'energy-kcal_100g': 20, proteins_100g: 0.7, carbohydrates_100g: 3.7, fat_100g: 0.2 } },
  { name: '乌梅', brand: '', category: '饮品', imageUrl: null, nutriments: { 'energy-kcal_100g': 260, proteins_100g: 3.4, carbohydrates_100g: 63, fat_100g: 0.8 } },
  { name: '陈皮', brand: '', category: '饮品', imageUrl: null, nutriments: { 'energy-kcal_100g': 278, proteins_100g: 8, carbohydrates_100g: 65, fat_100g: 1.4 } },
  { name: '甘草', brand: '', category: '饮品', imageUrl: null, nutriments: { 'energy-kcal_100g': 305, proteins_100g: 5, carbohydrates_100g: 70, fat_100g: 0.6 } },
  // ─── 其他 ───
  { name: '椰浆', brand: '', category: '其他', imageUrl: null, nutriments: { 'energy-kcal_100g': 230, proteins_100g: 2.3, carbohydrates_100g: 6, fat_100g: 24 } },
  { name: '椰蓉', brand: '', category: '其他', imageUrl: null, nutriments: { 'energy-kcal_100g': 660, proteins_100g: 6.9, carbohydrates_100g: 24, fat_100g: 65 } },
  { name: '巧克力', brand: '', category: '其他', imageUrl: null, nutriments: { 'energy-kcal_100g': 546, proteins_100g: 5, carbohydrates_100g: 60, fat_100g: 31 } },
  { name: '面包糠', brand: '', category: '其他', imageUrl: null, nutriments: { 'energy-kcal_100g': 395, proteins_100g: 13, carbohydrates_100g: 72, fat_100g: 5.3 } },
  { name: '吉利丁', brand: '', category: '其他', imageUrl: null, nutriments: { 'energy-kcal_100g': 343, proteins_100g: 86, carbohydrates_100g: 0, fat_100g: 0.2 } },
]

export function searchLocalIngredients(query: string): OffResult[] {
  const q = query.toLowerCase()
  return LOCAL_INGREDIENTS.filter((item) =>
    item.name.toLowerCase().includes(q) ||
    item.category.toLowerCase().includes(q)
  ).slice(0, 8)
}
