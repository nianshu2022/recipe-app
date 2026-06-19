import type { Env } from '../index'
import type { User } from '../middleware/auth'
import { jsonResponse, errorResponse, getCorsHeaders } from '../utils/response'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

const EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

// Magic bytes for file type validation
const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header (first 4 bytes)
}

async function validateMagicBytes(blob: Blob, expectedType: string): Promise<boolean> {
  const signatures = MAGIC_BYTES[expectedType]
  if (!signatures) return true // No signature to check

  const buffer = await blob.slice(0, 8).arrayBuffer()
  const bytes = new Uint8Array(buffer)

  return signatures.some(sig =>
    sig.every((byte, i) => bytes[i] === byte)
  )
}

export async function handleMedia(
  request: Request,
  env: Env,
  user: User,
  path: string,
): Promise<Response> {
  // POST /api/media/upload — upload image to R2
  if (request.method === 'POST' && path === '/api/media/upload') {
    const contentType = request.headers.get('Content-Type') ?? ''

    let blob: Blob
    let fileType: string

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file')
      if (!file || typeof file === 'string') {
        return errorResponse('No file provided', 400, request)
      }
      blob = file as Blob
      fileType = (file as Blob).type || 'application/octet-stream'
    } else {
      blob = await request.blob()
      fileType = contentType.split(';')[0].trim()
    }

    if (!ALLOWED_TYPES.has(fileType)) {
      return errorResponse('Unsupported file type. Allowed: JPEG, PNG, WebP, GIF', 400, request)
    }

    if (blob.size > MAX_FILE_SIZE) {
      return errorResponse('File too large. Maximum size: 5MB', 400, request)
    }

    // Validate magic bytes to prevent file type spoofing
    if (!await validateMagicBytes(blob, fileType)) {
      return errorResponse('File content does not match declared type', 400, request)
    }

    const ext = EXT_MAP[fileType] ?? 'bin'
    const key = `uploads/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    await env.MEDIA.put(key, blob, {
      httpMetadata: { contentType: fileType },
      customMetadata: { userId: user.id, uploadedAt: new Date().toISOString() },
    })

    return jsonResponse({ key, url: `/api/media/${key}` }, 200, request)
  }

  // GET /api/media/:key — serve image from R2
  if (request.method === 'GET' && path.startsWith('/api/media/')) {
    const key = path.replace('/api/media/', '')
    if (!key) {
      return errorResponse('Missing key', 400, request)
    }

    // Validate key format to prevent path traversal
    if (key.includes('..') || !key.startsWith('uploads/')) {
      return errorResponse('Invalid key', 400, request)
    }

    const object = await env.MEDIA.get(key)
    if (!object) {
      return errorResponse('Not found', 404, request)
    }

    const headers = new Headers()
    if (object.httpMetadata?.contentType) {
      headers.set('Content-Type', object.httpMetadata.contentType)
    }
    headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    
    // Use origin-specific CORS instead of wildcard
    const origin = request.headers.get('Origin')
    const corsHeaders = getCorsHeaders(origin)
    if (corsHeaders['Access-Control-Allow-Origin']) {
      headers.set('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin'])
    }

    return new Response(object.body, { headers })
  }

  // DELETE /api/media/:key — delete image from R2
  if (request.method === 'DELETE' && path.startsWith('/api/media/')) {
    const key = path.replace('/api/media/', '')
    if (!key) {
      return errorResponse('Missing key', 400, request)
    }

    const object = await env.MEDIA.get(key)
    if (!object) {
      return errorResponse('Not found', 404, request)
    }

    const meta = object.customMetadata
    if (meta?.userId !== user.id) {
      return errorResponse('Forbidden', 403, request)
    }

    await env.MEDIA.delete(key)
    return jsonResponse({ deleted: true }, 200, request)
  }

  return errorResponse('Method not allowed', 405, request)
}
