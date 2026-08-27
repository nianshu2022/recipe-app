const {
  getCollections,
  createCollection,
  renameCollection,
  deleteCollection,
  getCollectionRecipes,
  toggleFavoriteRecipe,
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

function formatCollections(collections, recipesById) {
  return collections.map((collection) => {
    const recipes = collection.recipeIds
      .map((id) => recipesById.get(id))
      .filter(Boolean)
    const coverRecipe = recipes[0]
    return {
      ...collection,
      recipeCount: recipes.length,
      coverColor: coverRecipe ? coverRecipe.coverColor : '#f5f3ef',
      coverImage: coverRecipe ? coverRecipe.coverImage : null,
      categoryIcon: coverRecipe
        ? (categoryIconMap[coverRecipe.category] || categoryIconMap['hot-dish'])
        : '/assets/lucide/heart.svg',
    }
  })
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
    collections: [],
    viewMode: 'list', // 'list' or 'detail'
    currentCollection: null,
    recipes: [],
    showCreatePopup: false,
    showRenamePopup: false,
    newCollectionName: '',
    renamingCollectionId: '',
    renamingName: '',
    statusBarHeight: 24,
    contentTopInset: 42,
  },

  onShow() {
    this.setData(getNavMetrics())
    if (this.data.viewMode === 'list') {
      this.loadCollections()
    } else {
      this.loadCollectionDetail()
    }
  },

  loadCollections() {
    const collections = getCollections()
    const allRecipes = require('../../utils/storage').getAllRecipes()
    const recipesById = new Map(allRecipes.map((r) => [r.id, r]))
    this.setData({ collections: formatCollections(collections, recipesById) })
  },

  loadCollectionDetail() {
    const { currentCollection } = this.data
    if (!currentCollection) return
    const recipes = getCollectionRecipes(currentCollection.id)
    this.setData({ recipes: formatRecipes(recipes) })
  },

  back() {
    if (this.data.viewMode === 'detail') {
      this.setData({ viewMode: 'list', currentCollection: null, recipes: [] })
      this.loadCollections()
    } else {
      wx.navigateBack({
        fail: () => wx.reLaunch({ url: '/pages/settings/settings' }),
      })
    }
  },

  openCollection(event) {
    const id = event.currentTarget.dataset.id
    const collections = getCollections()
    const allRecipes = require('../../utils/storage').getAllRecipes()
    const recipesById = new Map(allRecipes.map((r) => [r.id, r]))
    const formatted = formatCollections(collections, recipesById)
    const collection = formatted.find((c) => c.id === id)
    if (!collection) return
    this.setData({ viewMode: 'detail', currentCollection: collection }, () => {
      this.loadCollectionDetail()
    })
  },

  openRecipe(event) {
    wx.navigateTo({
      url: `/pages/recipe/detail?id=${event.currentTarget.dataset.id}`,
    })
  },

  removeFavorite(event) {
    const recipeId = event.currentTarget.dataset.id
    const { currentCollection } = this.data
    if (currentCollection) {
      const { removeRecipeFromCollection } = require('../../utils/storage')
      removeRecipeFromCollection(currentCollection.id, recipeId)
      this.loadCollectionDetail()
    }
  },

  showCreate() {
    this.setData({ showCreatePopup: true, newCollectionName: '' })
  },

  hideCreate() {
    this.setData({ showCreatePopup: false, newCollectionName: '' })
  },

  onNewNameInput(event) {
    this.setData({ newCollectionName: event.detail.value })
  },

  confirmCreate() {
    const name = this.data.newCollectionName.trim()
    if (!name) return
    createCollection(name)
    this.setData({ showCreatePopup: false, newCollectionName: '' })
    this.loadCollections()
  },

  startRename(event) {
    const id = event.currentTarget.dataset.id
    const name = event.currentTarget.dataset.name
    this.setData({
      showRenamePopup: true,
      renamingCollectionId: id,
      renamingName: name || '',
    })
  },

  onRenamingNameInput(event) {
    this.setData({ renamingName: event.detail.value })
  },

  confirmRename() {
    const { renamingCollectionId, renamingName } = this.data
    if (!renamingCollectionId) return
    renameCollection(renamingCollectionId, renamingName.trim() || undefined)
    this.setData({ showRenamePopup: false, renamingCollectionId: '', renamingName: '' })
    this.loadCollections()
  },

  hideRename() {
    this.setData({ showRenamePopup: false, renamingCollectionId: '', renamingName: '' })
  },

  deleteCollection(event) {
    const id = event.currentTarget.dataset.id
    wx.showModal({
      title: '删除收藏夹',
      content: '确定要删除这个收藏夹吗？',
      confirmColor: '#c9583a',
      success: (res) => {
        if (!res.confirm) return
        deleteCollection(id)
        this.loadCollections()
      },
    })
  },

  goHome() {
    wx.reLaunch({ url: '/pages/home/home' })
  },

  noop() {},
})
