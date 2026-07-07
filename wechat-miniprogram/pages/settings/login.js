const { fullSync, login, register } = require('../../utils/auth')
const { getNavMetrics } = require('../../utils/nav')

Page({
  data: {
    isRegister: false,
    email: '',
    password: '',
    nickname: '',
    error: '',
    loading: false,
    statusBarHeight: 24,
    navBarHeight: 88,
    menuButtonReserve: 104,
  },

  onLoad() {
    this.setData(getNavMetrics())
  },

  backToSettings() {
    wx.navigateBack({
      fail: () => wx.reLaunch({ url: '/pages/settings/settings' }),
    })
  },

  onFieldInput(event) {
    this.setData({
      [event.currentTarget.dataset.field]: event.detail.value,
      error: '',
    })
  },

  toggleMode() {
    this.setData({
      isRegister: !this.data.isRegister,
      error: '',
    })
  },

  async submit() {
    if (this.data.loading) return
    const email = this.data.email.trim()
    const password = this.data.password.trim()
    const nickname = this.data.nickname.trim()

    if (!email || !password) {
      this.setData({ error: '请填写邮箱和密码' })
      return
    }

    this.setData({ loading: true })
    let ok = false
    try {
      ok = this.data.isRegister
        ? await register(email, password, nickname)
        : await login(email, password)
    } catch (error) {
      ok = false
    }

    if (!ok) {
      this.setData({ loading: false, error: this.data.isRegister ? '注册失败，邮箱可能已被使用' : '邮箱或密码错误' })
      return
    }

    try {
      await fullSync()
    } catch (error) {
      // 登录成功优先，失败后用户仍可在设置页手动同步。
    }

    wx.showToast({ title: this.data.isRegister ? '注册成功' : '登录成功', icon: 'success' })
    setTimeout(() => {
      wx.reLaunch({ url: '/pages/settings/settings' })
    }, 350)
  },
})
