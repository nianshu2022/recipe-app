import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Download, Upload, Trash2, CheckCircle } from 'lucide-react'
import { exportData, downloadBackup, importData } from '@/utils/backup'
import { db } from '@/db'
import { useUIStore } from '@/stores/uiStore'

export function DataManagementPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [stats, setStats] = useState<{
    recipes: number
    collections: number
    cookingRecords: number
  } | null>(null)
  const showConfirm = useUIStore((s) => s.showConfirm)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    const recipes = await db.getAllRecipes()
    const collections = await db.getAllCollections()
    const records = await db.getAllCookingRecords()
    setStats({
      recipes: recipes.length,
      collections: collections.length,
      cookingRecords: records.length,
    })
  }

  const handleExport = async () => {
    try {
      const json = await exportData()
      downloadBackup(json)
      setMessage({ type: 'success', text: '备份文件已下载' })
    } catch {
      setMessage({ type: 'error', text: '导出失败' })
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setMessage(null)

    try {
      const text = await file.text()
      const result = await importData(text)
      setMessage({ type: result.success ? 'success' : 'error', text: result.message })
      if (result.success) {
        await loadStats()
      }
    } catch {
      setMessage({ type: 'error', text: '读取文件失败' })
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleClearData = async () => {
    await showConfirm({
      title: '清除所有数据',
      message: '确定要清除所有本地数据吗？此操作不可撤销。',
      confirmText: '清除',
      variant: 'danger',
      onConfirm: () => {
        indexedDB.deleteDatabase('recipe-app')
        window.location.reload()
      },
    })
  }

  return (
    <div className="space-y-8">
      <div className="sticky top-0 z-40 -mx-5 -mt-6 flex items-center gap-3 bg-[var(--color-bg)]/95 px-5 py-3 backdrop-blur-sm">
        <Link
          to="/settings"
          replace
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-bg-card)] shadow-xs transition-all duration-200 hover:shadow-sm active:scale-95"
        >
          <ArrowLeft size={18} className="text-[var(--color-text)]" />
        </Link>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-text)]">
          数据管理
        </h1>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-[var(--color-bg-card)] p-4 text-center shadow-xs">
            <p className="text-2xl font-semibold text-[var(--color-text)]">{stats.recipes}</p>
            <p className="text-xs text-[var(--color-text-muted)]">菜谱</p>
          </div>
          <div className="rounded-2xl bg-[var(--color-bg-card)] p-4 text-center shadow-xs">
            <p className="text-2xl font-semibold text-[var(--color-text)]">{stats.collections}</p>
            <p className="text-xs text-[var(--color-text-muted)]">收藏夹</p>
          </div>
          <div className="rounded-2xl bg-[var(--color-bg-card)] p-4 text-center shadow-xs">
            <p className="text-2xl font-semibold text-[var(--color-text)]">{stats.cookingRecords}</p>
            <p className="text-xs text-[var(--color-text-muted)]">做菜记录</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
          备份与恢复
        </h2>
        <div className="overflow-hidden rounded-2xl bg-[var(--color-bg-card)] shadow-xs">
          <button
            onClick={handleExport}
            className="flex w-full items-center gap-3 px-5 py-4 transition-colors hover:bg-[var(--color-bg-subtle)]"
          >
            <Download size={20} className="text-[var(--color-primary)]" />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-[var(--color-text)]">导出全部数据</p>
              <p className="text-xs text-[var(--color-text-muted)]">下载 JSON 备份文件</p>
            </div>
          </button>
          <div className="border-t border-[var(--color-border-subtle)]">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="flex w-full items-center gap-3 px-5 py-4 transition-colors hover:bg-[var(--color-bg-subtle)] disabled:opacity-50"
            >
              <Upload size={20} className="text-[var(--color-success)]" />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-[var(--color-text)]">
                  {importing ? '导入中...' : '导入数据'}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">从备份文件恢复数据</p>
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`flex items-center gap-2 rounded-2xl p-4 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
              : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
          }`}
        >
          <CheckCircle size={16} />
          {message.text}
        </div>
      )}

      {/* Danger zone */}
      <div className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
          危险操作
        </h2>
        <div className="overflow-hidden rounded-2xl bg-[var(--color-bg-card)] shadow-xs">
          <button
            onClick={handleClearData}
            className="flex w-full items-center gap-3 px-5 py-4 transition-colors hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            <Trash2 size={20} className="text-red-500" />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">清除所有数据</p>
              <p className="text-xs text-[var(--color-text-muted)]">删除本地所有菜谱和记录</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
