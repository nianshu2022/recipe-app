const app = getApp()
const { showToast } = require('../../utils/util')

Page({
  data: {
    recipe: null,
    currentStep: 0,
    totalSteps: 0,
    timerRunning: false,
    timerSeconds: 0,
    timerText: '00:00'
  },

  timer: null,

  onLoad(options) {
    if (options.id) {
      const allRecipes = app.globalData.recipes || []
      const recipe = allRecipes.find(r => r.id === options.id)
      if (recipe) {
        this.setData({ recipe, totalSteps: recipe.steps.length })
        wx.setNavigationBarTitle({ title: recipe.name })
      }
    }
  },

  onUnload() { this.stopTimer() },

  onPrevStep() {
    if (this.data.currentStep > 0) {
      this.stopTimer()
      this.setData({ currentStep: this.data.currentStep - 1 })
    }
  },

  onNextStep() {
    if (this.data.currentStep < this.data.totalSteps - 1) {
      this.stopTimer()
      this.setData({ currentStep: this.data.currentStep + 1 })
    }
  },

  onToggleTimer() {
    if (this.data.timerRunning) {
      this.stopTimer()
    } else {
      this.setData({ timerRunning: true })
      this.timer = setInterval(() => {
        const s = this.data.timerSeconds + 1
        const m = Math.floor(s / 60)
        const sec = s % 60
        this.setData({ timerSeconds: s, timerText: `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` })
      }, 1000)
    }
  },

  onResetTimer() {
    this.stopTimer()
    this.setData({ timerSeconds: 0, timerText: '00:00' })
  },

  stopTimer() {
    if (this.timer) { clearInterval(this.timer); this.timer = null }
    this.setData({ timerRunning: false })
  },

  onFinish() {
    wx.showModal({
      title: '完成',
      content: '恭喜完成做菜！',
      showCancel: false,
      success: () => wx.navigateBack()
    })
  }
})
