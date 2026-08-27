import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, AlertTriangle, Clock, X, Search, ChevronDown, Wand2, Pencil, Sparkles, Refrigerator } from 'lucide-react'
import { useFridgeStore } from '@/stores/fridgeStore'
import { useUIStore } from '@/stores/uiStore'
import { BrandLoading } from '@/components/ui/BrandLoading'
import { BatchFridgeModal } from '@/components/fridge/BatchFridgeModal'

const CATEGORIES = [
  { id: '蔬菜', label: '蔬菜', color: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' },
  { id: '肉类', label: '肉类', color: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400' },
  { id: '海鲜', label: '海鲜', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400' },
  { id: '蛋奶', label: '蛋奶', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400' },
  { id: '调料', label: '调料', color: 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400' },
  { id: '主食', label: '主食', color: 'bg-amber-100 text-amber-700 dark:amber-950/30 dark:text-amber-400' },
  { id: '豆制品', label: '豆制品', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400' },
  { id: '干货', label: '干货', color: 'bg-stone-100 text-stone-700 dark:bg-stone-950/30 dark:text-stone-400' },
  { id: '其他', label: '其他', color: 'bg-gray-100 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400' },
]

const UNITS = ['个', 'g', 'kg', 'ml', 'L', '包', '袋', '盒', '瓶']

function getDaysUntilExpiry(expiryDate: string): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const exp = new Date(expiryDate)
  exp.setHours(0, 0, 0, 0)
  return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

import type { FridgeItem } from '@/types'

export function FridgePage() {
  const { items, loading, loadItems, addItem, updateItem, deleteItem, getExpiringSoon, getExpired } = useFridgeStore()
  const showToast = useUIStore((s) => s.showToast)
  const navigate = useNavigate()

  const [showAdd, setShowAdd] = useState(false)
  const [showBatchAdd, setShowBatchAdd] = useState(false)
  const [editingItem, setEditingItem] = useState<FridgeItem | null>(null)
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Add/Edit form state
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [unit, setUnit] = useState('个')
  const [category, setCategory] = useState('蔬菜')
  const [expiryDate, setExpiryDate] = useState('')

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const expiringSoon = getExpiringSoon(3)
  const expired = getExpired()

  const filteredItems = items.filter((item) => {
    if (filterCategory && item.category !== filterCategory) return false
    if (searchQuery && !item.name.includes(searchQuery)) return false
    return true
  })

  const handleAdd = async () => {
    if (!name.trim() || !amount) return
    await addItem({
      name: name.trim(),
      amount: Number(amount),
      unit,
      category,
      purchaseDate: new Date().toISOString(),
      expiryDate: expiryDate || undefined,
    })
    resetForm()
    showToast('已添加到冰箱')
  }

  const handleEdit = async () => {
    if (!editingItem || !name.trim() || !amount) return
    await updateItem(editingItem.id, {
      name: name.trim(),
      amount: Number(amount),
      unit,
      category,
      expiryDate: expiryDate || undefined,
    })
    resetForm()
    setEditingItem(null)
    showToast('已更新食材')
  }

  const openEdit = (item: FridgeItem) => {
    setEditingItem(item)
    setName(item.name)
    setAmount(String(item.amount))
    setUnit(item.unit)
    setCategory(item.category)
    setExpiryDate(item.expiryDate || '')
  }

  const resetForm = () => {
    setName('')
    setAmount('')
    setUnit('个')
    setCategory('蔬菜')
    setExpiryDate('')
    setShowAdd(false)
  }

  const handleDelete = async (id: string, itemName: string) => {
    await deleteItem(id)
    showToast(`已删除 ${itemName}`)
  }

  if (loading && items.length === 0) {
    return <BrandLoading />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-40 -mx-5 -mt-6 flex items-end justify-between bg-[var(--color-bg)]/95 px-5 py-3 backdrop-blur-sm">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-text)]">
            冰箱
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {items.length > 0 ? `共 ${items.length} 种食材` : '管理你的食材'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBatchAdd(true)}
            className="flex h-10 items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 text-amber-700 dark:text-amber-300 shadow-2xs transition-all hover:bg-amber-500/20 active:scale-95"
            title="批量智能录入"
          >
            <Sparkles size={16} />
            <span className="text-xs font-semibold">批量录入</span>
          </button>
          {items.length > 0 && (
            <button
              onClick={() => navigate('/fridge/ai-recipe')}
              className="flex h-10 items-center gap-1 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-3 text-white shadow-md transition-all duration-200 hover:shadow-lg active:scale-95"
              title="AI 生成食谱"
            >
              <Wand2 size={16} />
              <span className="text-xs font-medium">AI</span>
            </button>
          )}
          <button
            onClick={() => setShowAdd(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary)] text-white shadow-md transition-all duration-200 hover:shadow-lg active:scale-95"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Alerts */}
      {(expired.length > 0 || expiringSoon.length > 0) && (
        <div className="space-y-2">
          {expired.length > 0 && (
            <div className="flex items-center gap-3 rounded-xl bg-red-50 p-3 dark:bg-red-950/20">
              <AlertTriangle size={18} className="text-red-500" />
              <p className="text-sm text-red-600 dark:text-red-400">
                {expired.length} 种食材已过期
              </p>
            </div>
          )}
          {expiringSoon.length > 0 && (
            <div className="flex items-center gap-3 rounded-xl bg-amber-50 p-3 dark:bg-amber-950/20">
              <Clock size={18} className="text-amber-500" />
              <p className="text-sm text-amber-600 dark:text-amber-400">
                {expiringSoon.length} 种食材即将过期
              </p>
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索食材..."
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] py-2.5 pl-9 pr-3 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-stone-400)]"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setFilterCategory(null)}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
            filterCategory === null
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)]'
          }`}
        >
          全部
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilterCategory(filterCategory === cat.id ? null : cat.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              filterCategory === cat.id
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Items list */}
      {loading ? (
        <BrandLoading>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-[var(--color-bg-card)] p-4 shadow-xs">
                <div className="h-4 w-24 rounded bg-[var(--color-bg-subtle)]" />
                <div className="mt-2 h-3 w-16 rounded bg-[var(--color-bg-subtle)]" />
              </div>
            ))}
          </div>
        </BrandLoading>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl bg-[var(--color-bg-card)] border border-[var(--color-border)]/60 p-8 text-center shadow-xs">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Refrigerator size={32} />
          </div>
          <h3 className="text-base font-bold text-[var(--color-text)]">
            {items.length === 0 ? '冰箱还是空空的' : '没有找到匹配食材'}
          </h3>
          <p className="mt-1 text-xs text-[var(--color-text-muted)] max-w-xs">
            {items.length === 0 ? '录入食材后可获得临期预警，还能一键生成清冰箱菜谱' : '换个关键词或分类试试吧'}
          </p>
          {items.length === 0 && (
            <div className="mt-5 flex flex-wrap gap-2.5 justify-center">
              <button
                onClick={() => setShowBatchAdd(true)}
                className="flex items-center gap-1.5 rounded-2xl bg-[var(--color-primary)] px-4 py-2.5 text-xs font-semibold text-white shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <Sparkles size={14} />
                批量智能录入
              </button>
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-1.5 rounded-2xl bg-[var(--color-bg-subtle)] px-4 py-2.5 text-xs font-medium text-[var(--color-text-secondary)] border border-[var(--color-border)] transition-all duration-200 hover:bg-[var(--color-border-subtle)] active:scale-95"
              >
                <Plus size={14} />
                手动添加
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item, index) => {
            const daysLeft = item.expiryDate ? getDaysUntilExpiry(item.expiryDate) : null
            const isExpired = daysLeft !== null && daysLeft < 0
            const isExpiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3
            const staggerClass = `stagger-${Math.min((index % 8) + 1, 8)}`

            return (
              <div
                key={item.id}
                className={`flex items-center justify-between rounded-2xl bg-[var(--color-bg-card)] p-4 shadow-xs transition-all duration-300 hover:shadow-md active:scale-[0.99] animate-card-in ${staggerClass} ${
                  isExpired ? 'ring-2 ring-red-200 dark:ring-red-800' : ''
                } ${isExpiringSoon ? 'ring-2 ring-amber-200 dark:ring-amber-800' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-medium ${
                    CATEGORIES.find((c) => c.id === item.category)?.color ?? 'bg-gray-100 text-gray-700'
                  }`}>
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text)]">{item.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {item.amount}{item.unit}
                      {daysLeft !== null && (
                        <span className={`ml-2 ${
                          isExpired ? 'text-red-500' : isExpiringSoon ? 'text-amber-500' : 'text-[var(--color-text-muted)]'
                        }`}>
                          {isExpired ? `已过期${Math.abs(daysLeft)}天` : isExpiringSoon ? `${daysLeft}天后过期` : `${daysLeft}天`}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(item)}
                    className="rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-blue-50 hover:text-blue-500"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.name)}
                    className="rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit dialog */}
      {(showAdd || editingItem) && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => { setShowAdd(false); setEditingItem(null); resetForm(); }}>
          <div
            className="mx-4 w-full max-w-sm rounded-2xl bg-[var(--color-bg-card)] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--color-text)]">{editingItem ? '编辑食材' : '添加食材'}</h3>
              <button onClick={() => { setShowAdd(false); setEditingItem(null); resetForm(); }} className="rounded-lg p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)]">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="食材名称"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-stone-400)]"
                autoFocus
              />

              <div className="flex gap-2">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="数量"
                  min="0"
                  step="0.1"
                  className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-stone-400)]"
                />
                <div className="relative flex-1">
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 pr-8 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-stone-400)]"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                </div>
              </div>

              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 pr-8 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-stone-400)]"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
              </div>

              <div>
                <label className="mb-1 block text-xs text-[var(--color-text-muted)]">保质期（可选）</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-stone-400)]"
                />
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => { setShowAdd(false); setEditingItem(null); resetForm(); }}
                className="flex-1 rounded-xl border border-[var(--color-border)] py-2.5 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]"
              >
                取消
              </button>
              <button
                onClick={editingItem ? handleEdit : handleAdd}
                disabled={!name.trim() || !amount}
                className="flex-1 rounded-xl bg-[var(--color-primary)] py-2.5 text-sm font-medium text-white shadow-md transition-all active:scale-[0.98] disabled:opacity-40"
              >
                {editingItem ? '保存' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Ingestion Modal */}
      <BatchFridgeModal
        isOpen={showBatchAdd}
        onClose={() => setShowBatchAdd(false)}
      />
    </div>
  )
}
