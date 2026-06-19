import type { Env } from '../index'
import type { User } from '../middleware/auth'
import {
  jsonResponse, errorResponse,
  checkRateLimit, rateLimitHeaders,
  validateRecipeInput, validateString,
} from '../utils/response'

type RecipeBody = {
  id?: string
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
}

const MAX_PAGE_SIZE = 100
const DEFAULT_PAGE_SIZE = 50

export async function handleRecipes(
  request: Request,
  env: Env,
  user: User,
  path: string,
): Promise<Response> {
  const url = new URL(request.url)
  const idMatch = path.match(/^\/api\/recipes\/([^/]+)/)
  const id = idMatch?.[1]

  // Rate limit: 60 requests per minute per user
  const rateResult = await checkRateLimit(`recipes:${user.id}`, 60, 60_000, env)
  const extraHeaders = rateLimitHeaders(rateResult)
  if (!rateResult.allowed) {
    return jsonResponse({ error: 'Too many requests' }, 429, request)
  }

  // GET /api/recipes
  if (request.method === 'GET' && !id) {
    const since = url.searchParams.get('since')
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10))
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(url.searchParams.get('page_size') ?? String(DEFAULT_PAGE_SIZE), 10)))
    const offset = (page - 1) * pageSize

    let query = 'SELECT * FROM recipes WHERE user_id = ? AND deleted_at IS NULL'
    const params: unknown[] = [user.id]
    if (since) {
      query += ' AND updated_at > ?'
      params.push(since)
    }

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM recipes WHERE user_id = ? AND deleted_at IS NULL${since ? ' AND updated_at > ?' : ''}`
    const countParams = since ? [user.id, since] : [user.id]
    const { total } = await env.DB.prepare(countQuery).bind(...countParams).first<{ total: number }>() ?? { total: 0 }

    query += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?'
    params.push(pageSize, offset)

    const { results } = await env.DB.prepare(query).bind(...params).all()
    return new Response(JSON.stringify({
      data: results,
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize),
      },
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...extraHeaders,
      },
    })
  }

  // GET /api/recipes/:id
  if (request.method === 'GET' && id) {
    const recipe = await env.DB.prepare('SELECT * FROM recipes WHERE id = ? AND user_id = ?')
      .bind(id, user.id)
      .first()
    if (!recipe) return errorResponse('Not found', 404, request)
    return jsonResponse(recipe, 200, request)
  }

  // POST /api/recipes
  if (request.method === 'POST' && !id) {
    let body: RecipeBody
    try {
      body = await request.json() as RecipeBody
    } catch {
      return errorResponse('Invalid JSON body', 400, request)
    }

    if (!body.id || !validateString(body.id, 50)) {
      return errorResponse('Invalid recipe ID', 400, request)
    }

    const validation = validateRecipeInput(body as Record<string, unknown>)
    if (!validation.valid) {
      return errorResponse(validation.error!, 400, request)
    }

    const now = new Date().toISOString()
    await env.DB.prepare(
      `INSERT INTO recipes (id, user_id, name, category, tags, difficulty, duration, servings, ingredients, steps, nutrition, cover_image, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        body.id, user.id, body.name!, body.category!,
        JSON.stringify(body.tags ?? []), body.difficulty ?? 'easy', body.duration ?? 30, body.servings ?? 2,
        JSON.stringify(body.ingredients ?? []), JSON.stringify(body.steps ?? []),
        body.nutrition ? JSON.stringify(body.nutrition) : null,
        body.cover_image ?? null, now, now,
      )
      .run()

    return jsonResponse({ id: body.id, created_at: now }, 201, request)
  }

  // PUT /api/recipes/:id
  if (request.method === 'PUT' && id) {
    let body: RecipeBody
    try {
      body = await request.json() as RecipeBody
    } catch {
      return errorResponse('Invalid JSON body', 400, request)
    }

    const validation = validateRecipeInput(body as Record<string, unknown>)
    if (!validation.valid) {
      return errorResponse(validation.error!, 400, request)
    }

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

    return jsonResponse({ id, updated_at: now }, 200, request)
  }

  // DELETE /api/recipes/:id
  if (request.method === 'DELETE' && id) {
    const now = new Date().toISOString()
    await env.DB.prepare('UPDATE recipes SET deleted_at = ?, updated_at = ? WHERE id = ? AND user_id = ?')
      .bind(now, now, id, user.id)
      .run()
    return jsonResponse({ id, deleted_at: now }, 200, request)
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, request)
}
