import type { Env } from '../index'
import type { User } from '../middleware/auth'

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}

export async function handleRecipes(
  request: Request,
  env: Env,
  user: User,
  path: string,
): Promise<Response> {
  const url = new URL(request.url)
  const idMatch = path.match(/^\/api\/recipes\/([^/]+)/)
  const id = idMatch?.[1]

  // GET /api/recipes
  if (request.method === 'GET' && !id) {
    const since = url.searchParams.get('since')
    let query = 'SELECT * FROM recipes WHERE user_id = ? AND deleted_at IS NULL'
    const params: unknown[] = [user.id]
    if (since) {
      query += ' AND updated_at > ?'
      params.push(since)
    }
    query += ' ORDER BY updated_at DESC'

    const { results } = await env.DB.prepare(query).bind(...params).all()
    return json(results)
  }

  // GET /api/recipes/:id
  if (request.method === 'GET' && id) {
    const recipe = await env.DB.prepare('SELECT * FROM recipes WHERE id = ? AND user_id = ?')
      .bind(id, user.id)
      .first()
    if (!recipe) return json({ error: 'Not found' }, 404)
    return json(recipe)
  }

  // POST /api/recipes
  if (request.method === 'POST' && !id) {
    const body = await request.json<{
      id: string
      name: string
      category: string
      tags: string[]
      difficulty: string
      duration: number
      servings: number
      ingredients: unknown[]
      steps: unknown[]
      nutrition?: unknown
      cover_image?: string
    }>()

    const now = new Date().toISOString()
    await env.DB.prepare(
      `INSERT INTO recipes (id, user_id, name, category, tags, difficulty, duration, servings, ingredients, steps, nutrition, cover_image, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        body.id, user.id, body.name, body.category,
        JSON.stringify(body.tags), body.difficulty, body.duration, body.servings,
        JSON.stringify(body.ingredients), JSON.stringify(body.steps),
        body.nutrition ? JSON.stringify(body.nutrition) : null,
        body.cover_image ?? null, now, now,
      )
      .run()

    return json({ id: body.id, created_at: now }, 201)
  }

  // PUT /api/recipes/:id
  if (request.method === 'PUT' && id) {
    const body = await request.json<{
      name?: string
      category?: string
      tags?: string[]
      difficulty?: string
      duration?: number
      servings?: number
      ingredients?: unknown[]
      steps?: unknown[]
      nutrition?: unknown
      cover_image?: string
    }>()

    const now = new Date().toISOString()
    const sets: string[] = ['updated_at = ?']
    const params: unknown[] = [now]

    if (body.name !== undefined) { sets.push('name = ?'); params.push(body.name) }
    if (body.category !== undefined) { sets.push('category = ?'); params.push(body.category) }
    if (body.tags !== undefined) { sets.push('tags = ?'); params.push(JSON.stringify(body.tags)) }
    if (body.difficulty !== undefined) { sets.push('difficulty = ?'); params.push(body.difficulty) }
    if (body.duration !== undefined) { sets.push('duration = ?'); params.push(body.duration) }
    if (body.servings !== undefined) { sets.push('servings = ?'); params.push(body.servings) }
    if (body.ingredients !== undefined) { sets.push('ingredients = ?'); params.push(JSON.stringify(body.ingredients)) }
    if (body.steps !== undefined) { sets.push('steps = ?'); params.push(JSON.stringify(body.steps)) }
    if (body.nutrition !== undefined) { sets.push('nutrition = ?'); params.push(JSON.stringify(body.nutrition)) }
    if (body.cover_image !== undefined) { sets.push('cover_image = ?'); params.push(body.cover_image) }

    params.push(id, user.id)
    await env.DB.prepare(
      `UPDATE recipes SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`,
    )
      .bind(...params)
      .run()

    return json({ id, updated_at: now })
  }

  // DELETE /api/recipes/:id
  if (request.method === 'DELETE' && id) {
    const now = new Date().toISOString()
    await env.DB.prepare('UPDATE recipes SET deleted_at = ?, updated_at = ? WHERE id = ? AND user_id = ?')
      .bind(now, now, id, user.id)
      .run()
    return json({ id, deleted_at: now })
  }

  return json({ error: 'Method not allowed' }, 405)
}
