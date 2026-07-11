import type { Recipe } from '@/types'

const WORKER_API = 'https://recipe-app-api.nianshu2022.workers.dev'

interface AiRecipeRequest {
  ingredients: { name: string; amount: number; unit: string }[]
  servings: number
  preferences?: {
    maxDuration?: number
    difficulty?: 'easy' | 'medium' | 'hard'
    excludeCategories?: string[]
  }
}

interface AiRecipeResponse {
  name: string
  category: 'hot-dish' | 'cold-dish' | 'soup' | 'staple' | 'dessert' | 'drink'
  difficulty: 'easy' | 'medium' | 'hard'
  duration: number
  ingredients: { name: string; amount: number; unit: string }[]
  steps: { order: number; description: string }[]
}

function buildPrompt(request: AiRecipeRequest): string {
  const ingredientList = request.ingredients
    .map((i) => `${i.name} ${i.amount}${i.unit}`)
    .join('、')

  const constraints: string[] = []
  if (request.preferences?.maxDuration) {
    constraints.push(`烹饪时间不超过${request.preferences.maxDuration}分钟`)
  }
  if (request.preferences?.difficulty) {
    const diffMap = { easy: '简单', medium: '中等', hard: '困难' }
    constraints.push(`难度为${diffMap[request.preferences.difficulty]}`)
  }

  return `你是一位经验丰富的中餐大厨。请根据以下食材生成一道家常菜谱。

可用食材：${ingredientList}
用餐人数：${request.servings}人
${constraints.length > 0 ? '要求：' + constraints.join('，') : ''}

请严格按照以下JSON格式返回（不要包含其他内容）：
{
  "name": "菜名",
  "category": "hot-dish|cold-dish|soup|staple|dessert|drink",
  "difficulty": "easy|medium|hard",
  "duration": 烹饪时间（分钟）,
  "ingredients": [
    { "name": "食材名", "amount": 数量, "unit": "单位" }
  ],
  "steps": [
    { "order": 1, "description": "步骤描述" }
  ]
}`
}

export async function generateRecipeWithAI(
  request: AiRecipeRequest,
): Promise<Recipe | null> {
  try {
    const prompt = buildPrompt(request)

    const response = await fetch(`${WORKER_API}/api/ai/generate-recipe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })

    if (!response.ok) {
      console.error('AI generation failed:', response.statusText)
      return null
    }

    const data = await response.json()
    const recipeData: AiRecipeResponse = JSON.parse(data.content)

    const recipe: Recipe = {
      id: `ai-${Date.now()}`,
      userId: 'local',
      name: recipeData.name,
      category: recipeData.category,
      tags: ['AI生成', recipeData.category === 'hot-dish' ? '热菜' : recipeData.category === 'cold-dish' ? '凉菜' : '汤类'],
      difficulty: recipeData.difficulty,
      duration: recipeData.duration,
      servings: request.servings,
      ingredients: recipeData.ingredients.map((ing, i) => ({
        id: `ing-${i}`,
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        type: 'main' as const,
        scalable: true,
      })),
      steps: recipeData.steps.map((step) => ({
        order: step.order,
        description: step.description,
      })),
      nutrition: undefined,
      syncStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return recipe
  } catch (error) {
    console.error('AI recipe generation error:', error)
    return null
  }
}

export function generateFallbackRecipe(
  ingredients: { name: string; amount: number; unit: string }[],
  servings: number,
): Recipe {
  const mainIngredients = ingredients.filter((i) => i.amount > 0)
  const name = mainIngredients.length > 0
    ? `${mainIngredients[0].name}料理`
    : '家常小炒'

  return {
    id: `fallback-${Date.now()}`,
    userId: 'local',
    name,
    category: 'hot-dish',
    tags: ['快速料理'],
    difficulty: 'easy',
    duration: 20,
    servings,
    ingredients: ingredients.map((ing, i) => ({
      id: `ing-${i}`,
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      type: 'main' as const,
      scalable: true,
    })),
    steps: [
      { order: 1, description: '将食材洗净切好备用' },
      { order: 2, description: '热锅凉油，放入主料翻炒' },
      { order: 3, description: '加入调味料翻炒均匀' },
      { order: 4, description: '出锅装盘即可' },
    ],
    nutrition: undefined,
    syncStatus: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}
