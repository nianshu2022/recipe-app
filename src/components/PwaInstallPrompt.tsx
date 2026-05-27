import { useState, useEffect } from 'react'
import { Download, X, Share, Plus } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isIOS(): boolean {
  return /iPhone|iPad|iPod/.test(navigator.userAgent)
}

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as unknown as Record<string, boolean>).standalone === true
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOSDevice, setIsIOSDevice] = useState(false)

  useEffect(() => {
    // Don't show if already installed
    if (isStandalone()) return

    // Detect iOS
    if (isIOS()) {
      setIsIOSDevice(true)
      // Show iOS instructions after delay
      const dismissed = localStorage.getItem('pwa-ios-dismissed')
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 5000)
      }
      return
    }

    // Android/Desktop: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => setShowPrompt(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowPrompt(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    if (isIOSDevice) {
      localStorage.setItem('pwa-ios-dismissed', '1')
    } else {
      sessionStorage.setItem('pwa-prompt-dismissed', '1')
    }
  }

  if (!showPrompt || sessionStorage.getItem('pwa-prompt-dismissed')) {
    return null
  }

  // iOS prompt with manual instructions
  if (isIOSDevice) {
    return (
      <div className="fixed bottom-24 left-4 right-4 z-50">
        <div className="rounded-2xl bg-[var(--color-bg-card)] p-5 shadow-xl border border-[var(--color-border)]">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-accent-50)]">
                <Download size={20} className="text-[var(--color-accent-500)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)]">安装「菜谱助手」</p>
                <p className="text-xs text-[var(--color-text-muted)]">添加到主屏幕，随时使用</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)]"
            >
              <X size={16} />
            </button>
          </div>
          <div className="space-y-2.5 text-sm text-[var(--color-text-secondary)]">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-bg-subtle)] text-xs font-medium">1</span>
              <span>点击底部 <Share size={14} className="inline text-[var(--color-primary)]" /> 共享按钮</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-bg-subtle)] text-xs font-medium">2</span>
              <span>选择「添加到主屏幕」<Plus size={14} className="inline" /></span>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="mt-4 w-full rounded-xl bg-[var(--color-bg-subtle)] py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-border)]"
          >
            我知道了
          </button>
        </div>
      </div>
    )
  }

  // Android/Desktop prompt
  return (
    <div className="fixed bottom-24 left-4 right-4 z-50">
      <div className="flex items-center gap-3 rounded-2xl bg-[var(--color-stone-900)] p-4 text-white shadow-xl">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
          <Download size={20} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">安装「菜谱助手」</p>
          <p className="text-xs text-stone-400">添加到主屏幕，随时离线使用</p>
        </div>
        <button
          onClick={handleInstall}
          className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-stone-900 transition-colors hover:bg-stone-100"
        >
          安装
        </button>
        <button
          onClick={handleDismiss}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition-colors hover:text-white"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
