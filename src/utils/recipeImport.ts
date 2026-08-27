import type { Ingredient, Step, Recipe, Category, Difficulty } from '@/types'

export interface ParsedRecipe {
  name: string
  category: Category
  difficulty: Difficulty
  duration: number
  servings: number
  tags: string[]
  ingredients: Ingredient[]
  steps: Step[]
}

// 常见单位与中文数量词正则
const UNIT_PATTERN =
  '(克|千克|kg|g|毫升|ml|l|升|勺|汤匙|茶匙|大勺|小勺|个|只|条|块|片|根|棵|瓣|张|颗|粒|碗|杯|罐|盒|袋|包|瓶|小块|朵|把|份|适量|少许|若干)'

const CHINESE_NUMBER_MAP: Record<string, number> = {
  '半': 0.5,
  '一': 1,
  '二': 2,
  '两': 2,
  '三': 3,
  '四': 4,
  '五': 5,
  '六': 6,
  '七': 7,
  '八': 8,
  '九': 9,
  '十': 10,
}

export function detectCategory(name: string, tags: string[] = []): Recipe['category'] {
  const text = (name + ' ' + tags.join(' ')).toLowerCase()
  if (/汤|羹|煲|炖汤|靓汤|盅/.test(text)) return 'soup'
  if (/凉拌|沙拉|凉菜|冷菜|拍黄瓜|口水鸡|泡菜|酱菜/.test(text)) return 'cold-dish'
  if (/甜品|蛋糕|饼干|甜点|布丁|慕斯|冰淇淋|泡芙|双皮奶|奶冻|杨枝甘露|西米露/.test(text)) return 'dessert'
  if (/饮品|茶|咖啡|果汁|奶昔|柠檬茶|奶茶|气泡水|特调|微醺|鸡尾酒/.test(text)) return 'drink'
  if (/饭|面|饺子|包子|馒头|饼|粥|粉|馄饨|意面|披萨|汉堡|饭团|三明治/.test(text)) return 'staple'
  return 'hot-dish'
}

export function detectDifficulty(stepsCount: number, duration: number): Recipe['difficulty'] {
  if (stepsCount <= 3 && duration <= 20) return 'easy'
  if (stepsCount >= 7 || duration >= 60) return 'hard'
  return 'medium'
}

// 将中文数字（如 "半勺"、"两勺"、"1/2"）转换为浮点数或数值
function normalizeAmount(amountStr: string): { amount: number; raw?: string } {
  if (!amountStr) return { amount: 0 }
  const trimmed = amountStr.trim()

  // 匹配分数 1/2, 1/4
  if (/^\d+\/\d+$/.test(trimmed)) {
    const [numerator, denominator] = trimmed.split('/').map(Number)
    if (denominator) return { amount: Math.round((numerator / denominator) * 100) / 100 }
  }

  // 匹配中文单个数字如 "半", "一", "两"
  if (CHINESE_NUMBER_MAP[trimmed] !== undefined) {
    return { amount: CHINESE_NUMBER_MAP[trimmed] }
  }

  // 匹配阿拉伯数字与区间 "1-2" 取平均或首值
  const rangeMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*[-~至到]\s*(\d+(?:\.\d+)?)/)
  if (rangeMatch) {
    const val1 = parseFloat(rangeMatch[1])
    const val2 = parseFloat(rangeMatch[2])
    return { amount: Math.round(((val1 + val2) / 2) * 10) / 10 }
  }

  const numMatch = trimmed.match(/(\d+(?:\.\d+)?)/)
  if (numMatch) {
    return { amount: parseFloat(numMatch[1]) }
  }

  return { amount: 0, raw: trimmed }
}

