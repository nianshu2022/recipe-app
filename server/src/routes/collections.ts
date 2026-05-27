import type { Env } from '../index'
import type { User } from '../middleware/auth'

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}

export async function handleCollections(
  request: Request,
  env: Env,
  user: User,
  path: string,
): Promise<Response> {
  const idMatch = path.match(/^\/api\/collections\/([^/]+)/)
  const id = idMatch?.[1]

  // GET /api/collections
  if (request.method === 'GET' && !id) {
    const { results } = await env.DB.prepare(
      'SELECT * FROM collections WHERE user_id = ? AND deleted_at IS NULL ORDER BY updated_at DESC',
    )
      .bind(user.id)
      .all()
    return json(results)
  }

  // POST /api/collections
  if (request.method === 'POST' && !id) {
    const body = await request.json<{ id: string; name: string; recipe_ids?: string[] }>()
    const now = new Date().toISOString()
    await env.DB.prepare(
      'INSERT INTO collections (id, user_id, name, recipe_ids, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    )
      .bind(body.id, user.id, body.name, JSON.stringify(body.recipe_ids ?? []), now, now)
      .run()
    return json({ id: body.id, created_at: now }, 201)
  }

  // PUT /api/collections/:id
  if (request.method === 'PUT' && id) {
    const body = await request.json<{ name?: string; recipe_ids?: string[] }>()
    const now = new Date().toISOString()
    const sets: string[] = ['updated_at = ?']
    const params: unknown[] = [now]
    if (body.name !== undefined) { sets.push('name = ?'); params.push(body.name) }
    if (body.recipe_ids !== undefined) { sets.push('recipe_ids = ?'); params.push(JSON.stringify(body.recipe_ids)) }
    params.push(id, user.id)
    await env.DB.prepare(`UPDATE collections SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`)
      .bind(...params)
      .run()
    return json({ id, updated_at: now })
  }

  // DELETE /api/collections/:id
  if (request.method === 'DELETE' && id) {
    const now = new Date().toISOString()
    await env.DB.prepare('UPDATE collections SET deleted_at = ?, updated_at = ? WHERE id = ? AND user_id = ?')
      .bind(now, now, id, user.id)
      .run()
    return json({ id, deleted_at: now })
  }

  return json({ error: 'Method not allowed' }, 405)
}
