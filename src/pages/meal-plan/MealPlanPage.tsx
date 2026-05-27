import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Eraser, ShoppingCart } from 'lucide-react'
import { useMealPlanStore, type MealSlot } from '@/stores/mealPlanStore'
import { useRecipeStore } from '@/stores/recipeStore'
import { useShoppingStore } from '@/stores/shoppingStore'
import { useUIStore } from '@/stores/uiStore'

const slots: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack']
const slotColors: Record<MealSlot, string> = {
  breakfast: 'bg-amber-50 text-amber-700',
  lunch: 'bg-emerald-50 text-emerald-700',
  dinner: 'bg-blue-50 text-blue-700',
  snack: 'bg-purple-50 text-purple-700',
}

export function MealPlanPage() {
  const { currentPlan, loading, loadCurrentWeek, setMeal, clearPlan, getWeekDates, getSlotLabel, getDayLabel } =
    useMealPlanStore()
  const { recipes, loadRecipes } = useRecipeStore()
  const { generateFromRecipes } = useShoppingStore()
  const navigate = useNavigate()

  const [selecting, setSelecting] = useState<{ day: number; slot: MealSlot } | null>(null)
  const setModalOpen = useUIStore((s) => s.setModalOpen)

  useEffect(() => {
    setModalOpen(selecting !== null)
    return () => setModalOpen(false)
  }, [selecting, setModalOpen])

  useEffect(() => {
    loadCurrentWeek()
    loadRecipes()
  }, [loadCurrentWeek, loadRecipes])

  const weekDates = getWeekDates()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const handleSelect = (recipeId: string) => {
    if (!selecting) return
    setMeal(selecting.day, selecting.slot, recipeId)
    setSelecting(null)
  }

  const handleGenerateShopping = async () => {
    if (!currentPlan) return
    const recipeIds = currentPlan.days.flatMap((day) =>
      slots.map((s) => day[s]).filter((id): id is string => !!id)
    )
    if (recipeIds.length === 0) return
    await generateFromRecipes(recipeIds)
    navigate('/shopping')
  }

  const handleClear = (day: number, slot: MealSlot) => {
    setMeal(day, slot, undefined)
  }

  const getRecipeName = (recipeId: string | undefined) => {
    if (!recipeId) return null
    return recipes.find((r) => r.id === recipeId)?.name ?? '未知菜谱'
  }

  // Count total planned meals
  const plannedCount = currentPlan
    ? currentPlan.days.reduce((sum, day) => {
        return sum + slots.filter((s) => day[s]).length
      }, 0)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-stone-900">
            周餐计划
          </h1>
          <p className="mt-1 text-sm text-stone-400">
            {plannedCount > 0 ? `已安排 ${plannedCount} 道菜` : '规划一周的美味'}
          </p>
        </div>
        {plannedCount > 0 && (
          <div className="flex gap-2">
            <button
              onClick={handleGenerateShopping}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-stone-500 shadow-xs transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-600 active:scale-95"
              title="生成购物清单"
            >
              <ShoppingCart size={18} />
            </button>
            <button
              onClick={clearPlan}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-stone-500 shadow-xs transition-all duration-200 hover:bg-red-50 hover:text-red-500 active:scale-95"
              title="清空计划"
            >
              <Eraser size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Week grid */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-white p-4 shadow-xs">
              <div className="h-4 w-16 rounded bg-stone-100" />
              <div className="mt-3 grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-14 rounded-xl bg-stone-50" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {weekDates.map((date, dayIndex) => {
            const isToday = date.getTime() === today.getTime()
            const dayPlan = currentPlan?.days[dayIndex]

            return (
              <div
                key={dayIndex}
                className={`rounded-2xl bg-white p-4 shadow-xs transition-all duration-200 ${
                  isToday ? 'ring-2 ring-primary/20' : ''
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${isToday ? 'text-primary' : 'text-stone-800'}`}>
                      {getDayLabel(dayIndex)}
                    </span>
                    <span className="text-xs text-stone-400">
                      {date.getMonth() + 1}/{date.getDate()}
                    </span>
                    {isToday && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        今天
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {slots.map((slot) => {
                    const recipeId = dayPlan?.[slot]
                    const recipeName = getRecipeName(recipeId)
                    const isActive = selecting?.day === dayIndex && selecting?.slot === slot

                    return (
                      <button
                        key={slot}
                        onClick={() => {
                          if (recipeId) {
                            handleClear(dayIndex, slot)
                          } else {
                            setSelecting({ day: dayIndex, slot })
                          }
                        }}
                        className={`group relative flex min-h-[56px] flex-col items-start justify-center rounded-xl px-3 py-2.5 text-left transition-all duration-200 ${
                          recipeId
                            ? `${slotColors[slot]} shadow-xs`
                            : 'border border-dashed border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                        } ${isActive ? 'ring-2 ring-primary' : ''}`}
                      >
                        <span className="text-[10px] font-medium uppercase tracking-wider opacity-60">
                          {getSlotLabel(slot)}
                        </span>
                        {recipeId ? (
                          <div className="flex w-full items-center justify-between">
                            <span className="truncate text-xs font-medium">{recipeName}</span>
                            <X size={12} className="shrink-0 opacity-0 transition-opacity group-hover:opacity-60" />
                          </div>
                        ) : (
                          <span className="text-xs text-stone-400">点击添加</span>
                        )}
                      </button>
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
        <div className="fixed inset-x-0 top-0 z-[60] flex items-end justify-center bg-black/30 backdrop-blur-sm" style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom))' }} onClick={() => setSelecting(null)}>
          <div
            className="max-h-[60vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-stone-800">
                选择菜谱 · {getSlotLabel(selecting.slot)}
              </h3>
              <button onClick={() => setSelecting(null)} className="rounded-lg p-1 text-stone-400 hover:bg-stone-100">
                <X size={18} />
              </button>
            </div>

            {recipes.length === 0 ? (
              <p className="py-8 text-center text-sm text-stone-400">还没有菜谱，先去创建吧</p>
            ) : (
              <div className="space-y-2">
                {recipes.map((recipe) => (
                  <button
                    key={recipe.id}
                    onClick={() => handleSelect(recipe.id)}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-stone-50 active:bg-stone-100"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-sm">
                      {recipe.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-stone-800">{recipe.name}</p>
                      <p className="text-xs text-stone-400">
                        {recipe.difficulty === 'easy' ? '简单' : recipe.difficulty === 'medium' ? '中等' : '困难'}
                        {' · '}{recipe.duration}分钟
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
