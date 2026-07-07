export interface Env {
  DB: D1Database
  MEDIA: R2Bucket
  JWT_SECRET: string
  RATE_LIMIT_KV?: KVNamespace
  RESEND_API_KEY?: string
}

import { handleAuth } from './routes/auth'
import { handleRecipes } from './routes/recipes'
import { handleCollections } from './routes/collections'
import { handleSync } from './routes/sync'
import { handleMedia } from './routes/media'
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
    const globalRate = await checkRateLimit(`global:${clientIp}`, 100, 60_000, env)
    if (!globalRate.allowed) {
      return jsonResponse({ error: 'Too many requests' }, 429, request)
    }

    try {
      // Public routes
      if (
        path === '/api/auth/register' ||
        path === '/api/auth/login' ||
        path === '/api/auth/refresh' ||
        path === '/api/auth/logout' ||
        path === '/api/auth/send-code' ||
        path === '/api/auth/login-code'
      ) {
        return await handleAuth(request, env)
      }

      // Protected routes
      const user = await authenticate(request, env)
      if (!user) {
        return errorResponse('Unauthorized', 401, request)
      }

      let response: Response

      if (path.startsWith('/api/recipes')) {
        response = await handleRecipes(request, env, user, path)
      } else if (path.startsWith('/api/collections')) {
        response = await handleCollections(request, env, user, path)
      } else if (path === '/api/sync') {
        response = await handleSync(request, env, user)
      } else if (path.startsWith('/api/media')) {
        response = await handleMedia(request, env, user, path)
      } else {
        response = errorResponse('Not found', 404, request)
      }

      // Add security headers
      response.headers.set('X-Content-Type-Options', 'nosniff')
      response.headers.set('X-Frame-Options', 'DENY')
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
      response.headers.set('X-XSS-Protection', '1; mode=block')

      return response
    } catch (e) {
      console.error('Unhandled error:', e)
      return errorResponse('Internal server error', 500, request)
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
