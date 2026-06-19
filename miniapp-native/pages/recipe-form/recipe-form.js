const app = getApp()
const { generateId, showToast, CATEGORY_OPTIONS, DIFFICULTY_OPTIONS, UNIT_OPTIONS } = require('../../utils/util')

Page({
  data: {
    isEdit: false,
    recipeId: '',
    name: '',
    categoryIndex: 1,
    categories: CATEGORY_OPTIONS,
    difficultyIndex: 0,
    difficulties: DIFFICULTY_OPTIONS,
    duration: 30,
    servings: 2,
    tags: '',
    ingredients: [{ id: 'ing_1', name: '', amount: '', unit: '克' }],
    steps: [{ order: 1, description: '' }],
    unitOptions: UNIT_OPTIONS,
    unitIndex: 0
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ isEdit: true, recipeId: options.id })
      wx.setNavigationBarTitle({ title: '编辑菜谱' })
      const recipe = app.globalData.recipes.find(r => r.id === options.id)
      if (recipe) {
        const catIdx = CATEGORY_OPTIONS.findIndex(c => c.value === recipe.category)
        const diffIdx = DIFFICULTY_OPTIONS.findIndex(d => d.value === recipe.difficulty)
        this.setData({
          name: recipe.name,
          categoryIndex: catIdx >= 0 ? catIdx : 1,
          difficultyIndex: diffIdx >= 0 ? diffIdx : 0,
          duration: recipe.duration,
          servings: recipe.servings,
          tags: (recipe.tags || []).join('、'),
          ingredients: recipe.ingredients.length > 0 ? recipe.ingredients.map(i => ({ ...i, amount: String(i.amount) })) : [{ id: 'ing_1', name: '', amount: '', unit: '克' }],
          steps: recipe.steps.length > 0 ? recipe.steps : [{ order: 1, description: '' }]
        })
      }
    }
  },

  onNameInput(e) { this.setData({ name: e.detail.value }) },
  onCategoryChange(e) { this.setData({ categoryIndex: e.detail.value }) },
  onDifficultyChange(e) { this.setData({ difficultyIndex: e.detail.value }) },
  onDurationInput(e) { this.setData({ duration: Number(e.detail.value) || 0 }) },
  onServingsInput(e) { this.setData({ servings: Number(e.detail.value) || 0 }) },
  onTagsInput(e) { this.setData({ tags: e.detail.value }) },

  onIngNameInput(e) {
    const idx = e.currentTarget.dataset.idx
    const ingredients = [...this.data.ingredients]
    ingredients[idx].name = e.detail.value
    this.setData({ ingredients })
  },
  onIngAmountInput(e) {
    const idx = e.currentTarget.dataset.idx
    const ingredients = [...this.data.ingredients]
    ingredients[idx].amount = e.detail.value
    this.setData({ ingredients })
  },
  onIngUnitChange(e) {
    const idx = e.currentTarget.dataset.idx
    const ingredients = [...this.data.ingredients]
    ingredients[idx].unit = UNIT_OPTIONS[e.detail.value]
    this.setData({ ingredients })
  },
  onAddIngredient() {
    const ingredients = [...this.data.ingredients, { id: 'ing_' + Date.now(), name: '', amount: '', unit: '克' }]
    this.setData({ ingredients })
  },
  onRemoveIngredient(e) {
    const idx = e.currentTarget.dataset.idx
    const ingredients = this.data.ingredients.filter((_, i) => i !== idx)
    this.setData({ ingredients: ingredients.length > 0 ? ingredients : [{ id: 'ing_1', name: '', amount: '', unit: '克' }] })
  },

  onStepInput(e) {
    const idx = e.currentTarget.dataset.idx
    const steps = [...this.data.steps]
    steps[idx].description = e.detail.value
    this.setData({ steps })
  },
  onAddStep() {
    const steps = [...this.data.steps, { order: this.data.steps.length + 1, description: '' }]
    this.setData({ steps })
  },
  onRemoveStep(e) {
    const idx = e.currentTarget.dataset.idx
    const steps = this.data.steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 }))
    this.setData({ steps: steps.length > 0 ? steps : [{ order: 1, description: '' }] })
  },

  onSave() {
    const { name, categoryIndex, difficultyIndex, duration, servings, tags, ingredients, steps, isEdit, recipeId } = this.data
    if (!name.trim()) { showToast('请输入菜名'); return }
    const validIngs = ingredients.filter(i => i.name.trim())
    if (validIngs.length === 0) { showToast('请至少添加一种食材'); return }
    const validSteps = steps.filter(s => s.description.trim())
    if (validSteps.length === 0) { showToast('请至少添加一个步骤'); return }

    const recipe = {
      id: isEdit ? recipeId : 'recipe_' + Date.now(),
      userId: 'local',
      name: name.trim(),
      category: CATEGORY_OPTIONS[categoryIndex].value,
      tags: tags.split(/[、,，]/).map(t => t.trim()).filter(Boolean),
      difficulty: DIFFICULTY_OPTIONS[difficultyIndex].value,
      duration: Number(duration) || 30,
      servings: Number(servings) || 2,
      ingredients: validIngs.map(i => ({ ...i, amount: Number(i.amount) || 0, type: 'main', scalable: true })),
      steps: validSteps.map((s, i) => ({ ...s, order: i + 1 })),
      syncStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    if (isEdit) {
      const idx = app.globalData.recipes.findIndex(r => r.id === recipeId)
      if (idx !== -1) app.globalData.recipes[idx] = recipe
    } else {
      app.globalData.recipes.unshift(recipe)
    }
    app.saveRecipes()
    showToast(isEdit ? '已更新' : '已创建')
    setTimeout(() => wx.navigateBack(), 1500)
  }
})
