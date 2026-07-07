const { applyTheme } = require('./utils/theme')

App({
  globalData: {
    appName: '知味',
  },

  onLaunch() {
    applyTheme()
  },

  onShow() {
    applyTheme()
  },
})
