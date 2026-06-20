const app = getApp()
const { showToast, showConfirm, SLOT_LABELS, DAY_LABELS, guessCategory } = require('../../utils/util')
const { getMonday } = require('../../utils/db')

Page({
  data: {
    weekDates: [],
    dayLabels: DAY_LABELS,
    slotLabels: SLOT_LABELS,
    currentPlan: null,
    plannedCount: 0,
    selecting: null,
    selectedIds: [],
    pickerRecipes: [],
    pickerSearch: ''
  },

  onLoad() { this.loadPlan() },
  onShow() { this.loadPlan() },

  loadPlan() {
    const plans = app.globalData.mealPlans || []
    const monday = getMonday(new Date())
    const weekStart = monday.toISOString().split('T')[0]
    let plan = plans.find(p => p.weekStart === weekStart)
    if (!plan) {
      plan = { id: 'plan_' + Date.now(), userId: 'local', weekStart, days: Array(7).fill(null).map(() => ({})), syncStatus: 'pending', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      plans.push(plan)
      app.globalData.mealPlans = plans
      app.saveMealPlans()
    }
    const weekDates = Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(d.getDate() + i); return d })
    let count = 0
    const allRecipes = app.globalData.recipes || []

    // Map recipe IDs to names for display
    const daysWithNames = plan.days.map(day => {
      const dayWithNames = {}
      for (const slotKey of ['breakfast', 'lunch', 'dinner', 'snack']) {
        const ids = day[slotKey] || []
        dayWithNames[slotKey] = ids.map(id => {
          const recipe = allRecipes.find(r => r.id === id)
          count++
          return { id, name: recipe ? recipe.name : '未知菜谱' }
        })
      }
      return dayWithNames
    })

    this.setData({ currentPlan: plan, weekDates, plannedCount: count, daysWithNames })
  },

  getRecipeName(id) {
    const all = [...(app.globalData.recipes || []), ...builtInRecipes]
    return all.find(r => r.id === id)?.name || '未知'
  },

  onSlotTap(e) {
    const { day, slot } = e.currentTarget.dataset
    const all = app.globalData.recipes || []
    this.setData({ selecting: { day, slot }, selectedIds: [], pickerRecipes: all, pickerSearch: '' })
  },

  onPickerSearch(e) {
    const key = e.detail.value.toLowerCase()
    const all = app.globalData.recipes || []
    this.setData({
      pickerSearch: e.detail.value,
      pickerRecipes: key ? all.filter(r => r.name.toLowerCase().includes(key)) : all
    })
  },

  onToggleRecipe(e) {
    const id = e.currentTarget.dataset.id
    let ids = [...this.data.selectedIds]
    const idx = ids.indexOf(id)
    if (idx === -1) ids.push(id)
    else ids.splice(idx, 1)
    this.setData({ selectedIds: ids })
  },

  onConfirmSelect() {
    const { selecting, selectedIds, currentPlan } = this.data
    if (!selecting || selectedIds.length === 0) return
    const { day, slot } = selecting
    const slotKey = ['breakfast', 'lunch', 'dinner', 'snack'][slot]
    const days = [...currentPlan.days]
    const existing = days[day][slotKey] || []
    days[day] = { ...days[day], [slotKey]: [...existing, ...selectedIds.filter(id => !existing.includes(id))] }
    const updated = { ...currentPlan, days, updatedAt: new Date().toISOString() }
    const plans = app.globalData.mealPlans
    const idx = plans.findIndex(p => p.id === updated.id)
    if (idx !== -1) plans[idx] = updated
    app.globalData.mealPlans = plans
    app.saveMealPlans()
    this.setData({ selecting: null })
    this.loadPlan()
    showToast('已添加')
  },

  onClosePicker() { this.setData({ selecting: null }) },

  onRemoveMeal(e) {
    const { day, slot, recipe } = e.currentTarget.dataset
    const slotKey = ['breakfast', 'lunch', 'dinner', 'snack'][slot]
    const { currentPlan } = this.data
    const days = [...currentPlan.days]
    days[day] = { ...days[day], [slotKey]: (days[day][slotKey] || []).filter(id => id !== recipe) }
    const updated = { ...currentPlan, days, updatedAt: new Date().toISOString() }
    const plans = app.globalData.mealPlans
    const idx = plans.findIndex(p => p.id === updated.id)
    if (idx !== -1) plans[idx] = updated
    app.globalData.mealPlans = plans
    app.saveMealPlans()
    this.loadPlan()
  },

  async onClearPlan() {
    const confirmed = await showConfirm('确定清空本周餐食计划吗？')
    if (!confirmed) return
    const { currentPlan } = this.data
    const updated = { ...currentPlan, days: Array(7).fill(null).map(() => ({})), updatedAt: new Date().toISOString() }
    const plans = app.globalData.mealPlans
    const idx = plans.findIndex(p => p.id === updated.id)
    if (idx !== -1) plans[idx] = updated
    app.globalData.mealPlans = plans
    app.saveMealPlans()
    this.loadPlan()
    showToast('已清空')
  },

  onGenerateShopping() {
    const { currentPlan } = this.data
    if (!currentPlan) return
    const recipeIds = currentPlan.days.flatMap(day => ['breakfast', 'lunch', 'dinner', 'snack'].flatMap(s => day[s] || []))
    if (recipeIds.length === 0) { showToast('还没有安排餐食'); return }

    const allRecipes = app.globalData.recipes || []
    const matchedRecipes = allRecipes.filter(r => recipeIds.includes(r.id))
    if (matchedRecipes.length === 0) { showToast('未找到菜谱'); return }

    // Merge ingredients
    const merged = new Map()
    for (const recipe of matchedRecipes) {
      for (const ing of recipe.ingredients) {
        const key = `${ing.name}_${ing.unit}`
        const existing = merged.get(key)
        if (existing) {
          existing.amount += ing.amount
        } else {
          merged.set(key, { name: ing.name, amount: ing.amount, unit: ing.unit, category: guessCategory(ing.name) })
        }
      }
    }

    const items = Array.from(merged.values()).map(m => ({
      id: 'item_' + Date.now() + Math.random().toString(36).substr(2, 4),
      name: m.name,
      amount: Math.round(m.amount * 100) / 100,
      unit: m.unit,
      category: m.category,
      checked: false
    }))

    const list = {
      id: 'list_' + Date.now(),
      userId: 'local',
      sourceRecipeIds: recipeIds,
      items,
      syncStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const lists = app.globalData.shoppingLists || []
    lists.unshift(list)
    app.globalData.shoppingLists = lists
    app.saveShoppingLists()
    showToast('已生成购物清单')
    wx.navigateTo({ url: '/pages/shopping/shopping' })
  }
})
