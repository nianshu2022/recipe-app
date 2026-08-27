const {
  getMenus,
  createMenu,
  renameMenu,
  deleteMenu,
  getMenuRecipes,
  addRecipeToMenu,
  removeRecipeFromMenu,
  getAllRecipes,
  addRecipesToShoppingList,
} = require('../../utils/storage')
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

function formatRecipes(recipes) {
  return recipes.map((recipe) => ({
    ...recipe,
    durationText: formatDuration(recipe.duration),
    displayTags: recipe.tags.slice(0, 2),
    categoryIcon: categoryIconMap[recipe.category] || categoryIconMap['hot-dish'],
  }))
}

Page({
  data: {
    menus: [],
    viewMode: 'list',
    currentMenu: null,
    recipes: [],
    allRecipes: [],
    showCreatePopup: false,
    showRenamePopup: false,
    showAddRecipePopup: false,
    newMenuName: '',
    renamingMenuId: '',
    renamingName: '',
    addableRecipes: [],
    statusBarHeight: 24,
    contentTopInset: 42,
  },

  onShow() {
    this.setData(getNavMetrics())
    if (this.data.viewMode === 'list') {
      this.loadMenus()
    } else {
      this.loadMenuDetail()
    }
  },

  loadMenus() {
    const menus = getMenus()
    const allRecipes = getAllRecipes()
    const recipesById = new Map(allRecipes.map((r) => [r.id, r]))
    const formatted = menus.map((menu) => {
      const recipes = menu.recipeIds.map((id) => recipesById.get(id)).filter(Boolean)
      const firstRecipe = recipes[0]
      return {
        ...menu,
        recipeCount: recipes.length,
        coverColor: firstRecipe ? firstRecipe.coverColor : '#f5f3ef',
        coverImage: firstRecipe ? firstRecipe.coverImage : null,
        categoryIcon: firstRecipe
          ? (categoryIconMap[firstRecipe.category] || categoryIconMap['hot-dish'])
          : '/assets/lucide/utensils-crossed.svg',
      }
    })
    this.setData({ menus: formatted })
  },

  loadMenuDetail() {
    const { currentMenu } = this.data
    if (!currentMenu) return
    const recipes = getMenuRecipes(currentMenu.id)
    this.setData({ recipes: formatRecipes(recipes) })
  },

  back() {
    if (this.data.viewMode === 'detail') {
      this.setData({ viewMode: 'list', currentMenu: null, recipes: [] })
      this.loadMenus()
    } else {
      wx.navigateBack({
        fail: () => wx.reLaunch({ url: '/pages/settings/settings' }),
      })
    }
  },

  openMenu(event) {
    const id = event.currentTarget.dataset.id
    const menus = getMenus()
    const menu = menus.find((m) => m.id === id)
    if (!menu) return
    const allRecipes = getAllRecipes()
    const recipesById = new Map(allRecipes.map((r) => [r.id, r]))
    const recipes = menu.recipeIds.map((rid) => recipesById.get(rid)).filter(Boolean)
    const firstRecipe = recipes[0]
    this.setData({
      viewMode: 'detail',
      currentMenu: {
        ...menu,
        recipeCount: recipes.length,
        coverColor: firstRecipe ? firstRecipe.coverColor : '#f5f3ef',
        coverImage: firstRecipe ? firstRecipe.coverImage : null,
        categoryIcon: firstRecipe
          ? (categoryIconMap[firstRecipe.category] || categoryIconMap['hot-dish'])
          : '/assets/lucide/utensils-crossed.svg',
      },
    }, () => this.loadMenuDetail())
  },

  openRecipe(event) {
    wx.navigateTo({
      url: `/pages/recipe/detail?id=${event.currentTarget.dataset.id}`,
    })
  },

  removeRecipeFromMenu(event) {
    const recipeId = event.currentTarget.dataset.id
    const { currentMenu } = this.data
    if (!currentMenu) return
    removeRecipeFromMenu(currentMenu.id, recipeId)
    this.loadMenuDetail()
    wx.showToast({ title: '已移出菜单', icon: 'none' })
  },

  showCreate() {
    this.setData({ showCreatePopup: true, newMenuName: '' })
  },

  hideCreate() {
    this.setData({ showCreatePopup: false, newMenuName: '' })
  },

  onNewNameInput(event) {
    this.setData({ newMenuName: event.detail.value })
  },

  confirmCreate() {
    const name = this.data.newMenuName.trim()
    if (!name) return
    createMenu(name)
    this.setData({ showCreatePopup: false, newMenuName: '' })
    this.loadMenus()
  },

  startRename(event) {
    const id = event.currentTarget.dataset.id
    const name = event.currentTarget.dataset.name
    this.setData({
      showRenamePopup: true,
      renamingMenuId: id,
      renamingName: name || '',
    })
  },

  onRenamingNameInput(event) {
    this.setData({ renamingName: event.detail.value })
  },

  confirmRename() {
    const { renamingMenuId, renamingName } = this.data
    if (!renamingMenuId) return
    renameMenu(renamingMenuId, renamingName.trim() || undefined)
    this.setData({ showRenamePopup: false, renamingMenuId: '', renamingName: '' })
    this.loadMenus()
  },

  hideRename() {
    this.setData({ showRenamePopup: false, renamingMenuId: '', renamingName: '' })
  },

  deleteMenu(event) {
    const id = event.currentTarget.dataset.id
    wx.showModal({
      title: '删除菜单',
      content: '确定要删除这个菜单吗？',
      confirmColor: '#c9583a',
      success: (res) => {
        if (!res.confirm) return
        deleteMenu(id)
        this.loadMenus()
      },
    })
  },

  showAddRecipe() {
    const { currentMenu } = this.data
    if (!currentMenu) return
    const allRecipes = getAllRecipes()
    const existingIds = new Set(currentMenu.recipeIds || [])
    const addableRecipes = allRecipes
      .filter((r) => !existingIds.has(r.id))
      .map((r) => ({
        ...r,
        categoryIcon: categoryIconMap[r.category] || categoryIconMap['hot-dish'],
      }))
    this.setData({ showAddRecipePopup: true, addableRecipes })
  },

  hideAddRecipe() {
    this.setData({ showAddRecipePopup: false, addableRecipes: [] })
  },

  addRecipe(event) {
    const recipeId = event.currentTarget.dataset.id
    const { currentMenu } = this.data
    if (!currentMenu || !recipeId) return
    addRecipeToMenu(currentMenu.id, recipeId)
    this.setData({ showAddRecipePopup: false, addableRecipes: [] })
    this.loadMenuDetail()
    wx.showToast({ title: '已添加', icon: 'success' })
  },

  generateShopping() {
    const { currentMenu } = this.data
    if (!currentMenu) return
    const recipes = getMenuRecipes(currentMenu.id)
    if (recipes.length === 0) {
      wx.showToast({ title: '菜单是空的', icon: 'none' })
      return
    }
    addRecipesToShoppingList(recipes)
    wx.showToast({ title: '已生成清单', icon: 'success' })
    setTimeout(() => wx.navigateTo({ url: '/pages/shopping/shopping' }), 300)
  },

  addToMealPlan() {
    const { currentMenu } = this.data
    if (!currentMenu) return
    const recipes = getMenuRecipes(currentMenu.id)
    if (recipes.length === 0) {
      wx.showToast({ title: '菜单是空的', icon: 'none' })
      return
    }
    const { addMealPlanRecipe } = require('../../utils/storage')
    const now = new Date()
    const day = now.getDay()
    const dayIndex = day === 0 ? 6 : day - 1
    recipes.forEach((recipe) => {
      addMealPlanRecipe(dayIndex, 'dinner', recipe)
    })
    wx.showToast({ title: `已添加 ${recipes.length} 道菜到今天晚餐`, icon: 'success' })
  },

  goHome() {
    wx.reLaunch({ url: '/pages/home/home' })
  },

  noop() {},
})
