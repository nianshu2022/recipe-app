import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Eraser, ShoppingCart, Plus, Search, Check } from 'lucide-react'
import type { Category } from '@/types'
import { categoryIcons, categoryLabels } from '@/constants/categories'
import { useMealPlanStore, type MealSlot } from '@/stores/mealPlanStore'
import { useRecipeStore } from '@/stores/recipeStore'
import { useShoppingStore } from '@/stores/shoppingStore'
import { useUIStore } from '@/stores/uiStore'
import { BrandLoading } from '@/components/ui/BrandLoading'

const slots: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack']
const slotColors: Record<MealSlot, string> = {
  breakfast: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  lunch: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  dinner: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
  snack: 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400',
}

export function MealPlanPage() {
  const { currentPlan, loading, loadCurrentWeek, setMeals, removeMeal, clearPlan, cleanupStaleRecipes, getWeekDates, getSlotLabel, getDayLabel } =
    useMealPlanStore()
  const { recipes, loadRecipes } = useRecipeStore()
  const { generateFromRecipes } = useShoppingStore()
  const navigate = useNavigate()

  const [selecting, setSelecting] = useState<{ day: number; slot: MealSlot } | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [pickerSearch, setPickerSearch] = useState('')
  const [pickerCategory, setPickerCategory] = useState<Category | null>(null)
  const setModalOpen = useUIStore((s) => s.setModalOpen)

  useEffect(() => {
    setModalOpen(selecting !== null)
    if (selecting) {
      setSelectedIds(new Set())
      setPickerSearch('')
      setPickerCategory(null)
    }
    return () => setModalOpen(false)
  }, [selecting, setModalOpen])

  useEffect(() => {
    loadCurrentWeek()
    loadRecipes()
  }, [loadCurrentWeek, loadRecipes])

  useEffect(() => {
    if (currentPlan && recipes.length > 0) {
      cleanupStaleRecipes(new Set(recipes.map((r) => r.id)))
    }
  }, [currentPlan, recipes, cleanupStaleRecipes])

  const weekDates = getWeekDates()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const toggleSelect = (recipeId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(recipeId)) next.delete(recipeId)
      else next.add(recipeId)
      return next
    })
  }

  const handleConfirm = async () => {
    if (!selecting || selectedIds.size === 0) return
    await setMeals(selecting.day, selecting.slot, Array.from(selectedIds))
    setSelecting(null)
  }

  const handleGenerateShopping = async () => {
    if (!currentPlan) return
    const recipeIds = currentPlan.days.flatMap((day) =>
      slots.flatMap((s) => day[s] ?? [])
    )
    if (recipeIds.length === 0) return
    await generateFromRecipes(recipeIds)
    navigate('/shopping')
  }

  const getRecipeName = (recipeId: string) =>
    recipes.find((r) => r.id === recipeId)?.name ?? '未知菜谱'

  // Count total planned meals
  const plannedCount = currentPlan
    ? currentPlan.days.reduce((sum, day) => {
        return sum + slots.reduce((s, slot) => s + (day[slot]?.length ?? 0), 0)
      }, 0)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-40 -mx-5 -mt-6 flex items-end justify-between bg-[var(--color-bg)]/95 px-5 py-3 backdrop-blur-sm">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-text)]">
            七日餐事
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {plannedCount > 0 ? `已安排 ${plannedCount} 道菜` : '规划一周的美味'}
          </p>
        </div>
        {plannedCount > 0 && (
          <div className="flex gap-2">
            <button
              onClick={handleGenerateShopping}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-bg-card)] text-[var(--color-text-muted)] shadow-xs transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-600 active:scale-95"
              title="生成购物清单"
            >
              <ShoppingCart size={18} />
            </button>
            <button
              onClick={clearPlan}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-bg-card)] text-[var(--color-text-muted)] shadow-xs transition-all duration-200 hover:bg-red-50 hover:text-red-500 active:scale-95"
              title="清空计划"
            >
              <Eraser size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Week grid */}
      {loading ? (
        <BrandLoading>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-[var(--color-bg-card)] p-4 shadow-xs">
                <div className="h-4 w-16 rounded bg-[var(--color-bg-subtle)]" />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-16 rounded-xl bg-[var(--color-bg-subtle)]" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </BrandLoading>
      ) : (
        <div className="space-y-3">
          {weekDates.map((date, dayIndex) => {
            const isToday = date.getTime() === today.getTime()
            const dayPlan = currentPlan?.days[dayIndex]

            return (
              <div
                key={dayIndex}
                className={`rounded-2xl bg-[var(--color-bg-card)] p-4 shadow-xs transition-all duration-200 ${
                  isToday ? 'ring-2 ring-[var(--color-primary)]/20' : ''
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${isToday ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'}`}>
                      {getDayLabel(dayIndex)}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {date.getMonth() + 1}/{date.getDate()}
                    </span>
                    {isToday && (
                      <span className="rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--color-primary)]">
                        今天
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {slots.map((slot) => {
                    const recipeIds = dayPlan?.[slot] ?? []
                    const isActive = selecting?.day === dayIndex && selecting?.slot === slot

                    return (
                      <div
                        key={slot}
                        className={`flex min-h-[64px] flex-col rounded-xl p-2.5 transition-all duration-200 ${
                          recipeIds.length > 0
                            ? `${slotColors[slot]} shadow-xs`
                            : 'border border-dashed border-[var(--color-border)]'
                        } ${isActive ? 'ring-2 ring-[var(--color-primary)]' : ''}`}
                      >
                        <span className="mb-1 text-[10px] font-medium uppercase tracking-wider opacity-60">
                          {getSlotLabel(slot)}
                        </span>
                        {recipeIds.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {recipeIds.map((id) => (
                              <span
                                key={id}
                                className="group inline-flex items-center gap-1 rounded-full bg-white/60 px-2 py-0.5 text-[11px] font-medium dark:bg-black/20"
                              >
                                <span className="truncate max-w-[60px]">{getRecipeName(id)}</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); removeMeal(dayIndex, slot, id) }}
                                  className="shrink-0 rounded-full p-0.5 opacity-40 transition-opacity hover:opacity-100 hover:bg-red-100"
                                >
                                  <X size={10} />
                                </button>
                              </span>
                            ))}
                            <button
                              onClick={() => setSelecting({ day: dayIndex, slot })}
                              className="inline-flex items-center justify-center rounded-full bg-white/40 p-0.5 opacity-50 transition-opacity hover:opacity-100 dark:bg-black/20"
                            >
                              <Plus size={10} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelecting({ day: dayIndex, slot })}
                            className="flex-1 text-left text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                          >
                            点击添加
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Recipe picker modal */}
      {selecting && (
        <div className="fixed inset-x-0 top-0 z-[60] flex items-end justify-center bg-black/30 backdrop-blur-sm" style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom))' }} role="dialog" aria-modal="true" aria-label={`选择菜谱 · ${getSlotLabel(selecting.slot)}`} onKeyDown={(e) => { if (e.key === 'Escape') setSelecting(null) }} onClick={() => setSelecting(null)}>
          <div
            className="flex max-h-[75vh] w-full max-w-2xl flex-col rounded-t-3xl bg-[var(--color-bg-card)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h3 className="text-base font-semibold text-[var(--color-text)]">
                选择菜谱 · {getSlotLabel(selecting.slot)}
              </h3>
              <button onClick={() => setSelecting(null)} className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)]">
                <X size={18} />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 pb-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="搜索菜谱..."
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 pl-9 pr-3 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-stone-400)]"
                />
              </div>
            </div>

            {/* Category filter */}
            <div className="flex gap-1.5 overflow-x-auto px-5 pb-3 scrollbar-none">
              <button
                onClick={() => setPickerCategory(null)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  pickerCategory === null
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)]'
                }`}
              >
                全部
              </button>
              {(Object.entries(categoryLabels) as [Category, string][]).map(([val, label]) => {
                const Icon = categoryIcons[val]
                return (
                  <button
                    key={val}
                    onClick={() => setPickerCategory(pickerCategory === val ? null : val)}
                    className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                      pickerCategory === val
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)]'
                    }`}
                  >
                    <Icon size={12} />
                    {label}
                  </button>
                )
              })}
            </div>

            {/* Recipe list */}
            <div className="flex-1 overflow-y-auto px-5 pb-3">
              {(() => {
                const existing = currentPlan?.days[selecting.day]?.[selecting.slot] ?? []
                const filtered = recipes.filter((r) => {
                  if (pickerCategory && r.category !== pickerCategory) return false
                  if (pickerSearch && !r.name.includes(pickerSearch) && !r.tags.some((t) => t.includes(pickerSearch))) return false
                  return true
                })
                if (filtered.length === 0) {
                  return <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">没有匹配的菜谱</p>
                }
                return (
                  <div className="space-y-2">
                    {filtered.map((recipe) => {
                      const alreadyAdded = existing.includes(recipe.id)
                      const isSelected = selectedIds.has(recipe.id)
                      return (
                        <button
                          key={recipe.id}
                          onClick={() => !alreadyAdded && toggleSelect(recipe.id)}
                          disabled={alreadyAdded}
                          className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                            alreadyAdded
                              ? 'opacity-40 cursor-not-allowed'
                              : isSelected
                                ? 'bg-[var(--color-primary)]/5 ring-1 ring-[var(--color-primary)]/30'
                                : 'hover:bg-[var(--color-bg-subtle)]'
                          }`}
                        >
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-medium ${
                            isSelected ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)]'
                          }`}>
                            {isSelected ? <Check size={18} /> : recipe.name.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-[var(--color-text)]">{recipe.name}</p>
                            <p className="text-xs text-[var(--color-text-muted)]">
                              {recipe.difficulty === 'easy' ? '简单' : recipe.difficulty === 'medium' ? '中等' : '困难'}
                              {' · '}{recipe.duration}分钟
                              {alreadyAdded && ' · 已添加'}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )
              })()}
            </div>

            {/* Confirm button */}
            <div className="border-t border-[var(--color-border)] px-5 py-4">
              <button
                onClick={handleConfirm}
                disabled={selectedIds.size === 0}
                className="w-full rounded-2xl bg-[var(--color-primary)] py-3.5 text-sm font-semibold text-white shadow-md transition-all active:scale-[0.98] disabled:opacity-40"
              >
                确认添加{selectedIds.size > 0 ? `（${selectedIds.size} 道）` : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
