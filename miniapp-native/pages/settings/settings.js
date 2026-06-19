const app = getApp()
const { showToast, showConfirm } = require('../../utils/util')

Page({
  data: {
    userInfo: null,
    version: '1.0.0'
  },

  onLoad() {
    this.setData({
      userInfo: app.globalData.userInfo
    })
  },

  onLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    })
  },

  onLogout() {
    showConfirm('确定退出登录吗？').then(confirmed => {
      if (confirmed) {
        app.globalData.userInfo = null
        app.saveUserInfo()
        this.setData({ userInfo: null })
        showToast('已退出登录')
      }
    })
  },

  onClearData() {
    showConfirm('确定清除所有本地数据吗？此操作不可恢复。').then(confirmed => {
      if (confirmed) {
        wx.clearStorageSync()
        app.globalData = {
          userInfo: null,
          recipes: [],
          collections: [],
          mealPlans: [],
          shoppingLists: []
        }
        showToast('数据已清除')
      }
    })
  },

  onDataManage() {
    wx.navigateTo({
      url: '/pages/data-manage/data-manage'
    })
  },

  onAbout() {
    wx.showModal({
      title: '关于知味',
      content: '知味 v1.0.0\n你的私人美食管家',
      showCancel: false
    })
  }
})
