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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}

function error(message: string, status = 400) {
  return json({ error: message }, status)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    const url = new URL(request.url)
    const path = url.pathname

    try {
      // Public routes
      if (path === '/api/auth/register' || path === '/api/auth/login' || path === '/api/auth/refresh') {
        return await handleAuth(request, env)
      }

      // Protected routes
      const user = await authenticate(request, env)
      if (!user) {
        return error('Unauthorized', 401)
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

      return error('Not found', 404)
    } catch (e) {
      console.error(e)
      return error('Internal server error', 500)
    }
  },
}
