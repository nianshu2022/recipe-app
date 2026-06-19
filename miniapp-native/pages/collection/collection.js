const app = getApp()
const { getDifficultyText, getDifficultyColor, getCategoryIcon, showToast } = require('../../utils/util')

Page({
  data: {
    recipes: [],
    loading: true
  },

  onLoad() { this.loadFavorites() },
  onShow() { this.loadFavorites() },

  loadFavorites() {
    const collections = app.globalData.collections || []
    const favIds = new Set(collections.flatMap(c => c.recipeIds || []))
    const allRecipes = app.globalData.recipes || []
    const favorites = allRecipes.filter(r => favIds.has(r.id)).map(r => ({
      ...r,
      difficultyText: getDifficultyText(r.difficulty),
      difficultyColor: getDifficultyColor(r.difficulty),
      categoryIcon: getCategoryIcon(r.category),
      tagsStr: (r.tags || []).slice(0, 2)
    }))
    this.setData({ recipes: favorites, loading: false })
  },

  onRecipeTap(e) {
    wx.navigateTo({ url: `/pages/recipe/recipe?id=${e.currentTarget.dataset.id}` })
  },

  onRemoveFavorite(e) {
    const id = e.currentTarget.dataset.id
    const collections = app.globalData.collections || []
    for (const col of collections) {
      const idx = (col.recipeIds || []).indexOf(id)
      if (idx !== -1) col.recipeIds.splice(idx, 1)
    }
    app.globalData.collections = collections
    app.saveCollections()
    this.loadFavorites()
    showToast('已取消收藏')
  }
})
