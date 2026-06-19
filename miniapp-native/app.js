App({
  globalData: {
    userInfo: null,
    recipes: [],
    collections: [],
    mealPlans: [],
    shoppingLists: []
  },

  onLaunch() {
    // 从本地存储加载数据
    this.loadLocalData()
  },

  loadLocalData() {
    try {
      const recipes = wx.getStorageSync('recipes') || []
      const collections = wx.getStorageSync('collections') || []
      const mealPlans = wx.getStorageSync('mealPlans') || []
      const shoppingLists = wx.getStorageSync('shoppingLists') || []
      const userInfo = wx.getStorageSync('userInfo') || null

      this.globalData.recipes = recipes
      this.globalData.collections = collections
      this.globalData.mealPlans = mealPlans
      this.globalData.shoppingLists = shoppingLists
      this.globalData.userInfo = userInfo
    } catch (e) {
      console.error('加载本地数据失败', e)
    }
  },

  saveRecipes() {
    wx.setStorageSync('recipes', this.globalData.recipes)
  },

  saveCollections() {
    wx.setStorageSync('collections', this.globalData.collections)
  },

  saveMealPlans() {
    wx.setStorageSync('mealPlans', this.globalData.mealPlans)
  },

  saveShoppingLists() {
    wx.setStorageSync('shoppingLists', this.globalData.shoppingLists)
  },

  saveUserInfo() {
    wx.setStorageSync('userInfo', this.globalData.userInfo)
  }
})
