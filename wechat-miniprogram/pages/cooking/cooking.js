const { addCookingRecord, getRecipe } = require('../../utils/storage')
const { getNavMetrics } = require('../../utils/nav')

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}

Page({
  data: {
    recipe: null,
    currentStep: 0,
    step: null,
    progress: 0,
    stepPosition: '',
    isFirstStep: true,
    nextLabel: '下一步',
    completed: false,
    timerSeconds: 0,
    timerTotal: 0,
    timerPercent: 0,
    timerText: '00:00',
    timerRunning: false,
    timerButtonLabel: '开始',
    alarmActive: false,
    statusBarHeight: 24,
    navBarHeight: 88,
    menuButtonReserve: 104,
    themeClass: 'theme-light',
  },

  timerId: null,
  alarmId: null,

  onLoad(options) {
    this.setNavMetrics()
    wx.setKeepScreenOn({ keepScreenOn: true })
    const recipe = getRecipe(options.id)
    if (!recipe || !recipe.steps || recipe.steps.length === 0) {
      wx.showToast({ title: '菜谱没有步骤', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 600)
      return
    }
    this.setData({ recipe }, () => this.setStep(0))
  },

  setNavMetrics() {
    this.setData(getNavMetrics())
  },

  onUnload() {
    this.stopTimer()
    this.stopAlarm()
    wx.setKeepScreenOn({ keepScreenOn: false })
  },

  setStep(index) {
    const steps = this.data.recipe.steps
    const step = steps[index]
    this.stopTimer()
    this.stopAlarm()
    const seconds = step.timer ? step.timer * 60 : 0
    this.setData({
      currentStep: index,
      step,
      progress: Math.round(((index + 1) / steps.length) * 100),
      stepPosition: `第 ${index + 1} / ${steps.length} 步`,
      isFirstStep: index === 0,
      nextLabel: index === steps.length - 1 ? '完成' : '下一步',
      timerSeconds: seconds,
      timerTotal: seconds,
      timerPercent: seconds > 0 ? 100 : 0,
      timerText: formatTime(seconds),
      timerRunning: false,
      timerButtonLabel: '开始',
      alarmActive: false,
    })
  },

  previousStep() {
    if (this.data.currentStep === 0) return
    this.setStep(this.data.currentStep - 1)
  },

  nextStep() {
    if (this.data.currentStep >= this.data.recipe.steps.length - 1) {
      this.finishCooking()
      return
    }
    this.setStep(this.data.currentStep + 1)
  },

  finishCooking() {
    this.stopTimer()
    this.stopAlarm()
    addCookingRecord(this.data.recipe)
    this.setData({ completed: true })
  },

  toggleTimer() {
    if (this.data.timerSeconds <= 0) return
    if (this.data.timerRunning) {
      this.stopTimer(false)
      return
    }
    this.setData({ timerRunning: true, timerButtonLabel: '暂停' })
    this.timerId = setInterval(() => {
      const next = this.data.timerSeconds - 1
      if (next <= 0) {
        this.stopTimer(false)
        this.setData({ timerSeconds: 0, timerText: '00:00' })
        this.startAlarm()
        wx.showToast({ title: '时间到', icon: 'none' })
        return
      }
      this.setData({
        timerSeconds: next,
        timerPercent: this.data.timerTotal > 0 ? Math.round((next / this.data.timerTotal) * 100) : 0,
        timerText: formatTime(next),
      })
    }, 1000)
  },

  resetTimer() {
    if (!this.data.step || !this.data.step.timer) return
    this.stopTimer(false)
    this.stopAlarm()
    const seconds = this.data.step.timer * 60
    this.setData({
      timerSeconds: seconds,
      timerTotal: seconds,
      timerPercent: seconds > 0 ? 100 : 0,
      timerText: formatTime(seconds),
    })
  },

  stopTimer(reset = true) {
    if (this.timerId) {
      clearInterval(this.timerId)
      this.timerId = null
    }
    if (reset) {
      this.setData({ timerRunning: false, timerButtonLabel: '开始' })
    } else {
      this.setData({ timerRunning: false, timerButtonLabel: '开始' })
    }
  },

  startAlarm() {
    this.stopAlarm()
    this.setData({ alarmActive: true })
    wx.vibrateLong()
    this.alarmId = setInterval(() => {
      wx.vibrateShort({ type: 'heavy' })
    }, 1200)
  },

  stopAlarm() {
    if (this.alarmId) {
      clearInterval(this.alarmId)
      this.alarmId = null
    }
    if (this.data.alarmActive) {
      this.setData({ alarmActive: false })
    }
  },

  backToRecipe() {
    if (this.data.recipe && this.data.recipe.id) {
      wx.redirectTo({ url: `/pages/recipe/detail?id=${this.data.recipe.id}` })
      return
    }
    wx.navigateBack()
  },
})
