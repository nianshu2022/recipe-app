const GITHUB_API = 'https://api.github.com/repos/nianshu2022/recipe-app/releases/latest'
const GITHUB_PROXIES = [
  'https://ghfast.top/',
  'https://ghproxy.net/',
  'https://mirror.ghproxy.com/',
  '',
]

export interface UpdateInfo {
  hasUpdate: boolean
  currentVersion: string
  latestVersion: string
  downloadUrl: string
  fallbackUrl: string
  releaseNotes: string
  publishedAt: string
}

async function fetchWithProxy(url: string): Promise<Response | null> {
  for (const proxy of GITHUB_PROXIES) {
    try {
      const res = await fetch(`${proxy}${url}`, {
        headers: { Accept: 'application/vnd.github.v3+json' },
        signal: AbortSignal.timeout(5000),
      })
      if (res.ok) return res
    } catch {
      continue
    }
  }
  return null
}

export async function checkForUpdate(): Promise<UpdateInfo | null> {
  try {
    const res = await fetchWithProxy(GITHUB_API)
    if (!res) return null

    const data = await res.json()
    const currentVersion = '1.0.7'
    const latestVersion = data.tag_name?.replace('v', '') || ''

    if (!latestVersion) return null

    const hasUpdate = compareVersions(latestVersion, currentVersion) > 0

    const apkAsset = data.assets?.find((a: { name: string }) => 
      a.name.endsWith('.apk')
    )

    const originalUrl = apkAsset?.browser_download_url || data.html_url
    let downloadUrl = originalUrl
    for (const proxy of GITHUB_PROXIES) {
      if (proxy) {
        downloadUrl = `${proxy}${originalUrl}`
        break
      }
    }

    return {
      hasUpdate,
      currentVersion,
      latestVersion,
      downloadUrl,
      fallbackUrl: originalUrl,
      releaseNotes: data.body || '',
      publishedAt: data.published_at || '',
    }
  } catch {
    return null
  }
}

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0
    const nb = pb[i] || 0
    if (na > nb) return 1
    if (na < nb) return -1
  }
  return 0
}
