import { create } from 'zustand'

interface ToastState {
  message: string
  type: 'success' | 'error' | 'info'
  visible: boolean
}

interface ConfirmState {
  title: string
  message: string
  confirmText: string
  cancelText: string
  danger: boolean
  visible: boolean
  resolve?: (value: boolean) => void
}

interface UIState {
  toast: ToastState
  confirm: ConfirmState
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
  hideToast: () => void
  showConfirm: (options: {
    title?: string
    message: string
    confirmText?: string
    cancelText?: string
    danger?: boolean
  }) => Promise<boolean>
  resolveConfirm: (result: boolean) => void
}

export const useUIStore = create<UIState>((set, get) => ({
  toast: { message: '', type: 'info', visible: false },
  confirm: {
    title: '',
    message: '',
    confirmText: '确认',
    cancelText: '取消',
    danger: false,
    visible: false,
  },

  showToast: (message, type = 'info') => {
    set({ toast: { message, type, visible: true } })
    setTimeout(() => {
      set((state) => ({
        toast: { ...state.toast, visible: false },
      }))
    }, 2500)
  },

  hideToast: () => {
    set((state) => ({ toast: { ...state.toast, visible: false } }))
  },

  showConfirm: (options) => {
    return new Promise<boolean>((resolve) => {
      set({
        confirm: {
          title: options.title || '确认',
          message: options.message,
          confirmText: options.confirmText || '确认',
          cancelText: options.cancelText || '取消',
          danger: options.danger || false,
          visible: true,
          resolve,
        },
      })
    })
  },

  resolveConfirm: (result) => {
    const { confirm } = get()
    confirm.resolve?.(result)
    set((state) => ({
      confirm: { ...state.confirm, visible: false },
    }))
  },
}))
