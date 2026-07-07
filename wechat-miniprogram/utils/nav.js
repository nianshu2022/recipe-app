const { getThemeState } = require('./theme')

function getNavMetrics() {
  const systemInfo = wx.getSystemInfoSync()
  const menuButton = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null
  const statusBarHeight = systemInfo.statusBarHeight || 24
  const windowWidth = systemInfo.windowWidth || 375
  const fallbackButton = {
    top: statusBarHeight + 6,
    left: windowWidth - 96,
    height: 32,
  }
  const button = menuButton || fallbackButton
  const menuGap = Math.max(4, button.top - statusBarHeight)
  return {
    ...getThemeState(),
    statusBarHeight,
    headerTopInset: statusBarHeight + 8,
    contentTopInset: statusBarHeight + 18,
    navBarHeight: button.height + menuGap * 2 + statusBarHeight,
    menuButtonReserve: Math.max(0, windowWidth - button.left + 8),
  }
}

module.exports = {
  getNavMetrics,
}
