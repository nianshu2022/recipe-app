import { useEffect, useState } from 'react'
import {
  Refrigerator, Plus, Trash2, X, AlertTriangle, Clock, Minus, Lightbulb,
} from 'lucide-react'
import { useFridgeStore } from '@/stores/fridgeStore'

const quickItems = [
  { name: '鸡蛋', unit: '个', amount: 10, category: '蛋奶', expiryDays: 14 },
  { name: '牛奶', unit: '盒', amount: 1, category: '蛋奶', expiryDays: 7 },
  { name: '鸡胸肉', unit: 'g', amount: 500, category: '肉类', expiryDays: 3 },
  { name: '番茄', unit: '个', amount: 4, category: '蔬菜', expiryDays: 5 },
  { name: '土豆', unit: '个', amount: 3, category: '蔬菜', expiryDays: 14 },
  { name: '豆腐', unit: '块', amount: 1, category: '豆制品', expiryDays: 3 },
  { name: '虾仁', unit: 'g', amount: 300, category: '海鲜', expiryDays: 2 },
  { name: '生菜', unit: '棵', amount: 1, category: '蔬菜', expiryDays: 3 },
]

export function FridgePage() {
  const {
    items, loading, categoryFilter, loadItems, addItem, removeItem,
    consumeItem, setCategoryFilter, getExpiringSoon, getExpired,
    getFilteredItems, getCategoryCounts, getRecommendations,
  } = useFridgeStore()

  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newUnit, setNewUnit] = useState('')
  const [showQuick, setShowQuick] = useState(false)

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const handleAdd = async () => {
    if (!newName.trim()) return
    await addItem(newName.trim(), Number(newAmount) || 0, newUnit.trim())
    setNewName('')
    setNewAmount('')
    setNewUnit('')
    setShowAdd(false)
  }

  const handleQuickAdd = async (item: typeof quickItems[0]) => {
    await addItem(item.name, item.amount, item.unit, item.category, item.expiryDays)
    setShowQuick(false)
  }

  const expiringSoon = getExpiringSoon()
  const expired = getExpired()
  const filtered = getFilteredItems()
  const categoryCounts = getCategoryCounts()
  const recommendations = getRecommendations()
  const categories = Object.keys(categoryCounts)

  const formatExpiry = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000)
    if (diff < 0) return '已过期'
    if (diff === 0) return '今天到期'
    if (diff === 1) return '明天到期'
    return `${diff}天后到期`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-stone-900">
            冰箱食材
          </h1>
          <p className="mt-1 text-sm text-stone-400">
            {items.length > 0 ? `${items.length} 种食材` : '管理你的食材库存'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowQuick(!showQuick); setShowAdd(false) }}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-stone-600 shadow-xs transition-all duration-200 hover:shadow-sm active:scale-95"
          >
            <Lightbulb size={18} />
          </button>
          <button
            onClick={() => { setShowAdd(!showAdd); setShowQuick(false) }}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-900 text-white shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
          >
            <Plus size={20} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* Quick add panel */}
      {showQuick && (
        <div className="rounded-2xl bg-white p-5 shadow-md">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-stone-800">快速录入</h3>
            <button onClick={() => setShowQuick(false)} className="rounded-lg p-1 text-stone-400 hover:bg-stone-100">
              <X size={16} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleQuickAdd(item)}
                className="rounded-full bg-stone-50 px-3.5 py-2 text-sm font-medium text-stone-600 transition-all duration-200 hover:bg-stone-100 active:scale-95"
              >
                {item.name} {item.amount}{item.unit}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Manual add panel */}
      {showAdd && (
        <div className="rounded-2xl bg-white p-5 shadow-md">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-stone-800">添加食材</h3>
            <button onClick={() => { setShowAdd(false); setNewName(''); setNewAmount(''); setNewUnit('') }} className="rounded-lg p-1 text-stone-400 hover:bg-stone-100">
              <X size={16} />
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="食材名称"
              autoFocus
              className="flex-1 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-100"
            />
            <input
              type="number"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              placeholder="数量"
              className="w-20 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-100"
            />
            <input
              type="text"
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              placeholder="单位"
              className="w-16 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-100"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={!newName.trim()}
            className="mt-3 w-full rounded-xl bg-stone-900 py-2.5 text-sm font-medium text-white transition-all duration-200 active:scale-[0.98] disabled:opacity-40"
          >
            添加
          </button>
        </div>
      )}

      {/* Expiring alerts */}
      {(expiringSoon.length > 0 || expired.length > 0) && (
        <div className="space-y-2">
          {expired.length > 0 && (
            <div className="flex items-center gap-2.5 rounded-2xl bg-red-50 px-4 py-3">
              <AlertTriangle size={16} className="shrink-0 text-red-500" />
              <span className="text-sm text-red-700">
                {expired.map((i) => i.name).join('、')} 已过期
              </span>
            </div>
          )}
          {expiringSoon.length > 0 && (
            <div className="flex items-center gap-2.5 rounded-2xl bg-amber-50 px-4 py-3">
              <Clock size={16} className="shrink-0 text-amber-500" />
              <span className="text-sm text-amber-700">
                {expiringSoon.map((i) => `${i.name}(${formatExpiry(i.expiryDate!)})`).join('、')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && items.length > 0 && (
        <div className="rounded-2xl bg-white p-4 shadow-xs">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-stone-400">根据现有食材推荐</p>
          <div className="flex flex-wrap gap-2">
            {recommendations.map((r) => (
              <span key={r} className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
                {r}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setCategoryFilter(null)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
              categoryFilter === null ? 'bg-stone-900 text-white' : 'bg-white text-stone-500 hover:bg-stone-100'
            }`}
          >
            全部
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                categoryFilter === cat ? 'bg-stone-900 text-white' : 'bg-white text-stone-500 hover:bg-stone-100'
              }`}
            >
              {cat} ({categoryCounts[cat]})
            </button>
          ))}
        </div>
      )}

      {/* Item list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-white p-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-stone-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-24 rounded bg-stone-100" />
                  <div className="h-3 w-16 rounded bg-stone-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-stone-100">
            <Refrigerator size={36} className="text-stone-300" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-stone-700">冰箱空空如也</h3>
          <p className="text-sm text-stone-400">录入你买了什么吧</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => {
            const isExpiring = item.expiryDate && new Date(item.expiryDate) <= new Date(Date.now() + 3 * 86400000)
            const isExpired = item.expiryDate && new Date(item.expiryDate) <= new Date()
            return (
              <div
                key={item.id}
                className={`group flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-xs transition-all duration-200 hover:shadow-sm ${
                  isExpired ? 'opacity-60' : ''
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-medium ${
                  isExpired ? 'bg-red-50 text-red-500' : isExpiring ? 'bg-amber-50 text-amber-600' : 'bg-stone-50 text-stone-500'
                }`}>
                  {item.amount > 0 ? `${item.amount}` : ''}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-stone-800">{item.name}</span>
                    <span className="rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-500">{item.category}</span>
                  </div>
                  <p className="text-xs text-stone-400">
                    {item.amount > 0 ? `${item.amount}${item.unit}` : ''}
                    {item.expiryDate && ` · ${formatExpiry(item.expiryDate)}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {item.amount > 0 && (
                    <button
                      onClick={() => consumeItem(item.id, 1)}
                      className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
                      title="消耗一份"
                    >
                      <Minus size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500"
                    title="移除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
