const GITHUB_API = 'https://api.github.com/repos/nianshu2022/recipe-app/releases/latest'

export interface UpdateInfo {
  hasUpdate: boolean
  currentVersion: string
  latestVersion: string
  downloadUrl: string
  releaseNotes: string
  publishedAt: string
}

export async function checkForUpdate(): Promise<UpdateInfo | null> {
  try {
    const res = await fetch(GITHUB_API, {
      headers: { Accept: 'application/vnd.github.v3+json' },
    })
    
    if (!res.ok) return null

    const data = await res.json()
    const currentVersion = '1.0.0'
    const latestVersion = data.tag_name?.replace('v', '') || ''

    if (!latestVersion) return null

    const hasUpdate = compareVersions(latestVersion, currentVersion) > 0

    const apkAsset = data.assets?.find((a: { name: string }) => 
      a.name.endsWith('.apk')
    )

    return {
      hasUpdate,
      currentVersion,
      latestVersion,
      downloadUrl: apkAsset?.browser_download_url || data.html_url,
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