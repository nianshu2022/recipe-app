const { fullSync, getCurrentUser, isLoggedIn, logout } = require('../../utils/auth')
const { getNavMetrics } = require('../../utils/nav')
const { getTheme, getThemeState, setTheme: saveTheme } = require('../../utils/theme')

Page({
  data: {
    userName: '未登录',
    userDesc: '登录后可同步数据到云端',
    loggedIn: false,
    theme: 'system',
    syncing: false,
    statusBarHeight: 24,
    contentTopInset: 42,
    themeClass: 'theme-light',
    showSettings: false,
  },

  onShow() {
    const user = getCurrentUser()
    this.setData({
      ...getNavMetrics(),
      loggedIn: isLoggedIn(),
      userName: user ? (user.nickname || '美食家') : '未登录',
      userDesc: user ? user.email : '登录后可同步数据到云端',
      theme: getTheme(),
      statusBarHeight: wx.getSystemInfoSync().statusBarHeight,
    })
  },

  openProfile() {
    if (!isLoggedIn()) {
      wx.navigateTo({ url: '/pages/settings/login' })
    }
  },

  openCollection() {
    wx.reLaunch({ url: '/pages/collection/collection' })
  },

  openMenu() {
    wx.navigateTo({ url: '/pages/menu/menu' })
  },

  openShopping() {
    wx.navigateTo({ url: '/pages/shopping/shopping' })
  },

  openSettings() {
    this.setData({ showSettings: true })
  },

  closeSettings() {
    this.setData({ showSettings: false })
  },

  openLogin() {
    wx.navigateTo({ url: '/pages/settings/login' })
  },

  openData() {
    wx.navigateTo({ url: '/pages/settings/data' })
  },

  async syncNow() {
    if (!this.data.loggedIn || this.data.syncing) return
    this.setData({ syncing: true })
    try {
      await fullSync()
      wx.showToast({ title: '同步完成', icon: 'success' })
    } catch (error) {
      wx.showToast({ title: '同步失败，请稍后重试', icon: 'none' })
    } finally {
      this.setData({ syncing: false })
    }
  },

  checkUpdate() {
    if (!wx.getUpdateManager) {
      wx.showToast({ title: '当前微信版本不支持', icon: 'none' })
      return
    }
    const updateManager = wx.getUpdateManager()
    updateManager.onCheckForUpdate((res) => {
      if (!res.hasUpdate) {
        wx.showToast({ title: '已是最新版本', icon: 'success' })
      }
    })
    updateManager.onUpdateReady(() => {
      wx.showModal({
        title: '发现新版本',
        content: '新版本已准备好，是否重启应用？',
        confirmText: '重启',
        confirmColor: '#c9583a',
        success: (res) => {
          if (res.confirm) updateManager.applyUpdate()
        },
      })
    })
    updateManager.onUpdateFailed(() => {
      wx.showToast({ title: '更新下载失败', icon: 'none' })
    })
  },

  setTheme(event) {
    const theme = event.currentTarget.dataset.theme
    saveTheme(theme)
    this.setData({ theme, ...getThemeState(theme) })
    wx.showToast({
      title: theme === 'system' ? '已跟随系统' : theme === 'dark' ? '已选择深色' : '已选择浅色',
      icon: 'none',
    })
  },

  openPrivacy() {
    wx.navigateTo({ url: '/pages/settings/privacy' })
  },

  logout() {
    wx.showModal({
      title: '退出登录',
      content: '确定退出当前账号吗？',
      confirmColor: '#c44b4b',
      success: (res) => {
        if (!res.confirm) return
        logout().then(() => this.onShow())
      },
    })
  },
})
