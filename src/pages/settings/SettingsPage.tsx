import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronRight, Heart, ShoppingCart, ChefHat, Moon, Sun, Monitor, Database, LogIn, LogOut, RefreshCw,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'

export function SettingsPage() {
  const { isLoggedIn, user, logout, syncNow } = useAuthStore()
  const { theme, setTheme } = useThemeStore()
  const [syncing, setSyncing] = useState(false)

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

  const menuGroups = [
    {
      title: '我的内容',
      items: [
        { to: '/collection', icon: Heart, label: '我的收藏夹' },
        { to: '/shopping', icon: ShoppingCart, label: '购物清单' },
      ],
    },
    {
      title: '设置',
      items: isLoggedIn
        ? [
            { to: '/settings/data', icon: Database, label: '数据管理' },
          ]
        : [
            { to: '/login', icon: LogIn, label: '登录 / 注册' },
            { to: '/settings/data', icon: Database, label: '数据管理' },
          ],
    },
  ]

  return (
    <div className="space-y-8">
      <div className="sticky top-0 z-40 -mx-5 -mt-6 bg-[var(--color-bg)]/95 px-5 py-3 backdrop-blur-sm">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-text)]">
          小窝
        </h1>
      </div>

      {/* Profile card */}
      <div className="flex items-center gap-4 rounded-2xl bg-[var(--color-bg-card)] p-5 shadow-xs">
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
        {isLoggedIn && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-bg)] text-[var(--color-text-muted)] shadow-xs transition-all duration-200 hover:bg-[var(--color-bg-subtle)] active:scale-95 disabled:opacity-50"
            title="同步数据"
          >
            <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      {/* Theme selector */}
      <div className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
          外观
        </h2>
        <div className="overflow-hidden rounded-2xl bg-[var(--color-bg-card)] shadow-xs">
          <div className="flex p-1.5 gap-1">
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

      {/* Menu groups */}
      {menuGroups.map((group) => (
        <div key={group.title} className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
            {group.title}
          </h2>
          <div className="overflow-hidden rounded-2xl bg-[var(--color-bg-card)] shadow-xs">
            {group.items.map(({ to, icon: Icon, label }, i) => (
              <Link
                key={label}
                to={to}
                className={`flex items-center justify-between px-5 py-3.5 transition-colors duration-150 hover:bg-[var(--color-bg-subtle)] ${
                  i > 0 ? 'border-t border-[var(--color-border-subtle)]' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className="text-[var(--color-text-muted)]" />
                  <span className="text-sm font-medium text-[var(--color-text)]">{label}</span>
                </div>
                <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
              </Link>
            ))}
          </div>
        </div>
      ))}

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

      {/* About */}
      <div className="pb-4 pt-2 text-center">
        <p className="text-xs text-[var(--color-text-muted)]">知味 v1.0.0</p>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">你的私人美食管家</p>
        <Link to="/privacy" className="mt-2 inline-block text-xs text-[var(--color-primary)] hover:underline">
          隐私政策
        </Link>
      </div>
    </div>
  )
}
