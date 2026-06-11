export interface Env {
  DB: D1Database
  MEDIA: R2Bucket
  JWT_SECRET: string
}

import { handleAuth } from './routes/auth'
import { handleRecipes } from './routes/recipes'
import { handleCollections } from './routes/collections'
import { handleSync } from './routes/sync'
import { authenticate } from './middleware/auth'
import { getCorsHeaders, errorResponse, checkRateLimit } from './utils/response'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const corsHeaders = getCorsHeaders(request.headers.get('Origin'))

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    const url = new URL(request.url)
    const path = url.pathname

    // Global rate limit: 100 requests per minute per IP
    const clientIp = request.headers.get('CF-Connecting-IP') ?? 'unknown'
    const globalRate = checkRateLimit(`global:${clientIp}`, 100, 60_000)
    if (!globalRate.allowed) {
      return jsonResponse({ error: 'Too many requests' }, 429, request)
    }

    try {
      // Public routes
      if (
        path === '/api/auth/register' ||
        path === '/api/auth/login' ||
        path === '/api/auth/refresh' ||
        path === '/api/auth/logout'
      ) {
        return await handleAuth(request, env)
      }

      // Protected routes
      const user = await authenticate(request, env)
      if (!user) {
        return errorResponse('Unauthorized', 401, request)
      }

      if (path.startsWith('/api/recipes')) {
        return await handleRecipes(request, env, user, path)
      }
      if (path.startsWith('/api/collections')) {
        return await handleCollections(request, env, user, path)
      }
      if (path === '/api/sync') {
        return await handleSync(request, env, user)
      }

      return errorResponse('Not found', 404, request)
    } catch (e) {
      console.error('Unhandled error:', e)
      const message = e instanceof Error ? e.message : 'Internal server error'
      return errorResponse(message, 500, request)
    }
  },
}

function jsonResponse(data: unknown, status: number, request?: Request) {
  const origin = request?.headers.get('Origin') ?? null
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(origin),
    },
  })
}
