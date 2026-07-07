const {
  getAllCollections,
  getCookingRecords,
  getAllFridgeItems,
  getAllMealPlanRecords,
  getAllRecipes,
  getAllShoppingLists,
  saveCookingRecords,
  saveCollections,
  saveFridgeItems,
  saveMealPlanRecords,
  saveRecipes,
  saveShoppingLists,
} = require('./storage')

const API_BASE = 'https://recipe-api.nianshu2022.cn'
const API_FALLBACK = 'https://recipe-app-api.2478951652.workers.dev'
const ACCESS_TOKEN_KEY = 'zhiwei_access_token'
const REFRESH_TOKEN_KEY = 'zhiwei_refresh_token'
const USER_KEY = 'zhiwei_user_profile'
const LAST_SYNC_KEY = 'zhiwei_last_sync'

const JSON_FIELDS = new Set([
  'tags',
  'ingredients',
  'steps',
  'nutrition',
  'recipe_ids',
  'source_recipe_ids',
  'items',
  'days',
  'nutriments',
])

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

let useFallback = false
let syncing = false

function getBaseUrl() {
  return useFallback ? API_FALLBACK : API_BASE
}

function request(path, options = {}) {
  const token = wx.getStorageSync(ACCESS_TOKEN_KEY)
  const header = {
    'Content-Type': 'application/json',
    ...(options.header || {}),
  }
  if (token) {
    header.Authorization = `Bearer ${token}`
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${getBaseUrl()}${path}`,
      method: options.method || 'GET',
      data: options.data,
      header,
      success: (res) => {
        if (useFallback) useFallback = false
        resolve(res)
      },
      fail: () => {
        if (useFallback) {
          reject(new Error('Network error'))
          return
        }
        useFallback = true
        wx.request({
          url: `${getBaseUrl()}${path}`,
          method: options.method || 'GET',
          data: options.data,
          header,
          success: resolve,
          fail: () => reject(new Error('Network error')),
        })
      },
    })
  })
}

async function requestWithRefresh(path, options = {}) {
  let res = await request(path, options)
  if (res.statusCode === 401 && await refreshTokenIfNeeded()) {
    res = await request(path, options)
  }
  return res
}

function storeAuthData(data) {
  wx.setStorageSync(ACCESS_TOKEN_KEY, data.accessToken)
  wx.setStorageSync(REFRESH_TOKEN_KEY, data.refreshToken)
  wx.setStorageSync(USER_KEY, data.user)
}

async function login(email, password) {
  const res = await request('/api/auth/login', {
    method: 'POST',
    data: { email, password },
  })
  if (res.statusCode < 200 || res.statusCode >= 300) return false
  storeAuthData(res.data)
  return true
}

async function register(email, password, nickname) {
  const res = await request('/api/auth/register', {
    method: 'POST',
    data: { email, password, nickname },
  })
  if (res.statusCode < 200 || res.statusCode >= 300) return false
  storeAuthData(res.data)
  return true
}

async function refreshTokenIfNeeded() {
  const refreshToken = wx.getStorageSync(REFRESH_TOKEN_KEY)
  if (!refreshToken) return false
  try {
    const res = await request('/api/auth/refresh', {
      method: 'POST',
      data: { refreshToken },
    })
    if (res.statusCode < 200 || res.statusCode >= 300) return false
    storeAuthData(res.data)
    return true
  } catch (error) {
    return false
  }
}

async function logout() {
  const refreshToken = wx.getStorageSync(REFRESH_TOKEN_KEY)
  if (refreshToken) {
    try {
      await request('/api/auth/logout', {
        method: 'POST',
        data: { refreshToken },
      })
    } catch (error) {
      // 本地退出优先，不阻断用户操作。
    }
  }
  wx.removeStorageSync(ACCESS_TOKEN_KEY)
  wx.removeStorageSync(REFRESH_TOKEN_KEY)
  wx.removeStorageSync(USER_KEY)
  wx.removeStorageSync(LAST_SYNC_KEY)
}

function isLoggedIn() {
  return Boolean(wx.getStorageSync(ACCESS_TOKEN_KEY))
}

function getCurrentUser() {
  const user = wx.getStorageSync(USER_KEY)
  return user && typeof user === 'object' ? user : null
}

function snakeKey(key) {
  return key.replace(/[A-Z]/g, (value) => `_${value.toLowerCase()}`)
}

function camelKey(key) {
  return key.replace(/_([a-z])/g, (_, value) => value.toUpperCase())
}

function mapClientToServer(record) {
  const mapped = {}
  for (const [key, value] of Object.entries(record)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue
    if (key === 'syncStatus' || key === 'userId' || value === undefined) continue
    const nextKey = snakeKey(key)
    mapped[nextKey] = JSON_FIELDS.has(nextKey) ? JSON.stringify(value) : value
  }
  return mapped
}

function mapServerToClient(record) {
  const mapped = {}
  for (const [key, value] of Object.entries(record || {})) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue
    const nextKey = camelKey(key)
    if (typeof value === 'string' && JSON_FIELDS.has(key)) {
      try {
        mapped[nextKey] = JSON.parse(value)
      } catch (error) {
        mapped[nextKey] = value
      }
    } else {
      mapped[nextKey] = value
    }
  }
  mapped.syncStatus = 'synced'
  return mapped
}

function normalizeRemoteRecipe(recipe) {
  const category = categoryMeta[recipe.category] || categoryMeta['hot-dish']
  return {
    ...recipe,
    categoryName: recipe.categoryName || category.label,
    difficultyName: recipe.difficultyName || difficultyMeta[recipe.difficulty] || recipe.difficulty,
    coverColor: recipe.coverColor || category.color,
    tags: Array.isArray(recipe.tags) ? recipe.tags : [],
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
    steps: Array.isArray(recipe.steps) ? recipe.steps : [],
  }
}

function toChange(record) {
  return {
    action: record.deletedAt ? 'delete' : 'upsert',
    data: mapClientToServer(record),
  }
}

function pendingRecords(records) {
  return records.filter((record) => record.syncStatus === 'pending')
}

function collectChanges() {
  return {
    recipes: pendingRecords(getAllRecipes()).map(toChange),
    collections: pendingRecords(getAllCollections()).map(toChange),
    cooking_records: pendingRecords(getCookingRecords()).map(toChange),
    shopping_lists: pendingRecords(getAllShoppingLists()).map(toChange),
    meal_plans: pendingRecords(getAllMealPlanRecords()).map(toChange),
    fridge_items: pendingRecords(getAllFridgeItems()).map(toChange),
  }
}

async function pushChanges() {
  const changes = collectChanges()
  const pendingRecipeIds = new Set(pendingRecords(getAllRecipes()).map((record) => record.id))
  const pendingCollectionIds = new Set(pendingRecords(getAllCollections()).map((record) => record.id))
  const pendingShoppingListIds = new Set(pendingRecords(getAllShoppingLists()).map((record) => record.id))
  const pendingCookingRecordIds = new Set(pendingRecords(getCookingRecords()).map((record) => record.id))
  const pendingMealPlanIds = new Set(pendingRecords(getAllMealPlanRecords()).map((record) => record.id))
  const pendingFridgeItemIds = new Set(pendingRecords(getAllFridgeItems()).map((record) => record.id))
  const res = await requestWithRefresh('/api/sync', {
    method: 'POST',
    data: { changes },
  })
  if (res.statusCode < 200 || res.statusCode >= 300) {
    throw new Error('Push failed')
  }
  if (pendingRecipeIds.size > 0) {
    saveRecipes(getAllRecipes().map((record) => (
      pendingRecipeIds.has(record.id) ? { ...record, syncStatus: 'synced' } : record
    )))
  }
  if (pendingCollectionIds.size > 0) {
    saveCollections(getAllCollections().map((record) => (
      pendingCollectionIds.has(record.id) ? { ...record, syncStatus: 'synced' } : record
    )))
  }
  if (pendingShoppingListIds.size > 0) {
    saveShoppingLists(getAllShoppingLists().map((record) => (
      pendingShoppingListIds.has(record.id) ? { ...record, syncStatus: 'synced' } : record
    )))
  }
  if (pendingCookingRecordIds.size > 0) {
    saveCookingRecords(getCookingRecords().map((record) => (
      pendingCookingRecordIds.has(record.id) ? { ...record, syncStatus: 'synced' } : record
    )))
  }
  if (pendingMealPlanIds.size > 0) {
    saveMealPlanRecords(getAllMealPlanRecords().map((record) => (
      pendingMealPlanIds.has(record.id) ? { ...record, syncStatus: 'synced' } : record
    )))
  }
  if (pendingFridgeItemIds.size > 0) {
    saveFridgeItems(getAllFridgeItems().map((record) => (
      pendingFridgeItemIds.has(record.id) ? { ...record, syncStatus: 'synced' } : record
    )))
  }
}

function mergeById(localItems, remoteItems) {
  const byId = new Map()
  localItems.forEach((item) => byId.set(item.id, item))
  remoteItems.forEach((item) => {
    const local = byId.get(item.id)
    if (!local) {
      byId.set(item.id, item)
      return
    }

    const remoteUpdated = new Date(item.updatedAt || 0).getTime()
    const localUpdated = new Date(local.updatedAt || 0).getTime()
    if (local.syncStatus === 'pending') {
      if (remoteUpdated > localUpdated) {
        byId.set(item.id, { ...item, syncStatus: 'conflict' })
      }
      return
    }

    if (remoteUpdated >= localUpdated) {
      byId.set(item.id, item)
    }
  })
  return Array.from(byId.values())
}

async function pullChanges() {
  const since = wx.getStorageSync(LAST_SYNC_KEY) || '1970-01-01T00:00:00Z'
  const res = await requestWithRefresh(`/api/sync?since=${encodeURIComponent(since)}`)
  if (res.statusCode < 200 || res.statusCode >= 300) {
    throw new Error('Pull failed')
  }

  const changes = res.data && res.data.changes ? res.data.changes : {}
  const remoteRecipes = Array.isArray(changes.recipes)
    ? changes.recipes.map(mapServerToClient).map(normalizeRemoteRecipe)
    : []
  if (remoteRecipes.length > 0) {
    saveRecipes(mergeById(getAllRecipes(), remoteRecipes))
  }

  const collections = Array.isArray(changes.collections) ? changes.collections.map(mapServerToClient) : []
  if (collections.length > 0) {
    saveCollections(mergeById(getAllCollections(), collections))
  }

  const remoteShoppingLists = Array.isArray(changes.shopping_lists)
    ? changes.shopping_lists.map(mapServerToClient)
    : []
  if (remoteShoppingLists.length > 0) {
    saveShoppingLists(mergeById(getAllShoppingLists(), remoteShoppingLists))
  }

  const remoteCookingRecords = Array.isArray(changes.cooking_records)
    ? changes.cooking_records.map(mapServerToClient)
    : []
  if (remoteCookingRecords.length > 0) {
    saveCookingRecords(mergeById(getCookingRecords(), remoteCookingRecords))
  }

  const mealPlans = Array.isArray(changes.meal_plans) ? changes.meal_plans.map(mapServerToClient) : []
  if (mealPlans.length > 0) {
    saveMealPlanRecords(mergeById(getAllMealPlanRecords(), mealPlans))
  }

  const remoteFridgeItems = Array.isArray(changes.fridge_items)
    ? changes.fridge_items.map(mapServerToClient)
    : []
  if (remoteFridgeItems.length > 0) {
    saveFridgeItems(mergeById(getAllFridgeItems(), remoteFridgeItems))
  }

  wx.setStorageSync(LAST_SYNC_KEY, res.data.timestamp || new Date().toISOString())
}

async function fullSync() {
  if (syncing || !isLoggedIn()) return
  syncing = true
  try {
    await pushChanges()
    await pullChanges()
  } finally {
    syncing = false
  }
}

module.exports = {
  fullSync,
  getCurrentUser,
  isLoggedIn,
  login,
  logout,
  register,
}
