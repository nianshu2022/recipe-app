import { useEffect, useRef } from 'react'
import { useUIStore } from '@/stores/uiStore'

export function ConfirmDialog() {
  const confirm = useUIStore((s) => s.confirm)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (confirm?.open) {
      cancelRef.current?.focus()
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          confirm.onCancel()
        }
        if (e.key === 'Tab' && dialogRef.current) {
          const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          )
          const first = focusable[0]
          const last = focusable[focusable.length - 1]
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault()
            last.focus()
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [confirm])

  if (!confirm?.open) return null

  const isDanger = confirm.variant === 'danger'

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
      onClick={confirm.onCancel}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="w-full max-w-sm rounded-2xl bg-[var(--color-bg-card)] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="confirm-title" className="text-lg font-semibold text-[var(--color-text)]">
          {confirm.title}
        </h3>
        <p id="confirm-message" className="mt-2 text-sm text-[var(--color-text-secondary)]">
          {confirm.message}
        </p>
        <div className="mt-6 flex gap-3">
          <button
            ref={cancelRef}
            onClick={confirm.onCancel}
            className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-subtle)]"
          >
            {confirm.cancelText ?? '取消'}
          </button>
          <button
            onClick={confirm.onConfirm}
            className={`flex-1 rounded-xl py-2.5 text-sm font-medium text-white transition-colors ${
              isDanger
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)]'
            }`}
          >
            {confirm.confirmText ?? '确认'}
          </button>
        </div>
      </div>
    </div>
  )
}
