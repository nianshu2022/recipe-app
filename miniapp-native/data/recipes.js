const recipes = [
  {
    id: 'recipe_001',
    name: '番茄炒蛋',
    category: 'hot-dish',
    tags: ['家常菜', '快手菜', '下饭菜'],
    difficulty: 'easy',
    duration: 15,
    servings: 2,
    ingredients: [
      { name: '番茄', amount: 2, unit: '个' },
      { name: '鸡蛋', amount: 3, unit: '个' },
      { name: '葱', amount: 2, unit: '根' },
      { name: '盐', amount: 3, unit: '克' },
      { name: '糖', amount: 5, unit: '克' },
      { name: '食用油', amount: 15, unit: '毫升' }
    ],
    steps: [
      '番茄切块，鸡蛋打散加少许盐搅匀',
      '热锅凉油，倒入蛋液炒至凝固盛出',
      '锅中留底油，放入番茄翻炒出汁',
      '加入糖、盐调味，倒回鸡蛋翻炒均匀，撒葱花出锅'
    ]
  },
  {
    id: 'recipe_002',
    name: '红烧肉',
    category: 'hot-dish',
    tags: ['家常菜', '硬菜', '下饭菜'],
    difficulty: 'medium',
    duration: 90,
    servings: 4,
    ingredients: [
      { name: '五花肉', amount: 500, unit: '克' },
      { name: '冰糖', amount: 30, unit: '克' },
      { name: '生抽', amount: 30, unit: '毫升' },
      { name: '老抽', amount: 15, unit: '毫升' },
      { name: '料酒', amount: 30, unit: '毫升' },
      { name: '八角', amount: 2, unit: '个' },
      { name: '桂皮', amount: 1, unit: '小块' },
      { name: '姜', amount: 3, unit: '片' }
    ],
    steps: [
      '五花肉切块，冷水下锅焯水后捞出',
      '锅中放少许油，放入冰糖小火炒至焦糖色',
      '放入五花肉翻炒上色',
      '加入生抽、老抽、料酒、八角、桂皮、姜片',
      '加入没过肉的热水，大火烧开后转小火炖60分钟',
      '大火收汁至浓稠即可'
    ]
  },
  {
    id: 'recipe_003',
    name: '清炒时蔬',
    category: 'hot-dish',
    tags: ['家常菜', '快手菜', '素菜'],
    difficulty: 'easy',
    duration: 10,
    servings: 2,
    ingredients: [
      { name: '青菜', amount: 300, unit: '克' },
      { name: '蒜', amount: 3, unit: '瓣' },
      { name: '盐', amount: 3, unit: '克' },
      { name: '食用油', amount: 15, unit: '毫升' }
    ],
    steps: [
      '青菜洗净切段，蒜切末',
      '热锅凉油，放入蒜末爆香',
      '放入青菜大火翻炒至断生',
      '加盐调味即可出锅'
    ]
  },
  {
    id: 'recipe_004',
    name: '酸辣土豆丝',
    category: 'cold-dish',
    tags: ['家常菜', '快手菜', '下饭菜'],
    difficulty: 'easy',
    duration: 15,
    servings: 2,
    ingredients: [
      { name: '土豆', amount: 2, unit: '个' },
      { name: '干辣椒', amount: 5, unit: '个' },
      { name: '花椒', amount: 10, unit: '粒' },
      { name: '醋', amount: 15, unit: '毫升' },
      { name: '盐', amount: 3, unit: '克' },
      { name: '葱', amount: 2, unit: '根' }
    ],
    steps: [
      '土豆去皮切丝，泡水去除淀粉',
      '热锅凉油，放入干辣椒和花椒爆香',
      '放入土豆丝大火翻炒',
      '加入醋和盐调味',
      '翻炒均匀，撒葱花出锅'
    ]
  },
  {
    id: 'recipe_005',
    name: '蛋花汤',
    category: 'soup',
    tags: ['汤品', '快手菜', '清淡'],
    difficulty: 'easy',
    duration: 10,
    servings: 2,
    ingredients: [
      { name: '鸡蛋', amount: 2, unit: '个' },
      { name: '紫菜', amount: 10, unit: '克' },
      { name: '盐', amount: 3, unit: '克' },
      { name: '香油', amount: 5, unit: '毫升' },
      { name: '葱', amount: 1, unit: '根' }
    ],
    steps: [
      '鸡蛋打散，紫菜撕小块',
      '锅中烧水，放入紫菜',
      '水开后倒入蛋液，搅拌成蛋花',
      '加盐调味，淋香油，撒葱花'
    ]
  }
]

module.exports = {
  recipes
}
