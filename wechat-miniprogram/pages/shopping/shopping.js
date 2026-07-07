const {
  addShoppingItem,
  clearCheckedShoppingItems,
  deleteShoppingList,
  getCurrentShoppingList,
  getShoppingLists,
  removeShoppingItem,
  setCurrentShoppingList,
  toggleShoppingItem,
} = require('../../utils/storage')
const { getNavMetrics } = require('../../utils/nav')

function formatItem(item) {
  return {
    ...item,
    amountText: Number(item.amount || 0) > 0 ? `${item.amount}${item.unit}` : '',
  }
}

function groupItems(items, expandedCategories) {
  const groups = items.reduce((acc, item) => {
    const category = item.category || '其他'
    if (!acc[category]) acc[category] = []
    acc[category].push(formatItem(item))
    return acc
  }, {})

  return Object.keys(groups).map((category) => {
    const categoryItems = groups[category]
    return {
      category,
      checkedCount: categoryItems.filter((item) => item.checked).length,
      totalCount: categoryItems.length,
      expanded: expandedCategories[category] !== false,
      items: categoryItems,
    }
  })
}

Page({
  data: {
    lists: [],
    listOptions: [],
    currentListLabel: '',
    currentListId: '',
    currentListIndex: 0,
    groupedItems: [],
    checkedCount: 0,
    totalCount: 0,
    progress: 0,
    showAdd: false,
    newName: '',
    expandedCategories: {},
    statusBarHeight: 24,
    navBarHeight: 88,
    menuButtonReserve: 104,
  },

  onShow() {
    this.setData(getNavMetrics())
    this.loadItems()
  },

  loadItems() {
    const lists = getShoppingLists()
    const currentList = getCurrentShoppingList()
    const currentListId = currentList.id || ''
    const currentListIndex = Math.max(0, lists.findIndex((list) => list.id === currentListId))
    const items = currentList.items || []
    const checkedCount = items.filter((item) => item.checked).length
    const totalCount = items.length
    this.setData({
      lists,
      listOptions: lists.map((list, index) => `清单 ${index + 1}（${list.items.length}项）`),
      currentListLabel: lists[currentListIndex] ? `清单 ${currentListIndex + 1}（${lists[currentListIndex].items.length}项）` : '',
      currentListId,
      currentListIndex,
      groupedItems: groupItems(items, this.data.expandedCategories),
      checkedCount,
      totalCount,
      progress: totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0,
    })
  },

  back() {
    wx.navigateBack({
      fail: () => wx.reLaunch({ url: '/pages/home/home' }),
    })
  },

  onListChange(event) {
    const index = Number(event.detail.value)
    const list = this.data.lists[index]
    if (!list) return
    setCurrentShoppingList(list.id)
    this.setData({ expandedCategories: {} }, () => this.loadItems())
  },

  showAddInput() {
    this.setData({ showAdd: true, newName: '' })
  },

  hideAddInput() {
    this.setData({ showAdd: false, newName: '' })
  },

  onNewNameInput(event) {
    this.setData({ newName: event.detail.value })
  },

  addItem() {
    const name = this.data.newName.trim()
    if (!name) return
    addShoppingItem(name)
    this.setData({ showAdd: false, newName: '' })
    this.loadItems()
  },

  toggleCategory(event) {
    const category = event.currentTarget.dataset.category
    this.setData({
      [`expandedCategories.${category}`]: this.data.expandedCategories[category] === false,
    }, () => this.loadItems())
  },

  toggleItem(event) {
    const id = event.currentTarget.dataset.id
    toggleShoppingItem(id)
    this.loadItems()
  },

  clearChecked() {
    if (this.data.checkedCount === 0) return
    clearCheckedShoppingItems()
    this.loadItems()
  },

  removeItem(event) {
    removeShoppingItem(event.currentTarget.dataset.id)
    this.loadItems()
  },

  deleteCurrentList() {
    if (!this.data.currentListId) return
    wx.showModal({
      title: '删除清单',
      content: '确定要删除这个购物清单吗？',
      confirmColor: '#c9583a',
      success: (res) => {
        if (!res.confirm) return
        deleteShoppingList(this.data.currentListId)
        this.setData({ expandedCategories: {} }, () => this.loadItems())
      },
    })
  },

  goHome() {
    wx.reLaunch({ url: '/pages/home/home' })
  },
})
