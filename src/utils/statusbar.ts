import { StatusBar, Style } from '@capacitor/status-bar'
import { Capacitor } from '@capacitor/core'

export async function initStatusBar() {
  if (!Capacitor.isNativePlatform()) return

  try {
    await StatusBar.setOverlaysWebView({ overlay: false })
    await StatusBar.setBackgroundColor({ color: '#fafaf9' })
    await StatusBar.setStyle({ style: Style.Dark })
  } catch (e) {
    console.warn('StatusBar init failed:', e)
  }
}
