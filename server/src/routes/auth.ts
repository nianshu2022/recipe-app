import type { Env } from '../index'
import { signJWT, verifyJWT } from '../middleware/auth'
import {
  jsonResponse, errorResponse,
  checkRateLimit, rateLimitHeaders,
  validateEmail, validatePassword, validateString,
} from '../utils/response'

type AuthBody = {
  email?: string
  password?: string
  nickname?: string
  refreshToken?: string
}

const PBKDF2_ITERATIONS = 200_000

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
    { name: 'PBKDF2', salt: encoder.encode(actualSalt), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
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

async function hashRefreshToken(token: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(token))
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
}

export async function handleAuth(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const path = url.pathname

  if (request.method !== 'POST') {
    return errorResponse('Method not allowed', 405, request)
  }

  let body: AuthBody
  try {
    body = await request.json() as AuthBody
  } catch {
    return errorResponse('Invalid JSON body', 400, request)
  }

  // Rate limit: 5 attempts per minute per IP for auth endpoints
  const clientIp = request.headers.get('CF-Connecting-IP') ?? 'unknown'
  const rateResult = checkRateLimit(`auth:${clientIp}`, 5, 60_000)
  const extraHeaders = rateLimitHeaders(rateResult)
  if (!rateResult.allowed) {
    return jsonResponse({ error: 'Too many requests, please try again later' }, 429, request)
  }

  // Register
  if (path === '/api/auth/register') {
    const { email, password, nickname } = body
    if (!email || !password) {
      return errorResponse('Email and password required', 400, request)
    }
    if (!validateEmail(email)) {
      return errorResponse('Invalid email format', 400, request)
    }
    if (!validatePassword(password)) {
      return errorResponse('Password must be 8-128 characters', 400, request)
    }
    if (nickname !== undefined && !validateString(nickname, 50)) {
      return errorResponse('Nickname must be 1-50 characters', 400, request)
    }

    const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
    if (existing) {
      return errorResponse('Registration failed', 400, request)
    }

    const id = crypto.randomUUID()
    const passwordHash = await hashPassword(password)
    await env.DB.prepare(
      'INSERT INTO users (id, email, password_hash, nickname) VALUES (?, ?, ?, ?)',
    )
      .bind(id, email, passwordHash, nickname ?? email.split('@')[0])
      .run()

    const accessToken = await signJWT({ sub: id }, env.JWT_SECRET, 900)
    const refreshToken = await signJWT({ sub: id, type: 'refresh' }, env.JWT_SECRET, 604800)

    const tokenHash = await hashRefreshToken(refreshToken, env.JWT_SECRET)
    await env.DB.prepare(
      'INSERT INTO sessions (id, user_id, refresh_token, expires_at) VALUES (?, ?, ?, datetime("now", "+7 days"))',
    )
      .bind(crypto.randomUUID(), id, tokenHash)
      .run()

    const response = jsonResponse(
      { accessToken, refreshToken, user: { id, email, nickname: nickname ?? email.split('@')[0] } },
      200, request,
    )
    for (const [k, v] of Object.entries(extraHeaders)) {
      response.headers.set(k, v)
    }
    return response
  }

  // Login
  if (path === '/api/auth/login') {
    const { email, password } = body
    if (!email || !password) {
      return errorResponse('Email and password required', 400, request)
    }

    const user = await env.DB.prepare(
      'SELECT id, email, nickname, password_hash FROM users WHERE email = ?',
    )
      .bind(email)
      .first<{ id: string; email: string; nickname: string; password_hash: string }>()

    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return errorResponse('Invalid credentials', 401, request)
    }

    const accessToken = await signJWT({ sub: user.id }, env.JWT_SECRET, 900)
    const refreshToken = await signJWT({ sub: user.id, type: 'refresh' }, env.JWT_SECRET, 604800)

    const tokenHash = await hashRefreshToken(refreshToken, env.JWT_SECRET)
    await env.DB.prepare(
      'INSERT INTO sessions (id, user_id, refresh_token, expires_at) VALUES (?, ?, ?, datetime("now", "+7 days"))',
    )
      .bind(crypto.randomUUID(), user.id, tokenHash)
      .run()

    const response = jsonResponse(
      { accessToken, refreshToken, user: { id: user.id, email: user.email, nickname: user.nickname } },
      200, request,
    )
    for (const [k, v] of Object.entries(extraHeaders)) {
      response.headers.set(k, v)
    }
    return response
  }

  // Refresh
  if (path === '/api/auth/refresh') {
    const { refreshToken } = body
    if (!refreshToken) {
      return errorResponse('Refresh token required', 400, request)
    }

    const payload = await verifyJWT(refreshToken, env.JWT_SECRET)
    if (!payload || payload.type !== 'refresh') {
      return errorResponse('Invalid refresh token', 401, request)
    }

    const tokenHash = await hashRefreshToken(refreshToken, env.JWT_SECRET)

    const anySession = await env.DB.prepare(
      'SELECT id, user_id, expires_at FROM sessions WHERE refresh_token = ?',
    )
      .bind(tokenHash)
      .first<{ id: string; user_id: string; expires_at: string }>()

    if (!anySession) {
      return errorResponse('Invalid refresh token', 401, request)
    }
    if (typeof payload.sub !== 'string' || anySession.user_id !== payload.sub) {
      return errorResponse('Invalid refresh token', 401, request)
    }

    const isExpired = new Date(anySession.expires_at).getTime() < Date.now()

    if (isExpired) {
      await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(anySession.id).run()
      return errorResponse('Session expired, please log in again', 401, request)
    }

    const user = await env.DB.prepare('SELECT id, email, nickname FROM users WHERE id = ?')
      .bind(payload.sub)
      .first<{ id: string; email: string; nickname: string }>()

    if (!user) {
      return errorResponse('User not found', 401, request)
    }

    const newAccessToken = await signJWT({ sub: user.id }, env.JWT_SECRET, 900)
    const newRefreshToken = await signJWT({ sub: user.id, type: 'refresh' }, env.JWT_SECRET, 604800)

    const newTokenHash = await hashRefreshToken(newRefreshToken, env.JWT_SECRET)
    await env.DB.prepare('UPDATE sessions SET refresh_token = ?, expires_at = datetime("now", "+7 days") WHERE id = ?')
      .bind(newTokenHash, anySession.id)
      .run()

    return jsonResponse({ accessToken: newAccessToken, refreshToken: newRefreshToken, user }, 200, request)
  }

  // Logout
  if (path === '/api/auth/logout') {
    const { refreshToken } = body
    if (refreshToken) {
      const tokenHash = await hashRefreshToken(refreshToken, env.JWT_SECRET)
      await env.DB.prepare('DELETE FROM sessions WHERE refresh_token = ?')
        .bind(tokenHash)
        .run()
    }
    return jsonResponse({ success: true }, 200, request)
  }

  return errorResponse('Not found', 404, request)
}
