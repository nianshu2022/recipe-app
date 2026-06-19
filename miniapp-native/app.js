const { loadRecipes, loadCollections, loadMealPlans, loadShoppingLists } = require('./utils/db')

App({
  globalData: {
    userInfo: null,
    recipes: [],
    collections: [],
    mealPlans: [],
    shoppingLists: []
  },

  onLaunch() {
    this.globalData.recipes = loadRecipes()
    this.globalData.collections = loadCollections()
    this.globalData.mealPlans = loadMealPlans()
    this.globalData.shoppingLists = loadShoppingLists()
    this.globalData.userInfo = wx.getStorageSync('userInfo') || null
  },

  saveRecipes() { wx.setStorageSync('recipes', this.globalData.recipes) },
  saveCollections() { wx.setStorageSync('collections', this.globalData.collections) },
  saveMealPlans() { wx.setStorageSync('mealPlans', this.globalData.mealPlans) },
  saveShoppingLists() { wx.setStorageSync('shoppingLists', this.globalData.shoppingLists) },
  saveUserInfo() { wx.setStorageSync('userInfo', this.globalData.userInfo) }
})