export function parseIngredientLine(rawLine: string): Ingredient[] {
  // 清理行首前缀如 "- ", "• ", "1. ", "【主料】" 等
  const line = rawLine
    .replace(/^[-\s*•●◆◇▪一二三四五六七八九十\d+.)、\]】:：]+\s*/, '')
    .trim()

  if (!line || line.length < 2) return []

  // 如果这一行是用 逗号、顿号、分号 或 多个空格 隔开的多个食材，拆分为多项解析
  // 如 "西红柿2个、鸡蛋3个、大葱半根、盐少许"
  const splitItems = line.split(/[，,、;；|]\s*/).filter(s => s.trim().length > 0)
  if (splitItems.length > 1) {
    const list: Ingredient[] = []
    for (const item of splitItems) {
      const parsed = parseSingleIngredient(item)
      if (parsed) list.push(parsed)
    }
    if (list.length > 0) return list
  }

  const single = parseSingleIngredient(line)
  return single ? [single] : []
}

function parseSingleIngredient(text: string): Ingredient | null {
  const cleaned = text
    .replace(/^[-*•●\s]+/, '')
    .replace(/[()（）]/g, ' ')
    .trim()

  if (!cleaned || cleaned.length < 1) return null

  // 匹配模式 1: "鸡胸肉 300g", "盐 2勺", "大蒜 3-4瓣", "生抽 1/2勺"
  const standardPattern = new RegExp(
    `^(.+?)[\\s:：]+((?:\\d+(?:\\.\\d+)?(?:\\s*[-~至到/]\\s*\\d+(?:\\.\\d+)?)?|[半一两二三四五六七八九十]+))\\s*(${UNIT_PATTERN}|适量|少许)?(?:\\s*(.*))?$`,
    'i'
  )
  const match1 = cleaned.match(standardPattern)
  if (match1) {
    const [, name, amountStr, unit = '', extra] = match1
    const { amount } = normalizeAmount(amountStr)
    const finalName = (name + (extra ? ` ${extra}` : '')).trim()
    return {
      id: '',
      name: finalName,
      amount,
      unit: unit || '份',
      type: detectIngredientType(finalName),
      scalable: !['适量', '少许'].includes(unit),
    }
  }

  // 匹配模式 2: 无空格紧凑格式，如 "土豆2个", "盐适量", "生姜3片", "五花肉500克"
  const compactPattern = new RegExp(
    `^([^0-9半一两二三四五六七八九十适量少许]+?)((?:\\d+(?:\\.\\d+)?|[半一两二三四五六七八九十]+))\\s*(${UNIT_PATTERN})?$`,
    'i'
  )
  const match2 = cleaned.match(compactPattern)
  if (match2) {
    const [, name, amountStr, unit = ''] = match2
    const { amount } = normalizeAmount(amountStr)
    return {
      id: '',
      name: name.trim(),
      amount,
      unit: unit || '个',
      type: detectIngredientType(name),
      scalable: true,
    }
  }

  // 匹配模式 3: "盐 适量", "白胡椒粉 少许"
  const vaguePattern = /^(.+?)[\s:：]*(适量|少许|若干)$/
  const match3 = cleaned.match(vaguePattern)
  if (match3) {
    const [, name, unit] = match3
    return {
      id: '',
      name: name.trim(),
      amount: 0,
      unit,
      type: 'seasoning',
      scalable: false,
    }
  }

  // 兜底单个名词
  return {
    id: '',
    name: cleaned,
    amount: 0,
    unit: '适量',
    type: detectIngredientType(cleaned),
    scalable: false,
  }
}

function detectIngredientType(name: string): Ingredient['type'] {
  const seasoningWords = [
    '盐', '糖', '生抽', '老抽', '酱油', '蚝油', '料酒', '醋', '油', '香油', '麻油',
    '胡椒粉', '辣椒粉', '花椒', '八角', '桂皮', '香叶', '孜然', '鸡精', '味精', '淀粉',
    '生粉', '番茄酱', '豆瓣酱', '沙茶酱', '黑胡椒', '黄油', '咖喱',
  ]
  const subWords = ['葱', '姜', '蒜', '香菜', '小米辣', '干辣椒', '芝麻', '柠檬', '薄荷']

  if (seasoningWords.some(s => name.includes(s))) return 'seasoning'
  if (subWords.some(s => name.includes(s))) return 'sub'
  return 'main'
}

