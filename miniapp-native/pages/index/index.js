const app = getApp()
const { recipes: builtInRecipes } = require('../../data/recipes')
const { getDifficultyText, getDifficultyColor, getCategoryText, getCategoryIcon, showToast } = require('../../utils/util')

Page({
  data: {
    recipes: [],
    filteredRecipes: [],
    categories: [
      { value: 'all', label: '全部', icon: '' },
      { value: 'cold-dish', label: '凉菜', icon: '🥬' },
      { value: 'hot-dish', label: '热菜', icon: '🔥' },
      { value: 'soup', label: '汤羹', icon: '🍲' },
      { value: 'staple', label: '主食', icon: '🌾' },
      { value: 'dessert', label: '甜品', icon: '🍦' },
      { value: 'drink', label: '饮品', icon: '🥤' }
    ],
    difficulties: [
      { value: 'all', label: '全部' },
      { value: 'easy', label: '简单' },
      { value: 'medium', label: '中等' },
      { value: 'hard', label: '困难' }
    ],
    categoryFilter: 'all',
    difficultyFilter: 'all',
    searchKey: '',
    loading: true
  },

  onLoad() {
    this.loadRecipes()
  },

  onShow() {
    this.loadRecipes()
  },

  loadRecipes() {
    const userRecipes = app.globalData.recipes || []
    const allRecipes = [...userRecipes, ...builtInRecipes.filter(b => !userRecipes.some(u => u.name === b.name))]
    const mapped = allRecipes.map(r => ({
      ...r,
      difficultyText: getDifficultyText(r.difficulty),
      difficultyColor: getDifficultyColor(r.difficulty),
      categoryText: getCategoryText(r.category),
      categoryIcon: getCategoryIcon(r.category),
      tagsStr: (r.tags || []).slice(0, 2),
      isFavorited: (app.globalData.collections || []).some(c => (c.recipeIds || []).includes(r.id))
    }))
    this.setData({ recipes: mapped, loading: false })
    this.filterRecipes()
  },

  filterRecipes() {
    let list = this.data.recipes
    const { categoryFilter, difficultyFilter, searchKey } = this.data
    const key = searchKey.toLowerCase()

    if (categoryFilter !== 'all') {
      list = list.filter(r => r.category === categoryFilter)
    }
    if (difficultyFilter !== 'all') {
      list = list.filter(r => r.difficulty === difficultyFilter)
    }
    if (key) {
      list = list.filter(r =>
        r.name.toLowerCase().includes(key) ||
        (r.tags || []).some(t => t.toLowerCase().includes(key)) ||
        (r.ingredients || []).some(i => i.name.toLowerCase().includes(key))
      )
    }
    this.setData({ filteredRecipes: list })
  },

  onSearchInput(e) {
    this.setData({ searchKey: e.detail.value })
    this.filterRecipes()
  },

  onCategoryTap(e) {
    this.setData({ categoryFilter: e.currentTarget.dataset.value })
    this.filterRecipes()
  },

  onDifficultyTap(e) {
    this.setData({ difficultyFilter: e.currentTarget.dataset.value })
    this.filterRecipes()
  },

  onRecipeTap(e) {
    wx.navigateTo({ url: `/pages/recipe/recipe?id=${e.currentTarget.dataset.id}` })
  },

  onToggleFavorite(e) {
    const id = e.currentTarget.dataset.id
    const collections = app.globalData.collections || []
    let col = collections[0]

    if (!col) {
      col = { id: 'col_' + Date.now(), userId: 'local', name: '我的收藏', recipeIds: [], syncStatus: 'pending', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      collections.push(col)
    }

    const idx = col.recipeIds.indexOf(id)
    if (idx === -1) {
      col.recipeIds.push(id)
    } else {
      col.recipeIds.splice(idx, 1)
    }

    app.globalData.collections = collections
    app.saveCollections()
    this.loadRecipes()
  },

  onAddTap() {
    wx.navigateTo({ url: '/pages/recipe-form/recipe-form' })
  },

  onBlindBoxTap() {
    wx.switchTab({ url: '/pages/blind-box/blind-box' })
  }
})
