import type { Env } from '../index'

export interface User {
  id: string
  email: string
  nickname: string
}

// Simple JWT implementation for Cloudflare Workers (no external deps)
function base64UrlEncode(data: string): string {
  return btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(data: string): string {
  let s = data.replace(/-/g, '+').replace(/_/g, '/')
  while (s.length % 4) s += '='
  return atob(s)
}

async function hmacSign(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
  return base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)))
}

export async function signJWT(payload: Record<string, unknown>, secret: string, expiresInSec: number): Promise<string> {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const now = Math.floor(Date.now() / 1000)
  const body = base64UrlEncode(JSON.stringify({
    ...payload,
    iat: now,
    exp: now + expiresInSec,
    iss: 'recipe-app',
    aud: 'recipe-client',
  }))
  const signature = await hmacSign(`${header}.${body}`, secret)
  return `${header}.${body}.${signature}`
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

export async function verifyJWT(token: string, secret: string): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [header, body, signature] = parts

    // Decode and validate header
    const headerObj = JSON.parse(base64UrlDecode(header))
    if (headerObj.alg === 'none') return null // Reject "none" algorithm
    if (headerObj.alg !== 'HS256') return null // Only allow HS256

    const expectedSig = await hmacSign(`${header}.${body}`, secret)
    if (!timingSafeEqual(signature, expectedSig)) return null

    const payload = JSON.parse(base64UrlDecode(body))
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null
    if (payload.iss && payload.iss !== 'recipe-app') return null
    if (payload.aud && payload.aud !== 'recipe-client') return null

    return payload
  } catch {
    return null
  }
}

export async function authenticate(request: Request, env: Env): Promise<User | null> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.slice(7)
  const payload = await verifyJWT(token, env.JWT_SECRET)
  if (!payload || !payload.sub) return null

  const user = await env.DB.prepare('SELECT id, email, nickname FROM users WHERE id = ?')
    .bind(payload.sub)
    .first<User>()

  return user ?? null
}
