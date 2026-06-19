const app = getApp()
const { showToast } = require('../../utils/util')

Page({
  data: {
    collections: []
  },

  onLoad() {
    this.loadCollections()
  },

  onShow() {
    this.loadCollections()
  },

  loadCollections() {
    this.setData({
      collections: app.globalData.collections || []
    })
  },

  onCollectionTap(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/recipe/recipe?id=${id}`
    })
  },

  async onRemove(e) {
    const { index } = e.currentTarget.dataset
    const collections = [...this.data.collections]
    collections.splice(index, 1)
    app.globalData.collections = collections
    app.saveCollections()
    this.setData({ collections })
    showToast('已取消收藏')
  }
})
