const {
  addMealPlanRecipe,
  addRecipesToShoppingList,
  clearMealPlan,
  getMealPlan,
  getRecipes,
  mealSlots,
  removeMealPlanRecipe,
} = require('../../utils/storage')
const { getNavMetrics } = require('../../utils/nav')

const pickerCategories = [
  { key: 'all', label: '全部' },
  { key: 'cold-dish', label: '凉菜', icon: '/assets/lucide/leaf.svg', activeIcon: '/assets/lucide/leaf-white.svg' },
  { key: 'hot-dish', label: '热菜', icon: '/assets/lucide/flame.svg', activeIcon: '/assets/lucide/flame-white.svg' },
  { key: 'soup', label: '汤羹', icon: '/assets/lucide/soup.svg', activeIcon: '/assets/lucide/soup-white.svg' },
  { key: 'staple', label: '主食', icon: '/assets/lucide/wheat.svg', activeIcon: '/assets/lucide/wheat-white.svg' },
  { key: 'dessert', label: '甜品', icon: '/assets/lucide/ice-cream-cone.svg', activeIcon: '/assets/lucide/ice-cream-cone-white.svg' },
  { key: 'drink', label: '饮品', icon: '/assets/lucide/cup-soda.svg', activeIcon: '/assets/lucide/cup-soda-white.svg' },
]

function decoratePlan(plan) {
  return plan.map((day) => ({
    ...day,
    dateText: getDateText(day.dayIndex),
    isToday: isToday(day.dayIndex),
    slots: mealSlots.map((slot) => ({
      key: slot.key,
      label: slot.label,
      recipes: day[slot.key] || [],
      value: (day[slot.key] || []).map((recipe) => recipe.name).join('、') || '点击添加',
      isEmpty: (day[slot.key] || []).length === 0,
    })),
  }))
}

function isToday(dayIndex) {
  const date = new Date()
  const day = date.getDay()
  const currentIndex = day === 0 ? 6 : day - 1
  return currentIndex === dayIndex
}

function getDateText(dayIndex) {
  const date = new Date()
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff + dayIndex)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function countPlanned(plan) {
  return plan.reduce((sum, day) => (
    sum + mealSlots.reduce((slotSum, slot) => slotSum + (day[slot.key] || []).length, 0)
  ), 0)
}

Page({
  data: {
    days: [],
    recipes: [],
    plannedCount: 0,
    pickerCategories,
    showPicker: false,
    selectingDay: 0,
    selectingSlot: '',
    selectingSlotLabel: '',
    selectedIds: {},
    pickerSearch: '',
    pickerCategory: 'all',
    pickerRecipes: [],
    selectedCount: 0,
    statusBarHeight: 24,
    headerTopInset: 32,
    menuButtonReserve: 104,
  },

  onShow() {
    this.setData(getNavMetrics())
    this.loadPlan()
  },

  loadPlan() {
    const plan = getMealPlan()
    this.setData({
      days: decoratePlan(plan),
      recipes: getRecipes(),
      plannedCount: countPlanned(plan),
    })
  },

  chooseRecipe(event) {
    const dayIndex = Number(event.currentTarget.dataset.day)
    const slot = event.currentTarget.dataset.slot
    const recipes = this.data.recipes

    if (recipes.length === 0) {
      wx.showToast({ title: '先记录一道菜谱', icon: 'none' })
      return
    }

    this.setData({
      showPicker: true,
      selectingDay: dayIndex,
      selectingSlot: slot,
      selectingSlotLabel: mealSlots.find((item) => item.key === slot).label,
      selectedIds: {},
      selectedCount: 0,
      pickerSearch: '',
      pickerCategory: 'all',
    }, () => this.updatePickerRecipes())
  },

  closePicker() {
    this.setData({ showPicker: false })
  },

  onPickerSearch(event) {
    this.setData({ pickerSearch: event.detail.value }, () => this.updatePickerRecipes())
  },

  onPickerCategory(event) {
    const key = event.currentTarget.dataset.key
    this.setData({
      pickerCategory: this.data.pickerCategory === key && key !== 'all' ? 'all' : key,
    }, () => this.updatePickerRecipes())
  },

  updatePickerRecipes() {
    const query = this.data.pickerSearch.trim().toLowerCase()
    const category = this.data.pickerCategory
    const day = getMealPlan()[this.data.selectingDay] || {}
    const existingIds = new Set((day[this.data.selectingSlot] || []).map((recipe) => recipe.id))
    const pickerRecipes = this.data.recipes
      .filter((recipe) => {
        if (category !== 'all' && recipe.category !== category) return false
        if (!query) return true
        return recipe.name.toLowerCase().includes(query) ||
          (recipe.tags || []).some((tag) => tag.toLowerCase().includes(query))
      })
      .map((recipe) => ({
        ...recipe,
        initial: recipe.name.slice(0, 1),
        isSelected: Boolean(this.data.selectedIds[recipe.id]),
        alreadyAdded: existingIds.has(recipe.id),
        metaText: `${recipe.difficultyName || ''} · ${recipe.duration}分钟`,
      }))
    const selectedCount = Object.keys(this.data.selectedIds).filter((id) => this.data.selectedIds[id]).length
    this.setData({ pickerRecipes, selectedCount })
  },

  togglePickerRecipe(event) {
    const id = event.currentTarget.dataset.id
    const recipe = this.data.pickerRecipes.find((item) => item.id === id)
    if (!recipe || recipe.alreadyAdded) return
    this.setData({
      [`selectedIds.${id}`]: !this.data.selectedIds[id],
    }, () => this.updatePickerRecipes())
  },

  confirmPicker() {
    const selectedIds = Object.keys(this.data.selectedIds).filter((id) => this.data.selectedIds[id])
    if (selectedIds.length === 0) return
    const recipesById = new Map(this.data.recipes.map((recipe) => [recipe.id, recipe]))
    selectedIds.forEach((id) => {
      const recipe = recipesById.get(id)
      if (recipe) addMealPlanRecipe(this.data.selectingDay, this.data.selectingSlot, recipe)
    })
    this.setData({ showPicker: false })
    this.loadPlan()
  },

  noop() {},

  removeRecipe(event) {
    removeMealPlanRecipe(
      Number(event.currentTarget.dataset.day),
      event.currentTarget.dataset.slot,
      event.currentTarget.dataset.id,
    )
    this.loadPlan()
  },

  generateShopping() {
    const recipesById = new Map(this.data.recipes.map((recipe) => [recipe.id, recipe]))
    const plannedRecipeIds = new Set()
    for (const day of getMealPlan()) {
      for (const slot of mealSlots) {
        for (const item of day[slot.key] || []) {
          if (recipesById.has(item.id)) plannedRecipeIds.add(item.id)
        }
      }
    }
    const plannedRecipes = Array.from(plannedRecipeIds).map((id) => recipesById.get(id)).filter(Boolean)
    if (plannedRecipes.length === 0) {
      wx.showToast({ title: '先安排几道菜', icon: 'none' })
      return
    }
    addRecipesToShoppingList(plannedRecipes)
    wx.navigateTo({ url: '/pages/shopping/shopping' })
  },

  clearPlan() {
    if (this.data.plannedCount === 0) return
    wx.showModal({
      title: '清空计划',
      content: '确定清空这一周的餐计划吗？',
      confirmColor: '#c9583a',
      success: (res) => {
        if (!res.confirm) return
        clearMealPlan()
        this.loadPlan()
      },
    })
  },
})
