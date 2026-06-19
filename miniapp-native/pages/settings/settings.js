const app = getApp()
const { showToast, showConfirm } = require('../../utils/util')

Page({
  data: {
    userInfo: null,
    version: '1.0.0'
  },

  onLoad() { this.setData({ userInfo: app.globalData.userInfo }) },
  onShow() { this.setData({ userInfo: app.globalData.userInfo }) },

  onLogin() { wx.navigateTo({ url: '/pages/login/login' }) },

  onLogout() {
    showConfirm('确定退出登录吗？').then(ok => {
      if (!ok) return
      app.globalData.userInfo = null
      app.saveUserInfo()
      this.setData({ userInfo: null })
      showToast('已退出登录')
    })
  },

  onCollectionTap() { wx.navigateTo({ url: '/pages/collection/collection' }) },
  onShoppingTap() { wx.navigateTo({ url: '/pages/shopping/shopping' }) },
  onDataManageTap() { wx.navigateTo({ url: '/pages/data-manage/data-manage' }) },
  onPrivacyTap() { wx.navigateTo({ url: '/pages/privacy/privacy' }) },

  onAbout() {
    wx.showModal({ title: '关于知味', content: '知味 v1.0.0\n你的私人美食管家', showCancel: false })
  }
})
