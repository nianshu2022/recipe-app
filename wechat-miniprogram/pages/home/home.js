const { getFavoriteRecipeIds, getRecipes, toggleFavoriteRecipe, addRecipesToShoppingList } = require('../../utils/storage')
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

const categories = [
  { key: 'all', label: '全部' },
  { key: 'cold-dish', label: '凉菜', icon: '/assets/lucide/leaf.svg', activeIcon: '/assets/lucide/leaf-white.svg' },
  { key: 'hot-dish', label: '热菜', icon: '/assets/lucide/flame.svg', activeIcon: '/assets/lucide/flame-white.svg' },
  { key: 'soup', label: '汤羹', icon: '/assets/lucide/soup.svg', activeIcon: '/assets/lucide/soup-white.svg' },
  { key: 'staple', label: '主食', icon: '/assets/lucide/wheat.svg', activeIcon: '/assets/lucide/wheat-white.svg' },
  { key: 'dessert', label: '甜品', icon: '/assets/lucide/ice-cream-cone.svg', activeIcon: '/assets/lucide/ice-cream-cone-white.svg' },
  { key: 'drink', label: '饮品', icon: '/assets/lucide/cup-soda.svg', activeIcon: '/assets/lucide/cup-soda-white.svg' },
]

const difficulties = [
  { key: 'all', label: '全部难度' },
  { key: 'easy', label: '简单' },
  { key: 'medium', label: '中等' },
  { key: 'hard', label: '困难' },
]

Page({
  data: {
    query: '',
    activeCategory: 'all',
    activeDifficulty: 'all',
    categories,
    difficulties,
    recipes: [],
    filteredRecipes: [],
    statusBarHeight: 24,
    headerTopInset: 32,
    menuButtonReserve: 104,
    selectMode: false,
    selectedIds: {},
    selectedCount: 0,
  },

  onLoad(options = {}) {
    if (options.q) {
      this.setData({ query: String(options.q) })
    }
  },

  onShow() {
    this.setData(getNavMetrics())
    const favoriteIds = new Set(getFavoriteRecipeIds())
    const recipes = getRecipes().map((recipe) => ({
      ...recipe,
      durationText: formatDuration(recipe.duration),
      displayTags: recipe.tags.slice(0, 2),
      categoryIcon: categoryIconMap[recipe.category] || categoryIconMap['hot-dish'],
      isFavorited: favoriteIds.has(recipe.id),
    }))
    this.setData({ recipes }, this.applyFilters)
  },

  onSearchInput(event) {
    this.setData({ query: event.detail.value }, this.applyFilters)
  },

  onCategoryTap(event) {
    const key = event.currentTarget.dataset.key
    this.setData({
      activeCategory: this.data.activeCategory === key && key !== 'all' ? 'all' : key,
    }, this.applyFilters)
  },

  onDifficultyTap(event) {
    const key = event.currentTarget.dataset.key
    this.setData({
      activeDifficulty: this.data.activeDifficulty === key ? 'all' : key,
    }, this.applyFilters)
  },

  createRecipe() {
    wx.navigateTo({
      url: '/pages/recipe/form',
    })
  },

  openBlindBox() {
    wx.navigateTo({
      url: '/pages/blind-box/blind-box',
    })
  },

  applyFilters() {
    const query = this.data.query.trim().toLowerCase()
    const category = this.data.activeCategory
    const difficulty = this.data.activeDifficulty
    const filteredRecipes = this.data.recipes.filter((recipe) => {
      const matchCategory = category === 'all' || recipe.category === category
      const matchDifficulty = difficulty === 'all' || recipe.difficulty === difficulty
      const matchQuery = !query ||
        recipe.name.toLowerCase().includes(query) ||
        recipe.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        recipe.ingredients.some((item) => item.name.toLowerCase().includes(query))
      return matchCategory && matchDifficulty && matchQuery
    })
    this.setData({ filteredRecipes })
  },

  openRecipe(event) {
    wx.navigateTo({
      url: `/pages/recipe/detail?id=${event.currentTarget.dataset.id}`,
    })
  },

  toggleFavorite(event) {
    const id = event.currentTarget.dataset.id
    const ids = toggleFavoriteRecipe(id)
    const favoriteIds = new Set(ids)
    const recipes = this.data.recipes.map((recipe) => ({
      ...recipe,
      isFavorited: favoriteIds.has(recipe.id),
    }))
    this.setData({ recipes }, this.applyFilters)
    wx.showToast({
      title: favoriteIds.has(id) ? '已收藏' : '已取消收藏',
      icon: 'none',
    })
  },

  enterSelectMode() {
    this.setData({ selectMode: true, selectedIds: {}, selectedCount: 0 })
  },

  exitSelectMode() {
    this.setData({ selectMode: false, selectedIds: {}, selectedCount: 0 })
  },

  toggleSelectRecipe(event) {
    const id = event.currentTarget.dataset.id
    const selectedIds = { ...this.data.selectedIds }
    if (selectedIds[id]) {
      delete selectedIds[id]
    } else {
      selectedIds[id] = true
    }
    this.setData({
      selectedIds,
      selectedCount: Object.keys(selectedIds).length,
    })
  },

  confirmGenerateShopping() {
    const selectedIds = this.data.selectedIds
    const ids = Object.keys(selectedIds).filter((id) => selectedIds[id])
    if (ids.length === 0) {
      wx.showToast({ title: '请先选择菜谱', icon: 'none' })
      return
    }
    const recipesById = new Map(this.data.recipes.map((r) => [r.id, r]))
    const selectedRecipes = ids.map((id) => recipesById.get(id)).filter(Boolean)
    addRecipesToShoppingList(selectedRecipes)
    this.setData({ selectMode: false, selectedIds: {}, selectedCount: 0 })
    wx.showToast({ title: `已生成 ${selectedRecipes.length} 道菜的清单`, icon: 'success' })
    setTimeout(() => wx.navigateTo({ url: '/pages/shopping/shopping' }), 300)
  },
})
