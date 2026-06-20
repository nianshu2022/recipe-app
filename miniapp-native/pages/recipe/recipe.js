const app = getApp()
const { recipes: builtInRecipes } = require('../../data/recipes')
const { getDifficultyText, getDifficultyColor, getCategoryText, getCategoryIcon, showToast, showConfirm, guessCategory } = require('../../utils/util')
const { scaleIngredients } = require('../../utils/db')

Page({
  data: {
    recipe: null,
    servings: 2,
    scaledIngredients: [],
    isFavorited: false,
    loading: true
  },

  onLoad(options) {
    if (options.id) this.loadRecipe(options.id)
  },

  loadRecipe(id) {
    const userRecipes = app.globalData.recipes || []
    const allRecipes = [...userRecipes, ...builtInRecipes]
    const recipe = allRecipes.find(r => r.id === id)
    if (recipe) {
      const isFavorited = (app.globalData.collections || []).some(c => (c.recipeIds || []).includes(recipe.id))
      this.setData({
        recipe: {
          ...recipe,
          difficultyText: getDifficultyText(recipe.difficulty),
          difficultyColor: getDifficultyColor(recipe.difficulty),
          categoryText: getCategoryText(recipe.category),
          categoryIcon: getCategoryIcon(recipe.category)
        },
        servings: recipe.servings,
        scaledIngredients: recipe.ingredients,
        isFavorited,
        loading: false
      })
      wx.setNavigationBarTitle({ title: recipe.name })
    } else {
      this.setData({ loading: false })
    }
  },

  onServingsChange(e) {
    const delta = Number(e.currentTarget.dataset.delta)
    const newServings = Math.max(1, Math.min(20, this.data.servings + delta))
    const scaled = scaleIngredients(this.data.recipe.ingredients, this.data.recipe.servings, newServings)
    this.setData({ servings: newServings, scaledIngredients: scaled })
  },

  onToggleFavorite() {
    const { recipe } = this.data
    const collections = app.globalData.collections || []
    let col = collections[0]
    if (!col) {
      col = { id: 'col_' + Date.now(), userId: 'local', name: '我的收藏', recipeIds: [], syncStatus: 'pending', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      collections.push(col)
    }
    const idx = col.recipeIds.indexOf(recipe.id)
    if (idx === -1) col.recipeIds.push(recipe.id)
    else col.recipeIds.splice(idx, 1)
    app.globalData.collections = collections
    app.saveCollections()
    this.setData({ isFavorited: idx === -1 })
    showToast(idx === -1 ? '已收藏' : '已取消收藏')
  },

  onAddToShopping() {
    const { recipe, scaledIngredients } = this.data
    const lists = app.globalData.shoppingLists || []
    let list = lists[0]
    if (!list) {
      list = { id: 'list_' + Date.now(), userId: 'local', sourceRecipeIds: [], items: [], syncStatus: 'pending', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      lists.push(list)
    }
    for (const ing of scaledIngredients) {
      const existing = list.items.find(i => i.name === ing.name && i.unit === ing.unit)
      if (existing) {
        existing.amount += ing.amount
      } else {
        list.items.push({ id: 'item_' + Date.now() + Math.random().toString(36).substr(2, 4), name: ing.name, amount: ing.amount, unit: ing.unit, category: guessCategory(ing.name), checked: false })
      }
    }
    if (!list.sourceRecipeIds.includes(recipe.id)) list.sourceRecipeIds.push(recipe.id)
    list.updatedAt = new Date().toISOString()
    app.globalData.shoppingLists = lists
    app.saveShoppingLists()
    showToast('已添加到购物清单')
  },

  onStartCooking() {
    wx.navigateTo({ url: `/pages/cooking/cooking?id=${this.data.recipe.id}` })
  },

  onEdit() {
    wx.navigateTo({ url: `/pages/recipe-form/recipe-form?id=${this.data.recipe.id}` })
  },

  async onDelete() {
    const confirmed = await showConfirm(`确定要删除「${this.data.recipe.name}」吗？`)
    if (!confirmed) return
    const idx = app.globalData.recipes.findIndex(r => r.id === this.data.recipe.id)
    if (idx !== -1) {
      app.globalData.recipes.splice(idx, 1)
      app.saveRecipes()
      showToast('菜谱已删除')
      setTimeout(() => wx.navigateBack(), 1500)
    }
  },

  onShare() {
    wx.showShareMenu({ withShareTicket: true, menus: ['shareAppMessage', 'shareTimeline'] })
  },

  onShareAppMessage() {
    const { recipe } = this.data
    return { title: recipe.name, path: `/pages/recipe/recipe?id=${recipe.id}` }
  }
})
