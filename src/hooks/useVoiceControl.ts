import { useEffect, useRef, useState } from 'react'

// Web Speech API type declarations
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}
interface SpeechRecognitionResultList {
  length: number
  [index: number]: SpeechRecognitionResult
}
interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  [index: number]: SpeechRecognitionAlternative
}
interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  start(): void
  stop(): void
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance
    webkitSpeechRecognition: new () => SpeechRecognitionInstance
  }
}

interface VoiceControlOptions {
  onCommand?: (command: string) => void
  enabled?: boolean
  lang?: string
}

export function useVoiceControl({ onCommand, enabled = false, lang = 'zh-CN' }: VoiceControlOptions) {
  const [isListening, setIsListening] = useState(false)
  const [lastCommand, setLastCommand] = useState('')
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  useEffect(() => {
    if (!enabled) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition not supported')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = lang
    recognition.continuous = true
    recognition.interimResults = false

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results[event.results.length - 1]
      if (last.isFinal) {
        const transcript = last[0].transcript.trim().toLowerCase()
        setLastCommand(transcript)
        onCommand?.(transcript)
      }
    }

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => {
      setIsListening(false)
      // Auto-restart if still enabled
      if (enabled) {
        try {
          recognition.start()
        } catch {
          // ignore
        }
      }
    }
    recognition.onerror = (e) => {
      if (e.error !== 'no-speech') {
        console.warn('Speech recognition error:', e.error)
      }
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch {
      // ignore
    }

    return () => {
      recognition.stop()
      recognitionRef.current = null
    }
  }, [enabled, lang, onCommand])

  return { isListening, lastCommand }
}

// Command matching helper
export function matchCommand(transcript: string, commands: Record<string, () => void>) {
  for (const [keywords, action] of Object.entries(commands)) {
    const keywordList = keywords.split('|')
    if (keywordList.some((kw) => transcript.includes(kw.trim()))) {
      action()
      return true
    }
  }
  return false
}
