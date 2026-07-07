const THEME_KEY = 'zhiwei_theme'

function getTheme() {
  return wx.getStorageSync(THEME_KEY) || 'system'
}

function resolveTheme(theme = getTheme()) {
  if (theme !== 'system') return theme
  const systemInfo = wx.getSystemInfoSync()
  return systemInfo.theme === 'dark' ? 'dark' : 'light'
}

function applyTheme(theme = getTheme()) {
  const resolved = resolveTheme(theme)
  const isDark = resolved === 'dark'
  wx.setNavigationBarColor({
    frontColor: isDark ? '#ffffff' : '#000000',
    backgroundColor: isDark ? '#1f1d1b' : '#faf9f7',
  })
  if (wx.setBackgroundColor) {
    wx.setBackgroundColor({
      backgroundColor: isDark ? '#1f1d1b' : '#faf9f7',
      backgroundColorTop: isDark ? '#1f1d1b' : '#faf9f7',
      backgroundColorBottom: isDark ? '#1f1d1b' : '#faf9f7',
    })
  }
  return resolved
}

function getThemeClass(theme = getTheme()) {
  return `theme-${resolveTheme(theme)}`
}

function getThemeState(theme = getTheme()) {
  const resolvedTheme = resolveTheme(theme)
  return {
    resolvedTheme,
    themeClass: `theme-${resolvedTheme}`,
  }
}

function setTheme(theme) {
  wx.setStorageSync(THEME_KEY, theme)
  return applyTheme(theme)
}

module.exports = {
  THEME_KEY,
  applyTheme,
  getTheme,
  getThemeClass,
  getThemeState,
  resolveTheme,
  setTheme,
}
