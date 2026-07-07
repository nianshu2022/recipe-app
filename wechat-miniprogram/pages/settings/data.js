const {
  clearAllData,
  exportData,
  getDataStats,
  importData,
} = require('../../utils/storage')
const { getNavMetrics } = require('../../utils/nav')

Page({
  data: {
    stats: {
      recipes: 0,
      collections: 0,
      cookingRecords: 0,
    },
    statusBarHeight: 24,
    navBarHeight: 88,
    menuButtonReserve: 104,
    importText: '',
    message: '',
    messageType: '',
  },

  onShow() {
    this.setData(getNavMetrics())
    this.loadStats()
  },

  backToSettings() {
    wx.navigateBack({
      fail: () => wx.reLaunch({ url: '/pages/settings/settings' }),
    })
  },

  loadStats() {
    this.setData({ stats: getDataStats() })
  },

  copyBackup() {
    wx.setClipboardData({
      data: exportData(),
      success: () => {
        this.setData({ message: '备份 JSON 已复制到剪贴板', messageType: 'success' })
      },
    })
  },

  onImportInput(event) {
    this.setData({ importText: event.detail.value, message: '', messageType: '' })
  },

  pasteFromClipboard() {
    wx.getClipboardData({
      success: (res) => {
        this.setData({ importText: res.data || '' })
      },
    })
  },

  importBackup() {
    const text = this.data.importText.trim()
    if (!text) {
      this.setData({ message: '请先粘贴备份 JSON', messageType: 'error' })
      return
    }
    const result = importData(text)
    this.setData({
      message: result.message,
      messageType: result.success ? 'success' : 'error',
      importText: result.success ? '' : this.data.importText,
    })
    this.loadStats()
  },

  clearData() {
    wx.showModal({
      title: '清除所有数据',
      content: '确定要清除所有本地数据吗？此操作不可撤销。',
      confirmText: '清除',
      confirmColor: '#c44b4b',
      success: (res) => {
        if (!res.confirm) return
        clearAllData()
        this.loadStats()
        this.setData({ message: '本地数据已清除', messageType: 'success', importText: '' })
      },
    })
  },
})
