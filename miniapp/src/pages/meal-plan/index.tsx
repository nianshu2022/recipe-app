import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useMemo, useEffect } from 'react'
import { useMealPlanStore, type MealSlot } from '@/stores/mealPlanStore'
import { useRecipeStore } from '@/stores/recipeStore'
import { useShoppingStore } from '@/stores/shoppingStore'
import { Icon } from '@/components/Icon'
import './index.scss'

const slots: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack']

const slotColors: Record<MealSlot, { bg: string; text: string }> = {
  breakfast: { bg: '#fffbeb', text: '#b45309' },
  lunch: { bg: '#ecfdf5', text: '#047857' },
  dinner: { bg: '#eff6ff', text: '#1d4ed8' },
  snack: { bg: '#faf5ff', text: '#7c3aed' },
}

export default function MealPlanPage() {
  const { currentPlan, loading, loadCurrentWeek, setMeal, clearPlan, cleanupStaleRecipes, getWeekDates, getSlotLabel, getDayLabel } =
    useMealPlanStore()
  const { recipes, loadRecipes } = useRecipeStore()
  const { generateFromRecipes } = useShoppingStore()

  const [selecting, setSelecting] = useState<{ day: number; slot: MealSlot } | null>(null)

  useDidShow(() => {
    loadCurrentWeek()
    loadRecipes()
  })

  useEffect(() => {
    if (currentPlan && recipes.length > 0) {
      cleanupStaleRecipes(new Set(recipes.map((r) => r.id)))
    }
  }, [currentPlan, recipes, cleanupStaleRecipes])

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
    if (recipeIds.length === 0) {
      Taro.showToast({ title: '请先安排菜品', icon: 'none' })
      return
    }
    await generateFromRecipes(recipeIds)
    Taro.navigateTo({ url: '/pages/shopping/index' })
  }

  const handleClearSlot = (day: number, slot: MealSlot) => {
    setMeal(day, slot, undefined)
  }

  const getRecipeName = (recipeId: string | undefined) => {
    if (!recipeId) return null
    return recipes.find((r) => r.id === recipeId)?.name ?? '未知菜谱'
  }

  const plannedCount = currentPlan
    ? currentPlan.days.reduce((sum, day) => sum + slots.filter((s) => day[s]).length, 0)
    : 0

  return (
    <View className="meal-plan-page">
      {/* Header */}
      <View className="plan-header">
        <View className="plan-header-left">
          <Text className="plan-title">周餐计划</Text>
          <Text className="plan-subtitle">
            {plannedCount > 0 ? `已安排 ${plannedCount} 道菜` : '规划一周的美味'}
          </Text>
        </View>
        {plannedCount > 0 && (
          <View className="plan-header-actions">
            <View className="plan-action-btn" onClick={handleGenerateShopping}>
              <Icon name="shoppingCart" size={36} color="#78716c" />
            </View>
            <View className="plan-action-btn" onClick={() => {
              Taro.showModal({
                title: '确认清空',
                content: '确定要清空本周所有计划吗？',
                success: (res) => { if (res.confirm) clearPlan() },
              })
            }}>
              <Icon name="eraser" size={36} color="#78716c" />
            </View>
          </View>
        )}
      </View>

      {/* Week grid */}
      {loading ? (
        <View className="skeleton-list">
          {[1, 2, 3].map((i) => (
            <View key={i} className="skeleton-card">
              <View className="skeleton-title" />
              <View className="skeleton-grid">
                {[1, 2, 3, 4].map((j) => (
                  <View key={j} className="skeleton-slot" />
                ))}
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View className="week-list">
          {weekDates.map((date, dayIndex) => {
            const isToday = date.getTime() === today.getTime()
            const dayPlan = currentPlan?.days[dayIndex]

            return (
              <View key={dayIndex} className={`day-card ${isToday ? 'today' : ''}`}>
                <View className="day-header">
                  <View className="day-header-left">
                    <Text className={`day-name ${isToday ? 'today-text' : ''}`}>
                      {getDayLabel(dayIndex)}
                    </Text>
                    <Text className="day-date">
                      {date.getMonth() + 1}/{date.getDate()}
                    </Text>
                    {isToday && (
                      <View className="today-badge">
                        <Text className="today-badge-text">今天</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View className="slot-grid">
                  {slots.map((slot) => {
                    const recipeId = dayPlan?.[slot]
                    const recipeName = getRecipeName(recipeId)
                    const colors = slotColors[slot]

                    return (
                      <View
                        key={slot}
                        className={`slot-card ${recipeId ? 'filled' : 'empty'}`}
                        style={recipeId ? { background: colors.bg } : undefined}
                        onClick={() => {
                          if (recipeId) {
                            handleClearSlot(dayIndex, slot)
                          } else {
                            setSelecting({ day: dayIndex, slot })
                          }
                        }}
                      >
                        <Text className="slot-label" style={recipeId ? { color: colors.text, opacity: 0.6 } : undefined}>
                          {getSlotLabel(slot)}
                        </Text>
                        {recipeId ? (
                          <Text className="slot-recipe" style={{ color: colors.text }}>
                            {recipeName}
                          </Text>
                        ) : (
                          <Text className="slot-empty">点击添加</Text>
                        )}
                      </View>
                    )
                  })}
                </View>
              </View>
            )
          })}
        </View>
      )}

      {/* Recipe picker modal */}
      {selecting && (
        <View className="picker-overlay" onClick={() => setSelecting(null)}>
          <View className="picker-sheet" onClick={(e) => e.stopPropagation()}>
            <View className="picker-header">
              <Text className="picker-title">选择菜谱 · {getSlotLabel(selecting.slot)}</Text>
              <View className="picker-close" onClick={() => setSelecting(null)}>
                <Icon name="x" size={36} color="#a8a29e" />
              </View>
            </View>

            {recipes.length === 0 ? (
              <View className="picker-empty">
                <Text className="picker-empty-text">还没有菜谱，先去创建吧</Text>
              </View>
            ) : (
              <ScrollView scrollY className="picker-list">
                {recipes.map((recipe) => (
                  <View
                    key={recipe.id}
                    className="picker-item"
                    onClick={() => handleSelect(recipe.id)}
                  >
                    <View className="picker-item-icon">
                      <Text className="picker-item-icon-text">{recipe.name.charAt(0)}</Text>
                    </View>
                    <View className="picker-item-info">
                      <Text className="picker-item-name">{recipe.name}</Text>
                      <Text className="picker-item-meta">
                        {recipe.difficulty === 'easy' ? '简单' : recipe.difficulty === 'medium' ? '中等' : '困难'}
                        {' · '}{recipe.duration}分钟
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      )}
    </View>
  )
}
