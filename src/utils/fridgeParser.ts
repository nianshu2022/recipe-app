export interface ParsedFridgeItem {
  id: string
  name: string
  amount: number
  unit: string
  category: string
  daysUntilExpiry: number
  expiryDate: string
}

const CATEGORY_RULES: { category: string; keywords: string[]; defaultDays: number }[] = [
  {
    category: '蔬菜',
    keywords: [
      '菜', '菠菜', '白菜', '生菜', '青菜', '油菜', '油麦菜', '芹菜', '空心菜', '茼蒿', '韭菜',
      '西红柿', '番茄', '黄瓜', '茄子', '辣椒', '青椒', '彩椒', '苦瓜', '丝瓜', '冬瓜', '南瓜',
      '土豆', '马铃薯', '胡萝卜', '白萝卜', '洋葱', '莲藕', '山药', '竹笋', '莴笋', '西兰花', '花菜',
      '蘑菇', '香菇', '金针菇', '杏鲍菇', '平菇', '木耳', '葱', '大蒜', '生姜', '蒜苗', '香菜',
    ],
    defaultDays: 5,
  },
  {
    category: '肉类',
    keywords: [
      '肉', '猪肉', '牛肉', '羊肉', '鸡肉', '鸭肉', '排骨', '五花肉', '里脊', '肉馅', '肉末',
      '鸡胸肉', '鸡翅', '鸡腿', '鸡爪', '鸭腿', '鸭翅', '培根', '火腿', '香肠', '腊肉', '牛排', '牛腩',
    ],
    defaultDays: 3,
  },
  {
    category: '海鲜',
    keywords: [
      '鱼', '虾', '蟹', '海鲜', '虾仁', '三文鱼', '鳕鱼', '鲈鱼', '带鱼', '鲫鱼', '生蚝', '扇贝',
      '蛤蜊', '花甲', '鱿鱼', '八爪鱼', '墨鱼', '鲍鱼', '龙虾', '紫菜', '海带',
    ],
    defaultDays: 2,
  },
  {
    category: '蛋奶',
    keywords: [
      '蛋', '鸡蛋', '鸭蛋', '鹌鹑蛋', '牛奶', '鲜奶', '酸奶', '奶酪', '芝士', '黄油', '奶油', '炼乳',
    ],
    defaultDays: 14,
  },
  {
    category: '豆制品',
    keywords: ['豆腐', '豆皮', '豆干', '千张', '腐竹', '豆浆', '素鸡', '油豆腐', '嫩豆腐', '老豆腐'],
    defaultDays: 3,
  },
  {
    category: '主食',
    keywords: ['面条', '挂面', '意面', '米饭', '大米', '小米', '燕麦', '吐司', '面包', '馒头', '包子', '饺子', '馄饨', '年糕', '红薯', '玉米'],
    defaultDays: 7,
  },
  {
    category: '调料',
    keywords: [
      '盐', '糖', '生抽', '老抽', '酱油', '蚝油', '料酒', '醋', '香醋', '陈醋', '白醋', '油', '花生油',
      '香油', '麻油', '橄榄油', '豆瓣酱', '番茄酱', '沙茶酱', '辣椒酱', '黑胡椒', '白胡椒', '花椒',
      '八角', '桂皮', '香叶', '孜然', '鸡精', '味精', '淀粉', '生粉', '咖喱',
    ],
    defaultDays: 180,
  },
  {
    category: '干货',
    keywords: ['枸杞', '红枣', '银耳', '干香菇', '干辣椒', '虾皮', '干贝', '腐竹段', '黄花菜', '桂圆'],
    defaultDays: 180,
  },
]

// 细化根据特定关键词调整天数（如叶菜3天，根茎14天）
function getRefinedDays(name: string, baseCategory: string, defaultDays: number): number {
  if (baseCategory === '蔬菜') {
    if (/土豆|胡萝卜|白萝卜|洋葱|南瓜|山药|生姜|大蒜/.test(name)) return 14
    if (/青菜|生菜|菠菜|小白菜|韭菜|香菇|金针菇/.test(name)) return 3
  }
  if (baseCategory === '蛋奶') {
    if (/牛奶|鲜奶|酸奶/.test(name)) return 7
    if (/鸡蛋|鸭蛋/.test(name)) return 21
  }
  if (baseCategory === '肉类') {
    if (/冷冻|肉卷|肉丸/.test(name)) return 60
  }
  return defaultDays
}

export function detectIngredientCategory(name: string): { category: string; defaultDays: number } {
  const cleanName = name.trim().toLowerCase()

  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((k) => cleanName.includes(k))) {
      const days = getRefinedDays(cleanName, rule.category, rule.defaultDays)
      return { category: rule.category, defaultDays: days }
    }
  }

  return { category: '其他', defaultDays: 7 }
}

function calculateExpiryDate(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

const UNIT_REGEX = '(个|g|kg|克|千克|斤|两|ml|毫升|L|升|包|袋|盒|瓶|根|棵|条|块|只|把|份)'

export function parseSingleFridgeText(text: string): ParsedFridgeItem | null {
  const cleaned = text
    .replace(/^[-*•●\s\d+.)、\]】:：]+/, '')
    .replace(/[()（）]/g, ' ')
    .trim()

  if (!cleaned || cleaned.length < 1) return null

  let name = cleaned
  let amount = 1
  let unit = '个'

  // 模式 1: "西红柿 500g", "纯牛奶 2盒", "土豆 3个"
  const match1 = cleaned.match(
    new RegExp(`^(.+?)[\\s:：]+(\\d+(?:\\.\\d+)?)\\s*(${UNIT_REGEX})?$`, 'i')
  )
  if (match1) {
    name = match1[1].trim()
    amount = parseFloat(match1[2])
    unit = match1[3] || '个'
  } else {
    // 模式 2: 紧凑模式 "西红柿2个", "五花肉500g"
    const match2 = cleaned.match(
      new RegExp(`^([^0-9]+?)(\\d+(?:\\.\\d+)?)\\s*(${UNIT_REGEX})?$`, 'i')
    )
    if (match2) {
      name = match2[1].trim()
      amount = parseFloat(match2[2])
      unit = match2[3] || '个'
    }
  }

  // 统一单位别名
  if (unit === '克') unit = 'g'
  if (unit === '千克') unit = 'kg'
  if (unit === '毫升') unit = 'ml'
  if (unit === '升') unit = 'L'

  const { category, defaultDays } = detectIngredientCategory(name)

  return {
    id: `batch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    amount,
    unit,
    category,
    daysUntilExpiry: defaultDays,
    expiryDate: calculateExpiryDate(defaultDays),
  }
}

export function parseBatchFridgeItems(text: string): ParsedFridgeItem[] {
  if (!text || !text.trim()) return []

  // 按换行或逗号、顿号、分号分割多项
  const rawLines = text
    .split(/[\n\r，,、;；|]+/)
    .map((l) => l.trim())
    .filter(Boolean)

  const items: ParsedFridgeItem[] = []

  for (const line of rawLines) {
    // 过滤掉如 "食材清单：" 或 "买菜小票：" 或 "#标签" 等标题行
    if (/^(食材|清单|小票|买菜|买菜小票|食材清单|购物清单|冷藏|冷冻|购买清单)[：:]?$/i.test(line) || /^[#【].*[】#]$/.test(line)) {
      continue
    }
    const parsed = parseSingleFridgeText(line)
    if (parsed) {
      items.push(parsed)
    }
  }

  return items
}
