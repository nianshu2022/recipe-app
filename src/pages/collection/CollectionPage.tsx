import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Plus, FolderHeart, ChevronRight, Trash2, X,
} from 'lucide-react'
import { useCollectionStore } from '@/stores/collectionStore'
import { useRecipeStore } from '@/stores/recipeStore'
import { useUIStore } from '@/stores/uiStore'

export function CollectionPage() {
  const navigate = useNavigate()
  const { collections, loadCollections, addCollection, deleteCollection } = useCollectionStore()
  const { recipes, loadRecipes } = useRecipeStore()
  const showConfirm = useUIStore((s) => s.showConfirm)
  const showToast = useUIStore((s) => s.showToast)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    loadCollections()
    loadRecipes()
  }, [loadCollections, loadRecipes])

  const handleCreate = async () => {
    const name = newName.trim()
    if (!name) return
    await addCollection(name)
    setNewName('')
    setShowCreate(false)
    showToast('收藏夹已创建', 'success')
  }

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await showConfirm({
      title: '删除收藏夹',
      message: `确定要删除「${name}」吗？此操作无法撤销。`,
      confirmText: '删除',
      variant: 'danger',
      onConfirm: () => deleteCollection(id),
    })
    if (confirmed) showToast('已删除', 'info')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-bg-card)] shadow-xs transition-all duration-200 hover:shadow-sm active:scale-95"
        >
          <ArrowLeft size={18} className="text-[var(--color-text-secondary)]" />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-text)]">
            我的收藏夹
          </h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-white shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
        >
          <Plus size={20} strokeWidth={2.2} />
        </button>
      </div>

      {/* Create dialog */}
      {showCreate && (
        <div className="rounded-2xl bg-[var(--color-bg-card)] p-5 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--color-text)]">新建收藏夹</h3>
            <button
              onClick={() => { setShowCreate(false); setNewName('') }}
              className="rounded-lg p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)]"
            >
              <X size={16} />
            </button>
          </div>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="收藏夹名称，如：周末大餐"
            autoFocus
            className="mb-3 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 text-sm text-[var(--color-text)] shadow-xs outline-none transition-all duration-200 placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-stone-300)] focus:ring-2 focus:ring-[var(--color-border-subtle)]"
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim()}
            className="w-full rounded-xl bg-[var(--color-primary)] py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-[var(--color-primary-dark)] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
          >
            创建
          </button>
        </div>
      )}

      {/* List */}
      {collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--color-bg-subtle)]">
            <FolderHeart size={36} className="text-[var(--color-text-muted)]" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-[var(--color-text)]">还没有收藏夹</h3>
          <p className="text-sm text-[var(--color-text-muted)]">去菜谱库逛逛，把喜欢的菜收藏起来</p>
        </div>
      ) : (
        <div className="space-y-3">
          {collections.map((col) => {
            const count = col.recipeIds.length
            const firstRecipe = recipes.find((r) => col.recipeIds.includes(r.id))
            return (
              <div
                key={col.id}
                className="group flex items-center gap-4 rounded-2xl bg-[var(--color-bg-card)] p-4 shadow-xs transition-all duration-200 hover:shadow-sm"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-bg-subtle)] to-[var(--color-bg)]">
                  <FolderHeart size={22} className="text-[var(--color-text-muted)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-[var(--color-text)]">{col.name}</h3>
                  <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                    {count > 0 ? `${count} 道菜` : '暂无菜谱'}
                    {firstRecipe && count > 0 && ` · ${firstRecipe.name}`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDelete(col.id, col.name)}
                    className="rounded-lg p-1.5 text-[var(--color-text-muted)] opacity-0 transition-all duration-200 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                  <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
