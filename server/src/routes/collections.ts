import type { Env } from '../index'
import type { User } from '../middleware/auth'
import { jsonResponse } from '../utils/response'

type CreateCollectionBody = {
  id?: string
  name?: string
  cover_image?: string
  recipe_ids?: string[]
}

type UpdateCollectionBody = {
  name?: string
  cover_image?: string
  recipe_ids?: string[]
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
    return jsonResponse(results, 200, request)
  }

  // POST /api/collections
  if (request.method === 'POST' && !id) {
    let body: CreateCollectionBody
    try {
      body = await request.json() as CreateCollectionBody
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400, request)
    }

    if (!body.id || !body.name) {
      return jsonResponse({ error: 'Missing required collection fields' }, 400, request)
    }

    const now = new Date().toISOString()
    await env.DB.prepare(
      'INSERT INTO collections (id, user_id, name, cover_image, recipe_ids, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
      .bind(body.id, user.id, body.name, body.cover_image ?? null, JSON.stringify(body.recipe_ids ?? []), now, now)
      .run()
    return jsonResponse({ id: body.id, created_at: now }, 201, request)
  }

  // PUT /api/collections/:id
  if (request.method === 'PUT' && id) {
    let body: UpdateCollectionBody
    try {
      body = await request.json() as UpdateCollectionBody
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400, request)
    }

    const now = new Date().toISOString()
    const sets: string[] = ['updated_at = ?']
    const params: unknown[] = [now]
    if (body.name !== undefined) { sets.push('name = ?'); params.push(body.name) }
    if (body.cover_image !== undefined) { sets.push('cover_image = ?'); params.push(body.cover_image) }
    if (body.recipe_ids !== undefined) { sets.push('recipe_ids = ?'); params.push(JSON.stringify(body.recipe_ids)) }
    params.push(id, user.id)
    await env.DB.prepare(`UPDATE collections SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`)
      .bind(...params)
      .run()
    return jsonResponse({ id, updated_at: now }, 200, request)
  }

  // DELETE /api/collections/:id
  if (request.method === 'DELETE' && id) {
    const now = new Date().toISOString()
    await env.DB.prepare('UPDATE collections SET deleted_at = ?, updated_at = ? WHERE id = ? AND user_id = ?')
      .bind(now, now, id, user.id)
      .run()
    return jsonResponse({ id, deleted_at: now }, 200, request)
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, request)
}
