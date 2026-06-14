import Taro from '@tarojs/taro'
import { db } from './storage'

const API_BASE = 'https://recipe-api.nianshu2022.cn'
const API_FALLBACK = 'https://recipe-app-api.2478951652.workers.dev'

let useFallback = false

function getBaseUrl(): string {
  return useFallback ? API_FALLBACK : API_BASE
}

interface SyncResponse {
  changes: Record<string, unknown[]>
  timestamp: string
}

interface PushPayload {
  changes: Record<string, { action: 'upsert' | 'delete'; data: Record<string, unknown> }[]>
}

function getToken(): string | null {
  try {
    return Taro.getStorageSync('access_token') || null
  } catch {
    return null
  }
}

async function apiRequest(
  path: string,
  options: { method?: string; data?: unknown } = {},
): Promise<{ statusCode: number; data: unknown }> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const tryRequest = async (base: string) => {
    return Taro.request({
      url: `${base}${path}`,
      method: (options.method || 'GET') as 'GET' | 'POST' | 'PUT' | 'DELETE',
      data: options.data,
      header: headers,
      timeout: 10000,
    })
  }

  try {
    return await tryRequest(getBaseUrl())
  } catch {
    if (!useFallback) {
      useFallback = true
      try {
        return await tryRequest(getBaseUrl())
      } catch {
        throw new Error('Network error')
      }
    }
    throw new Error('Network error')
  }
}

async function refreshTokenIfNeeded(): Promise<boolean> {
  const refreshToken = Taro.getStorageSync('refresh_token')
  if (!refreshToken) return false

  try {
    const res = await Taro.request({
      url: `${getBaseUrl()}/api/auth/refresh`,
      method: 'POST',
      data: { refreshToken },
      header: { 'Content-Type': 'application/json' },
      timeout: 10000,
    })
    if (res.statusCode !== 200) return false

    const data = res.data as { accessToken: string; refreshToken: string }
    Taro.setStorageSync('access_token', data.accessToken)
    Taro.setStorageSync('refresh_token', data.refreshToken)
    return true
  } catch {
    return false
  }
}

export async function login(email: string, password: string): Promise<boolean> {
  try {
    const res = await apiRequest('/api/auth/login', {
      method: 'POST',
      data: { email, password },
    })
    if (res.statusCode !== 200) return false

    const data = res.data as { accessToken: string; refreshToken: string; user: unknown }
    Taro.setStorageSync('access_token', data.accessToken)
    Taro.setStorageSync('refresh_token', data.refreshToken)
    Taro.setStorageSync('user', JSON.stringify(data.user))
    return true
  } catch {
    return false
  }
}

export async function register(email: string, password: string, nickname?: string): Promise<boolean> {
  try {
    const res = await apiRequest('/api/auth/register', {
      method: 'POST',
      data: { email, password, nickname },
    })
    if (res.statusCode !== 200) return false

    const data = res.data as { accessToken: string; refreshToken: string; user: unknown }
    Taro.setStorageSync('access_token', data.accessToken)
    Taro.setStorageSync('refresh_token', data.refreshToken)
    Taro.setStorageSync('user', JSON.stringify(data.user))
    return true
  } catch {
    return false
  }
}

export async function logout(): Promise<void> {
  const refreshToken = Taro.getStorageSync('refresh_token')
  if (refreshToken) {
    try {
      await Taro.request({
        url: `${getBaseUrl()}/api/auth/logout`,
        method: 'POST',
        data: { refreshToken },
        header: { 'Content-Type': 'application/json' },
        timeout: 10000,
      })
    } catch (e) {
      console.error('Failed to notify server of logout', e)
    }
  }
  Taro.removeStorageSync('access_token')
  Taro.removeStorageSync('refresh_token')
  Taro.removeStorageSync('user')
  Taro.removeStorageSync('last_sync')
}

export function isLoggedIn(): boolean {
  return !!Taro.getStorageSync('access_token')
}

export function getCurrentUser(): { id: string; email: string; nickname: string } | null {
  try {
    const s = Taro.getStorageSync('user')
    return s ? JSON.parse(s) : null
  } catch {
    return null
  }
}

export async function pullChanges(): Promise<void> {
  const since = Taro.getStorageSync('last_sync') || '1970-01-01T00:00:00Z'
  let res = await apiRequest(`/api/sync?since=${encodeURIComponent(since)}`)

  if (res.statusCode === 401) {
    const refreshed = await refreshTokenIfNeeded()
    if (refreshed) {
      res = await apiRequest(`/api/sync?since=${encodeURIComponent(since)}`)
    } else {
      throw new Error('Authentication expired')
    }
  }

  if (res.statusCode !== 200) throw new Error('Pull failed')

  const data = res.data as SyncResponse

  for (const [table, records] of Object.entries(data.changes)) {
    for (const record of records) {
      const r = record as Record<string, unknown>
      const mapped = mapServerToClient(table, r)
      switch (table) {
        case 'recipes':
          await db.putRecipe(mapped as never)
          break
        case 'collections':
          await db.putCollection(mapped as never)
          break
        case 'cooking_records':
          await db.putCookingRecord(mapped as never)
          break
        case 'shopping_lists':
          await db.putShoppingList(mapped as never)
          break
        case 'fridge_items':
          await db.putFridgeItem(mapped as never)
          break
        case 'meal_plans':
          await db.putMealPlan(mapped as never)
          break
      }
    }
  }

  Taro.setStorageSync('last_sync', data.timestamp)
}