export function parseStepLine(line: string, order: number): Step | null {
  // 清理数字前缀如 "1.", "1、", "Step 1:", "1️⃣", "①" 等
  const cleaned = line
    .replace(/^(\d+|[①-⑩❶-❿])[\s.、:：)\]）-]*\s*/u, '')
    .replace(/^(step|步骤|第[一二三四五六七八九十\d]+步)[\s:：-]*\d*[\s:：.]*/i, '')
    .trim()

  if (!cleaned || cleaned.length < 2) return null

  // 匹配时间信息 (如 "焯水5分钟", "大火焖5-8分", "腌制半小时", "静置30s", "煮15min")
  let timer: number | undefined
  const hourMatch = cleaned.match(/(?:腌制|发酵|静置|煲|炖|浸泡|烤|煮)[\s\S]*?(半|\d+)\s*(?:小时|个钟|h)/i)
  if (hourMatch) {
    timer = hourMatch[1] === '半' ? 30 : parseInt(hourMatch[1]) * 60
  } else {
    const minMatch = cleaned.match(/(?:煮|炖|焖|蒸|炸|炒|煎|烤|腌|泡|浸泡|静置|醒发?|发酵?|焯水|焯|微波|烘烤|熬)[\s\S]*?(\d+)(?:\s*[-~至到]\s*\d+)?\s*(?:分钟|分|min)/i)
    if (minMatch) {
      timer = parseInt(minMatch[1])
    } else {
      // 通用时长提取
      const generalMinMatch = cleaned.match(/(\d+)\s*(?:分钟|min)/i)
      if (generalMinMatch) {
        timer = parseInt(generalMinMatch[1])
      }
    }
  }

  return {
    order,
    description: cleaned,
    timer,
  }
}

