import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Refrigerator, Plus, Trash2, X, AlertTriangle, Clock, Pencil, Search, ScanBarcode,
} from 'lucide-react'
import { useFridgeStore } from '@/stores/fridgeStore'
import { useRecipeStore } from '@/stores/recipeStore'
import { useUIStore } from '@/stores/uiStore'
import { BrandLoading } from '@/components/ui/BrandLoading'
import { BarcodeScanner } from '@/components/ui/BarcodeScanner'
import { UNIT_OPTIONS } from '@/constants/units'
import { fetchOpenFoodFacts, searchLocalIngredients, type OffResult } from '@/utils/externalApis'
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'

export function FridgePage() {
  const {
    items, loading, categoryFilter, loadItems, addItem, removeItem,
    updateItem, setCategoryFilter, getExpiringSoon, getExpired,
    getFilteredItems, getCategoryCounts,
  } = useFridgeStore()
  const { recipes, loadRecipes } = useRecipeStore()

  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newBrand, setNewBrand] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newUnit, setNewUnit] = useState('')
  const [newExpiryDays, setNewExpiryDays] = useState('')
  const [newPurchaseDate, setNewPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [newNutriments, setNewNutriments] = useState<OffResult['nutriments']>(undefined)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [offResults, setOffResults] = useState<OffResult[]>([])
  const [offLoading, setOffLoading] = useState(false)
  const [offError, setOffError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const setModalOpen = useUIStore((s) => s.setModalOpen)

  const {
    showScanner, setShowScanner,
    lookupLoading, lookupError, setLookupError,
    handleScan,
  } = useBarcodeScanner({
    onProductFound: (product) => {
      setNewName(product.name)
      setNewBrand(product.brand || '')
      setNewNutriments(product.nutriments)
      setOffResults([])
      setOffError(null)
    },
  })

  useEffect(() => {
    setModalOpen(showAdd || editingId !== null)
    return () => setModalOpen(false)
  }, [showAdd, editingId, setModalOpen])

  useEffect(() => {
    loadItems()
    loadRecipes()
  }, [loadItems, loadRecipes])

  const handleAdd = async () => {
    if (!newName.trim()) return
    const days = newExpiryDays ? Number(newExpiryDays) : undefined
    await addItem(newName.trim(), Number(newAmount) || 0, newUnit.trim(), {
      brand: newBrand || undefined,
      nutriments: newNutriments,
      expiryDays: days,
      purchaseDate: newPurchaseDate,
    })
    setNewName('')
    setNewBrand('')
    setNewAmount('')
    setNewUnit('')
    setNewExpiryDays('')
    setNewPurchaseDate(new Date().toISOString().split('T')[0])
    setNewNutriments(undefined)
    setOffResults([])
    setHasSearched(false)
    setShowAdd(false)
  }

  const openEdit = (item: typeof items[0]) => {
    setEditingId(item.id)
    setNewName(item.name)
    setNewBrand(item.brand || '')
    setNewAmount(String(item.amount || ''))
    setNewUnit(item.unit)
    setNewPurchaseDate(new Date(item.purchaseDate).toISOString().split('T')[0])
    setNewNutriments(item.nutriments)
    if (item.expiryDate) {
      const diff = Math.ceil((new Date(item.expiryDate).getTime() - Date.now()) / 86400000)
      setNewExpiryDays(diff > 0 ? String(diff) : '')
    } else {
      setNewExpiryDays('')
    }
  }

  const closeEdit = () => {
    setEditingId(null)
    setNewName('')
    setNewBrand('')
    setNewAmount('')
    setNewUnit('')
    setNewExpiryDays('')
    setNewPurchaseDate(new Date().toISOString().split('T')[0])
    setNewNutriments(undefined)
  }

  const handleEdit = async () => {
    if (!editingId || !newName.trim()) return
    const days = newExpiryDays ? Number(newExpiryDays) : undefined
    const pDate = new Date(newPurchaseDate)
    await updateItem(editingId, {
      name: newName.trim(),
      amount: Number(newAmount) || 0,
      unit: newUnit.trim(),
      brand: newBrand || undefined,
      nutriments: newNutriments,
      purchaseDate: pDate.toISOString(),
      expiryDate: days ? new Date(pDate.getTime() + days * 86400000).toISOString() : undefined,
    })
    closeEdit()
  }

  const handleOffSearch = async () => {
    if (!newName.trim()) return
    setOffLoading(true)
    setOffResults([])
    setOffError(null)
    setHasSearched(true)

    // 先搜索本地食材
    const localResults = searchLocalIngredients(newName.trim())
    if (localResults.length > 0) {
      setOffLoading(false)
      setOffResults(localResults)
      return
    }

    // 本地没有则调用 API
    try {
      const { data } = await fetchOpenFoodFacts(newName.trim())
      setOffLoading(false)
      if (data.length > 0) {
        setOffResults(data)
      } else {
        setOffError('未找到匹配的食材，试试其他关键词')
      }
    } catch {
      setOffLoading(false)
      setOffError('搜索失败，请检查网络后重试')
    }
  }

  const pickOffResult = (r: OffResult) => {
    setNewName(r.name)
    setNewBrand(r.brand || '')
    setNewNutriments(r.nutriments)
    setOffResults([])
    setHasSearched(false)
    setOffError(null)
  }

  const expiringSoon = getExpiringSoon()
  const expired = getExpired()
  const filtered = getFilteredItems()
  const categoryCounts = getCategoryCounts()
  const categories = Object.keys(categoryCounts)

  // 基于冰箱食材推荐用户菜谱库中的菜谱
  const recommendations = (() => {
    if (items.length === 0 || recipes.length === 0) return []
    const fridgeNames = items.map((i) => i.name)
    // 找出菜谱中食材与冰箱食材匹配的菜谱
    const matched = recipes
      .map((recipe) => {
        const matchCount = recipe.ingredients.filter((ing) =>
          fridgeNames.some((name) => name.includes(ing.name) || ing.name.includes(name))
        ).length
        return { recipe, matchCount }
      })
      .filter((r) => r.matchCount > 0)
      .sort((a, b) => b.matchCount - a.matchCount)
      .slice(0, 3)
    return matched.map((r) => r.recipe)
  })()

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
      <div className="sticky top-0 z-40 -mx-5 -mt-6 flex items-end justify-between bg-[var(--color-bg)]/95 px-5 py-3 backdrop-blur-sm">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-text)]">
            鲜存清单
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {items.length > 0 ? `${items.length} 种食材` : '管理你的食材库存'}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-white shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
        >
          <Plus size={20} strokeWidth={2.2} />
        </button>
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label="添加食材" onKeyDown={(e) => { if (e.key === 'Escape') { setShowAdd(false); setNewName(''); setNewBrand(''); setNewAmount(''); setNewUnit(''); setNewExpiryDays(''); setNewPurchaseDate(new Date().toISOString().split('T')[0]); setNewNutriments(undefined); setOffResults([]); setOffError(null); setHasSearched(false) } }} onClick={() => { setShowAdd(false); setNewName(''); setNewBrand(''); setNewAmount(''); setNewUnit(''); setNewExpiryDays(''); setNewPurchaseDate(new Date().toISOString().split('T')[0]); setNewNutriments(undefined); setOffResults([]); setOffError(null); setHasSearched(false) }}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full max-w-2xl rounded-t-3xl bg-[var(--color-bg-card)] p-5 pb-24 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[var(--color-text)]">添加食材</h3>
              <button onClick={() => { setShowAdd(false); setNewName(''); setNewBrand(''); setNewAmount(''); setNewUnit(''); setNewExpiryDays(''); setNewPurchaseDate(new Date().toISOString().split('T')[0]); setNewNutriments(undefined); setOffResults([]); setOffError(null); setHasSearched(false) }} aria-label="关闭" className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)]">
                <X size={18} />
              </button>
            </div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">食材名称<span className="ml-0.5 text-red-500">*</span></label>
            <div className="relative">
              <input
                type="text"
                value={newName}
                onChange={(e) => { setNewName(e.target.value); setOffResults([]); setLookupError(null); setHasSearched(false) }}
                placeholder="请输入食材名称"
                autoFocus
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 pr-20 text-sm text-[var(--color-text)] outline-none transition-all duration-200 placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-stone-400)] focus:ring-2 focus:ring-[var(--color-border-subtle)]"
              />
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="absolute right-9 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text-secondary)]"
                title="扫码识别"
              >
                <ScanBarcode size={16} />
              </button>
              <button
                type="button"
                onClick={handleOffSearch}
                disabled={!newName.trim() || offLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text-secondary)] disabled:opacity-40"
                title="查询食品信息"
              >
                <Search size={16} className={offLoading ? 'animate-pulse' : ''} />
              </button>
            </div>
            {offLoading && (
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-muted)]">
                <Search size={14} className="animate-pulse" />
                搜索中...
              </div>
            )}
            {lookupLoading && (
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-muted)]">
                <ScanBarcode size={14} className="animate-pulse" />
                正在查询产品信息...
              </div>
            )}
            {offError && (
              <div className="mt-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {offError}
              </div>
            )}
            {lookupError && (
              <div className="mt-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {lookupError}
              </div>
            )}
            {!offLoading && !lookupLoading && !offError && !lookupError && hasSearched && offResults.length === 0 && newName.trim() && (
              <div className="mt-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-muted)]">
                未找到相关食品
              </div>
            )}
            {offResults.length > 0 && (
              <div className="mt-1 max-h-32 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-sm">
                {offResults.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => pickOffResult(r)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--color-bg-subtle)]"
                  >
                    {r.imageUrl && (
                      <img src={r.imageUrl} alt="" className="h-8 w-8 shrink-0 rounded-lg object-cover" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[var(--color-text)]">{r.name}</div>
                      {r.brand && <div className="truncate text-xs text-[var(--color-text-muted)]">{r.brand}</div>}
                    </div>
                    {r.category && (
                      <span className="shrink-0 rounded-full bg-[var(--color-bg-subtle)] px-2 py-0.5 text-[10px] text-[var(--color-text-muted)]">
                        {r.category}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
            <div className="mt-2">
              <label className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">品牌</label>
              <input
                type="text"
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                placeholder="选填"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5 text-sm text-[var(--color-text)] outline-none transition-all duration-200 placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-stone-400)] focus:ring-2 focus:ring-[var(--color-border-subtle)]"
              />
            </div>
            {newNutriments && (
              <div className="mt-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
                <p className="mb-2 text-xs font-medium text-[var(--color-text-muted)]">营养信息 (每100g)</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <div className="text-sm font-semibold text-orange-500">{newNutriments['energy-kcal_100g'] ?? '-'}</div>
                    <div className="text-[10px] text-[var(--color-text-muted)]">千卡</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-red-500">{newNutriments.proteins_100g ?? '-'}g</div>
                    <div className="text-[10px] text-[var(--color-text-muted)]">蛋白质</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-amber-500">{newNutriments.carbohydrates_100g ?? '-'}g</div>
                    <div className="text-[10px] text-[var(--color-text-muted)]">碳水</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-blue-500">{newNutriments.fat_100g ?? '-'}g</div>
                    <div className="text-[10px] text-[var(--color-text-muted)]">脂肪</div>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="数量"
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-3 text-sm text-[var(--color-text)] outline-none transition-all duration-200 placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-stone-400)] focus:ring-2 focus:ring-[var(--color-border-subtle)]"
              />
              <select
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                className={`appearance-none rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-3 text-sm outline-none transition-all duration-200 focus:border-[var(--color-stone-400)] focus:ring-2 focus:ring-[var(--color-border-subtle)] ${newUnit ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}`}
              >
                <option value="">单位</option>
                {UNIT_OPTIONS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-[var(--color-text-muted)]">购买日期</label>
                <input
                  type="date"
                  value={newPurchaseDate}
                  onChange={(e) => setNewPurchaseDate(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm text-[var(--color-text)] outline-none transition-all duration-200 focus:border-[var(--color-stone-400)] focus:ring-2 focus:ring-[var(--color-border-subtle)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--color-text-muted)]">保质期(天)</label>
                <input
                  type="number"
                  value={newExpiryDays}
                  onChange={(e) => setNewExpiryDays(e.target.value)}
                  placeholder="选填"
                  min={1}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm text-[var(--color-text)] outline-none transition-all duration-200 placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-stone-400)] focus:ring-2 focus:ring-[var(--color-border-subtle)]"
                />
              </div>
            </div>
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="mt-4 w-full rounded-2xl bg-[var(--color-primary)] py-3.5 text-sm font-semibold text-white shadow-md transition-all duration-200 active:scale-[0.98] disabled:opacity-40"
            >
              添加
            </button>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label="编辑食材" onKeyDown={(e) => { if (e.key === 'Escape') closeEdit() }} onClick={closeEdit}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full max-w-2xl rounded-t-3xl bg-[var(--color-bg-card)] p-5 pb-24 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[var(--color-text)]">编辑食材</h3>
              <button onClick={closeEdit} className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)]">
                <X size={18} />
              </button>
            </div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">食材名称<span className="ml-0.5 text-red-500">*</span></label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="请输入食材名称"
              autoFocus
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition-all duration-200 placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-stone-400)] focus:ring-2 focus:ring-[var(--color-border-subtle)]"
            />
            {newNutriments && (
              <div className="mt-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
                <p className="mb-2 text-xs font-medium text-[var(--color-text-muted)]">营养信息 (每100g)</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <div className="text-sm font-semibold text-orange-500">{newNutriments['energy-kcal_100g'] ?? '-'}</div>
                    <div className="text-[10px] text-[var(--color-text-muted)]">千卡</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-red-500">{newNutriments.proteins_100g ?? '-'}g</div>
                    <div className="text-[10px] text-[var(--color-text-muted)]">蛋白质</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-amber-500">{newNutriments.carbohydrates_100g ?? '-'}g</div>
                    <div className="text-[10px] text-[var(--color-text-muted)]">碳水</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-blue-500">{newNutriments.fat_100g ?? '-'}g</div>
                    <div className="text-[10px] text-[var(--color-text-muted)]">脂肪</div>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="数量"
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-3 text-sm text-[var(--color-text)] outline-none transition-all duration-200 placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-stone-400)] focus:ring-2 focus:ring-[var(--color-border-subtle)]"
              />
              <select
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                className={`appearance-none rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-3 text-sm outline-none transition-all duration-200 focus:border-[var(--color-stone-400)] focus:ring-2 focus:ring-[var(--color-border-subtle)] ${newUnit ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}`}
              >
                <option value="">单位</option>
                {UNIT_OPTIONS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-[var(--color-text-muted)]">购买日期</label>
                <input
                  type="date"
                  value={newPurchaseDate}
                  onChange={(e) => setNewPurchaseDate(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm text-[var(--color-text)] outline-none transition-all duration-200 focus:border-[var(--color-stone-400)] focus:ring-2 focus:ring-[var(--color-border-subtle)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--color-text-muted)]">保质期(天)</label>
                <input
                  type="number"
                  value={newExpiryDays}
                  onChange={(e) => setNewExpiryDays(e.target.value)}
                  placeholder="选填"
                  min={1}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm text-[var(--color-text)] outline-none transition-all duration-200 placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-stone-400)] focus:ring-2 focus:ring-[var(--color-border-subtle)]"
                />
              </div>
            </div>
            <button
              onClick={handleEdit}
              disabled={!newName.trim()}
              className="mt-4 w-full rounded-2xl bg-[var(--color-primary)] py-3.5 text-sm font-semibold text-white shadow-md transition-all duration-200 active:scale-[0.98] disabled:opacity-40"
            >
              保存
            </button>
          </div>
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
        <div className="rounded-2xl bg-[var(--color-bg-card)] p-4 shadow-xs">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">根据现有食材推荐</p>
          <div className="flex flex-wrap gap-2">
            {recommendations.map((recipe) => (
              <Link
                key={recipe.id}
                to={`/recipe/${recipe.id}`}
                className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
              >
                {recipe.name}
              </Link>
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
              categoryFilter === null ? 'bg-[var(--color-text)] text-[var(--color-bg)]' : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]'
            }`}
          >
            全部
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                categoryFilter === cat ? 'bg-[var(--color-text)] text-[var(--color-bg)]' : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]'
              }`}
            >
              {cat} ({categoryCounts[cat]})
            </button>
          ))}
        </div>
      )}

      {/* Item list */}
      {loading ? (
        <BrandLoading>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-[var(--color-bg-card)] p-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[var(--color-bg-subtle)]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-24 rounded bg-[var(--color-bg-subtle)]" />
                    <div className="h-3 w-16 rounded bg-[var(--color-bg-subtle)]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </BrandLoading>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--color-bg-subtle)]">
            <Refrigerator size={36} className="text-[var(--color-text-muted)]" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-[var(--color-text-secondary)]">冰箱空空如也</h3>
          <p className="text-sm text-[var(--color-text-muted)]">录入你买了什么吧</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => {
            const isExpiring = item.expiryDate && new Date(item.expiryDate) <= new Date(Date.now() + 3 * 86400000)
            const isExpired = item.expiryDate && new Date(item.expiryDate) <= new Date()
            return (
              <div
                key={item.id}
                className={`group flex items-center gap-3 rounded-2xl bg-[var(--color-bg-card)] px-4 py-3 shadow-xs transition-all duration-200 hover:shadow-sm ${
                  isExpired ? 'opacity-60' : ''
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-medium ${
                  isExpired ? 'bg-red-50 text-red-500' : isExpiring ? 'bg-amber-50 text-amber-600' : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)]'
                }`}>
                  {item.amount > 0 ? `${item.amount}` : ''}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--color-text)]">{item.name}</span>
                    {item.brand && <span className="text-xs text-[var(--color-text-muted)]">{item.brand}</span>}
                    <span className="rounded-full bg-[var(--color-bg-subtle)] px-1.5 py-0.5 text-[10px] text-[var(--color-text-secondary)]">{item.category}</span>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {item.amount > 0 ? `${item.amount}${item.unit}` : ''}
                    {` · ${new Date(item.purchaseDate).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}录入`}
                    {item.expiryDate && ` · ${formatExpiry(item.expiryDate)}`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(item)}
                    aria-label="编辑"
                    className="rounded-lg p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text-secondary)]"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    aria-label="删除"
                    className="rounded-lg p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showScanner && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  )
}
