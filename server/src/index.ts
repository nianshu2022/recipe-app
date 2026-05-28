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
import { getCorsHeaders, jsonResponse, errorResponse } from './utils/response'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const corsHeaders = getCorsHeaders(request.headers.get('Origin'))

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    const url = new URL(request.url)
    const path = url.pathname

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
      console.error(e)
      return errorResponse('Internal server error', 500, request)
    }
  },
}

