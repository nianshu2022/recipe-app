import { db } from '@/db'
import type {
  Recipe, Collection, CookingRecord,
  ShoppingList, MealPlan, FridgeItem,
} from '@/types'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'https://recipe-api.nianshu2022.cn'
const API_FALLBACK = import.meta.env.VITE_API_FALLBACK ?? 'https://recipe-app-api.2478951652.workers.dev'

let useFallback = false
let syncing = false

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

interface SyncableRecord {
  id: string
  syncStatus: string
  deletedAt?: string
}

type DBMethods = {
  getAll: () => Promise<SyncableRecord[]>
  get: (id: string) => Promise<SyncableRecord | undefined>
  put: (record: SyncableRecord) => Promise<IDBValidKey>
}

const TABLE_CONFIG: Record<string, DBMethods> = {
  recipes: {
    getAll: () => db.getAllRecipes() as Promise<SyncableRecord[]>,
    get: (id) => db.getRecipe(id) as Promise<SyncableRecord | undefined>,
    put: (r) => db.putRecipe(r as Recipe),
  },
  collections: {
    getAll: () => db.getAllCollections() as Promise<SyncableRecord[]>,
    get: (id) => db.getCollection(id) as Promise<SyncableRecord | undefined>,
    put: (r) => db.putCollection(r as Collection),
  },
  cooking_records: {
    getAll: () => db.getAllCookingRecords() as Promise<SyncableRecord[]>,
    get: (id) => db.getCookingRecord(id) as Promise<SyncableRecord | undefined>,
    put: (r) => db.putCookingRecord(r as CookingRecord),
  },
  shopping_lists: {
    getAll: () => db.getAllShoppingLists() as Promise<SyncableRecord[]>,
    get: (id) => db.getShoppingList(id) as Promise<SyncableRecord | undefined>,
    put: (r) => db.putShoppingList(r as ShoppingList),
  },
  meal_plans: {
    getAll: () => db.getAllMealPlans() as Promise<SyncableRecord[]>,
    get: (id) => db.getMealPlan(id) as Promise<SyncableRecord | undefined>,
    put: (r) => db.putMealPlan(r as MealPlan),
  },
  fridge_items: {
    getAll: () => db.getAllFridgeItems() as Promise<SyncableRecord[]>,
    get: (id) => db.getFridgeItem(id) as Promise<SyncableRecord | undefined>,
    put: (r) => db.putFridgeItem(r as FridgeItem),
  },
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
    if (useFallback) {
      useFallback = false
    }
    return res
  } catch {
    if (!useFallback) {
      useFallback = true
      console.warn('Primary API unavailable, switching to fallback')
      return fetch(`${getBaseUrl()}${path}`, { ...options, headers })
    }
    throw new Error('Network error')
  }
}

async function apiFetchWithRefresh(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  let res = await apiFetch(path, options)
  if (res.status === 401) {
    const refreshed = await refreshTokenIfNeeded()
    if (refreshed) {
      res = await apiFetch(path, options)
    } else {
      throw new Error('Authentication expired')
    }
  }
  return res
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

function storeAuthData(data: { accessToken: string; refreshToken: string; user: unknown }) {
  localStorage.setItem('access_token', data.accessToken)
  localStorage.setItem('refresh_token', data.refreshToken)
  localStorage.setItem('user', JSON.stringify(data.user))
}

export async function login(email: string, password: string): Promise<boolean> {
  const res = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) return false

  const data = await res.json()
  storeAuthData(data)
  return true
}

export async function register(email: string, password: string, nickname?: string): Promise<boolean> {
  const res = await apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, nickname }),
  })
  if (!res.ok) return false

  const data = await res.json()
  storeAuthData(data)
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

function mapServerToClient(record: Record<string, unknown>): Record<string, unknown> {
  const mapped: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
    if (typeof value === 'string' && JSON_FIELDS.has(key)) {
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

function mapClientToServer(record: Record<string, unknown>): Record<string, unknown> {
  const mapped: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    if (key === 'syncStatus' || key === 'userId') continue
    if (value === undefined) continue
    const snakeKey = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
    if (JSON_FIELDS.has(snakeKey)) {
      mapped[snakeKey] = JSON.stringify(value)
    } else {
      mapped[snakeKey] = value
    }
  }
  return mapped
}

function toChangeEntry(record: SyncableRecord) {
  return {
    action: record.deletedAt ? 'delete' as const : 'upsert' as const,
    data: mapClientToServer(record as unknown as Record<string, unknown>),
  }
}

export async function pullChanges(): Promise<void> {
  const since = localStorage.getItem('last_sync') ?? '1970-01-01T00:00:00Z'
  const res = await apiFetchWithRefresh(`/api/sync?since=${encodeURIComponent(since)}`)
  if (!res.ok) throw new Error('Pull failed')

  const data: SyncResponse = await res.json()

  for (const [table, records] of Object.entries(data.changes)) {
    const config = TABLE_CONFIG[table]
    if (!config || !Array.isArray(records)) continue

    for (const record of records) {
      if (typeof record !== 'object' || record === null) continue
      const mapped = mapServerToClient(record as Record<string, unknown>)
      if (!mapped.id || typeof mapped.id !== 'string') continue

      const localRecord = await config.get(mapped.id as string)
      if (localRecord && localRecord.syncStatus === 'pending') {
        const localUpdated = new Date((localRecord as Record<string, unknown>).updatedAt as string).getTime()
        const remoteUpdated = new Date(mapped.updatedAt as string).getTime()
        if (remoteUpdated > localUpdated) {
          mapped.syncStatus = 'conflict'
          await config.put(mapped as unknown as SyncableRecord)
        }
        continue
      }

      await config.put(mapped as unknown as SyncableRecord)
    }
  }

  localStorage.setItem('last_sync', data.timestamp)
}

export async function pushChanges(): Promise<void> {
  const changes: PushPayload['changes'] = {}
  const pendingRecords: Record<string, SyncableRecord[]> = {}

  for (const [table, config] of Object.entries(TABLE_CONFIG)) {
    const all = await config.getAll()
    const pending = all.filter((r) => r.syncStatus === 'pending')
    if (pending.length > 0) {
      changes[table] = pending.map((r) => toChangeEntry(r))
      pendingRecords[table] = pending
    }
  }

  if (Object.keys(changes).length === 0) return

  const res = await apiFetchWithRefresh('/api/sync', {
    method: 'POST',
    body: JSON.stringify({ changes }),
  })

  if (!res.ok) throw new Error('Push failed')

  for (const [table, records] of Object.entries(pendingRecords)) {
    const config = TABLE_CONFIG[table]
    for (const record of records) {
      await config.put({ ...record, syncStatus: 'synced' })
    }
  }
}

export async function fullSync(): Promise<void> {
  if (syncing) return
  syncing = true
  try {
    await pushChanges()
    await pullChanges()
  } finally {
    syncing = false
  }
}
