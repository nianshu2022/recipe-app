const API_BASE = import.meta.env.VITE_API_BASE ?? 'https://recipe-api.nianshu2022.cn'
const API_FALLBACK = import.meta.env.VITE_API_FALLBACK ?? 'https://recipe-app-api.2478951652.workers.dev'

let useFallback = false

function getToken(): string | null {
  return localStorage.getItem('access_token')
}

function getBaseUrl(): string {
  return useFallback ? API_FALLBACK : API_BASE
}

export async function uploadImage(file: File | Blob): Promise<string> {
  const token = getToken()
  if (!token) throw new Error('Not authenticated')

  const formData = new FormData()
  formData.append('file', file)

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  }

  try {
    const res = await fetch(`${getBaseUrl()}/api/media/upload`, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error((data as { error?: string }).error ?? 'Upload failed')
    }

    if (useFallback) useFallback = false

    const data = await res.json() as { key: string; url: string }
    return data.url
  } catch {
    if (!useFallback) {
      useFallback = true
      const res = await fetch(`${getBaseUrl()}/api/media/upload`, {
        method: 'POST',
        headers,
        body: formData,
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json() as { key: string; url: string }
      return data.url
    }
    throw new Error('Network error')
  }
}

export async function deleteImage(url: string): Promise<void> {
  const token = getToken()
  if (!token) throw new Error('Not authenticated')

  const key = url.startsWith('/api/media/') ? url.replace('/api/media/', '') : url

  await fetch(`${getBaseUrl()}/api/media/${key}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function getImageUrl(url: string): string {
  if (url.startsWith('http')) return url
  return `${getBaseUrl()}${url}`
}
