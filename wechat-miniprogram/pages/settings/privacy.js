const { getNavMetrics } = require('../../utils/nav')

Page({
  data: {
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
})
