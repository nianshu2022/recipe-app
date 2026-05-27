import type { Env } from '../index'
import { signJWT, verifyJWT } from '../middleware/auth'

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
}

export async function handleAuth(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const path = url.pathname

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const body = await request.json<{ email: string; password: string; nickname?: string }>()

  // Register
  if (path === '/api/auth/register') {
    const { email, password, nickname } = body
    if (!email || !password) {
      return json({ error: 'Email and password required' }, 400)
    }

    const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
    if (existing) {
      return json({ error: 'Email already registered' }, 409)
    }

    const id = crypto.randomUUID()
    const passwordHash = await hashPassword(password)
    await env.DB.prepare(
      'INSERT INTO users (id, email, password_hash, nickname) VALUES (?, ?, ?, ?)',
    )
      .bind(id, email, passwordHash, nickname ?? email.split('@')[0])
      .run()

    const accessToken = await signJWT({ sub: id, email }, env.JWT_SECRET, 900) // 15 min
    const refreshToken = await signJWT({ sub: id, type: 'refresh' }, env.JWT_SECRET, 604800) // 7 days

    // Store refresh token
    await env.DB.prepare(
      'INSERT INTO sessions (id, user_id, refresh_token, expires_at) VALUES (?, ?, ?, datetime("now", "+7 days"))',
    )
      .bind(crypto.randomUUID(), id, refreshToken)
      .run()

    return json({ accessToken, refreshToken, user: { id, email, nickname: nickname ?? email.split('@')[0] } })
  }

  // Login
  if (path === '/api/auth/login') {
    const { email, password } = body
    if (!email || !password) {
      return json({ error: 'Email and password required' }, 400)
    }

    const passwordHash = await hashPassword(password)
    const user = await env.DB.prepare(
      'SELECT id, email, nickname FROM users WHERE email = ? AND password_hash = ?',
    )
      .bind(email, passwordHash)
      .first<{ id: string; email: string; nickname: string }>()

    if (!user) {
      return json({ error: 'Invalid credentials' }, 401)
    }

    const accessToken = await signJWT({ sub: user.id, email: user.email }, env.JWT_SECRET, 900)
    const refreshToken = await signJWT({ sub: user.id, type: 'refresh' }, env.JWT_SECRET, 604800)

    await env.DB.prepare(
      'INSERT INTO sessions (id, user_id, refresh_token, expires_at) VALUES (?, ?, ?, datetime("now", "+7 days"))',
    )
      .bind(crypto.randomUUID(), user.id, refreshToken)
      .run()

    return json({ accessToken, refreshToken, user })
  }

  // Refresh
  if (path === '/api/auth/refresh') {
    const { refreshToken } = body
    if (!refreshToken) {
      return json({ error: 'Refresh token required' }, 400)
    }

    const payload = await verifyJWT(refreshToken, env.JWT_SECRET)
    if (!payload || payload.type !== 'refresh') {
      return json({ error: 'Invalid refresh token' }, 401)
    }

    const session = await env.DB.prepare(
      'SELECT id FROM sessions WHERE refresh_token = ? AND expires_at > datetime("now")',
    )
      .bind(refreshToken)
      .first()

    if (!session) {
      return json({ error: 'Session expired' }, 401)
    }

    const user = await env.DB.prepare('SELECT id, email, nickname FROM users WHERE id = ?')
      .bind(payload.sub)
      .first<{ id: string; email: string; nickname: string }>()

    if (!user) {
      return json({ error: 'User not found' }, 401)
    }

    const newAccessToken = await signJWT({ sub: user.id, email: user.email }, env.JWT_SECRET, 900)
    const newRefreshToken = await signJWT({ sub: user.id, type: 'refresh' }, env.JWT_SECRET, 604800)

    // Rotate refresh token
    await env.DB.prepare('UPDATE sessions SET refresh_token = ?, expires_at = datetime("now", "+7 days") WHERE id = ?')
      .bind(newRefreshToken, session.id)
      .run()

    return json({ accessToken: newAccessToken, refreshToken: newRefreshToken, user })
  }

  return json({ error: 'Not found' }, 404)
}
