const { getRecipes } = require('../../utils/storage')
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

Page({
  data: {
    recipes: [],
    phase: 'idle',
    result: null,
    statusBarHeight: 24,
    contentTopInset: 42,
  },

  onShow() {
    this.setData(getNavMetrics())
    this.setData({ recipes: getRecipes() })
  },

  drawRecipe() {
    const recipes = this.data.recipes
    if (recipes.length === 0) {
      wx.showToast({ title: '先记录几道菜谱', icon: 'none' })
      return
    }

    this.setData({ phase: 'shaking', result: null })
    setTimeout(() => {
      const picked = recipes[Math.floor(Math.random() * recipes.length)]
      this.setData({
        phase: 'revealed',
        result: {
          ...picked,
          durationText: formatDuration(picked.duration),
          categoryIcon: categoryIconMap[picked.category] || categoryIconMap['hot-dish'],
          tags: picked.tags.slice(0, 3),
        },
      })
    }, 850)
  },

  openRecipe() {
    if (!this.data.result) return
    wx.navigateTo({
      url: `/pages/recipe/detail?id=${this.data.result.id}`,
    })
  },

  createRecipe() {
    wx.navigateTo({ url: '/pages/recipe/form' })
  },
})
