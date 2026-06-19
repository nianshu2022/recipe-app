const GITHUB_API = 'https://api.github.com/repos/nianshu2022/recipe-app/releases/latest'
const GITHUB_MIRROR = 'https://ghproxy.com/' // 国内 GitHub 代理

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
    // 尝试直接访问 GitHub API
    let res = await fetch(GITHUB_API, {
      headers: { Accept: 'application/vnd.github.v3+json' },
    })
    
    // 如果失败，尝试使用代理
    if (!res.ok) {
      res = await fetch(`${GITHUB_MIRROR}${GITHUB_API}`, {
        headers: { Accept: 'application/vnd.github.v3+json' },
      })
    }
    
    if (!res.ok) return null

    const data = await res.json()
    const currentVersion = '1.0.2' // 需要与 build.gradle 中的版本一致
    const latestVersion = data.tag_name?.replace('v', '') || ''

    if (!latestVersion) return null

    const hasUpdate = compareVersions(latestVersion, currentVersion) > 0

    const apkAsset = data.assets?.find((a: { name: string }) => 
      a.name.endsWith('.apk')
    )

    // 为国内用户使用代理下载
    let downloadUrl = apkAsset?.browser_download_url || data.html_url
    if (downloadUrl && !downloadUrl.includes('ghproxy.com')) {
      downloadUrl = `${GITHUB_MIRROR}${downloadUrl}`
    }

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