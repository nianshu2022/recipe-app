import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ShoppingCart, Plus, Trash2, Check, X, ChevronDown, Eraser, ExternalLink, Pencil, Share2,
} from 'lucide-react'
import { useShoppingStore } from '@/stores/shoppingStore'
import { useUIStore } from '@/stores/uiStore'
import { EmptyState } from '@/components/ui/EmptyState'
import { ShoppingShareModal } from '@/components/shopping/ShoppingShareModal'
import type { ShoppingItem } from '@/types'

export function ShoppingListPage() {
  const navigate = useNavigate()
  const {
    lists, currentListId, loadLists, toggleItem, addItem, removeItem, updateItem,
    clearChecked, deleteList, setCurrentList,
  } = useShoppingStore()
  const showConfirm = useUIStore((s) => s.showConfirm)
  const showToast = useUIStore((s) => s.showToast)

  const [showAdd, setShowAdd] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null)
  const [newName, setNewName] = useState('')
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadLists()
  }, [loadLists])

  const list = lists.find((l) => l.id === currentListId) ?? lists[0] ?? null

  const handleAdd = async () => {
    if (!list || !newName.trim()) return
    await addItem(list.id, newName.trim())
    setNewName('')
    setShowAdd(false)
  }

  const handleEdit = async () => {
    if (!list || !editingItem || !newName.trim()) return
    await updateItem(list.id, editingItem.id, { name: newName.trim() })
    setNewName('')
    setEditingItem(null)
  }

  const openEdit = (item: ShoppingItem) => {
    setEditingItem(item)
    setNewName(item.name)
    setShowAdd(true)
  }

  const toggleCat = (cat: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  const handleDeleteList = async () => {
    if (!list) return
    const confirmed = await showConfirm({
      title: '删除清单',
      message: '确定要删除这个购物清单吗？',
      confirmText: '删除',
      variant: 'danger',
      onConfirm: () => deleteList(list.id),
    })
    if (confirmed) showToast('清单已删除', 'info')
  }

  // Group items by category
  const grouped = list
    ? list.items.reduce<Record<string, ShoppingItem[]>>((acc, item) => {
        ;(acc[item.category] ??= []).push(item)
        return acc
      }, {})
    : {}

  const categories = Object.keys(grouped)
  const checkedCount = list?.items.filter((i) => i.checked).length ?? 0
  const totalCount = list?.items.length ?? 0

  if (!list) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="返回"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-bg-card)] shadow-xs transition-all duration-200 hover:shadow-sm active:scale-95"
          >
            <ArrowLeft size={18} className="text-[var(--color-text-secondary)]" />
          </button>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-text)]">
            购物清单
          </h1>
        </div>
        <EmptyState
          icon={ShoppingCart}
          title="清单是空的"
          description="从菜谱生成一份购物清单吧"
          action={{ label: '去选菜谱', to: '/' }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
            购物清单
          </h1>
          <p className="text-xs text-[var(--color-text-muted)]">
            {checkedCount}/{totalCount} 已购
          </p>
        </div>

        {/* List selector when multiple lists exist */}
        {lists.length > 1 && (
          <select
            value={list?.id ?? ''}
            onChange={(e) => setCurrentList(e.target.value)}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-2 py-1.5 text-xs text-[var(--color-text-secondary)] outline-none"
          >
            {lists.map((l, i) => (
              <option key={l.id} value={l.id}>
                清单 {i + 1} ({l.items.length}项)
              </option>
            ))}
          </select>
        )}
        <div className="flex gap-2">
          {list?.items && list.items.length > 0 && (
            <button
              onClick={() => setShowShareModal(true)}
              className="flex h-9 items-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 text-xs font-semibold text-amber-700 dark:text-amber-300 shadow-2xs transition-all hover:bg-amber-500/20 active:scale-95"
              title="分享与导出清单"
            >
              <Share2 size={14} />
              <span>导出</span>
            </button>
          )}
          {checkedCount > 0 && (
            <button
              onClick={() => clearChecked(list.id)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] shadow-xs transition-all duration-200 hover:bg-red-50 hover:text-red-500 active:scale-95"
              title="清除已购"
            >
              <Eraser size={16} />
            </button>
          )}
          <button
            onClick={() => setShowAdd(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-primary)] text-white shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Plus size={16} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* Add/Edit item input */}
      {showAdd && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (editingItem ? handleEdit() : handleAdd())}
            placeholder="输入食材名称"
            autoFocus
            className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-2.5 text-sm text-[var(--color-text)] shadow-xs outline-none transition-all duration-200 placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-stone-300)] focus:ring-2 focus:ring-[var(--color-border-subtle)]"
          />
          <button
            onClick={editingItem ? handleEdit : handleAdd}
            disabled={!newName.trim()}
            className="rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 active:scale-95 disabled:opacity-40"
          >
            {editingItem ? '保存' : '添加'}
          </button>
          <button
            onClick={() => { setShowAdd(false); setEditingItem(null); setNewName('') }}
            className="rounded-xl bg-[var(--color-bg-card)] px-3 py-2.5 text-[var(--color-text-secondary)] shadow-xs transition-all duration-200 hover:bg-[var(--color-bg-subtle)] active:scale-95"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Progress bar */}
      <div className="overflow-hidden rounded-full bg-[var(--color-bg-subtle)]">
        <div
          className="h-1.5 rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: totalCount > 0 ? `${(checkedCount / totalCount) * 100}%` : '0%' }}
        />
      </div>

      {/* Grouped items */}
      <div className="space-y-4">
        {categories.map((cat) => {
          const items = grouped[cat]
          const catChecked = items.filter((i) => i.checked).length
          const isExpanded = expandedCats.size === 0 || expandedCats.has(cat)

          return (
            <div key={cat} className="overflow-hidden rounded-2xl bg-[var(--color-bg-card)] shadow-xs">
              <button
                onClick={() => toggleCat(cat)}
                className="flex w-full items-center justify-between px-5 py-3 transition-colors hover:bg-[var(--color-bg-subtle)]"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--color-text)]">{cat}</span>
                  <span className="rounded-full bg-[var(--color-bg-subtle)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-secondary)]">
                    {catChecked}/{items.length}
                  </span>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-[var(--color-text-muted)] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>
              {isExpanded && (
                <div className="border-t border-[var(--color-border-subtle)]">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`group flex items-center gap-3 px-5 py-3 transition-colors ${
                        item.checked ? 'bg-[var(--color-bg-subtle)]' : ''
                      }`}
                    >
                      <button
                        onClick={() => toggleItem(list.id, item.id)}
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200 ${
                          item.checked
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : 'border-[var(--color-border)] hover:border-[var(--color-stone-300)]'
                        }`}
                      >
                        {item.checked && <Check size={12} strokeWidth={3} />}
                      </button>
                      <span
                        className={`flex-1 text-sm transition-all duration-200 ${
                          item.checked
                            ? 'text-[var(--color-text-muted)] line-through'
                            : 'text-[var(--color-text)]'
                        }`}
                      >
                        {item.name}
                      </span>
                      <span className={`text-xs ${item.checked ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-text-muted)]'}`}>
                        {item.amount > 0 ? `${item.amount}${item.unit}` : ''}
                      </span>
                      {!item.checked && (
                        <button
                          onClick={() => {
                            const query = encodeURIComponent(item.name)
                            window.open(`https://s.taobao.com/search?q=${query}`, '_blank')
                          }}
                          className="rounded-lg p-1 text-[var(--color-text-muted)] opacity-0 transition-all duration-200 hover:bg-blue-50 hover:text-blue-500 group-hover:opacity-100"
                          title="去淘宝搜索"
                        >
                          <ExternalLink size={12} />
                        </button>
                      )}
                      {!item.checked && (
                        <button
                          onClick={() => openEdit(item)}
                          className="rounded-lg p-1 text-[var(--color-text-muted)] opacity-0 transition-all duration-200 hover:bg-blue-50 hover:text-blue-500 group-hover:opacity-100"
                        >
                          <Pencil size={12} />
                        </button>
                      )}
                      <button
                        onClick={() => removeItem(list.id, item.id)}
                        className="rounded-lg p-1 text-[var(--color-text-muted)] opacity-0 transition-all duration-200 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Delete list */}
      <button
        onClick={handleDeleteList}
        className="w-full rounded-xl py-3 text-center text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:text-red-500"
      >
        删除清单
      </button>

      {/* Share & Export Modal */}
      {list && (
        <ShoppingShareModal
          list={list}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  )
}
