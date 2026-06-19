const app = getApp()
const { showToast, showConfirm } = require('../../utils/util')

Page({
  data: {
    items: [],
    newItem: ''
  },

  onLoad() {
    this.loadItems()
  },

  onShow() {
    this.loadItems()
  },

  loadItems() {
    this.setData({
      items: app.globalData.shoppingLists || []
    })
  },

  onInput(e) {
    this.setData({ newItem: e.detail.value })
  },

  onAdd() {
    const name = this.data.newItem.trim()
    if (!name) {
      showToast('请输入食材名称')
      return
    }

    const items = [...this.data.items, {
      id: 'item_' + Date.now(),
      name,
      checked: false
    }]
    
    app.globalData.shoppingLists = items
    app.saveShoppingLists()
    this.setData({ items, newItem: '' })
  },

  onToggle(e) {
    const { index } = e.currentTarget.dataset
    const items = [...this.data.items]
    items[index].checked = !items[index].checked
    
    app.globalData.shoppingLists = items
    app.saveShoppingLists()
    this.setData({ items })
  },

  onDelete(e) {
    const { index } = e.currentTarget.dataset
    const items = [...this.data.items]
    items.splice(index, 1)
    
    app.globalData.shoppingLists = items
    app.saveShoppingLists()
    this.setData({ items })
  },

  async onClear() {
    const confirmed = await showConfirm('确定清除所有已购项目吗？')
    if (confirmed) {
      const items = this.data.items.filter(item => !item.checked)
      app.globalData.shoppingLists = items
      app.saveShoppingLists()
      this.setData({ items })
      showToast('已清除')
    }
  }
})
