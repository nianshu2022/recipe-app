const app = getApp()
const { showToast, showConfirm } = require('../../utils/util')

Page({
  data: {
    recipesCount: 0,
    collectionsCount: 0,
    mealPlansCount: 0,
    shoppingListsCount: 0
  },

  onLoad() { this.updateCounts() },
  onShow() { this.updateCounts() },

  updateCounts() {
    this.setData({
      recipesCount: (app.globalData.recipes || []).length,
      collectionsCount: (app.globalData.collections || []).length,
      mealPlansCount: (app.globalData.mealPlans || []).length,
      shoppingListsCount: (app.globalData.shoppingLists || []).length
    })
  },

  onExport() {
    const data = {
      recipes: app.globalData.recipes,
      collections: app.globalData.collections,
      mealPlans: app.globalData.mealPlans,
      shoppingLists: app.globalData.shoppingLists,
      exportTime: new Date().toISOString()
    }
    wx.setClipboardData({
      data: JSON.stringify(data, null, 2),
      success() { showToast('数据已复制到剪贴板') }
    })
  },

  async onImport() {
    const confirmed = await showConfirm('导入将覆盖现有数据，确定继续吗？')
    if (!confirmed) return
    wx.getClipboardData({
      success: (res) => {
        try {
          const data = JSON.parse(res.data)
          if (data.recipes) { app.globalData.recipes = data.recipes; app.saveRecipes() }
          if (data.collections) { app.globalData.collections = data.collections; app.saveCollections() }
          if (data.mealPlans) { app.globalData.mealPlans = data.mealPlans; app.saveMealPlans() }
          if (data.shoppingLists) { app.globalData.shoppingLists = data.shoppingLists; app.saveShoppingLists() }
          this.updateCounts()
          showToast('导入成功')
        } catch (e) {
          showToast('导入失败，数据格式错误')
        }
      }
    })
  },

  async onClearAll() {
    const confirmed = await showConfirm('确定清除所有数据吗？此操作不可恢复。')
    if (!confirmed) return
    app.globalData.recipes = []
    app.globalData.collections = []
    app.globalData.mealPlans = []
    app.globalData.shoppingLists = []
    app.saveRecipes()
    app.saveCollections()
    app.saveMealPlans()
    app.saveShoppingLists()
    this.updateCounts()
    showToast('数据已清除')
  }
})
