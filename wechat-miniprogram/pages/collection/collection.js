const { getFavoriteRecipes, toggleFavoriteRecipe } = require('../../utils/storage')
const { formatDuration } = require('../../utils/format')
const { getNavMetrics } = require('../../utils/nav')

const categoryIconMap = {
  'hot-dish': '/assets/lucide/flame.svg',
  'cold-dish': '/assets/lucide/leaf.svg',
  soup: '/assets/lucide/soup.svg',
  staple: '/assets/lucide/wheat.svg',
  dessert: '/assets/lucide/ice-cream-cone.svg',
  drink: '/assets/lucide/cup-soda.svg',
}

function formatRecipes(recipes) {
  return recipes.map((recipe) => ({
    ...recipe,
    durationText: formatDuration(recipe.duration),
    displayTags: recipe.tags.slice(0, 2),
    categoryIcon: categoryIconMap[recipe.category] || categoryIconMap['hot-dish'],
  }))
}

Page({
  data: {
    recipes: [],
    statusBarHeight: 24,
    contentTopInset: 42,
  },

  onShow() {
    this.setData(getNavMetrics())
    this.loadFavorites()
  },

  loadFavorites() {
    this.setData({ recipes: formatRecipes(getFavoriteRecipes()) })
  },

  back() {
    wx.navigateBack({
      fail: () => wx.reLaunch({ url: '/pages/settings/settings' }),
    })
  },

  openRecipe(event) {
    wx.navigateTo({
      url: `/pages/recipe/detail?id=${event.currentTarget.dataset.id}`,
    })
  },

  removeFavorite(event) {
    toggleFavoriteRecipe(event.currentTarget.dataset.id)
    wx.showToast({ title: '已取消收藏', icon: 'none' })
    this.loadFavorites()
  },

  goHome() {
    wx.reLaunch({ url: '/pages/home/home' })
  },
})
