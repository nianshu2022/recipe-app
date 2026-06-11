import { useEffect, useRef, type RefObject } from 'react'

export function useFocusTrap<T extends HTMLElement = HTMLElement>(
  isActive: boolean,
): RefObject<T | null> {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    if (!isActive || !ref.current) return

    const container = ref.current
    const focusableSelectors = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    const focusableElements = container.querySelectorAll<HTMLElement>(focusableSelectors)
    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]

    // Store previously focused element
    const previouslyFocused = document.activeElement as HTMLElement

    // Focus first element
    firstFocusable?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault()
          lastFocusable?.focus()
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault()
          firstFocusable?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [isActive])

  return ref
}
