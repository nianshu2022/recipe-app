const app = getApp()
const { recipes: builtInRecipes } = require('../../data/recipes')
const { showToast, showConfirm, SLOT_LABELS, DAY_LABELS } = require('../../utils/util')
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
    plan.days.forEach(day => { SLOT_LABELS.forEach((_, i) => { count += (day[['breakfast','lunch','dinner','snack'][i]] || []).length }) })
    this.setData({ currentPlan: plan, weekDates, plannedCount: count })
  },

  getRecipeName(id) {
    const all = [...(app.globalData.recipes || []), ...builtInRecipes]
    return all.find(r => r.id === id)?.name || '未知'
  },

  onSlotTap(e) {
    const { day, slot } = e.currentTarget.dataset
    const all = [...(app.globalData.recipes || []), ...builtInRecipes]
    this.setData({ selecting: { day, slot }, selectedIds: [], pickerRecipes: all, pickerSearch: '' })
  },

  onPickerSearch(e) {
    const key = e.detail.value.toLowerCase()
    const all = [...(app.globalData.recipes || []), ...builtInRecipes]
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
    wx.navigateTo({ url: '/pages/shopping/shopping?fromMealPlan=1' })
  }
})
