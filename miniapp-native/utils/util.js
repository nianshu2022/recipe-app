// 生成唯一ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 格式化日期
function formatDate(date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 格式化时间
function formatTime(date) {
  const d = new Date(date)
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

// 获取难度文本
function getDifficultyText(difficulty) {
  const map = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }
  return map[difficulty] || '简单'
}

// 获取分类文本
function getCategoryText(category) {
  const map = {
    'hot-dish': '热菜',
    'cold-dish': '凉菜',
    'soup': '汤品',
    'staple': '主食',
    'dessert': '甜品',
    'drink': '饮品',
    'snack': '小吃'
  }
  return map[category] || category
}

// 显示提示
function showToast(title, icon = 'none') {
  wx.showToast({
    title,
    icon,
    duration: 2000
  })
}

// 显示加载
function showLoading(title = '加载中...') {
  wx.showLoading({
    title,
    mask: true
  })
}

// 隐藏加载
function hideLoading() {
  wx.hideLoading()
}

// 显示确认对话框
function showConfirm(content, title = '提示') {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      success(res) {
        resolve(res.confirm)
      }
    })
  })
}

module.exports = {
  generateId,
  formatDate,
  formatTime,
  getDifficultyText,
  getCategoryText,
  showToast,
  showLoading,
  hideLoading,
  showConfirm
}
