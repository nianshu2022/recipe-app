import type { Env } from '../index'
import type { User } from '../middleware/auth'
import { jsonResponse } from '../utils/response'

const tables = [
  { table: 'recipes' },
  { table: 'collections' },
  { table: 'menus' },
  { table: 'meal_plans' },
  { table: 'shopping_lists' },
  { table: 'fridge_items' },
  { table: 'cooking_records' },
]

// Whitelisted columns per table for SQL safety
const allowedColumns: Record<string, Set<string>> = {
  recipes: new Set(['id', 'user_id', 'name', 'category', 'tags', 'difficulty', 'duration', 'servings', 'cover_image', 'ingredients', 'steps', 'nutrition', 'deleted_at', 'created_at', 'updated_at']),
  collections: new Set(['id', 'user_id', 'name', 'cover_image', 'recipe_ids', 'deleted_at', 'created_at', 'updated_at']),
  menus: new Set(['id', 'user_id', 'name', 'recipe_ids', 'deleted_at', 'created_at', 'updated_at']),
  meal_plans: new Set(['id', 'user_id', 'week_start', 'days', 'deleted_at', 'created_at', 'updated_at']),
  shopping_lists: new Set(['id', 'user_id', 'source_recipe_ids', 'items', 'deleted_at', 'created_at', 'updated_at']),
  fridge_items: new Set(['id', 'user_id', 'name', 'brand', 'category', 'amount', 'unit', 'image_url', 'nutriments', 'purchase_date', 'expiry_date', 'deleted_at', 'created_at', 'updated_at']),
  cooking_records: new Set(['id', 'user_id', 'recipe_id', 'date', 'servings', 'notes', 'deleted_at', 'created_at', 'updated_at']),
}

type SyncBody = {
  changes?: Record<string, { action: 'upsert' | 'delete'; data: Record<string, unknown> }[]>
}

function sanitizeColumns(table: string, data: Record<string, unknown>): Record<string, unknown> {
  const allowed = allowedColumns[table]
  if (!allowed) return data
  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (allowed.has(key)) {
      sanitized[key] = value
    }
  }
  return sanitized
}

export async function handleSync(request: Request, env: Env, user: User): Promise<Response> {
  // GET /api/sync?since=timestamp — incremental pull
  if (request.method === 'GET') {
    const url = new URL(request.url)
    const since = url.searchParams.get('since') ?? '1970-01-01T00:00:00Z'

    const changes: Record<string, unknown[]> = {}
    for (const { table } of tables) {
      const { results } = await env.DB.prepare(
        `SELECT * FROM ${table} WHERE user_id = ? AND updated_at > ? ORDER BY updated_at`,
      )
        .bind(user.id, since)
        .all()
      if (results.length > 0) {
        changes[table] = results
      }
    }

    return jsonResponse({ changes, timestamp: new Date().toISOString() }, 200, request)
  }

  // POST /api/sync — batch push
  if (request.method === 'POST') {
    let body: SyncBody
    try {
      body = await request.json() as SyncBody
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400, request)
    }

    if (!body.changes || typeof body.changes !== 'object') {
      return jsonResponse({ error: 'Changes payload required' }, 400, request)
    }

    const results: Record<string, number> = {}

    for (const [table, ops] of Object.entries(body.changes)) {
      const tableDef = tables.find((t) => t.table === table)
      if (!tableDef) continue

      let count = 0
      for (const op of ops) {
        if (op.action !== 'upsert' && op.action !== 'delete') continue
        const now = new Date().toISOString()
        const data = sanitizeColumns(table, { ...op.data, user_id: user.id, updated_at: now })
        if (typeof data.id !== 'string') continue

        if (op.action === 'delete') {
          await env.DB.prepare(
            `UPDATE ${table} SET deleted_at = ?, updated_at = ? WHERE id = ? AND user_id = ?`,
          )
            .bind(now, now, data.id, user.id)
            .run()
        } else {
          // Upsert
          const columns = Object.keys(data)
          const values = Object.values(data)
          const placeholders = columns.map(() => '?').join(', ')
          const updates = columns
            .filter((c) => c !== 'id' && c !== 'user_id' && c !== 'created_at')
            .map((c) => `${c} = excluded.${c}`)
            .join(', ')

          if (updates.length > 0) {
            await env.DB.prepare(
              `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})
               ON CONFLICT(id) DO UPDATE SET ${updates}
               WHERE ${table}.user_id = excluded.user_id`,
            )
              .bind(...values)
              .run()
          } else {
            await env.DB.prepare(
              `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})
               ON CONFLICT(id) DO NOTHING`,
            )
              .bind(...values)
              .run()
          }
        }
        count++
      }
      results[table] = count
    }

    return jsonResponse({ synced: results, timestamp: new Date().toISOString() }, 200, request)
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, request)
}
