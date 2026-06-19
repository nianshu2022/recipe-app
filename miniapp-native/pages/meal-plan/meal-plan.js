const app = getApp()
const { showToast } = require('../../utils/util')

Page({
  data: {
    weekDays: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    mealSlots: ['早餐', '午餐', '晚餐', '加餐'],
    currentPlan: null
  },

  onLoad() {
    this.loadPlan()
  },

  onShow() {
    this.loadPlan()
  },

  loadPlan() {
    const plans = app.globalData.mealPlans || []
    const today = new Date()
    const monday = new Date(today)
    monday.setDate(today.getDate() - today.getDay() + 1)
    const weekStart = monday.toISOString().split('T')[0]
    
    let plan = plans.find(p => p.weekStart === weekStart)
    if (!plan) {
      plan = {
        id: 'plan_' + Date.now(),
        weekStart,
        days: Array(7).fill(null).map(() => ({}))
      }
      plans.push(plan)
      app.globalData.mealPlans = plans
      app.saveMealPlans()
    }
    
    this.setData({ currentPlan: plan })
  },

  onDaySlotTap(e) {
    const { day, slot } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/meal-plan/meal-plan?day=${day}&slot=${slot}`
    })
  }
})
