const app = getApp()
const { recipes } = require('../../data/recipes')
const { showToast } = require('../../utils/util')

Page({
  data: {
    currentRecipe: null,
    isAnimating: false
  },

  onLoad() {
    this.getRandomRecipe()
  },

  getRandomRecipe() {
    const allRecipes = app.globalData.recipes.length > 0 ? app.globalData.recipes : recipes
    const randomIndex = Math.floor(Math.random() * allRecipes.length)
    this.setData({ currentRecipe: allRecipes[randomIndex] })
  },

  onShake() {
    if (this.data.isAnimating) return
    
    this.setData({ isAnimating: true })
    
    setTimeout(() => {
      this.getRandomRecipe()
      this.setData({ isAnimating: false })
    }, 800)
  },

  onCook() {
    if (!this.data.currentRecipe) return
    wx.navigateTo({
      url: `/pages/cooking/cooking?id=${this.data.currentRecipe.id}`
    })
  },

  onSkip() {
    this.onShake()
  }
})
