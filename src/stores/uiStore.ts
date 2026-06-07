import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ConfirmState {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'default'
  onConfirm: () => void
  onCancel: () => void
}

interface UIState {
  modalOpen: boolean
  setModalOpen: (open: boolean) => void

  // Toast
  toasts: Toast[]
  showToast: (message: string, type?: ToastType) => void
  removeToast: (id: string) => void

  // Confirm dialog
  confirm: ConfirmState | null
  showConfirm: (options: Omit<ConfirmState, 'open' | 'onConfirm' | 'onCancel'> & { onConfirm: () => void }) => Promise<boolean>
  closeConfirm: () => void
}

let confirmResolver: ((value: boolean) => void) | null = null

export const useUIStore = create<UIState>((set) => ({
  modalOpen: false,
  setModalOpen: (open) => set({ modalOpen: open }),

  toasts: [],
  showToast: (message, type = 'info') => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 3000)
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  confirm: null,
  showConfirm: (options) => {
    return new Promise<boolean>((resolve) => {
      confirmResolver = resolve
      set({
        confirm: {
          open: true,
          title: options.title,
          message: options.message,
          confirmText: options.confirmText,
          cancelText: options.cancelText,
          variant: options.variant,
          onConfirm: () => {
            options.onConfirm()
            resolve(true)
            set({ confirm: null })
            confirmResolver = null
          },
          onCancel: () => {
            resolve(false)
            set({ confirm: null })
            confirmResolver = null
          },
        },
      })
    })
  },
  closeConfirm: () => {
    if (confirmResolver) confirmResolver(false)
    set({ confirm: null })
    confirmResolver = null
  },
}))