// 智能清洗提取小红书/抖音等分享文本中的标题与话题标签
function extractTitleAndTags(text: string): { title: string; tags: string[]; cleanLines: string[] } {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const tags: string[] = []
  let title = ''

  // 提取 #标签
  const tagMatches = text.match(/#([^\s#]+)/g)
  if (tagMatches) {
    tagMatches.forEach(tag => {
      const cleanTag = tag.replace('#', '').trim()
      if (cleanTag && !tags.includes(cleanTag)) {
        tags.push(cleanTag)
      }
    })
  }

  const cleanLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // 过滤掉只有 #标签 的行
    if (/^(#[^\s#]+\s*)+$/.test(line)) continue

    // 寻找标题：带有【】《》或者第一行短文本
    if (!title) {
      const bracketMatch = line.match(/[【《](.+?)[】》]/)
      if (bracketMatch) {
        title = bracketMatch[1].trim()
      } else if (i === 0 && line.length <= 30 && !/食材|用料|做法|步骤/i.test(line)) {
        // 去除多余前缀如 "今日份快手菜！"
        title = line.replace(/^[\p{Extended_Pictographic}\s]+/u, '').replace(/[!！。~～]+$/, '').trim()
      }
    }

    cleanLines.push(line)
  }

  return { title: title || '未命名菜谱', tags, cleanLines }
}

export function parseRecipeFromText(text: string): ParsedRecipe {
  const { title, tags, cleanLines } = extractTitleAndTags(text)

  let name = title
  const ingredients: Ingredient[] = []
  const steps: Step[] = []

  const ingredientMarkers = ['用料', '食材', '材料', '原料', '配料', '主料', '辅料', '调料', '调味', '备料']
  const stepMarkers = ['做法', '步骤', '烹饪步骤', '制作步骤', '操作步骤', '步骤详解', '制作方法', '过程']
  const ignoreMarkers = ['小贴士', '注意事项', '温馨提示', 'Tips', '小提示', '总结']

  let currentSection: 'none' | 'ingredients' | 'steps' | 'ignore' = 'none'

  for (const line of cleanLines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // 检查分段标记
    const isIngredientHeader = ingredientMarkers.some(m => trimmed.startsWith(m) || trimmed.includes(`【${m}】`) || trimmed.includes(`[${m}]`))
    const isStepHeader = stepMarkers.some(m => trimmed.startsWith(m) || trimmed.includes(`【${m}】`) || trimmed.includes(`[${m}]`))
    const isIgnoreHeader = ignoreMarkers.some(m => trimmed.startsWith(m) || trimmed.includes(`【${m}】`))

    if (isIgnoreHeader) {
      currentSection = 'ignore'
      continue
    }

    if (isIngredientHeader) {
      currentSection = 'ingredients'
      // 检查 header 后面是否紧接着食材，如 "食材：西红柿2个，鸡蛋3个"
      const contentAfterColon = trimmed.replace(/^[^:：]*[:：]/, '').trim()
      if (contentAfterColon && contentAfterColon !== trimmed) {
        const parsedList = parseIngredientLine(contentAfterColon)
        parsedList.forEach(ing => ingredients.push(ing))
      }
      continue
    }

    if (isStepHeader) {
      currentSection = 'steps'
      const contentAfterColon = trimmed.replace(/^[^:：]*[:：]/, '').trim()
      if (contentAfterColon && contentAfterColon !== trimmed) {
        const step = parseStepLine(contentAfterColon, steps.length + 1)
        if (step) steps.push(step)
      }
      continue
    }

    if (currentSection === 'ignore') {
      continue
    }

    if (currentSection === 'ingredients') {
      const parsedList = parseIngredientLine(trimmed)
      parsedList.forEach(ing => ingredients.push(ing))
    } else if (currentSection === 'steps') {
      const step = parseStepLine(trimmed, steps.length + 1)
      if (step) steps.push(step)
    } else {
      // 尚未明确进入某个 Section，尝试智能探测
      if (!name || name === '未命名菜谱') {
        if (trimmed.length <= 25 && !/^[0-9一二三四五六七八九十]/.test(trimmed)) {
          name = trimmed.replace(/[【】《》]/g, '')
          continue
        }
      }

      // 如果行包含数字编号 (如 1. 2. ①)，推测为步骤
      if (/^(\d+|[①-⑩❶-❿])/.test(trimmed)) {
        const step = parseStepLine(trimmed, steps.length + 1)
        if (step) steps.push(step)
      }
    }
  }

  // 兜底：如果没明确分段，尝试从全文本提取食材
  if (ingredients.length === 0) {
    for (const line of cleanLines) {
      if (/^(\d+|[①-⑩❶-❿])/.test(line)) continue
      const parsed = parseIngredientLine(line)
      if (parsed.length > 0 && parsed.some(p => p.amount > 0 || p.unit)) {
        ingredients.push(...parsed)
      }
    }
  }

  // 兜底：如果没提取到步骤
  if (steps.length === 0) {
    let order = 1
    for (const line of cleanLines) {
      if (/^(\d+|[①-⑩❶-❿])/.test(line)) {
        const step = parseStepLine(line, order++)
        if (step) steps.push(step)
      }
    }
  }

  const category = detectCategory(name, tags)
  const duration = steps.reduce((sum, s) => sum + (s.timer || 5), 0) || 25
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
    throw new Error(`网络请求失败: ${response.status}`)
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
    parsed.forEach((p, subIdx) => {
      ingredients.push({ ...p, id: `import-${i}-${subIdx}` })
    })
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
    errors.push('未能识别菜名，请在上方手动完善')
  }
  if (recipe.ingredients.length === 0) {
    errors.push('未能识别食材清单，请至少添加一项')
  }
  if (recipe.steps.length === 0) {
    errors.push('未能识别做法步骤，请至少添加一个步骤')
  }
  return errors
}

const CATEGORY_MAP: Record<string, Category> = {
  '热菜': 'hot-dish',
  '凉菜': 'cold-dish',
  '汤羹': 'soup',
  '主食': 'staple',
  '甜品': 'dessert',
  '饮品': 'drink',
}

const DIFFICULTY_MAP: Record<string, Difficulty> = {
  '简单': 'easy',
  '中等': 'medium',
  '困难': 'hard',
}

export function parseRecipesFromMarkdown(mdContent: string): ParsedRecipe[] {
  if (!mdContent || !mdContent.trim()) return []

  // 按 "## " 或 "---" 拆分为多个菜谱块
  const rawSections = mdContent.split(/(?=\n##\s+)/).map((s) => s.trim()).filter(Boolean)
  const results: ParsedRecipe[] = []

  for (const section of rawSections) {
    // 忽略文档头部总目录或说明
    if (/^#+\s*(?:知味|目录|📑|📖)/.test(section) && !/###\s*(?:食材|用料|步骤)/.test(section)) {
      continue
    }

    const lines = section.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length === 0) continue

    let name = ''
    let category: Category = 'hot-dish'
    let difficulty: Difficulty = 'easy'
    let duration = 30
    let servings = 2
    let description = ''
    const tags: string[] = []
    const ingredients: Ingredient[] = []
    const steps: Step[] = []

    let inIngredients = false
    let inSteps = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // 提取标题 ## 菜名
      const headerMatch = line.match(/^#{1,3}\s+(.+)$/)
      if (headerMatch) {
        const rawHText = headerMatch[1].trim()
        const hText = rawHText.replace(/^[^\w\u4e00-\u9fa5]+/, '').trim()
        if (/(?:食材|用料|材料|配料)/.test(hText)) {
          inIngredients = true
          inSteps = false
          continue
        } else if (/(?:烹饪步骤|做法|步骤|制作方法)/.test(hText)) {
          inIngredients = false
          inSteps = true
          continue
        } else if (!name) {
          name = hText.replace(/^[0-9+.)、\s]+/, '').trim()
          continue
        }
      }

      // 属性行匹配
      const catMatch = line.match(/[-*•]\s*\*\*分类\*\*[：:]\s*(.+)/)
      if (catMatch) {
        const val = catMatch[1].trim()
        if (CATEGORY_MAP[val]) category = CATEGORY_MAP[val]
        continue
      }

      const diffMatch = line.match(/[-*•]\s*\*\*难度\*\*[：:]\s*(.+)/)
      if (diffMatch) {
        const val = diffMatch[1].trim()
        if (DIFFICULTY_MAP[val]) difficulty = DIFFICULTY_MAP[val]
        continue
      }

      const durMatch = line.match(/[-*•]\s*\*\*耗时\*\*[：:]\s*(\d+)/)
      if (durMatch) {
        duration = parseInt(durMatch[1])
        continue
      }

      const servMatch = line.match(/[-*•]\s*\*\*分量\*\*[：:]\s*(\d+)/)
      if (servMatch) {
        servings = parseInt(servMatch[1])
        continue
      }

      const tagMatch = line.match(/[-*•]\s*\*\*标签\*\*[：:]\s*(.+)/)
      if (tagMatch) {
        const rawTags = tagMatch[1].match(/#([^\s#]+)/g) || tagMatch[1].split(/[,，\s]+/)
        rawTags.forEach((t) => {
          const clean = t.replace('#', '').trim()
          if (clean && !tags.includes(clean)) tags.push(clean)
        })
        continue
      }

      if (line.startsWith('>') && !description && !inSteps) {
        description = line.replace(/^>\s*/, '').trim()
        continue
      }

      // 食材行
      if (inIngredients && /^[-*•]\s*(\[[ xX]\]\s*)?/.test(line)) {
        const cleanLine = line.replace(/^[-*•]\s*(\[[ xX]\]\s*)?/, '').replace(/\*\*/g, '').trim()
        const parsed = parseSingleIngredient(cleanLine)
        if (parsed) ingredients.push(parsed)
        continue
      }

      // 步骤行
      if (inSteps) {
        const stepMatch = line.match(/^(\d+)[.、\s]+(.+)$/)
        if (stepMatch) {
          const desc = stepMatch[2].trim()
          const parsedStep = parseStepLine(desc, steps.length + 1)
          if (parsedStep) steps.push(parsedStep)
          continue
        }
      }
    }

    if (name && (ingredients.length > 0 || steps.length > 0)) {
      results.push({
        name,
        category,
        difficulty,
        duration,
        servings,
        tags,
        ingredients,
        steps: steps.map((s, idx) => ({ ...s, order: idx + 1 })),
      })
    }
  }

  // 如果 Markdown 未使用标准 ## 分隔，尝试单篇自然语言回退
  if (results.length === 0) {
    const single = parseRecipeFromText(mdContent)
    if (single.name && single.name !== '未命名菜谱') {
      results.push(single)
    }
  }

  return results
}


