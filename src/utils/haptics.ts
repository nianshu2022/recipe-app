/**
 * iOS-style Haptic Feedback Utility
 */

export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' = 'light') {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return

  try {
    switch (type) {
      case 'selection':
      case 'light':
        navigator.vibrate(10)
        break
      case 'medium':
        navigator.vibrate(20)
        break
      case 'heavy':
        navigator.vibrate(35)
        break
      case 'success':
        navigator.vibrate([10, 30, 15])
        break
      case 'warning':
        navigator.vibrate([20, 40, 20])
        break
    }
  } catch {
    // Ignore if not permitted by browser context
  }
}

/**
 * Initialize global subtle touch feedback on interactive elements
 */
export function initGlobalHaptics() {
  if (typeof window === 'undefined') return

  window.addEventListener(
    'pointerdown',
    (e) => {
      const target = (e.target as HTMLElement)?.closest('button, [role="button"], .ios-spring, .ios-card-spring')
      if (target) {
        triggerHaptic('light')
      }
    },
    { passive: true },
  )
}
