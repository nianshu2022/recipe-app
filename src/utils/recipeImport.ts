import type { Ingredient, Step, Recipe } from '@/types'

interface ParsedRecipe {
  name: string
  category: Recipe['category']
  difficulty: Recipe['difficulty']
  duration: number
  servings: number
  tags: string[]
  ingredients: Ingredient[]
  steps: Step[]
}

function detectCategory(name: string, tags: string[]): Recipe['category'] {
  const text = (name + ' ' + tags.join(' ')).toLowerCase()
  if (/汤|羹|煲/.test(text)) return 'soup'
  if (/凉拌|沙拉|凉菜|冷菜/.test(text)) return 'cold-dish'
  if (/甜品|蛋糕|饼干|甜点|布丁|慕斯/.test(text)) return 'dessert'
  if (/饮品|茶|咖啡|果汁|奶昔/.test(text)) return 'drink'
  if (/饭|面|饺子|包子|馒头|饼|粥|粉/.test(text)) return 'staple'
  return 'hot-dish'
}

function detectDifficulty(steps: number, duration: number): Recipe['difficulty'] {
  if (steps <= 3 && duration <= 20) return 'easy'
  if (steps >= 7 || duration >= 60) return 'hard'
  return 'medium'
}

function parseIngredientLine(line: string): Ingredient | null {
  const cleaned = line.replace(/^[-•●◆◇▪]\s*/, '').trim()
  if (!cleaned || cleaned.length < 2) return null

  const unitPattern = '(克|千克|毫升|升|勺|汤匙|茶匙|个|块|片|根|棵|瓣|张|颗|条|只|碗|杯|罐|盒|袋|包|瓶|粒|小块|朵|适量|少许)'
  const amountPattern = `(\\d+(?:\\.\\d+)?(?:\\s*[-~]\\s*\\d+(?:\\.\\d+)?)?)\\s*${unitPattern}\\s*`

  const match = cleaned.match(new RegExp(`^(.+?)\\s+${amountPattern}(.+)$`))

  if (match) {
    const [, name, amountStr, unit, desc] = match
    const amountMatch = amountStr.match(/(\d+(?:\.\d+)?)/)
    return {
      id: '',
      name: (name + (desc ? ' ' + desc : '')).trim(),
      amount: amountMatch ? parseFloat(amountMatch[1]) : 0,
      unit: unit,
      type: 'main',
      scalable: true,
    }
  }

  const simpleMatch = cleaned.match(new RegExp(`^(.+?)\\s+${unitPattern}$`))
  if (simpleMatch) {
    return {
      id: '',
      name: simpleMatch[1].trim(),
      amount: 0,
      unit: simpleMatch[2],
      type: 'main',
      scalable: true,
    }
  }

  return {
    id: '',
    name: cleaned,
    amount: 0,
    unit: '',
    type: 'main',
    scalable: true,
  }
}

function parseStepLine(line: string, order: number): Step | null {
  const cleaned = line.replace(/^\d+[.、)\]）]\s*/, '').trim()
  if (!cleaned || cleaned.length < 2) return null

  const timerMatch = cleaned.match(/(?:煮|炖|焖|蒸|炸|炒|煎|烤|腌|泡|浸泡|静置|醒发?|发酵?)[\s\S]*?(\d+)\s*(?:分钟|分钟|分)/)
  const timer = timerMatch ? parseInt(timerMatch[1]) : undefined

  return {
    order,
    description: cleaned,
    timer,
  }
}

