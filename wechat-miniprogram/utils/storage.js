const { recipes: sampleRecipes } = require('../data/sampleRecipes')

const RECIPE_KEY = 'zhiwei_recipes'
const SHOPPING_KEY = 'zhiwei_shopping_items'
const SHOPPING_LISTS_KEY = 'zhiwei_shopping_lists'
const CURRENT_SHOPPING_LIST_KEY = 'zhiwei_current_shopping_list_id'
const MEAL_PLAN_KEY = 'zhiwei_meal_plan'
const MEAL_PLAN_RECORDS_KEY = 'zhiwei_meal_plans'
const FAVORITE_KEY = 'zhiwei_favorite_recipe_ids'
const COLLECTIONS_KEY = 'zhiwei_collections'
const COOKING_RECORDS_KEY = 'zhiwei_cooking_records'
const MENUS_KEY = 'zhiwei_menus'
const FRIDGE_ITEMS_KEY = 'zhiwei_fridge_items'

const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const mealSlots = [
  { key: 'breakfast', label: '早餐' },
  { key: 'lunch', label: '午餐' },
  { key: 'dinner', label: '晚餐' },
  { key: 'snack', label: '加餐' },
]

const categoryMeta = {
  'hot-dish': { label: '热菜', color: '#c9583a' },
  'cold-dish': { label: '凉菜', color: '#5a7a54' },
  soup: { label: '汤羹', color: '#7a9aa0' },
  staple: { label: '主食', color: '#c49a3c' },
  dessert: { label: '甜品', color: '#b86b8b' },
  drink: { label: '饮品', color: '#6b7ca8' },
}

const difficultyMeta = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
}

const ingredientCategoryMap = {
  '番茄': '蔬菜', '西红柿': '蔬菜', '土豆': '蔬菜', '胡萝卜': '蔬菜', '洋葱': '蔬菜',
  '青椒': '蔬菜', '红椒': '蔬菜', '大蒜': '蔬菜', '生姜': '蔬菜', '大葱': '蔬菜',
  '小葱': '蔬菜', '白菜': '蔬菜', '生菜': '蔬菜', '黄瓜': '蔬菜', '茄子': '蔬菜',
  '西兰花': '蔬菜', '花菜': '蔬菜', '芹菜': '蔬菜', '韭菜': '蔬菜', '菠菜': '蔬菜',
  '豆芽': '蔬菜', '蘑菇': '蔬菜', '香菇': '蔬菜', '木耳': '蔬菜', '玉米': '蔬菜',
  '南瓜': '蔬菜', '冬瓜': '蔬菜', '丝瓜': '蔬菜', '苦瓜': '蔬菜',
  '猪肉': '肉类', '牛肉': '肉类', '羊肉': '肉类', '鸡肉': '肉类', '鸡胸肉': '肉类',
  '鸡腿': '肉类', '鸡翅': '肉类', '排骨': '肉类', '五花肉': '肉类', '里脊': '肉类',
  '肉末': '肉类', '肉丝': '肉类', '腊肉': '肉类', '培根': '肉类', '香肠': '肉类',
  '虾': '海鲜', '虾仁': '海鲜', '鱼': '海鲜', '鲈鱼': '海鲜', '三文鱼': '海鲜',
  '螃蟹': '海鲜', '蛤蜊': '海鲜', '鱿鱼': '海鲜', '带鱼': '海鲜',
  '鸡蛋': '蛋奶', '鸭蛋': '蛋奶', '牛奶': '蛋奶', '酸奶': '蛋奶', '奶酪': '蛋奶',
  '黄油': '蛋奶', '淡奶油': '蛋奶',
  '盐': '调料', '糖': '调料', '生抽': '调料', '老抽': '调料', '醋': '调料',
  '料酒': '调料', '蚝油': '调料', '豆瓣酱': '调料', '番茄酱': '调料', '芝麻油': '调料',
  '花椒': '调料', '八角': '调料', '桂皮': '调料', '干辣椒': '调料', '胡椒': '调料',
  '五香粉': '调料', '淀粉': '调料', '酱油': '调料',
  '食用油': '调料', '花生油': '调料', '橄榄油': '调料', '菜籽油': '调料',
  '米饭': '主食', '面条': '主食', '面粉': '主食', '饺子皮': '主食', '面包': '主食',
  '馒头': '主食', '年糕': '主食', '粉丝': '主食', '米粉': '主食',
  '豆腐': '豆制品', '豆干': '豆制品', '腐竹': '豆制品', '花生': '干货', '芝麻': '干货',
  '红枣': '干货', '枸杞': '干货', '桂圆': '干货',
}

function generateId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function guessIngredientCategory(name) {
  for (const keyword of Object.keys(ingredientCategoryMap)) {
    if (String(name || '').includes(keyword)) return ingredientCategoryMap[keyword]
  }
  return '其他'
}

