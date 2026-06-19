const app = getApp()
const { recipes } = require('../../data/recipes')
const { getDifficultyText, getCategoryText } = require('../../utils/util')

Page({
  data: {
    recipes: [],
    categories: [
      { id: 'all', name: '全部' },
      { id: 'hot-dish', name: '热菜' },
      { id: 'cold-dish', name: '凉菜' },
      { id: 'soup', name: '汤品' },
      { id: 'staple', name: '主食' },
      { id: 'dessert', name: '甜品' }
    ],
    currentCategory: 'all',
    searchKey: ''
  },

  onLoad() {
    this.loadRecipes()
  },

  onShow() {
    this.loadRecipes()
  },

  loadRecipes() {
    let list = app.globalData.recipes.length > 0 ? app.globalData.recipes : recipes
    
    // 分类筛选
    if (this.data.currentCategory !== 'all') {
      list = list.filter(r => r.category === this.data.currentCategory)
    }
    
    // 搜索筛选
    if (this.data.searchKey) {
      const key = this.data.searchKey.toLowerCase()
      list = list.filter(r => 
        r.name.toLowerCase().includes(key) || 
        r.tags.some(t => t.toLowerCase().includes(key))
      )
    }
    
    // 添加显示文本
    list = list.map(r => ({
      ...r,
      difficultyText: getDifficultyText(r.difficulty),
      categoryText: getCategoryText(r.category)
    }))
    
    this.setData({ recipes: list })
  },

  onCategoryTap(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ currentCategory: category })
    this.loadRecipes()
  },

  onSearchInput(e) {
    this.setData({ searchKey: e.detail.value })
    this.loadRecipes()
  },

  onRecipeTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/recipe/recipe?id=${id}`
    })
  },

  onAddTap() {
    wx.navigateTo({
      url: '/pages/recipe/recipe?mode=add'
    })
  }
})
