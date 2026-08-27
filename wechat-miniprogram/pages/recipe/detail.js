const {
  addRecipeToShoppingList,
  deleteRecipe,
  getRecipe,
  isRecipeFavorited,
  toggleFavoriteRecipe,
  getCollections,
  addRecipeToCollection,
  getCollectionsContainingRecipe,
} = require('../../utils/storage')
const { formatDuration, formatDifficulty } = require('../../utils/format')
const { getNavMetrics } = require('../../utils/nav')
const { scaleIngredients } = require('../../utils/scaling')
const { estimateNutrition, getCalorieLabel } = require('../../utils/nutrition')

const categoryIconMap = {
  'hot-dish': '/assets/lucide/flame.svg',
  'cold-dish': '/assets/lucide/leaf.svg',
  soup: '/assets/lucide/soup.svg',
  staple: '/assets/lucide/wheat.svg',
  dessert: '/assets/lucide/ice-cream-cone.svg',
  drink: '/assets/lucide/cup-soda.svg',
}

function buildViewRecipe(recipe, servings) {
  const nutrition = recipe.nutrition || estimateNutrition(recipe.ingredients || [])
  const perServing = {
    calories: Math.round(nutrition.calories / recipe.servings),
    protein: Math.round((nutrition.protein / recipe.servings) * 10) / 10,
    carbs: Math.round((nutrition.carbs / recipe.servings) * 10) / 10,
    fat: Math.round((nutrition.fat / recipe.servings) * 10) / 10,
    fiber: Math.round((nutrition.fiber / recipe.servings) * 10) / 10,
  }
  const proteinCalories = perServing.protein * 4
  const carbsCalories = perServing.carbs * 4
  const fatCalories = perServing.fat * 9
  const macroTotal = proteinCalories + carbsCalories + fatCalories
  const proteinPercent = macroTotal === 0 ? 0 : Math.round((proteinCalories / macroTotal) * 100)
  const carbsPercent = macroTotal === 0 ? 0 : Math.round((carbsCalories / macroTotal) * 100)
  return {
    ...recipe,
    durationText: formatDuration(recipe.duration),
    difficultyText: formatDifficulty(recipe.difficulty),
    categoryIcon: categoryIconMap[recipe.category] || categoryIconMap['hot-dish'],
    scaledIngredients: scaleIngredients(recipe.ingredients || [], recipe.servings, servings),
    servingsNow: servings,
    nutrition: {
      ...perServing,
      label: getCalorieLabel(perServing.calories),
      levelClass: perServing.calories < 300 ? 'low' : perServing.calories <= 600 ? 'medium' : 'high',
      proteinPercent,
      carbsPercent,
      fatPercent: Math.max(0, 100 - proteinPercent - carbsPercent),
    },
  }
}

Page({
  data: {
    recipe: null,
    id: '',
    isFavorited: false,
    servings: 2,
    statusBarHeight: 24,
    navBarHeight: 88,
    menuButtonReserve: 104,
    themeClass: 'theme-light',
    showCollectionPicker: false,
    collections: [],
    collectionStatus: {},
  },

  onLoad(options) {
    wx.showShareMenu({ withShareTicket: true })
    this.setNavMetrics()
    this.setData({ id: options.id || '' })
    this.loadRecipe(options.id)
  },

  onShow() {
    if (this.data.id) {
      this.loadRecipe(this.data.id)
    }
  },

  onShareAppMessage() {
    const recipe = this.data.recipe
    return {
      title: recipe ? `知味菜谱：${recipe.name}` : '知味菜谱',
      path: recipe ? `/pages/recipe/detail?id=${recipe.id}` : '/pages/home/home',
    }
  },

  loadRecipe(id) {
    const recipe = getRecipe(id)
    if (!recipe) {
      wx.showToast({ title: '菜谱不存在', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 600)
      return
    }

    const servings = this.data.servings || recipe.servings
    this.setData({
      recipe: buildViewRecipe(recipe, servings),
      servings,
      isFavorited: isRecipeFavorited(recipe.id),
    })
  },

  setNavMetrics() {
    this.setData(getNavMetrics())
  },

  back() {
    wx.navigateBack({
      fail: () => wx.reLaunch({ url: '/pages/home/home' }),
    })
  },

  changeServings(event) {
    const delta = Number(event.currentTarget.dataset.delta)
    const servings = Math.max(1, this.data.servings + delta)
    const recipe = getRecipe(this.data.id)
    if (!recipe) return
    this.setData({
      servings,
      recipe: buildViewRecipe(recipe, servings),
    })
  },

  editRecipe() {
    wx.navigateTo({
      url: `/pages/recipe/form?id=${this.data.id}`,
    })
  },

  addToShopping() {
    if (!this.data.recipe) return
    addRecipeToShoppingList({
      ...this.data.recipe,
      ingredients: this.data.recipe.scaledIngredients,
    })
    wx.showToast({ title: '已生成清单', icon: 'success' })
    setTimeout(() => wx.navigateTo({ url: '/pages/shopping/shopping' }), 300)
  },

  startCooking() {
    wx.navigateTo({
      url: `/pages/cooking/cooking?id=${this.data.id}`,
    })
  },

  toggleFavorite() {
    if (!this.data.id) return
    const ids = toggleFavoriteRecipe(this.data.id)
    const isFavorited = ids.includes(this.data.id)
    this.setData({ isFavorited })
    wx.showToast({ title: isFavorited ? '已收藏' : '已取消收藏', icon: 'none' })
  },

  showCollectionPicker() {
    const collections = getCollections()
    const collectionStatus = {}
    if (this.data.id) {
      const containedIds = getCollectionsContainingRecipe(this.data.id)
      containedIds.forEach((id) => { collectionStatus[id] = true })
    }
    this.setData({ showCollectionPicker: true, collections, collectionStatus })
  },

  hideCollectionPicker() {
    this.setData({ showCollectionPicker: false })
  },

  toggleCollection(event) {
    const id = event.currentTarget.dataset.id
    if (!id || !this.data.id) return
    const contained = this.data.collectionStatus[id]
    if (contained) {
      const { removeRecipeFromCollection } = require('../../utils/storage')
      removeRecipeFromCollection(id, this.data.id)
      this.setData({ [`collectionStatus.${id}`]: false })
      wx.showToast({ title: '已移出收藏夹', icon: 'none' })
    } else {
      addRecipeToCollection(id, this.data.id)
      this.setData({ [`collectionStatus.${id}`]: true })
      wx.showToast({ title: '已添加到收藏夹', icon: 'none' })
    }
  },

  removeRecipe() {
    wx.showModal({
      title: '删除菜谱',
      content: '确定删除这道菜吗？',
      confirmColor: '#c9583a',
      success: (res) => {
        if (!res.confirm) return
        deleteRecipe(this.data.id)
        wx.showToast({ title: '已删除', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 350)
      },
    })
  },

  noop() {},
})
