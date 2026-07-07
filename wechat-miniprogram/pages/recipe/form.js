const { getRecipe, upsertRecipe, generateRecipeId } = require('../../utils/storage')
const { getNavMetrics } = require('../../utils/nav')

const categoryOptions = [
  { key: 'hot-dish', label: '热菜', color: '#c9583a' },
  { key: 'cold-dish', label: '凉菜', color: '#5a7a54' },
  { key: 'soup', label: '汤羹', color: '#7a9aa0' },
  { key: 'staple', label: '主食', color: '#c49a3c' },
  { key: 'dessert', label: '甜品', color: '#b86b8b' },
  { key: 'drink', label: '饮品', color: '#6b7ca8' },
]

const difficultyOptions = [
  { key: 'easy', label: '简单' },
  { key: 'medium', label: '中等' },
  { key: 'hard', label: '困难' },
]

const unitOptions = [
  '',
  '克', '千克',
  '毫升', '升',
  '勺', '汤匙', '茶匙',
  '个', '块', '片', '根', '棵', '瓣', '张', '颗', '条', '只',
  '碗', '杯', '罐', '盒', '袋', '包', '瓶', '粒', '小块', '朵',
  '适量', '少许',
]

function createId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function createIngredient(overrides = {}) {
  const ingredient = {
    id: createId('i'),
    name: '',
    amount: '',
    unit: '',
    unitIndex: 0,
    type: 'main',
    scalable: true,
    ...overrides,
  }
  ingredient.unitIndex = getUnitIndex(ingredient.unit)
  return ingredient
}

function createStep(order, overrides = {}) {
  return {
    order,
    description: '',
    timer: '',
    ...overrides,
  }
}

function normalizeIngredient(item, index) {
  return createIngredient({
    id: item.id || createId('i'),
    name: item.name || '',
    amount: item.amount || item.amount === 0 ? String(item.amount) : '',
    unit: item.unit || '',
    type: item.type || (index === 0 ? 'main' : 'sub'),
    scalable: item.scalable !== false,
  })
}

function normalizeStep(item, index) {
  return createStep(index + 1, {
    description: item.description || '',
    timer: item.timer || item.timer === 0 ? String(item.timer) : '',
    tip: item.tip || '',
    image: item.image,
    video: item.video,
  })
}

function getUnitIndex(unit) {
  const index = unitOptions.indexOf(unit || '')
  return index >= 0 ? index : 0
}

