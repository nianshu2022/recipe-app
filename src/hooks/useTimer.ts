import { useEffect, useRef, useState, useCallback } from 'react'

interface TimerState {
  seconds: number
  total: number
  running: boolean
  alarmActive: boolean
}

export function useTimer() {
  const [state, setState] = useState<TimerState>({
    seconds: 0,
    total: 0,
    running: false,
    alarmActive: false,
  })

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const alarmRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const ensureAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext()
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume()
    }
    return audioCtxRef.current
  }, [])

  const playBeepPattern = useCallback(() => {
    try {
      const ctx = ensureAudioCtx()
      const playBeep = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = freq
        osc.type = 'sine'
        gain.gain.setValueAtTime(0.5, startTime)
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration)
        osc.start(startTime)
        osc.stop(startTime + duration)
      }
      const now = ctx.currentTime
      playBeep(880, now, 0.2)
      playBeep(880, now + 0.25, 0.2)
      playBeep(1320, now + 0.5, 0.4)
    } catch { /* AudioContext not supported */ }
  }, [ensureAudioCtx])

  const stopAlarm = useCallback(() => {
    setState((s) => ({ ...s, alarmActive: false }))
    if (alarmRef.current) {
      clearInterval(alarmRef.current)
      alarmRef.current = null
    }
  }, [])

  const startAlarm = useCallback(() => {
    setState((s) => ({ ...s, alarmActive: true }))
    playBeepPattern()
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([400, 200, 400])
      } catch { /* ignore */ }
    }
    alarmRef.current = setInterval(() => {
      playBeepPattern()
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([400, 200, 400])
        } catch { /* ignore */ }
      }
    }, 1500)
  }, [playBeepPattern])

  const start = useCallback((seconds: number) => {
    ensureAudioCtx()
    setState({ seconds, total: seconds, running: true, alarmActive: false })
  }, [ensureAudioCtx])

  const toggle = useCallback(() => {
    ensureAudioCtx()
    setState((s) => {
      if (s.alarmActive) {
        stopAlarm()
      }
      return { ...s, running: !s.running, alarmActive: false }
    })
  }, [ensureAudioCtx, stopAlarm])

  const reset = useCallback(() => {
    stopAlarm()
    setState((s) => ({ ...s, running: false, seconds: s.total }))
  }, [stopAlarm])

  const prepareForStep = useCallback((stepTimer?: number) => {
    stopAlarm()
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (stepTimer) {
      const total = stepTimer * 60
      setState({ seconds: total, total, running: false, alarmActive: false })
    } else {
      setState({ seconds: 0, total: 0, running: false, alarmActive: false })
    }
  }, [stopAlarm])

  useEffect(() => {
    if (!state.running) return

    const id = setInterval(() => {
      setState((s) => {
        if (s.seconds <= 1) {
          clearInterval(id)
          startAlarm()
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('计时结束', { body: '步骤计时已完成！' })
          }
          return { ...s, seconds: 0, running: false }
        }
        return { ...s, seconds: s.seconds - 1 }
      })
    }, 1000)
    timerRef.current = id
    return () => clearInterval(id)
  }, [state.running, startAlarm])

  useEffect(() => {
    return () => {
      if (alarmRef.current) clearInterval(alarmRef.current)
      audioCtxRef.current?.close()
    }
  }, [])

  return {
    seconds: state.seconds,
    total: state.total,
    running: state.running,
    alarmActive: state.alarmActive,
    percent: state.total > 0 ? ((state.total - state.seconds) / state.total) * 100 : 0,
    start,
    toggle,
    reset,
    stopAlarm,
    prepareForStep,
    ensureAudioCtx,
  }
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