function normalizeRecipe(recipe) {
  const category = categoryMeta[recipe.category] || categoryMeta['hot-dish']
  return {
    ...recipe,
    category: recipe.category || 'hot-dish',
    categoryName: recipe.categoryName || category.label,
    difficulty: recipe.difficulty || 'easy',
    difficultyName: recipe.difficultyName || difficultyMeta[recipe.difficulty] || '简单',
    coverColor: recipe.coverColor || category.color,
    tags: Array.isArray(recipe.tags) ? recipe.tags : [],
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
    steps: Array.isArray(recipe.steps) ? recipe.steps : [],
    duration: Math.max(1, Number(recipe.duration) || 30),
    servings: Math.max(1, Number(recipe.servings) || 2),
  }
}

function getAllRecipes() {
  const stored = wx.getStorageSync(RECIPE_KEY)
  if (Array.isArray(stored)) {
    const normalized = stored.map(normalizeRecipe)
    wx.setStorageSync(RECIPE_KEY, normalized)
    return normalized
  }
  const recipes = sampleRecipes.map(normalizeRecipe)
  wx.setStorageSync(RECIPE_KEY, recipes)
  return recipes
}

function getRecipes() {
  return getAllRecipes().filter((recipe) => !recipe.deletedAt)
}

function getRecipe(id) {
  return getRecipes().find((recipe) => recipe.id === id)
}

function saveRecipes(recipes) {
  wx.setStorageSync(RECIPE_KEY, recipes.map(normalizeRecipe))
}

function upsertRecipe(recipe) {
  const recipes = getAllRecipes()
  const index = recipes.findIndex((item) => item.id === recipe.id)
  const nextRecipes = index >= 0
    ? recipes.map((item) => (item.id === recipe.id ? recipe : item))
    : [recipe, ...recipes]
  saveRecipes(nextRecipes)
  return recipe
}

function deleteRecipe(id) {
  const now = new Date().toISOString()
  saveRecipes(getAllRecipes().map((recipe) => (
    recipe.id === id
      ? { ...recipe, deletedAt: now, updatedAt: now, syncStatus: 'pending' }
      : recipe
  )))
  saveCollections(getAllCollections().map((collection) => {
    const recipeIds = (collection.recipeIds || []).filter((recipeId) => recipeId !== id)
    return recipeIds.length === (collection.recipeIds || []).length
      ? collection
      : { ...collection, recipeIds, updatedAt: now, syncStatus: 'pending' }
  }))
  removeRecipeFromMealPlanRecords(id, now)
}

