const { getThemeState } = require('../../utils/theme')

const items = [
  {
    key: 'home',
    page: '/pages/home/home',
    text: '寻味',
    icon: '/assets/lucide/utensils-crossed.svg',
    activeIcon: '/assets/lucide/utensils-crossed-active.svg',
  },
  {
    key: 'meal',
    page: '/pages/meal-plan/meal-plan',
    text: '七日味',
    icon: '/assets/lucide/calendar-range.svg',
    activeIcon: '/assets/lucide/calendar-range-active.svg',
  },
  {
    key: 'blind',
    page: '/pages/blind-box/blind-box',
    text: '味遇',
    icon: '/assets/lucide/sparkles-white.svg',
    activeIcon: '/assets/lucide/sparkles-white.svg',
    center: true,
  },
  {
    key: 'collection',
    page: '/pages/collection/collection',
    text: '收藏',
    icon: '/assets/lucide/heart.svg',
    activeIcon: '/assets/lucide/heart-active.svg',
  },
  {
    key: 'settings',
    page: '/pages/settings/settings',
    text: '小窝',
    icon: '/assets/lucide/user.svg',
    activeIcon: '/assets/lucide/user-active.svg',
  },
]

Component({
  properties: {
    active: {
      type: String,
      value: 'home',
    },
  },

  data: {
    items,
    themeClass: 'theme-light',
  },

  lifetimes: {
    attached() {
      this.refreshTheme()
    },
  },

  pageLifetimes: {
    show() {
      this.refreshTheme()
    },
  },

  methods: {
    refreshTheme() {
      this.setData(getThemeState())
    },

    switchTab(event) {
      const page = event.currentTarget.dataset.page
      if (!page) return
      wx.reLaunch({ url: page })
    },
  },
})
