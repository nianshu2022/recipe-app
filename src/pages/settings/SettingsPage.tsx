import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronRight, Heart, ShoppingCart, ChefHat, Moon, Sun, Monitor, Database, LogOut, RefreshCw,
  Settings, ArrowLeft,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { useUIStore } from '@/stores/uiStore'

export function SettingsPage() {
  const { isLoggedIn, user, logout, syncNow } = useAuthStore()
  const { theme, setTheme } = useThemeStore()
  const showToast = useUIStore((s) => s.showToast)
  const [syncing, setSyncing] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    await syncNow()
    setSyncing(false)
  }

  const themeOptions = [
    { value: 'light' as const, label: '浅色', icon: Sun },
    { value: 'dark' as const, label: '深色', icon: Moon },
    { value: 'system' as const, label: '跟随系统', icon: Monitor },
  ]

  return (
    <div className="space-y-8">
      <div className="sticky top-0 z-40 -mx-5 -mt-6 bg-[var(--color-bg)]/95 px-5 py-3 backdrop-blur-sm">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-text)]">
          小窝
        </h1>
      </div>

      {/* Profile card */}
      <Link
        to={isLoggedIn ? '#' : '/login'}
        className="flex items-center gap-4 rounded-2xl bg-[var(--color-bg-card)] p-5 shadow-xs transition-colors hover:bg-[var(--color-bg-subtle)]"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-bg-subtle)] to-[var(--color-bg)]">
          <ChefHat size={24} className="text-[var(--color-text-muted)]" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-[var(--color-text)]">
            {isLoggedIn ? user?.nickname ?? '美食家' : '未登录'}
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            {isLoggedIn ? user?.email : '登录后可同步数据到云端'}
          </p>
        </div>
        {isLoggedIn ? (
          <button
            onClick={(e) => { e.preventDefault(); handleSync() }}
            disabled={syncing}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-bg)] text-[var(--color-text-muted)] shadow-xs transition-all duration-200 hover:bg-[var(--color-bg-subtle)] active:scale-95 disabled:opacity-50"
            title="同步数据"
          >
            <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
          </button>
        ) : (
          <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
        )}
      </Link>

      {/* My Content */}
      <div className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
          我的内容
        </h2>
        <div className="overflow-hidden rounded-2xl bg-[var(--color-bg-card)] shadow-xs">
          <Link
            to="/collection"
            className="flex items-center justify-between px-5 py-3.5 transition-colors duration-150 hover:bg-[var(--color-bg-subtle)]"
          >
            <div className="flex items-center gap-3">
              <Heart size={18} className="text-[var(--color-text-muted)]" />
              <span className="text-sm font-medium text-[var(--color-text)]">我的收藏夹</span>
            </div>
            <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
          </Link>
          <Link
            to="/shopping"
            className="flex items-center justify-between px-5 py-3.5 border-t border-[var(--color-border-subtle)] transition-colors duration-150 hover:bg-[var(--color-bg-subtle)]"
          >
            <div className="flex items-center gap-3">
              <ShoppingCart size={18} className="text-[var(--color-text-muted)]" />
              <span className="text-sm font-medium text-[var(--color-text)]">购物清单</span>
            </div>
            <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
          </Link>
        </div>
      </div>

      {/* Logout */}
      {isLoggedIn && (
        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-bg-card)] py-3.5 text-sm font-medium text-red-500 shadow-xs transition-colors hover:bg-red-50 dark:hover:bg-red-950/20"
        >
          <LogOut size={16} />
          退出登录
        </button>
      )}

      {/* Settings button */}
      <div className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
          设置
        </h2>
        <div className="overflow-hidden rounded-2xl bg-[var(--color-bg-card)] shadow-xs">
          <button
            onClick={() => setShowSettings(true)}
            className="flex w-full items-center justify-between px-5 py-3.5 transition-colors duration-150 hover:bg-[var(--color-bg-subtle)]"
          >
            <div className="flex items-center gap-3">
              <Settings size={18} className="text-[var(--color-text-muted)]" />
              <span className="text-sm font-medium text-[var(--color-text)]">设置</span>
            </div>
            <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
          </button>
        </div>
      </div>

      {/* About */}
      <div className="pb-4 pt-2 text-center">
        <p className="text-xs text-[var(--color-text-muted)]">知味 v1.1.6</p>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">你的私人美食管家</p>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-[var(--color-bg)]">
          <div className="sticky top-0 z-40 -mx-5 -mt-6 flex items-center gap-3 bg-[var(--color-bg)]/95 px-5 py-3 backdrop-blur-sm">
            <button
              onClick={() => setShowSettings(false)}
              aria-label="返回"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-bg-card)] shadow-xs transition-all duration-200 hover:shadow-sm active:scale-95"
            >
              <ArrowLeft size={18} className="text-[var(--color-text-secondary)]" />
            </button>
            <h1 className="flex-1 truncate font-display text-lg font-semibold tracking-tight text-[var(--color-text)]">
              设置
            </h1>
          </div>

          <div className="space-y-8 px-5">
            {/* Appearance */}
            <div className="space-y-3">
              <h2 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
                外观
              </h2>
              <div className="overflow-hidden rounded-2xl bg-[var(--color-bg-card)] shadow-xs">
                <div className="p-1.5">
                  <div className="flex gap-1">
                    {themeOptions.map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => setTheme(value)}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all duration-200 ${
                          theme === value
                            ? 'bg-[var(--color-primary)] text-white shadow-sm'
                            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]'
                        }`}
                      >
                        <Icon size={16} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Data Management */}
            <div className="space-y-3">
              <h2 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
                数据
              </h2>
              <div className="overflow-hidden rounded-2xl bg-[var(--color-bg-card)] shadow-xs">
                <Link
                  to="/settings/data"
                  className="flex items-center justify-between px-5 py-3.5 transition-colors duration-150 hover:bg-[var(--color-bg-subtle)]"
                >
                  <div className="flex items-center gap-3">
                    <Database size={18} className="text-[var(--color-text-muted)]" />
                    <span className="text-sm font-medium text-[var(--color-text)]">数据管理</span>
                  </div>
                  <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
                </Link>
              </div>
            </div>

            {/* About */}
            <div className="space-y-3">
              <h2 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
                关于
              </h2>
              <div className="overflow-hidden rounded-2xl bg-[var(--color-bg-card)] shadow-xs">
                <Link
                  to="/privacy"
                  className="flex items-center justify-between px-5 py-3.5 transition-colors duration-150 hover:bg-[var(--color-bg-subtle)]"
                >
                  <div className="flex items-center gap-3">
                    <Heart size={18} className="text-[var(--color-text-muted)]" />
                    <span className="text-sm font-medium text-[var(--color-text)]">隐私政策</span>
                  </div>
                  <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