export async function pushChanges(): Promise<void> {
  const changes: PushPayload['changes'] = {}

  const recipes = (await db.getAllRecipes()).filter((r) => r.syncStatus === 'pending')
  if (recipes.length > 0) {
    changes.recipes = recipes.map((r) => ({
      action: r.deletedAt ? 'delete' : 'upsert',
      data: mapClientToServer('recipes', r),
    }))
  }

  const collections = (await db.getAllCollections()).filter((c) => c.syncStatus === 'pending')
  if (collections.length > 0) {
    changes.collections = collections.map((c) => ({
      action: c.deletedAt ? 'delete' : 'upsert',
      data: mapClientToServer('collections', c),
    }))
  }

  const cookingRecords = (await db.getAllCookingRecords()).filter((r) => r.syncStatus === 'pending')
  if (cookingRecords.length > 0) {
    changes.cooking_records = cookingRecords.map((r) => ({
      action: r.deletedAt ? 'delete' : 'upsert',
      data: mapClientToServer('cooking_records', r),
    }))
  }

  const shoppingLists = (await db.getAllShoppingLists()).filter((l) => l.syncStatus === 'pending')
  if (shoppingLists.length > 0) {
    changes.shopping_lists = shoppingLists.map((l) => ({
      action: l.deletedAt ? 'delete' : 'upsert',
      data: mapClientToServer('shopping_lists', l),
    }))
  }

  const fridgeItems = (await db.getAllFridgeItems()).filter((i) => i.syncStatus === 'pending')
  if (fridgeItems.length > 0) {
    changes.fridge_items = fridgeItems.map((i) => ({
      action: i.deletedAt ? 'delete' : 'upsert',
      data: mapClientToServer('fridge_items', i),
    }))
  }

  const mealPlans = (await db.getAllMealPlans()).filter((p) => p.syncStatus === 'pending')
  if (mealPlans.length > 0) {
    changes.meal_plans = mealPlans.map((p) => ({
      action: p.deletedAt ? 'delete' : 'upsert',
      data: mapClientToServer('meal_plans', p),
    }))
  }

  if (Object.keys(changes).length === 0) return

  let res = await apiRequest('/api/sync', {
    method: 'POST',
    data: { changes },
  })

  if (res.statusCode === 401) {
    const refreshed = await refreshTokenIfNeeded()
    if (refreshed) {
      res = await apiRequest('/api/sync', {
        method: 'POST',
        data: { changes },
      })
    }
  }

  if (res.statusCode !== 200) throw new Error('Push failed')

  for (const recipe of recipes) {
    await db.putRecipe({ ...recipe, syncStatus: 'synced' })
  }
  for (const col of collections) {
    await db.putCollection({ ...col, syncStatus: 'synced' })
  }
  for (const record of cookingRecords) {
    await db.putCookingRecord({ ...record, syncStatus: 'synced' })
  }
  for (const list of shoppingLists) {
    await db.putShoppingList({ ...list, syncStatus: 'synced' })
  }
  for (const item of fridgeItems) {
    await db.putFridgeItem({ ...item, syncStatus: 'synced' })
  }
  for (const plan of mealPlans) {
    await db.putMealPlan({ ...plan, syncStatus: 'synced' })
  }
}

export async function fullSync(): Promise<void> {
  await pushChanges()
  await pullChanges()
}

function mapServerToClient(_table: string, record: Record<string, unknown>): Record<string, unknown> {
  const mapped: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue
    const camelKey = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
    if (
      typeof value === 'string' &&
      (key === 'tags' || key === 'ingredients' || key === 'steps' || key === 'nutrition' ||
        key === 'recipe_ids' || key === 'source_recipe_ids' || key === 'items' || key === 'days')
    ) {
      try {
        mapped[camelKey] = JSON.parse(value)
      } catch {
        mapped[camelKey] = value
      }
    } else {
      mapped[camelKey] = value
    }
  }
  mapped.syncStatus = 'synced'
  return mapped
}

function mapClientToServer(_table: string, record: Record<string, unknown>): Record<string, unknown> {
  const mapped: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    if (key === 'syncStatus' || key === 'userId') continue
    const snakeKey = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
    if (Array.isArray(value) || (typeof value === 'object' && value !== null && !(value instanceof Date))) {
      mapped[snakeKey] = JSON.stringify(value)
    } else {
      mapped[snakeKey] = value
    }
  }
  return mapped
}
