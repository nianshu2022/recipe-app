const app = getApp()
const { showToast, showConfirm, guessCategory } = require('../../utils/util')

Page({
  data: {
    list: null,
    grouped: {},
    categories: [],
    checkedCount: 0,
    totalCount: 0,
    progress: 0,
    showAdd: false,
    newName: '',
    expandedCats: {}
  },

  onLoad(options) {
    this.loadList()
  },

  onShow() {
    this.loadList()
  },

  loadList() {
    const lists = app.globalData.shoppingLists || []
    const list = lists[0] || null
    if (!list) { this.setData({ list: null }); return }

    const grouped = {}
    for (const item of list.items) {
      if (!grouped[item.category]) grouped[item.category] = []
      grouped[item.category].push(item)
    }
    const categories = Object.keys(grouped)
    const checkedCount = list.items.filter(i => i.checked).length
    const totalCount = list.items.length
    const progress = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0
    this.setData({ list, grouped, categories, checkedCount, totalCount, progress })
  },

  onToggleItem(e) {
    const itemId = e.currentTarget.dataset.id
    const lists = app.globalData.shoppingLists
    const list = lists[0]
    const item = list.items.find(i => i.id === itemId)
    if (item) {
      item.checked = !item.checked
      list.items.sort((a, b) => (a.checked === b.checked ? 0 : a.checked ? 1 : -1))
      list.updatedAt = new Date().toISOString()
      app.globalData.shoppingLists = lists
      app.saveShoppingLists()
      this.loadList()
    }
  },

  onShowAdd() { this.setData({ showAdd: true }) },
  onHideAdd() { this.setData({ showAdd: false, newName: '' }) },
  onNewNameInput(e) { this.setData({ newName: e.detail.value }) },

  onAddItem() {
    const { newName, list } = this.data
    if (!newName.trim() || !list) return
    list.items.push({
      id: 'item_' + Date.now(),
      name: newName.trim(),
      amount: 0,
      unit: '',
      category: guessCategory(newName.trim()),
      checked: false
    })
    list.updatedAt = new Date().toISOString()
    app.globalData.shoppingLists = app.globalData.shoppingLists
    app.saveShoppingLists()
    this.setData({ showAdd: false, newName: '' })
    this.loadList()
  },

  onRemoveItem(e) {
    const itemId = e.currentTarget.dataset.id
    const lists = app.globalData.shoppingLists
    const list = lists[0]
    list.items = list.items.filter(i => i.id !== itemId)
    list.updatedAt = new Date().toISOString()
    app.globalData.shoppingLists = lists
    app.saveShoppingLists()
    this.loadList()
  },

  onToggleCat(e) {
    const cat = e.currentTarget.dataset.cat
    const expandedCats = { ...this.data.expandedCats }
    expandedCats[cat] = !expandedCats[cat]
    this.setData({ expandedCats })
  },

  async onClearChecked() {
    const lists = app.globalData.shoppingLists
    const list = lists[0]
    list.items = list.items.filter(i => !i.checked)
    list.updatedAt = new Date().toISOString()
    app.globalData.shoppingLists = lists
    app.saveShoppingLists()
    this.loadList()
    showToast('已清除')
  },

  async onDeleteList() {
    const confirmed = await showConfirm('确定删除这个购物清单吗？')
    if (!confirmed) return
    app.globalData.shoppingLists = []
    app.saveShoppingLists()
    this.loadList()
    showToast('已删除')
  }
})
