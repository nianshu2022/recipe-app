import { useEffect } from 'react'

export function useWakeLock() {
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null

    const request = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen')
        }
      } catch {
        // ignore
      }
    }

    request()

    return () => {
      wakeLock?.release()
    }
  }, [])
}