export function parseRecipeFromText(text: string): ParsedRecipe {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  let name = ''
  let ingredients: Ingredient[] = []
  let steps: Step[] = []
  let tags: string[] = []

  const ingredientSectionMarkers = ['用料', '食材', '材料', '原料', '配料', '主料', '调料']
  const stepSectionMarkers = ['做法', '步骤', '烹饪步骤', '制作步骤', '操作步骤', '步骤详解']

  let currentSection: 'none' | 'ingredients' | 'steps' = 'none'

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    if (!name && trimmed.length <= 30 && !/^[0-9]/.test(trimmed)) {
      name = trimmed
      continue
    }

    if (ingredientSectionMarkers.some(m => trimmed.includes(m))) {
      currentSection = 'ingredients'
      continue
    }
    if (stepSectionMarkers.some(m => trimmed.includes(m))) {
      currentSection = 'steps'
      continue
    }

    if (currentSection === 'ingredients') {
      const ing = parseIngredientLine(trimmed)
      if (ing) ingredients.push(ing)
    } else if (currentSection === 'steps') {
      const step = parseStepLine(trimmed, steps.length + 1)
      if (step) steps.push(step)
    }
  }

  if (ingredients.length === 0) {
    for (const line of lines) {
      const ing = parseIngredientLine(line)
      if (ing && ing.unit) ingredients.push(ing)
    }
  }

  if (steps.length === 0) {
    let stepNum = 1
    for (const line of lines) {
      if (/^\d+[.、)\]）]/.test(line)) {
        const step = parseStepLine(line, stepNum++)
        if (step) steps.push(step)
      }
    }
  }

  const category = detectCategory(name, tags)
  const duration = steps.reduce((sum, s) => sum + (s.timer || 5), 0) || 30
  const difficulty = detectDifficulty(steps.length, duration)

  return {
    name: name || '未命名菜谱',
    category,
    difficulty,
    duration,
    servings: 2,
    tags,
    ingredients: ingredients.map((ing, i) => ({ ...ing, id: `import-${i}` })),
    steps: steps.map((step, i) => ({ ...step, order: i + 1 })),
  }
}

export async function fetchAndParseRecipe(url: string): Promise<ParsedRecipe> {
  const response = await fetch(url, {
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    },
  })

  if (!response.ok) {
    throw new Error(`请求失败: ${response.status}`)
  }

  const html = await response.text()
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  const titleEl = doc.querySelector('h1') || doc.querySelector('.recipe-name, .dish-name, [class*="title"]')
  const name = titleEl?.textContent?.trim() || ''

  const ingredientEls = doc.querySelectorAll('.ingredient-item, [class*="ingredient"] li, [class*="material"] li, [class*="food"] li')
  const ingredients: Ingredient[] = []
  ingredientEls.forEach((el, i) => {
    const text = el.textContent?.trim() || ''
    const parsed = parseIngredientLine(text)
    if (parsed) {
      ingredients.push({ ...parsed, id: `import-${i}` })
    }
  })

  const stepEls = doc.querySelectorAll('.step-item, [class*="step"] p, [class*="step"] li, [class*="practice"] p')
  const steps: Step[] = []
  stepEls.forEach((el, i) => {
    const text = el.textContent?.trim() || ''
    const parsed = parseStepLine(text, i + 1)
    if (parsed) {
      steps.push(parsed)
    }
  })

  if (ingredients.length === 0 && steps.length === 0) {
    const bodyText = doc.body?.textContent || ''
    return parseRecipeFromText(bodyText)
  }

  const duration = steps.reduce((sum, s) => sum + (s.timer || 5), 0) || 30
  const difficulty = detectDifficulty(steps.length, duration)

  return {
    name: name || '未命名菜谱',
    category: detectCategory(name, []),
    difficulty,
    duration,
    servings: 2,
    tags: [],
    ingredients,
    steps: steps.map((step, i) => ({ ...step, order: i + 1 })),
  }
}

export function validateRecipeForImport(recipe: ParsedRecipe): string[] {
  const errors: string[] = []
  if (!recipe.name || recipe.name === '未命名菜谱') {
    errors.push('未能识别菜名，请手动输入')
  }
  if (recipe.ingredients.length === 0) {
    errors.push('未能识别食材，请手动添加')
  }
  if (recipe.steps.length === 0) {
    errors.push('未能识别步骤，请手动添加')
  }
  return errors
}
