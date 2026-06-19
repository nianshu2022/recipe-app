const app = getApp()
const { recipes } = require('../../data/recipes')
const { getDifficultyText, getCategoryText, showToast, showConfirm } = require('../../utils/util')

Page({
  data: {
    recipe: null,
    mode: 'view', // view 或 add
    isEditing: false,
    formData: {
      name: '',
      category: 'hot-dish',
      difficulty: 'easy',
      duration: 30,
      servings: 2,
      ingredients: [],
      steps: []
    },
    categories: [
      { id: 'hot-dish', name: '热菜' },
      { id: 'cold-dish', name: '凉菜' },
      { id: 'soup', name: '汤品' },
      { id: 'staple', name: '主食' },
      { id: 'dessert', name: '甜品' }
    ],
    difficulties: [
      { id: 'easy', name: '简单' },
      { id: 'medium', name: '中等' },
      { id: 'hard', name: '困难' }
    ]
  },

  onLoad(options) {
    if (options.mode === 'add') {
      this.setData({ mode: 'add', isEditing: true })
      wx.setNavigationBarTitle({ title: '创建菜谱' })
    } else if (options.id) {
      this.loadRecipe(options.id)
    }
  },

  loadRecipe(id) {
    const allRecipes = app.globalData.recipes.length > 0 ? app.globalData.recipes : recipes
    const recipe = allRecipes.find(r => r.id === id)
    if (recipe) {
      this.setData({
        recipe,
        formData: {
          name: recipe.name,
          category: recipe.category,
          difficulty: recipe.difficulty,
          duration: recipe.duration,
          servings: recipe.servings,
          ingredients: recipe.ingredients || [],
          steps: recipe.steps || []
        }
      })
      wx.setNavigationBarTitle({ title: recipe.name })
    }
  },

  onEdit() {
    this.setData({ isEditing: true })
  },

  onCancel() {
    if (this.data.mode === 'add') {
      wx.navigateBack()
    } else {
      this.setData({ isEditing: false })
      this.loadRecipe(this.data.recipe.id)
    }
  },

  onSave() {
    const { formData, mode } = this.data
    
    if (!formData.name.trim()) {
      showToast('请输入菜名')
      return
    }

    const recipe = {
      id: mode === 'add' ? 'recipe_' + Date.now() : this.data.recipe.id,
      ...formData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    if (mode === 'add') {
      app.globalData.recipes.unshift(recipe)
    } else {
      const index = app.globalData.recipes.findIndex(r => r.id === recipe.id)
      if (index !== -1) {
        app.globalData.recipes[index] = recipe
      }
    }
    
    app.saveRecipes()
    showToast('保存成功')
    
    setTimeout(() => {
      if (mode === 'add') {
        wx.navigateBack()
      } else {
        this.setData({ isEditing: false, recipe })
      }
    }, 1500)
  },

  async onDelete() {
    const confirmed = await showConfirm('确定删除这个菜谱吗？')
    if (confirmed) {
      const index = app.globalData.recipes.findIndex(r => r.id === this.data.recipe.id)
      if (index !== -1) {
        app.globalData.recipes.splice(index, 1)
        app.saveRecipes()
        showToast('已删除')
        setTimeout(() => wx.navigateBack(), 1500)
      }
    }
  },

  onInputChange(e) {
    const { field } = e.currentTarget.dataset
    this.setData({
      [`formData.${field}`]: e.detail.value
    })
  },

  onNumberChange(e) {
    const { field } = e.currentTarget.dataset
    this.setData({
      [`formData.${field}`]: Number(e.detail.value)
    })
  },

  onCategoryChange(e) {
    this.setData({
      'formData.category': this.data.categories[e.detail.value].id
    })
  },

  onDifficultyChange(e) {
    this.setData({
      'formData.difficulty': this.data.difficulties[e.detail.value].id
    })
  },

  onAddIngredient() {
    const ingredients = [...this.data.formData.ingredients]
    ingredients.push({ name: '', amount: 0, unit: '克' })
    this.setData({ 'formData.ingredients': ingredients })
  },

  onIngredientInput(e) {
    const { index, field } = e.currentTarget.dataset
    const ingredients = [...this.data.formData.ingredients]
    ingredients[index][field] = field === 'amount' ? Number(e.detail.value) : e.detail.value
    this.setData({ 'formData.ingredients': ingredients })
  },

  onDeleteIngredient(e) {
    const { index } = e.currentTarget.dataset
    const ingredients = [...this.data.formData.ingredients]
    ingredients.splice(index, 1)
    this.setData({ 'formData.ingredients': ingredients })
  },

  onAddStep() {
    const steps = [...this.data.formData.steps]
    steps.push('')
    this.setData({ 'formData.steps': steps })
  },

  onStepInput(e) {
    const { index } = e.currentTarget.dataset
    const steps = [...this.data.formData.steps]
    steps[index] = e.detail.value
    this.setData({ 'formData.steps': steps })
  },

  onDeleteStep(e) {
    const { index } = e.currentTarget.dataset
    const steps = [...this.data.formData.steps]
    steps.splice(index, 1)
    this.setData({ 'formData.steps': steps })
  },

  onStartCooking() {
    wx.navigateTo({
      url: `/pages/cooking/cooking?id=${this.data.recipe.id}`
    })
  }
})
