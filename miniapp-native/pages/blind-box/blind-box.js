const app = getApp()
const { getDifficultyText, getDifficultyColor, getCategoryText, getCategoryIcon, showToast } = require('../../utils/util')

Page({
  data: {
    phase: 'idle',
    result: null,
    hasRecipes: false
  },

  onLoad() {
    this.setData({ hasRecipes: (app.globalData.recipes || []).length > 0 })
  },

  onShow() {
    this.setData({ hasRecipes: (app.globalData.recipes || []).length > 0 })
  },

  onDraw() {
    const recipes = app.globalData.recipes || []
    if (recipes.length === 0) return
    this.setData({ phase: 'shaking', result: null })
    setTimeout(() => {
      const picked = recipes[Math.floor(Math.random() * recipes.length)]
      this.setData({ phase: 'revealed', result: this.mapRecipe(picked) })
    }, 850)
  },

  mapRecipe(r) {
    return {
      ...r,
      difficultyText: getDifficultyText(r.difficulty),
      difficultyColor: getDifficultyColor(r.difficulty),
      categoryText: getCategoryText(r.category),
      categoryIcon: getCategoryIcon(r.category),
      tagsStr: (r.tags || []).slice(0, 3)
    }
  },

  onRedraw() {
    this.onDraw()
  },

  onViewDetail() {
    wx.navigateTo({ url: `/pages/recipe/recipe?id=${this.data.result.id}` })
  },

  onCreateRecipe() {
    wx.navigateTo({ url: '/pages/recipe-form/recipe-form' })
  }
})
