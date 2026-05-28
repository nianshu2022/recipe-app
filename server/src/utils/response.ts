const ALLOWED_ORIGINS = [
  'https://recipe.nianshu2022.cn',
  'http://localhost:5173',
  'http://localhost:4173',
]

export function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  }
}

export function jsonResponse(data: unknown, status = 200, request?: Request) {
  const origin = request?.headers.get('Origin') ?? null
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(origin),
    },
  })
}

export function errorResponse(message: string, status = 400, request?: Request) {
  return jsonResponse({ error: message }, status, request)
}
