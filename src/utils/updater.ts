const GITHUB_API = 'https://api.github.com/repos/nianshu2022/recipe-app/releases/latest'
const R2_BASE = 'https://pub-e0895a39a1f746bcbbaefc526fa28c4a.r2.dev'

export interface UpdateInfo {
  hasUpdate: boolean
  currentVersion: string
  latestVersion: string
  downloadUrl: string
  releaseNotes: string
  publishedAt: string
}

async function fetchWithTimeout(url: string, timeout = 5000): Promise<Response | null> {
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/vnd.github.v3+json' },
      signal: AbortSignal.timeout(timeout),
    })
    if (res.ok) return res
  } catch {
    // ignore
  }
  return null
}

export async function checkForUpdate(): Promise<UpdateInfo | null> {
  try {
    const res = await fetchWithTimeout(GITHUB_API)
    if (!res) return null

    const data = await res.json()
    const currentVersion = '1.1.0'
    const latestVersion = data.tag_name?.replace('v', '') || ''

    if (!latestVersion) return null

    const hasUpdate = compareVersions(latestVersion, currentVersion) > 0

    // 优先使用 R2 下载，速度快且稳定
    const downloadUrl = `${R2_BASE}/zhivei-${latestVersion}-android-arm64-release.apk`

    return {
      hasUpdate,
      currentVersion,
      latestVersion,
      downloadUrl,
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
