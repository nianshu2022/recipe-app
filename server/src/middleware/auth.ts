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
  const body = base64UrlEncode(JSON.stringify({ ...payload, iat: now, exp: now + expiresInSec }))
  const signature = await hmacSign(`${header}.${body}`, secret)
  return `${header}.${body}.${signature}`
}

export async function verifyJWT(token: string, secret: string): Promise<Record<string, unknown> | null> {
  const parts = token.split('.')
  if (parts.length !== 3) return null

  const [header, body, signature] = parts
  const expectedSig = await hmacSign(`${header}.${body}`, secret)
  if (signature !== expectedSig) return null

  const payload = JSON.parse(base64UrlDecode(body))
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null

  return payload
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
