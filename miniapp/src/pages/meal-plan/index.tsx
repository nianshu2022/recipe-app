import { useState, useMemo } from 'react'
import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useMealPlanStore, SLOT_LABELS, DAY_LABELS } from '@/stores/mealPlanStore'
import { useRecipeStore } from '@/stores/recipeStore'
import { useShoppingStore } from '@/stores/shoppingStore'
import { useUIStore } from '@/stores/uiStore'
import { Icon } from '@/components/Icon'
import type { DayPlan } from '@/types'
import { CATEGORY_OPTIONS, CATEGORY_ICONS, SLOT_COLORS } from '@/constants/options'
import './index.scss'

type SlotKey = keyof DayPlan

export default function MealPlanPage() {
  const currentPlan = useMealPlanStore((s) => s.currentPlan)
  const loading = useMealPlanStore((s) => s.loading)
  const loadCurrentWeek = useMealPlanStore((s) => s.loadCurrentWeek)
  const setMeals = useMealPlanStore((s) => s.setMeals)
  const removeMeal = useMealPlanStore((s) => s.removeMeal)
  const clearPlan = useMealPlanStore((s) => s.clearPlan)
  const getWeekDates = useMealPlanStore((s) => s.getWeekDates)
  const recipes = useRecipeStore((s) => s.recipes)
  const loadRecipes = useRecipeStore((s) => s.loadRecipes)
  const generateFromRecipes = useShoppingStore((s) => s.generateFromRecipes)
  const showToast = useUIStore((s) => s.showToast)
  const showConfirm = useUIStore((s) => s.showConfirm)

  const [showPicker, setShowPicker] = useState(false)
  const [pickerDayIndex, setPickerDayIndex] = useState(0)
  const [pickerSlot, setPickerSlot] = useState<SlotKey>('breakfast')
  const [pickerSearch, setPickerSearch] = useState('')
  const [pickerCategory, setPickerCategory] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useDidShow(() => {
    loadCurrentWeek()
    loadRecipes()
  })

  const weekDates = getWeekDates()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const getRecipeName = (id: string): string => {
    const r = recipes.find((r) => r.id === id)
    return r?.name || '未知菜谱'
  }

  const plannedCount = currentPlan
    ? currentPlan.days.reduce((sum, day) => {
        return sum + ['breakfast', 'lunch', 'dinner', 'snack'].reduce((s, slot) => s + ((day[slot as SlotKey] as string[])?.length ?? 0), 0)
      }, 0)
    : 0

  const handleOpenPicker = (dayIndex: number, slot: SlotKey) => {
    setPickerDayIndex(dayIndex)
    setPickerSlot(slot)
    setPickerSearch('')
    setPickerCategory('all')
    setSelectedIds(new Set())
    setShowPicker(true)
  }

  const toggleSelect = (recipeId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(recipeId)) next.delete(recipeId)
      else next.add(recipeId)
      return next
    })
  }

  const handleConfirm = async () => {
    if (selectedIds.size === 0) return
    await setMeals(pickerDayIndex, pickerSlot, Array.from(selectedIds))
    setShowPicker(false)
  }

  const handleRemoveRecipe = (dayIndex: number, slot: SlotKey, recipeId: string) => {
    removeMeal(dayIndex, slot, recipeId)
  }

  const handleGenerateShoppingList = async () => {
    if (!currentPlan) return
    const recipeIds = currentPlan.days.flatMap((day) =>
      ['breakfast', 'lunch', 'dinner', 'snack'].flatMap((s) => (day[s as SlotKey] as string[]) ?? [])
    )
    if (recipeIds.length === 0) {
      showToast('还没有安排餐食', 'info')
      return
    }
    const plannedRecipes = recipes.filter((r) => recipeIds.includes(r.id))
    await generateFromRecipes(plannedRecipes)
    Taro.navigateTo({ url: '/pages/shopping/index' })
  }

  const handleClearPlan = async () => {
    const confirmed = await showConfirm({
      title: '清空计划',
      message: '确定清空本周所有餐食安排吗？',
      danger: true,
    })
    if (confirmed) {
      await clearPlan()
      showToast('已清空', 'success')
    }
  }

  const filteredPickerRecipes = useMemo(() => {
    const existing = currentPlan?.days[pickerDayIndex]?.[pickerSlot] as string[] ?? []
    return recipes.filter((r) => {
      if (r.deletedAt) return false
      if (pickerCategory !== 'all' && r.category !== pickerCategory) return false
      if (pickerSearch) {
        const q = pickerSearch.toLowerCase()
        if (!r.name.toLowerCase().includes(q) && !r.tags.some((t) => t.toLowerCase().includes(q))) return false
      }
      return true
    })
  }, [recipes, pickerSearch, pickerCategory, currentPlan, pickerDayIndex, pickerSlot])

  const getSlotRecipes = (day: DayPlan, slot: SlotKey): string[] => {
    return (day[slot] as string[]) || []
  }

  return (
    <View className='meal-plan-page'>
      <View className='meal-plan-header'>
        <View className='meal-plan-header__top'>
          <View>
            <Text className='meal-plan-header__title'>七日餐事</Text>
            <Text className='meal-plan-header__count'>
              {plannedCount > 0 ? `已安排 ${plannedCount} 道菜` : '规划一周的美味'}
            </Text>
          </View>
          {plannedCount > 0 && (
            <View className='meal-plan-header__actions'>
              <View className='meal-plan-header__btn' onClick={handleGenerateShoppingList}>
                <Icon name='shoppingCart' size={40} color='#252220' />
              </View>
              <View className='meal-plan-header__btn' onClick={handleClearPlan}>
                <Icon name='eraser' size={40} color='#252220' />
              </View>
            </View>
          )}
        </View>
      </View>

      <ScrollView scrollY className='meal-plan-content' enhanced showScrollbar={false}>
        {weekDates.map((date, dayIndex) => {
          const isToday = date.getTime() === today.getTime()
          const day = currentPlan?.days[dayIndex] || {}

          return (
            <View key={dayIndex} className={`day-card ${isToday ? 'day-card--today' : ''}`}>
              <View className='day-card__header'>
                <Text className={`day-card__label ${isToday ? 'day-card__label--today' : ''}`}>
                  {DAY_LABELS[dayIndex]}
                </Text>
                <Text className='day-card__date'>{date.getMonth() + 1}/{date.getDate()}</Text>
                {isToday && <View className='day-card__today-badge'><Text>今天</Text></View>}
              </View>

              <View className='day-card__slots'>
                {(['breakfast', 'lunch', 'dinner', 'snack'] as SlotKey[]).map((slot) => {
                  const slotRecipes = getSlotRecipes(day, slot)
                  const colors = SLOT_COLORS[slot]

                  return (
                    <View key={slot} className='meal-slot'>
                      <View className='meal-slot__label' style={{ background: colors.bg, color: colors.text }}>
                        <Text>{SLOT_LABELS[['breakfast', 'lunch', 'dinner', 'snack'].indexOf(slot)]}</Text>
                      </View>
                      <View className='meal-slot__content'>
                        {slotRecipes.length > 0 ? (
                          <View className='meal-slot__recipes'>
                            {slotRecipes.map((id) => (
                              <View key={id} className='meal-slot__recipe' style={{ background: colors.bg, color: colors.text }}>
                                <Text className='meal-slot__recipe-name'>{getRecipeName(id)}</Text>
                                <View className='meal-slot__remove' onClick={() => handleRemoveRecipe(dayIndex, slot, id)}>
                                  <Icon name='x' size={24} color={colors.text} />
                                </View>
                              </View>
                            ))}
                            <View className='meal-slot__add' onClick={() => handleOpenPicker(dayIndex, slot)}>
                              <Icon name='plus' size={28} color='#a8a08e' />
                            </View>
                          </View>
                        ) : (
                          <View className='meal-slot__empty' onClick={() => handleOpenPicker(dayIndex, slot)}>
                            <Text className='meal-slot__empty-text'>点击添加</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )
                })}
              </View>
            </View>
          )
        })}
      </ScrollView>

      {showPicker && (
        <View className='picker-overlay' onClick={() => setShowPicker(false)}>
          <View className='picker-sheet' onClick={(e) => e.stopPropagation()}>
            <View className='picker-sheet__header'>
              <Text className='picker-sheet__title'>选择菜谱 · {SLOT_LABELS[['breakfast', 'lunch', 'dinner', 'snack'].indexOf(pickerSlot)]}</Text>
              <View className='picker-sheet__close' onClick={() => setShowPicker(false)}>
                <Icon name='x' size={40} color='#252220' />
              </View>
            </View>

            <View className='picker-sheet__search'>
              <Icon name='search' size={32} color='#a8a08e' />
              <Input
                className='picker-sheet__search-input'
                placeholder='搜索菜谱...'
                value={pickerSearch}
                onInput={(e) => setPickerSearch(e.detail.value)}
              />
            </View>

            <ScrollView scrollX className='picker-sheet__filters' enhanced showScrollbar={false}>
              <View className='picker-sheet__pills'>
                {CATEGORY_OPTIONS.map((cat) => {
                  const catIcon = cat.value !== 'all' ? CATEGORY_ICONS[cat.value] : undefined
                  return (
                    <View
                      key={cat.value}
                      className={`picker-pill ${pickerCategory === cat.value ? 'picker-pill--active' : ''}`}
                      onClick={() => setPickerCategory(cat.value)}
                    >
                      {catIcon && <Icon name={catIcon} size={24} color={pickerCategory === cat.value ? '#ffffff' : '#6b6355'} />}
                      <Text>{cat.label}</Text>
                    </View>
                  )
                })}
              </View>
            </ScrollView>

            <ScrollView scrollY className='picker-sheet__list' enhanced showScrollbar={false}>
              {filteredPickerRecipes.map((recipe) => {
                const existing = currentPlan?.days[pickerDayIndex]?.[pickerSlot] as string[] ?? []
                const alreadyAdded = existing.includes(recipe.id)
                const isSelected = selectedIds.has(recipe.id)
                return (
                  <View
                    key={recipe.id}
                    className={`picker-item ${alreadyAdded ? 'picker-item--disabled' : ''} ${isSelected ? 'picker-item--selected' : ''}`}
                    onClick={() => !alreadyAdded && toggleSelect(recipe.id)}
                  >
                    <View className={`picker-item__check ${isSelected ? 'picker-item__check--active' : ''}`}>
                      {isSelected ? (
                        <Icon name='check' size={28} color='#ffffff' />
                      ) : (
                        <Text className='picker-item__initial'>{recipe.name.charAt(0)}</Text>
                      )}
                    </View>
                    <View className='picker-item__info'>
                      <Text className='picker-item__name'>{recipe.name}</Text>
                      <Text className='picker-item__meta'>
                        {recipe.difficulty === 'easy' ? '简单' : recipe.difficulty === 'medium' ? '中等' : '困难'}
                        {' · '}{recipe.duration}分钟
                        {alreadyAdded && ' · 已添加'}
                      </Text>
                    </View>
                  </View>
                )
              })}
            </ScrollView>

            <View className='picker-sheet__footer'>
              <View
                className={`picker-sheet__confirm ${selectedIds.size > 0 ? '' : 'picker-sheet__confirm--disabled'}`}
                onClick={handleConfirm}
              >
                <Text className='picker-sheet__confirm-text'>
                  确认添加{selectedIds.size > 0 ? `（${selectedIds.size} 道）` : ''}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
