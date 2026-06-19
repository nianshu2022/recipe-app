const app = getApp()
const { recipes } = require('../../data/recipes')

Page({
  data: {
    recipe: null,
    currentStep: 0,
    isTimerRunning: false,
    timerSeconds: 0,
    timerText: '00:00'
  },

  timerInterval: null,

  onLoad(options) {
    if (options.id) {
      this.loadRecipe(options.id)
    }
  },

  onUnload() {
    this.stopTimer()
  },

  loadRecipe(id) {
    const allRecipes = app.globalData.recipes.length > 0 ? app.globalData.recipes : recipes
    const recipe = allRecipes.find(r => r.id === id)
    if (recipe) {
      this.setData({ recipe })
      wx.setNavigationBarTitle({ title: recipe.name })
    }
  },

  onPrevStep() {
    if (this.data.currentStep > 0) {
      this.setData({ currentStep: this.data.currentStep - 1 })
      this.stopTimer()
    }
  },

  onNextStep() {
    const { recipe, currentStep } = this.data
    if (currentStep < recipe.steps.length - 1) {
      this.setData({ currentStep: currentStep + 1 })
      this.stopTimer()
    }
  },

  onStartTimer() {
    if (this.data.isTimerRunning) {
      this.stopTimer()
    } else {
      this.setData({ isTimerRunning: true })
      this.timerInterval = setInterval(() => {
        let seconds = this.data.timerSeconds + 1
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        this.setData({
          timerSeconds: seconds,
          timerText: `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
        })
      }, 1000)
    }
  },

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }
    this.setData({ isTimerRunning: false })
  },

  onResetTimer() {
    this.stopTimer()
    this.setData({ timerSeconds: 0, timerText: '00:00' })
  },

  onFinish() {
    wx.showModal({
      title: '完成',
      content: '恭喜完成做菜！',
      showCancel: false,
      success() {
        wx.navigateBack()
      }
    })
  }
})
