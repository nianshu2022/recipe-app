import type { Recipe } from '@/types'
import { db } from '@/db'
import { generateId } from './id'

const sampleRecipes: Omit<Recipe, 'id' | 'syncStatus' | 'createdAt' | 'updatedAt'>[] = [
  {
    userId: 'local',
    name: '番茄炒蛋',
    category: 'hot-dish',
    tags: ['家常菜', '快手菜', '下饭菜'],
    difficulty: 'easy',
    duration: 15,
    servings: 2,
    ingredients: [
      { id: generateId(), name: '番茄', amount: 2, unit: '个', type: 'main', scalable: true },
      { id: generateId(), name: '鸡蛋', amount: 3, unit: '个', type: 'main', scalable: true },
      { id: generateId(), name: '食用油', amount: 2, unit: '勺', type: 'seasoning', scalable: false },
      { id: generateId(), name: '盐', amount: 1, unit: '茶匙', type: 'seasoning', scalable: false },
      { id: generateId(), name: '糖', amount: 0.5, unit: '茶匙', type: 'seasoning', scalable: false },
      { id: generateId(), name: '小葱', amount: 2, unit: '根', type: 'sub', scalable: true },
    ],
    steps: [
      { order: 1, description: '番茄洗净切块，鸡蛋打散加少许盐搅匀', tip: '番茄可以先用开水烫一下去皮' },
      { order: 2, description: '热锅凉油，倒入蛋液，快速翻炒至凝固后盛出', timer: 2 },
      { order: 3, description: '锅中留底油，放入番茄块翻炒出汁', timer: 3 },
      { order: 4, description: '加入糖和盐调味，倒回炒好的鸡蛋翻炒均匀', timer: 1 },
      { order: 5, description: '撒上葱花，出锅装盘' },
    ],
  },
  {
    userId: 'local',
    name: '可乐鸡翅',
    category: 'hot-dish',
    tags: ['家常菜', '硬菜', '下饭菜'],
    difficulty: 'easy',
    duration: 30,
    servings: 3,
    ingredients: [
      { id: generateId(), name: '鸡翅', amount: 10, unit: '个', type: 'main', scalable: true },
      { id: generateId(), name: '可乐', amount: 1, unit: '罐', type: 'main', scalable: true },
      { id: generateId(), name: '生姜', amount: 3, unit: '片', type: 'sub', scalable: true },
      { id: generateId(), name: '生抽', amount: 2, unit: '勺', type: 'seasoning', scalable: false },
      { id: generateId(), name: '老抽', amount: 1, unit: '勺', type: 'seasoning', scalable: false },
      { id: generateId(), name: '料酒', amount: 1, unit: '勺', type: 'seasoning', scalable: false },
    ],
    steps: [
      { order: 1, description: '鸡翅两面各划两刀，冷水下锅焯水去腥，捞出沥干', tip: '冷水下锅能更好地去除血水' },
      { order: 2, description: '热锅少油，放入鸡翅煎至两面金黄', timer: 3 },
      { order: 3, description: '加入姜片、生抽、老抽、料酒翻炒上色', timer: 1 },
      { order: 4, description: '倒入可乐，没过鸡翅，大火烧开后转小火炖煮', timer: 15 },
      { order: 5, description: '大火收汁至浓稠，出锅装盘', timer: 3 },
    ],
  },
  {
    userId: 'local',
    name: '麻婆豆腐',
    category: 'hot-dish',
    tags: ['家常菜', '下饭菜', '川菜'],
    difficulty: 'medium',
    duration: 20,
    servings: 2,
    ingredients: [
      { id: generateId(), name: '豆腐', amount: 1, unit: '块', type: 'main', scalable: true },
      { id: generateId(), name: '猪肉末', amount: 100, unit: 'g', type: 'main', scalable: true },
      { id: generateId(), name: '豆瓣酱', amount: 1, unit: '勺', type: 'seasoning', scalable: false },
      { id: generateId(), name: '花椒', amount: 1, unit: '茶匙', type: 'seasoning', scalable: false },
      { id: generateId(), name: '大蒜', amount: 3, unit: '瓣', type: 'sub', scalable: true },
      { id: generateId(), name: '淀粉', amount: 1, unit: '勺', type: 'seasoning', scalable: false },
      { id: generateId(), name: '小葱', amount: 2, unit: '根', type: 'sub', scalable: true },
    ],
    steps: [
      { order: 1, description: '豆腐切成2cm小方块，放入加了盐的开水中焯烫2分钟，捞出沥干', tip: '焯水可以去除豆腥味，也让豆腐更不容易碎', timer: 2 },
      { order: 2, description: '热锅凉油，放入肉末炒散变色', timer: 2 },
      { order: 3, description: '加入豆瓣酱和蒜末炒出红油', timer: 1 },
      { order: 4, description: '加入适量清水烧开，放入豆腐块，轻轻推动，小火炖煮入味', timer: 5 },
      { order: 5, description: '淀粉加水勾芡，轻轻推匀，撒上花椒粉和葱花出锅' },
    ],
  },
  {
    userId: 'local',
    name: '蒜蓉西兰花',
    category: 'hot-dish',
    tags: ['快手菜', '减脂餐', '素菜'],
    difficulty: 'easy',
    duration: 10,
    servings: 2,
    ingredients: [
      { id: generateId(), name: '西兰花', amount: 1, unit: '棵', type: 'main', scalable: true },
      { id: generateId(), name: '大蒜', amount: 5, unit: '瓣', type: 'sub', scalable: true },
      { id: generateId(), name: '食用油', amount: 1, unit: '勺', type: 'seasoning', scalable: false },
      { id: generateId(), name: '盐', amount: 0.5, unit: '茶匙', type: 'seasoning', scalable: false },
      { id: generateId(), name: '蚝油', amount: 1, unit: '勺', type: 'seasoning', scalable: false },
    ],
    steps: [
      { order: 1, description: '西兰花掰成小朵，淡盐水浸泡10分钟后洗净', tip: '盐水浸泡可以驱出藏在花蕾中的小虫' },
      { order: 2, description: '烧一锅开水，加少许盐和油，西兰花焯水1分钟后捞出过凉水', timer: 1 },
      { order: 3, description: '热锅凉油，放入蒜末爆香', timer: 1 },
      { order: 4, description: '放入西兰花快速翻炒，加蚝油和盐调味，出锅', timer: 2 },
    ],
  },
  {
    userId: 'local',
    name: '紫菜蛋花汤',
    category: 'soup',
    tags: ['快手菜', '汤羹', '家常菜'],
    difficulty: 'easy',
    duration: 10,
    servings: 3,
    ingredients: [
      { id: generateId(), name: '紫菜', amount: 1, unit: '张', type: 'main', scalable: true },
      { id: generateId(), name: '鸡蛋', amount: 2, unit: '个', type: 'main', scalable: true },
      { id: generateId(), name: '盐', amount: 0.5, unit: '茶匙', type: 'seasoning', scalable: false },
      { id: generateId(), name: '芝麻油', amount: 1, unit: '茶匙', type: 'seasoning', scalable: false },
      { id: generateId(), name: '小葱', amount: 1, unit: '根', type: 'sub', scalable: true },
    ],
    steps: [
      { order: 1, description: '紫菜撕成小块，鸡蛋打散备用' },
      { order: 2, description: '锅中加适量清水烧开，放入紫菜', timer: 2 },
      { order: 3, description: '水开后缓缓倒入蛋液，用筷子轻轻搅动形成蛋花', tip: '蛋液要慢慢倒，这样蛋花才好看' },
      { order: 4, description: '加盐调味，淋上芝麻油，撒上葱花即可出锅' },
    ],
  },
]

export async function seedSampleRecipes() {
  const existing = await db.getAllRecipes()
  if (existing.length > 0) return // Already has recipes, don't seed

  const now = new Date().toISOString()
  for (const recipeData of sampleRecipes) {
    const recipe: Recipe = {
      ...recipeData,
      id: generateId(),
      syncStatus: 'synced',
      createdAt: now,
      updatedAt: now,
    }
    await db.putRecipe(recipe)
  }
}