function generateRecipeId() {
  return `recipe-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function normalizeShoppingItem(item) {
  return {
    id: item.id || generateId('shop'),
    key: item.key || `${item.name}-${item.unit || ''}`,
    name: item.name,
    amount: Number(item.amount || 0),
    unit: item.unit || '',
    category: item.category || guessIngredientCategory(item.name),
    checked: Boolean(item.checked),
    sourceRecipeId: item.sourceRecipeId || '',
    sourceRecipeName: item.sourceRecipeName || '',
  }
}

function createShoppingList(recipeIds, items) {
  const now = new Date().toISOString()
  return {
    id: generateId('list'),
    userId: 'local',
    sourceRecipeIds: recipeIds,
    items: items.map(normalizeShoppingItem).sort((a, b) => a.category.localeCompare(b.category)),
    syncStatus: 'pending',
    createdAt: now,
    updatedAt: now,
  }
}

function getAllShoppingLists() {
  const lists = wx.getStorageSync(SHOPPING_LISTS_KEY)
  if (Array.isArray(lists)) {
    return lists
  }

  const oldItems = wx.getStorageSync(SHOPPING_KEY)
  if (Array.isArray(oldItems) && oldItems.length > 0) {
    const list = createShoppingList([], oldItems)
    wx.setStorageSync(SHOPPING_LISTS_KEY, [list])
    wx.setStorageSync(CURRENT_SHOPPING_LIST_KEY, list.id)
    return [list]
  }

  wx.setStorageSync(SHOPPING_LISTS_KEY, [])
  return []
}

function getShoppingLists() {
  return getAllShoppingLists().filter((list) => !list.deletedAt)
}

function saveShoppingLists(lists) {
  wx.setStorageSync(SHOPPING_LISTS_KEY, lists)
  wx.setStorageSync(SHOPPING_KEY, getCurrentShoppingListFrom(lists).items)
}

function getCurrentShoppingListFrom(lists) {
  const activeLists = lists.filter((list) => !list.deletedAt)
  const currentId = wx.getStorageSync(CURRENT_SHOPPING_LIST_KEY)
  return activeLists.find((list) => list.id === currentId) || activeLists[0] || {
    id: '',
    userId: 'local',
    sourceRecipeIds: [],
    items: [],
    syncStatus: 'pending',
    createdAt: '',
    updatedAt: '',
  }
}

function getCurrentShoppingList() {
  return getCurrentShoppingListFrom(getAllShoppingLists())
}

function setCurrentShoppingList(id) {
  wx.setStorageSync(CURRENT_SHOPPING_LIST_KEY, id)
  return getCurrentShoppingList()
}

function mergeRecipeItems(recipes) {
  const merged = new Map()
  for (const recipe of recipes) {
    for (const ingredient of recipe.ingredients || []) {
      const key = `${ingredient.name}_${ingredient.unit || ''}`
      const existing = merged.get(key)
      if (existing) {
        existing.amount = Number(existing.amount || 0) + Number(ingredient.amount || 0)
      } else {
        merged.set(key, {
          id: generateId('shop'),
          key,
          name: ingredient.name,
          amount: Number(ingredient.amount || 0),
          unit: ingredient.unit || '',
          category: guessIngredientCategory(ingredient.name),
          checked: false,
          sourceRecipeId: recipe.id,
          sourceRecipeName: recipe.name,
        })
      }
    }
  }
  return Array.from(merged.values())
}

function getShoppingItems() {
  return getCurrentShoppingList().items
}

function saveShoppingItems(items) {
  const lists = getAllShoppingLists()
  let current = getCurrentShoppingListFrom(lists)
  if (!current.id) {
    current = createShoppingList([], [])
    wx.setStorageSync(CURRENT_SHOPPING_LIST_KEY, current.id)
    lists.unshift(current)
  }
  const now = new Date().toISOString()
  const updated = {
    ...current,
    items: items.map(normalizeShoppingItem),
    updatedAt: now,
    syncStatus: 'pending',
  }
  const nextLists = lists.map((list) => (list.id === updated.id ? updated : list))
  saveShoppingLists(nextLists)
  return updated.items
}

function addRecipeToShoppingList(recipe) {
  const list = createShoppingList([recipe.id], mergeRecipeItems([recipe]))
  const lists = [list, ...getAllShoppingLists()]
  wx.setStorageSync(CURRENT_SHOPPING_LIST_KEY, list.id)
  saveShoppingLists(lists)
  return list.items
}

function addRecipesToShoppingList(recipes) {
  const list = createShoppingList(recipes.map((recipe) => recipe.id), mergeRecipeItems(recipes))
  const lists = [list, ...getAllShoppingLists()]
  wx.setStorageSync(CURRENT_SHOPPING_LIST_KEY, list.id)
  saveShoppingLists(lists)
  return list.items
}

function addShoppingItem(name) {
  const trimmedName = String(name || '').trim()
  if (!trimmedName) return getShoppingItems()
  const items = [
    ...getShoppingItems(),
    {
      id: generateId('shop'),
      key: `${trimmedName}-manual`,
      name: trimmedName,
      amount: 0,
      unit: '',
      category: guessIngredientCategory(trimmedName),
      checked: false,
      sourceRecipeId: '',
      sourceRecipeName: '手动添加',
    },
  ]
  return saveShoppingItems(items)
}

function toggleShoppingItem(id) {
  const items = getShoppingItems()
    .map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    .sort((a, b) => (a.checked === b.checked ? 0 : a.checked ? 1 : -1))
  return saveShoppingItems(items)
}

function removeShoppingItem(id) {
  return saveShoppingItems(getShoppingItems().filter((item) => item.id !== id))
}

function updateShoppingItemAmount(id, amount) {
  const items = getShoppingItems().map((item) =>
    item.id === id ? { ...item, amount: Number(amount) || 0 } : item,
  )
  return saveShoppingItems(items)
}

function renameShoppingList(id, name) {
  const now = new Date().toISOString()
  const lists = getAllShoppingLists()
  const nextLists = lists.map((list) =>
    list.id === id
      ? { ...list, name: name || list.name, updatedAt: now, syncStatus: 'pending' }
      : list,
  )
  saveShoppingLists(nextLists)
  return nextLists
}

function clearCheckedShoppingItems() {
  return saveShoppingItems(getShoppingItems().filter((item) => !item.checked))
}

function deleteShoppingList(id) {
  const now = new Date().toISOString()
  const nextLists = getAllShoppingLists().map((list) => (
    list.id === id
      ? { ...list, deletedAt: now, updatedAt: now, syncStatus: 'pending' }
      : list
  ))
  saveShoppingLists(nextLists)
  const activeLists = nextLists.filter((list) => !list.deletedAt)
  if (!activeLists.some((list) => list.id === wx.getStorageSync(CURRENT_SHOPPING_LIST_KEY))) {
    wx.setStorageSync(CURRENT_SHOPPING_LIST_KEY, activeLists[0] ? activeLists[0].id : '')
  }
  return getCurrentShoppingList()
}

function createEmptyMealPlan() {
  return dayNames.map((name, dayIndex) => ({
    dayIndex,
    name,
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  }))
}

function normalizeMealPlan(plan) {
  return dayNames.map((name, dayIndex) => {
    const day = plan[dayIndex] || {}
    const normalized = { dayIndex, name }
    for (const slot of mealSlots) {
      const value = day[slot.key]
      if (Array.isArray(value)) {
        normalized[slot.key] = value.filter(Boolean)
      } else if (value) {
        normalized[slot.key] = [value]
      } else {
        normalized[slot.key] = []
      }
    }
    return normalized
  })
}

function mealPlanDaysFromView(plan) {
  return normalizeMealPlan(plan).map((day) => ({
    breakfast: (day.breakfast || []).map((recipe) => recipe.id || recipe).filter(Boolean),
    lunch: (day.lunch || []).map((recipe) => recipe.id || recipe).filter(Boolean),
    dinner: (day.dinner || []).map((recipe) => recipe.id || recipe).filter(Boolean),
    snack: (day.snack || []).map((recipe) => recipe.id || recipe).filter(Boolean),
  }))
}

function normalizeMealPlanRecord(record) {
  const now = new Date().toISOString()
  const days = Array.isArray(record.days) ? record.days : []
  return {
    id: record.id || `local-week-${record.weekStart || getWeekStart()}`,
    userId: record.userId || 'local',
    weekStart: record.weekStart || getWeekStart(),
    days: dayNames.map((_, index) => {
      const day = days[index] || {}
      return {
        breakfast: Array.isArray(day.breakfast) ? day.breakfast.filter(Boolean) : [],
        lunch: Array.isArray(day.lunch) ? day.lunch.filter(Boolean) : [],
        dinner: Array.isArray(day.dinner) ? day.dinner.filter(Boolean) : [],
        snack: Array.isArray(day.snack) ? day.snack.filter(Boolean) : [],
      }
    }),
    syncStatus: record.syncStatus || 'synced',
    createdAt: record.createdAt || now,
    updatedAt: record.updatedAt || now,
    deletedAt: record.deletedAt,
  }
}

function createMealPlanRecordFromView(plan, existing = null, syncStatus = 'pending') {
  const now = new Date().toISOString()
  const weekStart = getWeekStart()
  return normalizeMealPlanRecord({
    ...(existing || {}),
    id: existing && existing.id ? existing.id : `local-week-${weekStart}`,
    userId: existing && existing.userId ? existing.userId : 'local',
    weekStart,
    days: mealPlanDaysFromView(plan),
    syncStatus,
    createdAt: existing && existing.createdAt ? existing.createdAt : now,
    updatedAt: now,
  })
}

function getMealPlan() {
  const stored = wx.getStorageSync(MEAL_PLAN_KEY)
  if (Array.isArray(stored) && stored.length === dayNames.length) {
    const normalized = normalizeMealPlan(stored)
    wx.setStorageSync(MEAL_PLAN_KEY, normalized)
    return normalized
  }
  const plan = createEmptyMealPlan()
  wx.setStorageSync(MEAL_PLAN_KEY, plan)
  return plan
}

function saveMealPlanView(plan) {
  const normalized = normalizeMealPlan(plan)
  wx.setStorageSync(MEAL_PLAN_KEY, normalized)
  return normalized
}

function pickDisplayMealPlanRecord(records) {
  const active = records.filter((record) => !record.deletedAt)
  if (active.length === 0) return null
  return active.find((record) => record.weekStart === getWeekStart()) ||
    active.sort((a, b) => String(b.weekStart || '').localeCompare(String(a.weekStart || '')))[0]
}

function getAllMealPlanRecords() {
  const stored = wx.getStorageSync(MEAL_PLAN_RECORDS_KEY)
  if (Array.isArray(stored)) {
    const normalized = stored.map(normalizeMealPlanRecord)
    wx.setStorageSync(MEAL_PLAN_RECORDS_KEY, normalized)
    return normalized
  }
  const record = createMealPlanRecordFromView(getMealPlan(), null, 'pending')
  wx.setStorageSync(MEAL_PLAN_RECORDS_KEY, [record])
  return [record]
}

function saveMealPlanRecords(records) {
  const normalized = records.map(normalizeMealPlanRecord)
  wx.setStorageSync(MEAL_PLAN_RECORDS_KEY, normalized)
  const displayRecord = pickDisplayMealPlanRecord(normalized)
  saveMealPlanView(displayRecord ? applyMealPlanRecord(displayRecord) : createEmptyMealPlan())
}

function removeRecipeFromMealPlanRecords(recipeId, updatedAt = new Date().toISOString()) {
  let changed = false
  const records = getAllMealPlanRecords().map((record) => {
    let recordChanged = false
    const days = (record.days || []).map((day) => {
      const nextDay = {}
      for (const slot of mealSlots) {
        const values = Array.isArray(day[slot.key]) ? day[slot.key] : []
        const filtered = values.filter((id) => id !== recipeId)
        if (filtered.length !== values.length) recordChanged = true
        nextDay[slot.key] = filtered
      }
      return nextDay
    })
    if (!recordChanged) return record
    changed = true
    return {
      ...record,
      days,
      updatedAt,
      syncStatus: 'pending',
    }
  })
  if (changed) {
    saveMealPlanRecords(records)
  }
}

function syncMealPlanRecordFromView(plan) {
  const records = getAllMealPlanRecords()
  const weekStart = getWeekStart()
  const existing = records.find((record) => record.weekStart === weekStart && !record.deletedAt)
  const nextRecord = createMealPlanRecordFromView(plan, existing, 'pending')
  const nextRecords = existing
    ? records.map((record) => (record.id === existing.id ? nextRecord : record))
    : [nextRecord, ...records]
  wx.setStorageSync(MEAL_PLAN_RECORDS_KEY, nextRecords)
}

function saveMealPlan(plan, options = {}) {
  const normalized = saveMealPlanView(plan)
  if (options.syncRecord !== false) {
    syncMealPlanRecordFromView(normalized)
  }
}

function setMealPlanSlot(dayIndex, slot, recipe) {
  const plan = getMealPlan().map((day) => {
    if (day.dayIndex !== dayIndex) return day
    return {
      ...day,
      [slot]: recipe ? [{ id: recipe.id, name: recipe.name }] : [],
    }
  })
  saveMealPlan(plan)
  return plan
}

function addMealPlanRecipe(dayIndex, slot, recipe) {
  const plan = getMealPlan().map((day) => {
    if (day.dayIndex !== dayIndex) return day
    const current = day[slot] || []
    if (current.some((item) => item.id === recipe.id)) return day
    return {
      ...day,
      [slot]: [...current, { id: recipe.id, name: recipe.name }],
    }
  })
  saveMealPlan(plan)
  return plan
}

function removeMealPlanRecipe(dayIndex, slot, recipeId) {
  const plan = getMealPlan().map((day) => {
    if (day.dayIndex !== dayIndex) return day
    return {
      ...day,
      [slot]: (day[slot] || []).filter((recipe) => recipe.id !== recipeId),
    }
  })
  saveMealPlan(plan)
  return plan
}

function clearMealPlan() {
  const plan = createEmptyMealPlan()
  saveMealPlan(plan)
  return plan
}

function normalizeCollection(collection) {
  const now = new Date().toISOString()
  return {
    id: collection.id || generateId('collection'),
    userId: collection.userId || 'local',
    name: collection.name || '我的收藏',
    coverImage: collection.coverImage,
    recipeIds: Array.isArray(collection.recipeIds) ? collection.recipeIds : [],
    syncStatus: collection.syncStatus || 'synced',
    createdAt: collection.createdAt || now,
    updatedAt: collection.updatedAt || now,
    deletedAt: collection.deletedAt,
  }
}

function getAllCollections() {
  const stored = wx.getStorageSync(COLLECTIONS_KEY)
  if (Array.isArray(stored)) {
    const normalized = stored.map(normalizeCollection)
    wx.setStorageSync(COLLECTIONS_KEY, normalized)
    wx.setStorageSync(FAVORITE_KEY, getFavoriteRecipeIdsFrom(normalized))
    return normalized
  }

  const legacyIds = wx.getStorageSync(FAVORITE_KEY)
  const collections = Array.isArray(legacyIds) && legacyIds.length > 0
    ? [normalizeCollection({
        id: 'local-favorites',
        name: '我的收藏',
        recipeIds: legacyIds,
        syncStatus: 'pending',
      })]
    : []
  wx.setStorageSync(COLLECTIONS_KEY, collections)
  return collections
}

function getCollections() {
  return getAllCollections().filter((collection) => !collection.deletedAt)
}

function createCollection(name) {
  const now = new Date().toISOString()
  const collections = getAllCollections()
  const collection = normalizeCollection({
    name: name || '新建收藏夹',
    recipeIds: [],
    syncStatus: 'pending',
    createdAt: now,
    updatedAt: now,
  })
  saveCollections([collection, ...collections])
  return collection
}

function renameCollection(id, name) {
  const now = new Date().toISOString()
  const collections = getAllCollections()
  const nextCollections = collections.map((c) =>
    c.id === id ? { ...c, name, updatedAt: now, syncStatus: 'pending' } : c,
  )
  saveCollections(nextCollections)
}

function deleteCollection(id) {
  const now = new Date().toISOString()
  const collections = getAllCollections()
  const nextCollections = collections.map((c) =>
    c.id === id ? { ...c, deletedAt: now, updatedAt: now, syncStatus: 'pending' } : c,
  )
  saveCollections(nextCollections)
}

function addRecipeToCollection(collectionId, recipeId) {
  const now = new Date().toISOString()
  const collections = getAllCollections()
  const nextCollections = collections.map((c) => {
    if (c.id !== collectionId) return c
    if (c.recipeIds.includes(recipeId)) return c
    return { ...c, recipeIds: [...c.recipeIds, recipeId], updatedAt: now, syncStatus: 'pending' }
  })
  saveCollections(nextCollections)
}

function removeRecipeFromCollection(collectionId, recipeId) {
  const now = new Date().toISOString()
  const collections = getAllCollections()
  const nextCollections = collections.map((c) => {
    if (c.id !== collectionId) return c
    return { ...c, recipeIds: c.recipeIds.filter((id) => id !== recipeId), updatedAt: now, syncStatus: 'pending' }
  })
  saveCollections(nextCollections)
}

function getCollectionRecipes(collectionId) {
  const collection = getAllCollections().find((c) => c.id === collectionId)
  if (!collection) return []
  const recipesById = new Map(getRecipes().map((r) => [r.id, r]))
  return collection.recipeIds.map((id) => recipesById.get(id)).filter(Boolean)
}

function getCollectionsContainingRecipe(recipeId) {
  return getAllCollections()
    .filter((c) => !c.deletedAt && c.recipeIds.includes(recipeId))
    .map((c) => c.id)
}

function getFavoriteRecipeIdsFrom(collections) {
  return Array.from(new Set(
    collections
      .filter((collection) => !collection.deletedAt)
      .flatMap((collection) => collection.recipeIds || [])
  ))
}

function saveCollections(collections) {
  const normalized = collections.map(normalizeCollection)
  wx.setStorageSync(COLLECTIONS_KEY, normalized)
  wx.setStorageSync(FAVORITE_KEY, getFavoriteRecipeIdsFrom(normalized))
}

function getFavoriteRecipeIds() {
  return getFavoriteRecipeIdsFrom(getAllCollections())
}

function saveFavoriteRecipeIds(ids) {
  const now = new Date().toISOString()
  const collections = getAllCollections()
  const activeCollections = collections.filter((collection) => !collection.deletedAt)
  const target = activeCollections.find((collection) => collection.name === '我的收藏') || activeCollections[0]
  if (!target && ids.length === 0) {
    saveCollections(collections)
    return
  }
  const nextCollections = target
    ? collections.map((collection) => (
        collection.id === target.id
          ? { ...collection, recipeIds: ids, updatedAt: now, syncStatus: 'pending' }
          : collection
      ))
    : [
        normalizeCollection({
          id: 'local-favorites',
          name: '我的收藏',
          recipeIds: ids,
          syncStatus: 'pending',
          createdAt: now,
          updatedAt: now,
        }),
      ]
  saveCollections(nextCollections)
}

function isRecipeFavorited(recipeId) {
  return getFavoriteRecipeIds().includes(recipeId)
}

function toggleFavoriteRecipe(recipeId) {
  const now = new Date().toISOString()
  const collections = getAllCollections()
  const activeCollections = collections.filter((collection) => !collection.deletedAt)
  const target = activeCollections.find((collection) => collection.name === '我的收藏') || activeCollections[0]
  if (!target) {
    saveCollections([
      normalizeCollection({
        id: 'local-favorites',
        name: '我的收藏',
        recipeIds: [recipeId],
        syncStatus: 'pending',
        createdAt: now,
        updatedAt: now,
      }),
    ])
    return getFavoriteRecipeIds()
  }
  const has = (target.recipeIds || []).includes(recipeId)
  const recipeIds = has
    ? target.recipeIds.filter((id) => id !== recipeId)
    : [recipeId, ...target.recipeIds]
  saveCollections(collections.map((collection) => (
    collection.id === target.id
      ? { ...collection, recipeIds, updatedAt: now, syncStatus: 'pending' }
      : collection
  )))
  return getFavoriteRecipeIds()
}

function getFavoriteRecipes() {
  const ids = new Set(getFavoriteRecipeIds())
  return getRecipes().filter((recipe) => ids.has(recipe.id))
}

function getWeekStart() {
  const date = new Date()
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date.toISOString().slice(0, 10)
}

function buildFavoriteCollection() {
  const favorite = getCollections().find((collection) => collection.name === '我的收藏')
  if (favorite) return favorite
  const now = new Date().toISOString()
  return normalizeCollection({
    id: 'local-favorites',
    name: '我的收藏',
    recipeIds: [],
    syncStatus: 'pending',
    createdAt: now,
    updatedAt: now,
  })
}

function buildMealPlanRecord() {
  const weekStart = getWeekStart()
  const existing = getAllMealPlanRecords().find((record) => record.weekStart === weekStart && !record.deletedAt)
  return createMealPlanRecordFromView(getMealPlan(), existing, existing ? existing.syncStatus : 'pending')
}

function applyMealPlanRecord(record) {
  if (!record || !Array.isArray(record.days)) return createEmptyMealPlan()
  const recipesById = new Map(getRecipes().map((recipe) => [recipe.id, recipe]))
  return dayNames.map((name, dayIndex) => {
    const day = record.days[dayIndex] || {}
    const convert = (ids) => (Array.isArray(ids) ? ids : [])
      .map((id) => recipesById.get(id))
      .filter(Boolean)
      .map((recipe) => ({ id: recipe.id, name: recipe.name }))
    return {
      dayIndex,
      name,
      breakfast: convert(day.breakfast),
      lunch: convert(day.lunch),
      dinner: convert(day.dinner),
      snack: convert(day.snack),
    }
  })
}

function getCookingRecords() {
  const stored = wx.getStorageSync(COOKING_RECORDS_KEY)
  return Array.isArray(stored) ? stored : []
}

function saveCookingRecords(records) {
  wx.setStorageSync(COOKING_RECORDS_KEY, records)
}

function addCookingRecord(recipe, notes = '') {
  const now = new Date().toISOString()
  const record = {
    id: generateId('cook'),
    userId: 'local',
    recipeId: recipe.id,
    date: now,
    servings: recipe.servings || 1,
    notes,
    syncStatus: 'pending',
    createdAt: now,
    updatedAt: now,
  }
  saveCookingRecords([record, ...getCookingRecords()])
  return record
}

function getMenus() {
  const stored = wx.getStorageSync(MENUS_KEY)
  return Array.isArray(stored) ? stored : []
}

function saveMenus(menus) {
  wx.setStorageSync(MENUS_KEY, menus)
}

function createMenu(name, recipeIds) {
  const now = new Date().toISOString()
  const menu = {
    id: generateId('menu'),
    userId: 'local',
    name: name || '新建菜单',
    recipeIds: Array.isArray(recipeIds) ? recipeIds : [],
    syncStatus: 'pending',
    createdAt: now,
    updatedAt: now,
  }
  saveMenus([menu, ...getMenus()])
  return menu
}

function renameMenu(id, name) {
  const now = new Date().toISOString()
  const menus = getMenus()
  saveMenus(menus.map((m) =>
    m.id === id ? { ...m, name, updatedAt: now, syncStatus: 'pending' } : m,
  ))
}

function deleteMenu(id) {
  const menus = getMenus()
  saveMenus(menus.filter((m) => m.id !== id))
}

function addRecipeToMenu(menuId, recipeId) {
  const now = new Date().toISOString()
  const menus = getMenus()
  saveMenus(menus.map((m) => {
    if (m.id !== menuId) return m
    if (m.recipeIds.includes(recipeId)) return m
    return { ...m, recipeIds: [...m.recipeIds, recipeId], updatedAt: now, syncStatus: 'pending' }
  }))
}

function removeRecipeFromMenu(menuId, recipeId) {
  const now = new Date().toISOString()
  const menus = getMenus()
  saveMenus(menus.map((m) => {
    if (m.id !== menuId) return m
    return { ...m, recipeIds: m.recipeIds.filter((id) => id !== recipeId), updatedAt: now, syncStatus: 'pending' }
  }))
}

function getMenuRecipes(menuId) {
  const menu = getMenus().find((m) => m.id === menuId)
  if (!menu) return []
  const recipesById = new Map(getRecipes().map((r) => [r.id, r]))
  return menu.recipeIds.map((id) => recipesById.get(id)).filter(Boolean)
}

function getAllFridgeItems() {
  const stored = wx.getStorageSync(FRIDGE_ITEMS_KEY)
  return Array.isArray(stored) ? stored : []
}

function saveFridgeItems(items) {
  wx.setStorageSync(FRIDGE_ITEMS_KEY, items)
}

function isValidRecord(record) {
  return record && typeof record === 'object' && !Array.isArray(record) && typeof record.id === 'string' && record.id.length > 0
}

function sanitizeRecord(record) {
  const sanitized = {}
  for (const [key, value] of Object.entries(record)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue
    sanitized[key] = value
  }
  return sanitized
}

function sanitizeRecords(records) {
  return Array.isArray(records) ? records.filter(isValidRecord).map(sanitizeRecord) : []
}

function getDataStats() {
  const plan = getMealPlan()
  const plannedMeals = plan.reduce((sum, day) => (
    sum + mealSlots.reduce((slotSum, slot) => slotSum + (day[slot.key] || []).length, 0)
  ), 0)
  const shoppingLists = getShoppingLists()
  return {
    recipes: getRecipes().length,
    favorites: getFavoriteRecipeIds().length,
    collections: getCollections().length,
    cookingRecords: getCookingRecords().length,
    shoppingItems: shoppingLists.reduce((sum, list) => sum + list.items.length, 0),
    shoppingLists: shoppingLists.length,
    plannedMeals,
  }
}

function exportData() {
  return JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    recipes: getAllRecipes(),
    collections: getAllCollections(),
    menus: getMenus(),
    mealPlans: getAllMealPlanRecords(),
    shoppingLists: getShoppingLists(),
    cookingRecords: getCookingRecords(),
  }, null, 2)
}

function importData(json) {
  try {
    const data = JSON.parse(json)
    if (!data || data.version !== 1 || !Array.isArray(data.recipes)) {
      return { success: false, message: '无效的备份内容' }
    }

    const recipes = sanitizeRecords(data.recipes)
    saveRecipes(recipes)
    const collections = sanitizeRecords(data.collections)
    if (collections.length > 0) {
      saveCollections(collections)
    } else {
      saveFavoriteRecipeIds(Array.isArray(data.favoriteRecipeIds) ? data.favoriteRecipeIds : [])
    }

    const shoppingLists = sanitizeRecords(data.shoppingLists)
    if (Array.isArray(data.shoppingLists)) {
      wx.setStorageSync(CURRENT_SHOPPING_LIST_KEY, data.currentShoppingListId || (data.shoppingLists[0] && data.shoppingLists[0].id) || '')
      saveShoppingLists(shoppingLists)
    } else {
      saveShoppingItems(Array.isArray(data.shoppingItems) ? data.shoppingItems : [])
    }

    const mealPlans = sanitizeRecords(data.mealPlans)
    if (Array.isArray(data.mealPlans)) {
      saveMealPlanRecords(mealPlans)
    } else if (Array.isArray(data.mealPlan)) {
      saveMealPlan(normalizeMealPlan(data.mealPlan))
    } else {
      saveMealPlan(createEmptyMealPlan())
    }

    const cookingRecords = sanitizeRecords(data.cookingRecords)
    const menus = sanitizeRecords(data.menus)
    saveCookingRecords(cookingRecords)
    saveMenus(menus)
    saveFridgeItems(Array.isArray(data.fridgeItems) ? sanitizeRecords(data.fridgeItems) : getAllFridgeItems())

    const total = recipes.length +
      collections.length +
      menus.length +
      mealPlans.length +
      shoppingLists.length +
      cookingRecords.length
    return { success: true, message: `成功导入 ${total} 条数据（${recipes.length} 道菜谱）` }
  } catch (error) {
    return { success: false, message: '导入失败，请检查 JSON 内容' }
  }
}

function clearAllData() {
  wx.setStorageSync(RECIPE_KEY, [])
  wx.setStorageSync(SHOPPING_KEY, [])
  wx.setStorageSync(SHOPPING_LISTS_KEY, [])
  wx.setStorageSync(CURRENT_SHOPPING_LIST_KEY, '')
  wx.setStorageSync(MEAL_PLAN_KEY, createEmptyMealPlan())
  wx.setStorageSync(MEAL_PLAN_RECORDS_KEY, [])
  wx.setStorageSync(FAVORITE_KEY, [])
  wx.setStorageSync(COLLECTIONS_KEY, [])
  wx.setStorageSync(COOKING_RECORDS_KEY, [])
  wx.setStorageSync(MENUS_KEY, [])
  wx.setStorageSync(FRIDGE_ITEMS_KEY, [])
}

module.exports = {
  getAllRecipes,
  getRecipes,
  getRecipe,
  saveRecipes,
  upsertRecipe,
  deleteRecipe,
  generateRecipeId,
  getShoppingItems,
  getAllShoppingLists,
  getShoppingLists,
  getCurrentShoppingList,
  setCurrentShoppingList,
  saveShoppingItems,
  saveShoppingLists,
  addRecipeToShoppingList,
  addRecipesToShoppingList,
  addShoppingItem,
  toggleShoppingItem,
  removeShoppingItem,
  updateShoppingItemAmount,
  renameShoppingList,
  clearCheckedShoppingItems,
  deleteShoppingList,
  getMealPlan,
  saveMealPlan,
  getAllMealPlanRecords,
  saveMealPlanRecords,
  setMealPlanSlot,
  addMealPlanRecipe,
  removeMealPlanRecipe,
  clearMealPlan,
  mealSlots,
  getAllCollections,
  getCollections,
  createCollection,
  renameCollection,
  deleteCollection,
  addRecipeToCollection,
  removeRecipeFromCollection,
  getCollectionRecipes,
  getCollectionsContainingRecipe,
  saveCollections,
  getFavoriteRecipeIds,
  saveFavoriteRecipeIds,
  isRecipeFavorited,
  toggleFavoriteRecipe,
  getFavoriteRecipes,
  buildFavoriteCollection,
  buildMealPlanRecord,
  applyMealPlanRecord,
  getCookingRecords,
  saveCookingRecords,
  addCookingRecord,
  getMenus,
  saveMenus,
  createMenu,
  renameMenu,
  deleteMenu,
  addRecipeToMenu,
  removeRecipeFromMenu,
  getMenuRecipes,
  getAllFridgeItems,
  saveFridgeItems,
  getDataStats,
  exportData,
  importData,
  clearAllData,
}
