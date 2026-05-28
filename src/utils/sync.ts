import { db } from '@/db'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'https://recipe-api.nianshu2022.cn'
const API_FALLBACK = import.meta.env.VITE_API_FALLBACK ?? 'https://recipe-app-api.2478951652.workers.dev'

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
  return localStorage.getItem('access_token')
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const res = await fetch(`${getBaseUrl()}${path}`, { ...options, headers })
    return res
  } catch {
    // If primary fails and we're not already using fallback, try fallback
    if (!useFallback) {
      useFallback = true
      console.warn('Primary API unavailable, switching to fallback')
      return fetch(`${getBaseUrl()}${path}`, { ...options, headers })
    }
    throw new Error('Network error')
  }
}

async function refreshTokenIfNeeded(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refresh_token')
  if (!refreshToken) return false

  try {
    const res = await fetch(`${getBaseUrl()}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) return false

    const data = await res.json()
    localStorage.setItem('access_token', data.accessToken)
    localStorage.setItem('refresh_token', data.refreshToken)
    return true
  } catch {
    return false
  }
}

export async function login(email: string, password: string): Promise<boolean> {
  const res = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) return false

  const data = await res.json()
  localStorage.setItem('access_token', data.accessToken)
  localStorage.setItem('refresh_token', data.refreshToken)
  localStorage.setItem('user', JSON.stringify(data.user))
  return true
}

export async function register(email: string, password: string, nickname?: string): Promise<boolean> {
  const res = await apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, nickname }),
  })
  if (!res.ok) return false

  const data = await res.json()
  localStorage.setItem('access_token', data.accessToken)
  localStorage.setItem('refresh_token', data.refreshToken)
  localStorage.setItem('user', JSON.stringify(data.user))
  return true
}

export async function logout(): Promise<void> {
  const refreshToken = localStorage.getItem('refresh_token')
  if (refreshToken) {
    try {
      await fetch(`${getBaseUrl()}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
    } catch (e) {
      console.error('Failed to notify server of logout', e)
    }
  }
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')
  localStorage.removeItem('last_sync')
}

export function isLoggedIn(): boolean {
  return !!localStorage.getItem('access_token')
}

export function getCurrentUser(): { id: string; email: string; nickname: string } | null {
  const s = localStorage.getItem('user')
  return s ? JSON.parse(s) : null
}

// Sync engine
export async function pullChanges(): Promise<void> {
  const since = localStorage.getItem('last_sync') ?? '1970-01-01T00:00:00Z'
  let res = await apiFetch(`/api/sync?since=${encodeURIComponent(since)}`)

  // Try refresh if unauthorized
  if (res.status === 401) {
    const refreshed = await refreshTokenIfNeeded()
    if (refreshed) {
      res = await apiFetch(`/api/sync?since=${encodeURIComponent(since)}`)
    } else {
      throw new Error('Authentication expired')
    }
  }

  if (!res.ok) throw new Error('Pull failed')

  const data: SyncResponse = await res.json()

  // Apply changes to IndexedDB
  const validTables = new Set(['recipes', 'collections', 'cooking_records', 'shopping_lists', 'fridge_items', 'meal_plans'])
  for (const [table, records] of Object.entries(data.changes)) {
    if (!validTables.has(table)) continue
    if (!Array.isArray(records)) continue
    for (const record of records) {
      if (typeof record !== 'object' || record === null) continue
      const r = record as Record<string, unknown>
      const mapped = mapServerToClient(table, r)
      if (!mapped.id || typeof mapped.id !== 'string') continue
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

  localStorage.setItem('last_sync', data.timestamp)
}

export async function pushChanges(): Promise<void> {
  const changes: PushPayload['changes'] = {}

  // Collect pending items from IndexedDB
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

  let res = await apiFetch('/api/sync', {
    method: 'POST',
    body: JSON.stringify({ changes }),
  })

  if (res.status === 401) {
    const refreshed = await refreshTokenIfNeeded()
    if (refreshed) {
      res = await apiFetch('/api/sync', {
        method: 'POST',
        body: JSON.stringify({ changes }),
      })
    }
  }

  if (!res.ok) throw new Error('Push failed')

  // Mark as synced
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

// Field mapping between client (camelCase) and server (snake_case)
function mapServerToClient(_table: string, record: Record<string, unknown>): Record<string, unknown> {
  const mapped: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    // Skip prototype pollution vectors
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
    // Parse JSON fields
    if (typeof value === 'string' && (key === 'tags' || key === 'ingredients' || key === 'steps' || key === 'nutrition' || key === 'recipe_ids' || key === 'source_recipe_ids' || key === 'items' || key === 'days')) {
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
    // Stringify array/object fields
    if (Array.isArray(value) || (typeof value === 'object' && value !== null && !(value instanceof Date))) {
      mapped[snakeKey] = JSON.stringify(value)
    } else {
      mapped[snakeKey] = value
    }
  }
  return mapped
}
