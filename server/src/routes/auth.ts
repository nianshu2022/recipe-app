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
  code?: string
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
  const rateResult = await checkRateLimit(`auth:${clientIp}`, 5, 60_000, env)
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

  // Send verification code
  if (path === '/api/auth/send-code') {
    const { email } = body
    if (!email || !validateEmail(email)) {
      return errorResponse('请提供有效的邮箱地址', 400, request)
    }

    // Rate limit: 1 code per 60 seconds per email
    const codeRate = await checkRateLimit(`code:${email}`, 1, 60_000, env)
    if (!codeRate.allowed) {
      return errorResponse('发送过于频繁，请60秒后重试', 429, request)
    }

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const codeId = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes

    // Delete old unused codes for this email
    await env.DB.prepare(
      'DELETE FROM verification_codes WHERE email = ? AND used = 0',
    ).bind(email).run()

    // Save new code
    await env.DB.prepare(
      'INSERT INTO verification_codes (id, email, code, purpose, expires_at) VALUES (?, ?, ?, ?, ?)',
    ).bind(codeId, email, code, 'login', expiresAt).run()

    // Send email via Resend API
    if (env.RESEND_API_KEY) {
      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: '知味 <noreply@nianshu2022.cn>',
            to: email,
            subject: '【知味】登录验证码',
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px;">
                <h2 style="color: #252220;">知味 · 登录验证码</h2>
                <p style="color: #6b6355; font-size: 14px;">您正在使用邮箱验证码登录，验证码为：</p>
                <div style="background: #f5f3ef; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
                  <span style="font-size: 32px; font-weight: bold; color: #c9583a; letter-spacing: 8px;">${code}</span>
                </div>
                <p style="color: #a8a08e; font-size: 12px;">验证码5分钟内有效，请勿泄露给他人。</p>
              </div>
            `,
          }),
        })

        if (!resendRes.ok) {
          const errText = await resendRes.text()
          console.error('Resend API error:', errText)
          return errorResponse('验证码发送失败，请稍后重试', 500, request)
        }
      } catch (e) {
        console.error('Failed to send email:', e)
        return errorResponse('验证码发送失败，请稍后重试', 500, request)
      }
    } else {
      // Development mode: log code to console
      console.log(`[DEV] Verification code for ${email}: ${code}`)
    }

    return jsonResponse({ success: true, message: '验证码已发送' }, 200, request)
  }

  // Login with verification code
  if (path === '/api/auth/login-code') {
    const { email, code } = body
    if (!email || !validateEmail(email)) {
      return errorResponse('请提供有效的邮箱地址', 400, request)
    }
    if (!code || typeof code !== 'string' || code.length !== 6) {
      return errorResponse('请提供6位验证码', 400, request)
    }

    // Find valid code
    const record = await env.DB.prepare(
      'SELECT id FROM verification_codes WHERE email = ? AND code = ? AND used = 0 AND expires_at > datetime("now")',
    ).bind(email, code).first<{ id: string }>()

    if (!record) {
      return errorResponse('验证码无效或已过期', 401, request)
    }

    // Mark code as used
    await env.DB.prepare(
      'UPDATE verification_codes SET used = 1 WHERE id = ?',
    ).bind(record.id).run()

    // Find or create user
    let user = await env.DB.prepare(
      'SELECT id, email, nickname FROM users WHERE email = ?',
    ).bind(email).first<{ id: string; email: string; nickname: string }>()

    if (!user) {
      // Auto-register
      const userId = crypto.randomUUID()
      const nickname = email.split('@')[0]
      // Generate a random password for code-login users
      const randomPassword = crypto.randomUUID().slice(0, 16)
      const passwordHash = await hashPassword(randomPassword)

      await env.DB.prepare(
        'INSERT INTO users (id, email, password_hash, nickname) VALUES (?, ?, ?, ?)',
      ).bind(userId, email, passwordHash, nickname).run()

      user = { id: userId, email, nickname }
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
      { accessToken, refreshToken, user },
      200, request,
    )
    for (const [k, v] of Object.entries(extraHeaders)) {
      response.headers.set(k, v)
    }
    return response
  }

  return errorResponse('Not found', 404, request)
}
