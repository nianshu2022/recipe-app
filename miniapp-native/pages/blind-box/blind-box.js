const app = getApp()
const { recipes: builtInRecipes } = require('../../data/recipes')
const { getDifficultyText, getDifficultyColor, getCategoryText, getCategoryIcon, showToast } = require('../../utils/util')

Page({
  data: {
    phase: 'idle',
    source: 'local',
    result: null,
    saved: false,
    hasRecipes: false
  },

  onLoad() {
    this.setData({ hasRecipes: (app.globalData.recipes || []).length > 0 })
  },

  onShow() {
    this.setData({ hasRecipes: (app.globalData.recipes || []).length > 0 })
  },

  onDrawLocal() {
    const recipes = app.globalData.recipes || []
    if (recipes.length === 0) return
    this.setData({ phase: 'shaking', source: 'local', result: null, saved: false })
    setTimeout(() => {
      const picked = recipes[Math.floor(Math.random() * recipes.length)]
      this.setData({ phase: 'revealed', result: this.mapRecipe(picked) })
    }, 850)
  },

  onDrawGlobal() {
    this.setData({ phase: 'shaking', source: 'recommend', result: null, saved: false })
    setTimeout(() => {
      const picked = builtInRecipes[Math.floor(Math.random() * builtInRecipes.length)]
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
    if (this.data.source === 'recommend') this.onDrawGlobal()
    else this.onDrawLocal()
  },

  onSave() {
    const { result } = this.data
    if (!result) return
    const recipe = { ...result, id: 'recipe_' + Date.now(), userId: 'local', syncStatus: 'pending', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    delete recipe.difficultyText
    delete recipe.difficultyColor
    delete recipe.categoryText
    delete recipe.categoryIcon
    delete recipe.tagsStr
    app.globalData.recipes.unshift(recipe)
    app.saveRecipes()
    this.setData({ saved: true })
    showToast('已保存')
  },

  onViewDetail() {
    wx.navigateTo({ url: `/pages/recipe/recipe?id=${this.data.result.id}` })
  },

  onCreateRecipe() {
    wx.navigateTo({ url: '/pages/recipe-form/recipe-form' })
  }
})
