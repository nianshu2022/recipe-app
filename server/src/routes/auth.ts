import type { Env } from '../index'
import { signJWT, verifyJWT } from '../middleware/auth'
import { jsonResponse } from '../utils/response'

async function hashPassword(password: string, salt?: string): Promise<string> {
  const encoder = new TextEncoder()
  const actualSalt = salt ?? crypto.randomUUID().replace(/-/g, '')
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(actualSalt), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256,
  )
  const hash = btoa(String.fromCharCode(...new Uint8Array(bits)))
  return `${actualSalt}:${hash}`
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt] = stored.split(':')
  if (!salt) return false
  const computed = await hashPassword(password, salt)
  return computed === stored
}

export async function handleAuth(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const path = url.pathname

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, request)
  }

  let body: { email?: string; password?: string; nickname?: string; refreshToken?: string } = {}
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400, request)
  }

  // Register
  if (path === '/api/auth/register') {
    const { email, password, nickname } = body
    if (!email || !password) {
      return jsonResponse({ error: 'Email and password required' }, 400, request)
    }
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({ error: 'Invalid email format' }, 400, request)
    }
    if (typeof password !== 'string' || password.length < 8) {
      return jsonResponse({ error: 'Password must be at least 8 characters' }, 400, request)
    }
    if (nickname !== undefined && (typeof nickname !== 'string' || nickname.length > 50)) {
      return jsonResponse({ error: 'Invalid nickname' }, 400, request)
    }

    const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
    if (existing) {
      return jsonResponse({ error: 'Email already registered' }, 409, request)
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

    return jsonResponse({ accessToken, refreshToken, user: { id, email, nickname: nickname ?? email.split('@')[0] } }, 200, request)
  }

  // Login
  if (path === '/api/auth/login') {
    const { email, password } = body
    if (!email || !password) {
      return jsonResponse({ error: 'Email and password required' }, 400, request)
    }

    const user = await env.DB.prepare(
      'SELECT id, email, nickname, password_hash FROM users WHERE email = ?',
    )
      .bind(email)
      .first<{ id: string; email: string; nickname: string; password_hash: string }>()

    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return jsonResponse({ error: 'Invalid credentials' }, 401, request)
    }

    const accessToken = await signJWT({ sub: user.id, email: user.email }, env.JWT_SECRET, 900)
    const refreshToken = await signJWT({ sub: user.id, type: 'refresh' }, env.JWT_SECRET, 604800)

    await env.DB.prepare(
      'INSERT INTO sessions (id, user_id, refresh_token, expires_at) VALUES (?, ?, ?, datetime("now", "+7 days"))',
    )
      .bind(crypto.randomUUID(), user.id, refreshToken)
      .run()

    return jsonResponse({ accessToken, refreshToken, user: { id: user.id, email: user.email, nickname: user.nickname } }, 200, request)
  }

  // Refresh
  if (path === '/api/auth/refresh') {
    const { refreshToken } = body
    if (!refreshToken) {
      return jsonResponse({ error: 'Refresh token required' }, 400, request)
    }

    const payload = await verifyJWT(refreshToken, env.JWT_SECRET)
    if (!payload || payload.type !== 'refresh') {
      return jsonResponse({ error: 'Invalid refresh token' }, 401, request)
    }

    const session = await env.DB.prepare(
      'SELECT id, user_id FROM sessions WHERE refresh_token = ? AND expires_at > datetime("now")',
    )
      .bind(refreshToken)
      .first<{ id: string; user_id: string }>()

    if (!session) {
      // Token reuse detected: invalidate all sessions for this user
      await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(payload.sub).run()
      return jsonResponse({ error: 'Session expired or token reused' }, 401, request)
    }

    const user = await env.DB.prepare('SELECT id, email, nickname FROM users WHERE id = ?')
      .bind(payload.sub)
      .first<{ id: string; email: string; nickname: string }>()

    if (!user) {
      return jsonResponse({ error: 'User not found' }, 401, request)
    }

    const newAccessToken = await signJWT({ sub: user.id, email: user.email }, env.JWT_SECRET, 900)
    const newRefreshToken = await signJWT({ sub: user.id, type: 'refresh' }, env.JWT_SECRET, 604800)

    // Rotate refresh token
    await env.DB.prepare('UPDATE sessions SET refresh_token = ?, expires_at = datetime("now", "+7 days") WHERE id = ?')
      .bind(newRefreshToken, session.id)
      .run()

    return jsonResponse({ accessToken: newAccessToken, refreshToken: newRefreshToken, user }, 200, request)
  }

  // Logout
  if (path === '/api/auth/logout') {
    const { refreshToken } = body
    if (refreshToken) {
      await env.DB.prepare('DELETE FROM sessions WHERE refresh_token = ?')
        .bind(refreshToken)
        .run()
    }
    return jsonResponse({ success: true }, 200, request)
  }

  return jsonResponse({ error: 'Not found' }, 404, request)
}
