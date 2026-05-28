import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ShoppingCart, Plus, Trash2, Check, X, ChevronDown, Eraser,
} from 'lucide-react'
import { useShoppingStore } from '@/stores/shoppingStore'
import type { ShoppingItem } from '@/types'

export function ShoppingListPage() {
  const navigate = useNavigate()
  const {
    lists, currentListId, loadLists, toggleItem, addItem, removeItem,
    clearChecked, deleteList, setCurrentList,
  } = useShoppingStore()

  const [showAdd, setShowAdd] = useState(false)
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

  const toggleCat = (cat: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
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
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-xs transition-all duration-200 hover:shadow-sm active:scale-95"
          >
            <ArrowLeft size={18} className="text-stone-600" />
          </button>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-stone-900">
            购物清单
          </h1>
        </div>
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-stone-100">
            <ShoppingCart size={36} className="text-stone-300" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-stone-700">清单是空的</h3>
          <p className="mb-6 text-sm text-stone-400">从菜谱生成一份购物清单吧</p>
          <Link
            to="/"
            className="rounded-2xl bg-stone-900 px-8 py-3 text-sm font-medium text-white shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
          >
            去选菜谱
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-xs transition-all duration-200 hover:shadow-sm active:scale-95"
        >
          <ArrowLeft size={18} className="text-stone-600" />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-stone-900">
            购物清单
          </h1>
          <p className="text-xs text-stone-400">
            {checkedCount}/{totalCount} 已购
          </p>
        </div>

        {/* List selector when multiple lists exist */}
        {lists.length > 1 && (
          <select
            value={list?.id ?? ''}
            onChange={(e) => setCurrentList(e.target.value)}
            className="rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs text-stone-600 outline-none"
          >
            {lists.map((l, i) => (
              <option key={l.id} value={l.id}>
                清单 {i + 1} ({l.items.length}项)
              </option>
            ))}
          </select>
        )}
        <div className="flex gap-2">
          {checkedCount > 0 && (
            <button
              onClick={() => clearChecked(list.id)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-stone-500 shadow-xs transition-all duration-200 hover:bg-red-50 hover:text-red-500 active:scale-95"
              title="清除已购"
            >
              <Eraser size={16} />
            </button>
          )}
          <button
            onClick={() => setShowAdd(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 text-white shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Plus size={16} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* Add item input */}
      {showAdd && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="输入食材名称"
            autoFocus
            className="flex-1 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-800 shadow-xs outline-none transition-all duration-200 placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-100"
          />
          <button
            onClick={handleAdd}
            disabled={!newName.trim()}
            className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 active:scale-95 disabled:opacity-40"
          >
            添加
          </button>
          <button
            onClick={() => { setShowAdd(false); setNewName('') }}
            className="rounded-xl bg-white px-3 py-2.5 text-stone-500 shadow-xs transition-all duration-200 hover:bg-stone-50 active:scale-95"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Progress bar */}
      <div className="overflow-hidden rounded-full bg-stone-200/60">
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
            <div key={cat} className="overflow-hidden rounded-2xl bg-white shadow-xs">
              <button
                onClick={() => toggleCat(cat)}
                className="flex w-full items-center justify-between px-5 py-3 transition-colors hover:bg-stone-50"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-stone-800">{cat}</span>
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-500">
                    {catChecked}/{items.length}
                  </span>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-stone-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>
              {isExpanded && (
                <div className="border-t border-stone-100">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 px-5 py-3 transition-colors ${
                        item.checked ? 'bg-stone-50' : ''
                      }`}
                    >
                      <button
                        onClick={() => toggleItem(list.id, item.id)}
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200 ${
                          item.checked
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : 'border-stone-300 hover:border-stone-400'
                        }`}
                      >
                        {item.checked && <Check size={12} strokeWidth={3} />}
                      </button>
                      <span
                        className={`flex-1 text-sm transition-all duration-200 ${
                          item.checked
                            ? 'text-stone-400 line-through'
                            : 'text-stone-700'
                        }`}
                      >
                        {item.name}
                      </span>
                      <span className={`text-xs ${item.checked ? 'text-stone-300' : 'text-stone-400'}`}>
                        {item.amount > 0 ? `${item.amount}${item.unit}` : ''}
                      </span>
                      <button
                        onClick={() => removeItem(list.id, item.id)}
                        className="rounded-lg p-1 text-stone-300 opacity-0 transition-all duration-200 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
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
        onClick={() => deleteList(list.id)}
        className="w-full rounded-xl py-3 text-center text-sm font-medium text-stone-400 transition-colors hover:text-red-500"
      >
        删除清单
      </button>
    </div>
  )
}
