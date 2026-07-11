import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Eraser, ShoppingCart, Plus, Search, Check, Bookmark, ChevronDown, Wand2 } from 'lucide-react'
import type { Category, Difficulty, Recipe } from '@/types'
import { categoryIcons, categoryLabels } from '@/constants/categories'
import { useMealPlanStore, type MealSlot } from '@/stores/mealPlanStore'
import { useRecipeStore } from '@/stores/recipeStore'
import { useShoppingStore } from '@/stores/shoppingStore'
import { useTemplateStore } from '@/stores/templateStore'
import { useSubscriptionStore } from '@/stores/subscriptionStore'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { useFridgeStore } from '@/stores/fridgeStore'
import { generateMealPlan } from '@/utils/mealGenerator'
import { calculateWeeklyNutrition } from '@/utils/nutrition'
import { calculateSmartShopping, type SmartShoppingResult } from '@/utils/smartShopping'
import { useUIStore } from '@/stores/uiStore'
import { BrandLoading } from '@/components/ui/BrandLoading'
import { NutritionPanel } from '@/components/ui/NutritionPanel'

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
  const { recipes } = useRecipeStore()
  const { generateFromRecipes } = useShoppingStore()
  const { templates, loadTemplates, saveTemplate, deleteTemplate, getTemplateDays } = useTemplateStore()
  const { isPro } = useSubscriptionStore()
  const { preferences } = usePreferencesStore()
  const { items: fridgeItems } = useFridgeStore()
  const navigate = useNavigate()

  const [selecting, setSelecting] = useState<{ day: number; slot: MealSlot } | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [pickerSearch, setPickerSearch] = useState('')
  const [pickerCategory, setPickerCategory] = useState<Category | null>(null)
  const [showTemplateMenu, setShowTemplateMenu] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [showSmartShopping, setShowSmartShopping] = useState(false)
  const [smartResult, setSmartResult] = useState<SmartShoppingResult | null>(null)
  const [templateName, setTemplateName] = useState('')
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
    loadTemplates()
  }, [loadCurrentWeek, loadTemplates])

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

    // Free users can only have 1 plan with meals
    if (!isPro()) {
      const hasMeals = currentPlan?.days.some((day) =>
        slots.some((slot) => (day[slot]?.length ?? 0) > 0)
      )
      if (hasMeals) {
        navigate('/settings/pricing')
        return
      }
    }

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

  const handleSaveTemplate = async () => {
    if (!currentPlan || !templateName.trim()) return
    await saveTemplate(templateName.trim(), currentPlan.days)
    setShowSaveDialog(false)
    setTemplateName('')
    setShowTemplateMenu(false)
  }

  const handleLoadTemplate = async (templateId: string) => {
    const days = getTemplateDays(templateId)
    if (days && currentPlan) {
      const updatedPlan = { ...currentPlan, days, updatedAt: new Date().toISOString() }
      const { db } = await import('@/db')
      await db.putMealPlan(updatedPlan)
      loadCurrentWeek()
    }
    setShowTemplateMenu(false)
  }

  const handleAutoGenerate = async () => {
    if (!currentPlan || recipes.length === 0) return
    const days = generateMealPlan(recipes, preferences)
    const updatedPlan = { ...currentPlan, days, updatedAt: new Date().toISOString() }
    const { db } = await import('@/db')
    await db.putMealPlan(updatedPlan)
    loadCurrentWeek()
    setShowPreferences(false)
  }

  const handleSmartShopping = () => {
    if (!currentPlan) return
    const planRecipes = currentPlan.days.flatMap((day) =>
      slots.flatMap((slot) => {
        const ids = day[slot] ?? []
        return ids.map((id) => recipes.find((r) => r.id === id)).filter(Boolean)
      })
    ) as Recipe[]

    const result = calculateSmartShopping(planRecipes, fridgeItems, preferences.servings)
    setSmartResult(result)
    setShowSmartShopping(true)
  }

  const handleAddSmartToShopping = async () => {
    if (!smartResult || smartResult.needToBuy.length === 0) return
    const { generateFromRecipesWithIngredients } = useShoppingStore.getState()
    await generateFromRecipesWithIngredients(
      ['smart-shopping'],
      [{
        id: 'smart-shopping',
        ingredients: smartResult.needToBuy.map((item) => ({
          name: item.name,
          amount: item.amount,
          unit: item.unit,
        })),
      }],
    )
    setShowSmartShopping(false)
    navigate('/shopping')
  }

  const hasMeals = currentPlan?.days.some((day) =>
    slots.some((slot) => (day[slot]?.length ?? 0) > 0)
  )

  const getRecipeName = (recipeId: string) =>
    recipes.find((r) => r.id === recipeId)?.name ?? '未知菜谱'

  // Count total planned meals
  const plannedCount = currentPlan
    ? currentPlan.days.reduce((sum, day) => {
        return sum + slots.reduce((s, slot) => s + (day[slot]?.length ?? 0), 0)
      }, 0)
    : 0

  // Calculate nutrition
  const nutritionData = currentPlan
    ? calculateWeeklyNutrition(currentPlan.days, recipes, preferences.servings)
    : null

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
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreferences(true)}
            className="flex h-10 items-center gap-1 rounded-xl bg-[var(--color-bg-card)] px-3 text-[var(--color-text-muted)] shadow-xs transition-all duration-200 hover:bg-purple-50 hover:text-purple-600 active:scale-95"
            title="智能排菜"
          >
            <Wand2 size={16} />
          </button>
          {hasMeals && fridgeItems.length > 0 && (
            <button
              onClick={handleSmartShopping}
              className="flex h-10 items-center gap-1 rounded-xl bg-[var(--color-bg-card)] px-3 text-[var(--color-text-muted)] shadow-xs transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-600 active:scale-95"
              title="智能购物"
            >
              <ShoppingCart size={16} />
            </button>
          )}
          <div className="relative">
            <button
              onClick={() => setShowTemplateMenu(!showTemplateMenu)}
              className="flex h-10 items-center gap-1 rounded-xl bg-[var(--color-bg-card)] px-3 text-[var(--color-text-muted)] shadow-xs transition-all duration-200 hover:bg-amber-50 hover:text-amber-600 active:scale-95"
              title="模板"
            >
              <Bookmark size={16} />
              <ChevronDown size={14} className={`transition-transform ${showTemplateMenu ? 'rotate-180' : ''}`} />
            </button>
            {showTemplateMenu && (
              <div className="absolute right-0 top-12 z-50 w-48 rounded-xl bg-[var(--color-bg-card)] p-1.5 shadow-lg">
                {hasMeals && (
                  <button
                    onClick={() => { setShowSaveDialog(true); setShowTemplateMenu(false) }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)]"
                  >
                    保存为模板
                  </button>
                )}
                {templates.length > 0 && (
                  <div className="border-t border-[var(--color-border)] my-1" />
                )}
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleLoadTemplate(t.id)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)]"
                  >
                    <span className="truncate flex-1">{t.name}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteTemplate(t.id) }}
                      className="shrink-0 rounded p-1 text-[var(--color-text-muted)] hover:text-red-500"
                    >
                      <X size={12} />
                    </button>
                  </button>
                ))}
              </div>
            )}
          </div>
          {plannedCount > 0 && (
            <>
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
            </>
          )}
        </div>
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

      {/* Nutrition panel */}
      {nutritionData && plannedCount > 0 && (
        <NutritionPanel
          dailyData={nutritionData.days}
          totals={nutritionData.totals}
          averages={nutritionData.averages}
          servings={preferences.servings}
        />
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

      {/* Save template dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowSaveDialog(false)}>
          <div
            className="mx-4 w-full max-w-sm rounded-2xl bg-[var(--color-bg-card)] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-semibold text-[var(--color-text)]">保存为模板</h3>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="输入模板名称，如家常一周"
              className="mb-4 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-stone-400)]"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTemplate() }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 rounded-xl border border-[var(--color-border)] py-2.5 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]"
              >
                取消
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={!templateName.trim()}
                className="flex-1 rounded-xl bg-[var(--color-primary)] py-2.5 text-sm font-medium text-white shadow-md transition-all active:scale-[0.98] disabled:opacity-40"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-generate preferences dialog */}
      {showPreferences && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowPreferences(false)}>
          <div
            className="mx-4 w-full max-w-sm rounded-2xl bg-[var(--color-bg-card)] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-2">
              <Wand2 size={20} className="text-purple-500" />
              <h3 className="text-lg font-semibold text-[var(--color-text)]">智能排菜</h3>
            </div>
            <p className="mb-4 text-sm text-[var(--color-text-muted)]">
              根据你的偏好自动生成一周菜单
            </p>

            <div className="space-y-4">
              {/* Servings */}
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">用餐人数</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <button
                      key={n}
                      onClick={() => usePreferencesStore.getState().updateServings(n)}
                      className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                        preferences.servings === n
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card)]'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max difficulty */}
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">最大难度</label>
                <div className="flex gap-2">
                  {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => usePreferencesStore.getState().setMaxDifficulty(d)}
                      className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                        preferences.maxDifficulty === d
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card)]'
                      }`}
                    >
                      {d === 'easy' ? '简单' : d === 'medium' ? '中等' : '困难'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max duration */}
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
                  最长烹饪时间：{preferences.maxDuration}分钟
                </label>
                <input
                  type="range"
                  min={15}
                  max={120}
                  step={15}
                  value={preferences.maxDuration}
                  onChange={(e) => usePreferencesStore.getState().setMaxDuration(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Exclude categories */}
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">排除分类</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(categoryLabels) as [Category, string][]).map(([val, label]) => {
                    const Icon = categoryIcons[val]
                    const excluded = preferences.excludeCategories.includes(val)
                    return (
                      <button
                        key={val}
                        onClick={() => usePreferencesStore.getState().toggleExcludeCategory(val)}
                        className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                          excluded
                            ? 'bg-red-100 text-red-600 line-through'
                            : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)]'
                        }`}
                      >
                        <Icon size={12} />
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowPreferences(false)}
                className="flex-1 rounded-xl border border-[var(--color-border)] py-2.5 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]"
              >
                取消
              </button>
              <button
                onClick={handleAutoGenerate}
                disabled={recipes.length === 0}
                className="flex-1 rounded-xl bg-[var(--color-primary)] py-2.5 text-sm font-medium text-white shadow-md transition-all active:scale-[0.98] disabled:opacity-40"
              >
                生成菜单
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Smart shopping modal */}
      {showSmartShopping && smartResult && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowSmartShopping(false)}>
          <div
            className="mx-4 w-full max-w-sm rounded-2xl bg-[var(--color-bg-card)] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-semibold text-[var(--color-text)]">智能购物清单</h3>
            
            {smartResult.needToBuy.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-medium text-red-500">需要购买</p>
                <div className="max-h-40 space-y-1 overflow-y-auto">
                  {smartResult.needToBuy.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-sm dark:bg-red-950/20">
                      <span className="text-[var(--color-text)]">{item.name}</span>
                      <span className="text-xs text-red-500">{item.amount}{item.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {smartResult.alreadyHave.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-medium text-emerald-500">冰箱已有</p>
                <div className="max-h-32 space-y-1 overflow-y-auto">
                  {smartResult.alreadyHave.map((item) => (
                    <div key={item.name} className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm dark:bg-emerald-950/20">
                      <span className="text-[var(--color-text)]">{item.name}</span>
                      <span className="text-xs text-emerald-500">{item.amount}{item.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {smartResult.expiringSoon.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-medium text-amber-500">即将过期</p>
                <div className="space-y-1">
                  {smartResult.expiringSoon.map((item) => (
                    <div key={item.name} className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-sm dark:bg-amber-950/20">
                      <span className="text-[var(--color-text)]">{item.name}</span>
                      <span className="text-xs text-amber-500">{item.daysLeft}天后过期</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowSmartShopping(false)}
                className="flex-1 rounded-xl border border-[var(--color-border)] py-2.5 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]"
              >
                取消
              </button>
              {smartResult.needToBuy.length > 0 && (
                <button
                  onClick={handleAddSmartToShopping}
                  className="flex-1 rounded-xl bg-[var(--color-primary)] py-2.5 text-sm font-medium text-white shadow-md transition-all active:scale-[0.98]"
                >
                  生成购物清单
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
