const ALLOWED_ORIGINS = [
  'https://recipe.nianshu2022.cn',
  'http://localhost:5173',
  'http://localhost:4173',
]

export function getCorsHeaders(origin: string | null): Record<string, string> {
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return {
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  }
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  }
}

export function jsonResponse(data: unknown, status = 200, request?: Request) {
  const origin = request?.headers.get('Origin') ?? null
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(origin),
    },
  })
}

export function errorResponse(message: string, status = 400, request?: Request) {
  return jsonResponse({ error: message }, status, request)
}

// Rate limiting using in-memory store (resets on Worker restart)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  env?: { RATE_LIMIT_KV?: KVNamespace },
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Date.now()

  // Try KV-based rate limiting if available (persistent across isolates)
  if (env?.RATE_LIMIT_KV) {
    try {
      const kvKey = `ratelimit:${key}`
      const stored = await env.RATE_LIMIT_KV.get(kvKey, { type: 'json' }) as { count: number; resetAt: number } | null
      const entry = stored || { count: 0, resetAt: now + windowMs }

      if (now > entry.resetAt) {
        entry.count = 1
        entry.resetAt = now + windowMs
      } else if (entry.count >= limit) {
        return { allowed: false, remaining: 0, resetAt: entry.resetAt }
      } else {
        entry.count++
      }

      await env.RATE_LIMIT_KV.put(kvKey, JSON.stringify(entry), { expirationTtl: Math.ceil(windowMs / 1000) + 10 })
      return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt }
    } catch {
      // Fall through to in-memory if KV fails
    }
  }

  // Fallback: in-memory rate limiting
  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}

export function rateLimitHeaders(result: { remaining: number; resetAt: number }): Record<string, string> {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  }
}

// Input validation helpers
export function validateEmail(email: unknown): email is string {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
}

export function validatePassword(password: unknown): password is string {
  return typeof password === 'string' && password.length >= 8 && password.length <= 128
}

export function validateString(value: unknown, maxLen: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= maxLen
}

export function validateNumber(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && value >= min && value <= max
}

export function validateArray(value: unknown, itemValidator: (item: unknown) => boolean): value is unknown[] {
  return Array.isArray(value) && value.every(itemValidator)
}

export function validateRecipeInput(body: Record<string, unknown>): { valid: boolean; error?: string } {
  if (!validateString(body.name, 50)) return { valid: false, error: '菜名不能为空且不超过50字' }
  if (!validateString(body.category, 20)) return { valid: false, error: '分类无效' }
  if (body.difficulty !== undefined && !['easy', 'medium', 'hard'].includes(body.difficulty as string)) {
    return { valid: false, error: '难度等级无效' }
  }
  if (body.duration !== undefined && !validateNumber(body.duration, 1, 1440)) {
    return { valid: false, error: '时长应在1-1440分钟之间' }
  }
  if (body.servings !== undefined && !validateNumber(body.servings, 1, 100)) {
    return { valid: false, error: '份数应在1-100之间' }
  }
  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags)) return { valid: false, error: '标签格式无效' }
    if (body.tags.length > 10) return { valid: false, error: '标签最多10个' }
    if (!body.tags.every((t: unknown) => typeof t === 'string' && t.length <= 20)) {
      return { valid: false, error: '每个标签不超过20字' }
    }
  }
  if (body.ingredients !== undefined) {
    if (!Array.isArray(body.ingredients)) return { valid: false, error: '用料格式无效' }
    if (body.ingredients.length > 50) return { valid: false, error: '用料最多50种' }
  }
  if (body.steps !== undefined) {
    if (!Array.isArray(body.steps)) return { valid: false, error: '步骤格式无效' }
    if (body.steps.length > 30) return { valid: false, error: '步骤最多30步' }
  }
  return { valid: true }
}