Page({
  data: {
    id: '',
    isEdit: false,
    categoryOptions,
    difficultyOptions,
    unitOptions,
    categoryIndex: 0,
    difficultyIndex: 0,
    categoryLabel: categoryOptions[0].label,
    difficultyLabel: difficultyOptions[0].label,
    statusBarHeight: 24,
    navBarHeight: 88,
    menuButtonReserve: 104,
    themeClass: 'theme-light',
    form: {
      name: '',
      duration: '30',
      servings: '2',
      tags: '',
      coverImage: '',
    },
    ingredients: [createIngredient()],
    steps: [createStep(1)],
  },

  onLoad(options) {
    this.setNavMetrics()
    if (!options.id) return

    const recipe = getRecipe(options.id)
    if (!recipe) {
      wx.showToast({ title: '菜谱不存在', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 600)
      return
    }

    const categoryIndex = categoryOptions.findIndex((item) => item.key === recipe.category)
    const difficultyIndex = difficultyOptions.findIndex((item) => item.key === recipe.difficulty)
    const safeCategoryIndex = categoryIndex >= 0 ? categoryIndex : 0
    const safeDifficultyIndex = difficultyIndex >= 0 ? difficultyIndex : 0

    this.setData({
      id: recipe.id,
      isEdit: true,
      categoryIndex: safeCategoryIndex,
      difficultyIndex: safeDifficultyIndex,
      categoryLabel: categoryOptions[safeCategoryIndex].label,
      difficultyLabel: difficultyOptions[safeDifficultyIndex].label,
      form: {
        name: recipe.name || '',
        duration: String(recipe.duration || 30),
        servings: String(recipe.servings || 2),
        tags: (recipe.tags || []).join(', '),
        coverImage: recipe.coverImage || '',
      },
      ingredients: (recipe.ingredients || []).length > 0
        ? recipe.ingredients.map(normalizeIngredient)
        : [createIngredient()],
      steps: (recipe.steps || []).length > 0
        ? recipe.steps.map(normalizeStep)
        : [createStep(1)],
    })
  },

  setNavMetrics() {
    this.setData(getNavMetrics())
  },

  onFieldInput(event) {
    const field = event.currentTarget.dataset.field
    this.setData({
      [`form.${field}`]: event.detail.value,
    })
  },

  onIngredientInput(event) {
    const index = Number(event.currentTarget.dataset.index)
    const field = event.currentTarget.dataset.field
    this.setData({
      [`ingredients[${index}].${field}`]: event.detail.value,
    })
  },

  onIngredientUnitChange(event) {
    const index = Number(event.currentTarget.dataset.index)
    const unit = unitOptions[Number(event.detail.value)] || ''
    this.setData({
      [`ingredients[${index}].unit`]: unit,
      [`ingredients[${index}].unitIndex`]: Number(event.detail.value),
    })
  },

  addIngredient() {
    this.setData({
      ingredients: [...this.data.ingredients, createIngredient({ type: 'sub' })],
    })
  },

  removeIngredient(event) {
    const index = Number(event.currentTarget.dataset.index)
    const ingredients = this.data.ingredients.filter((_, itemIndex) => itemIndex !== index)
    this.setData({
      ingredients: ingredients.length > 0 ? ingredients : [createIngredient()],
    })
  },

  onStepInput(event) {
    const index = Number(event.currentTarget.dataset.index)
    const field = event.currentTarget.dataset.field
    this.setData({
      [`steps[${index}].${field}`]: event.detail.value,
    })
  },

  addStep() {
    this.setData({
      steps: [...this.data.steps, createStep(this.data.steps.length + 1)],
    })
  },

  removeStep(event) {
    const index = Number(event.currentTarget.dataset.index)
    const steps = this.data.steps
      .filter((_, itemIndex) => itemIndex !== index)
      .map((step, itemIndex) => ({ ...step, order: itemIndex + 1 }))
    this.setData({
      steps: steps.length > 0 ? steps : [createStep(1)],
    })
  },

  chooseCoverImage() {
    const onChoose = (file) => {
      const filePath = typeof file === 'string' ? file : file && (file.tempFilePath || file.path)
      if (!filePath) return
      const fileType = file && (file.fileType || file.type)
      if (fileType && !String(fileType).startsWith('image')) {
        wx.showToast({ title: '请选择图片文件', icon: 'none' })
        return
      }
      if (file && file.size && file.size > 5 * 1024 * 1024) {
        wx.showToast({ title: '图片大小不能超过 5MB', icon: 'none' })
        return
      }
      const fs = wx.getFileSystemManager ? wx.getFileSystemManager() : null
      if (!fs || !wx.saveFile) {
        this.setData({ 'form.coverImage': filePath })
        return
      }
      wx.saveFile({
        tempFilePath: filePath,
        success: (res) => this.setData({ 'form.coverImage': res.savedFilePath }),
        fail: () => this.setData({ 'form.coverImage': filePath }),
      })
    }

    if (wx.chooseMedia) {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success: (res) => onChoose(res.tempFiles && res.tempFiles[0]),
      })
      return
    }

    wx.chooseImage({
      count: 1,
      sourceType: ['album', 'camera'],
      success: (res) => onChoose((res.tempFiles && res.tempFiles[0]) || (res.tempFilePaths && res.tempFilePaths[0])),
    })
  },

  removeCoverImage() {
    this.setData({ 'form.coverImage': '' })
  },

  back() {
    if (this.data.isEdit && this.data.id) {
      wx.redirectTo({ url: `/pages/recipe/detail?id=${this.data.id}` })
      return
    }
    wx.reLaunch({ url: '/pages/home/home' })
  },

  onCategoryChange(event) {
    const categoryIndex = Number(event.detail.value)
    this.setData({
      categoryIndex,
      categoryLabel: categoryOptions[categoryIndex].label,
    })
  },

  onDifficultyChange(event) {
    const difficultyIndex = Number(event.detail.value)
    this.setData({
      difficultyIndex,
      difficultyLabel: difficultyOptions[difficultyIndex].label,
    })
  },

  saveRecipe() {
    const form = this.data.form
    const name = form.name.trim()
    const ingredients = this.data.ingredients
      .map((item, index) => ({
        id: item.id || createId('i'),
        name: String(item.name || '').trim(),
        amount: Number(item.amount) || 0,
        unit: item.unit || '',
        type: item.type || (index === 0 ? 'main' : 'sub'),
        scalable: item.scalable !== false,
      }))
      .filter((item) => item.name)
    const steps = this.data.steps
      .map((item, index) => ({
        order: index + 1,
        description: String(item.description || '').trim(),
        timer: item.timer ? Number(item.timer) : undefined,
        tip: item.tip || undefined,
        image: item.image,
        video: item.video,
      }))
      .filter((item) => item.description)

    if (!name) {
      wx.showToast({ title: '请输入菜名', icon: 'none' })
      return
    }
    if (ingredients.length === 0) {
      wx.showToast({ title: '请至少添加一个食材', icon: 'none' })
      return
    }
    if (steps.length === 0) {
      wx.showToast({ title: '请至少添加一个步骤', icon: 'none' })
      return
    }

    const category = categoryOptions[this.data.categoryIndex]
    const difficulty = difficultyOptions[this.data.difficultyIndex]
    const now = new Date().toISOString()
    const existingRecipe = this.data.id ? getRecipe(this.data.id) : null
    const recipe = {
      ...(existingRecipe || {}),
      id: this.data.id || generateRecipeId(),
      userId: existingRecipe && existingRecipe.userId ? existingRecipe.userId : 'local',
      name,
      category: category.key,
      categoryName: category.label,
      tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      difficulty: difficulty.key,
      difficultyName: difficulty.label,
      duration: Math.max(1, Number(form.duration) || 30),
      servings: Math.max(1, Number(form.servings) || 2),
      coverColor: category.color,
      coverImage: form.coverImage || '',
      ingredients,
      steps,
      syncStatus: 'pending',
      updatedAt: now,
      createdAt: existingRecipe && existingRecipe.createdAt ? existingRecipe.createdAt : now,
    }

    upsertRecipe(recipe)
    wx.showToast({ title: this.data.isEdit ? '菜谱已更新' : '菜谱已创建', icon: 'success' })
    setTimeout(() => {
      wx.reLaunch({ url: '/pages/home/home' })
    }, 350)
  },

  getUnitIndex,
})
