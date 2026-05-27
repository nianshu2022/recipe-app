import type { Env } from '../index'
import type { User } from '../middleware/auth'

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}

const tables = [
  { table: 'recipes', idCol: 'id' },
  { table: 'collections', idCol: 'id' },
  { table: 'menus', idCol: 'id' },
  { table: 'meal_plans', idCol: 'id' },
  { table: 'shopping_lists', idCol: 'id' },
  { table: 'fridge_items', idCol: 'id' },
  { table: 'cooking_records', idCol: 'id' },
]

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

    return json({ changes, timestamp: new Date().toISOString() })
  }

  // POST /api/sync — batch push
  if (request.method === 'POST') {
    const body = await request.json<{
      changes: Record<string, { action: 'upsert' | 'delete'; data: Record<string, unknown> }[]>
    }>()

    const results: Record<string, number> = {}

    for (const [table, ops] of Object.entries(body.changes)) {
      const tableDef = tables.find((t) => t.table === table)
      if (!tableDef) continue

      let count = 0
      for (const op of ops) {
        const data = { ...op.data, user_id: user.id }

        if (op.action === 'delete') {
          await env.DB.prepare(
            `UPDATE ${table} SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ? AND user_id = ?`,
          )
            .bind(data.id, user.id)
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

          await env.DB.prepare(
            `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})
             ON CONFLICT(id) DO UPDATE SET ${updates}, updated_at = datetime('now')`,
          )
            .bind(...values)
            .run()
        }
        count++
      }
      results[table] = count
    }

    return json({ synced: results, timestamp: new Date().toISOString() })
  }

  return json({ error: 'Method not allowed' }, 405)
}
