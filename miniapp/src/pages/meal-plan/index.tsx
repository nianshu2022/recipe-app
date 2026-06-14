import { useState, useMemo } from 'react'
import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useMealPlanStore, SLOT_LABELS, DAY_LABELS, getWeekStart } from '@/stores/mealPlanStore'
import { useRecipeStore } from '@/stores/recipeStore'
import { useShoppingStore } from '@/stores/shoppingStore'
import { useUIStore } from '@/stores/uiStore'
import { Icon } from '@/components/Icon'
import type { DayPlan, Recipe } from '@/types'
import { CATEGORY_OPTIONS, CATEGORY_ICONS, SLOT_COLORS } from '@/constants/options'
import './index.scss'

type SlotKey = keyof DayPlan

export default function MealPlanPage() {
  const plans = useMealPlanStore((s) => s.plans)
  const currentWeekStart = useMealPlanStore((s) => s.currentWeekStart)
  const loadPlans = useMealPlanStore((s) => s.loadPlans)
  const setCurrentWeekStart = useMealPlanStore((s) => s.setCurrentWeekStart)
  const getCurrentPlan = useMealPlanStore((s) => s.getCurrentPlan)
  const addRecipeToSlot = useMealPlanStore((s) => s.addRecipeToSlot)
  const removeRecipeFromSlot = useMealPlanStore((s) => s.removeRecipeFromSlot)
  const clearCurrentPlan = useMealPlanStore((s) => s.clearCurrentPlan)
  const getPlannedRecipeIds = useMealPlanStore((s) => s.getPlannedRecipeIds)
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

  useDidShow(() => {
    loadPlans()
    loadRecipes()
  })

  const currentPlan = getCurrentPlan()

  const weekDates = useMemo(() => {
    const start = new Date(currentWeekStart)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [currentWeekStart])

  const today = new Date().toISOString().split('T')[0]

  const getRecipeName = (id: string): string => {
    const r = recipes.find((r) => r.id === id)
    return r?.name || '未知菜谱'
  }

  const plannedCount = getPlannedRecipeIds().length

  const handlePrevWeek = () => {
    const d = new Date(currentWeekStart)
    d.setDate(d.getDate() - 7)
    setCurrentWeekStart(getWeekStart(d))
  }

  const handleNextWeek = () => {
    const d = new Date(currentWeekStart)
    d.setDate(d.getDate() + 7)
    setCurrentWeekStart(getWeekStart(d))
  }

  const handleOpenPicker = (dayIndex: number, slot: SlotKey) => {
    setPickerDayIndex(dayIndex)
    setPickerSlot(slot)
    setPickerSearch('')
    setPickerCategory('all')
    setShowPicker(true)
  }

  const handleSelectRecipe = (recipeId: string) => {
    addRecipeToSlot(pickerDayIndex, pickerSlot, recipeId)
    setShowPicker(false)
  }

  const handleRemoveRecipe = (dayIndex: number, slot: SlotKey, recipeId: string) => {
    removeRecipeFromSlot(dayIndex, slot, recipeId)
  }

  const handleGenerateShoppingList = async () => {
    const plannedIds = getPlannedRecipeIds()
    if (plannedIds.length === 0) {
      showToast('还没有安排餐食', 'info')
      return
    }
    const plannedRecipes = recipes.filter((r) => plannedIds.includes(r.id))
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
      await clearCurrentPlan()
      showToast('已清空', 'success')
    }
  }

  const filteredPickerRecipes = useMemo(() => {
    return recipes.filter((r) => {
      if (r.deletedAt) return false
      if (pickerCategory !== 'all' && r.category !== pickerCategory) return false
      if (pickerSearch) {
        const q = pickerSearch.toLowerCase()
        if (!r.name.toLowerCase().includes(q) && !r.tags.some((t) => t.toLowerCase().includes(q))) return false
      }
      return true
    })
  }, [recipes, pickerSearch, pickerCategory])

  const getSlotRecipes = (day: DayPlan, slot: SlotKey): string[] => {
    return (day[slot] as string[]) || []
  }

  return (
    <View className='meal-plan-page'>
      <View className='meal-plan-header'>
        <View className='meal-plan-header__top'>
          <View>
            <Text className='meal-plan-header__title'>七日餐事</Text>
            <Text className='meal-plan-header__count'>{plannedCount} 道菜已安排</Text>
          </View>
          <View className='meal-plan-header__actions'>
            <View className='meal-plan-header__btn' onClick={handleGenerateShoppingList}>
              <Icon name='shoppingCart' size={40} color='#252220' />
            </View>
            <View className='meal-plan-header__btn' onClick={handleClearPlan}>
              <Icon name='eraser' size={40} color='#252220' />
            </View>
          </View>
        </View>

        <View className='week-nav'>
          <View className='week-nav__btn' onClick={handlePrevWeek}>
            <Icon name='arrowLeft' size={36} color='#252220' />
          </View>
          <Text className='week-nav__label'>
            {weekDates[0].toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })} - {weekDates[6].toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
          </Text>
          <View className='week-nav__btn' onClick={handleNextWeek}>
            <Icon name='chevronRight' size={36} color='#252220' />
          </View>
        </View>
      </View>

      <ScrollView scrollY className='meal-plan-content' enhanced showScrollbar={false}>
        {weekDates.map((date, dayIndex) => {
          const dateStr = date.toISOString().split('T')[0]
          const isToday = dateStr === today
          const day = currentPlan?.days[dayIndex] || {}

          return (
            <View key={dayIndex} className={`day-card ${isToday ? 'day-card--today' : ''}`}>
              <View className='day-card__header'>
                <Text className='day-card__label'>{DAY_LABELS[dayIndex]}</Text>
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
              <Text className='picker-sheet__title'>选择菜谱</Text>
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
              {filteredPickerRecipes.map((recipe) => (
                <View key={recipe.id} className='picker-item' onClick={() => handleSelectRecipe(recipe.id)}>
                  <View className='picker-item__cover'>
                    {recipe.coverImage ? (
                      <View className='picker-item__img' style={{ backgroundImage: `url(${recipe.coverImage})` }} />
                    ) : (
                      <View className='picker-item__placeholder'>
                        <Icon name='chefHat' size={36} color='#a8a08e' />
                      </View>
                    )}
                  </View>
                  <Text className='picker-item__name'>{recipe.name}</Text>
                  <Text className='picker-item__meta'>{recipe.duration}分钟</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  )
}
