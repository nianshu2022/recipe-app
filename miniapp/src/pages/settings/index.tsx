import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { useUIStore } from '@/stores/uiStore'
import { Icon, type IconName } from '@/components/Icon'
import './index.scss'

type Theme = 'light' | 'dark' | 'system'

const THEME_OPTIONS: { value: Theme; label: string; icon: IconName }[] = [
  { value: 'light', label: '浅色', icon: 'sun' },
  { value: 'dark', label: '深色', icon: 'moon' },
  { value: 'system', label: '跟随系统', icon: 'monitor' },
]

interface MenuItem {
  icon: IconName
  label: string
  path?: string
  action?: () => void
}

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const loadAuth = useAuthStore((s) => s.loadAuth)
  const logout = useAuthStore((s) => s.logout)
  const theme = useThemeStore((s) => s.theme)
  const loadTheme = useThemeStore((s) => s.loadTheme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const showConfirm = useUIStore((s) => s.showConfirm)
  const showToast = useUIStore((s) => s.showToast)

  useDidShow(() => {
    loadAuth()
    loadTheme()
  })

  const handleLogout = async () => {
    const confirmed = await showConfirm({
      title: '退出登录',
      message: '确定退出当前账号吗？',
      danger: true,
    })
    if (confirmed) {
      logout()
      showToast('已退出登录', 'success')
    }
  }

  const menuGroups: { title: string; items: MenuItem[] }[] = [
    {
      title: '我的内容',
      items: [
        { icon: 'heart', label: '我的收藏', path: '/pages/collection/index' },
        { icon: 'shoppingCart', label: '购物清单', path: '/pages/shopping/index' },
      ],
    },
    {
      title: '设置',
      items: user
        ? [
            { icon: 'database' as IconName, label: '数据管理', path: '/pages/data-manage/index' },
          ]
        : [
            { icon: 'logIn' as IconName, label: '登录 / 注册', path: '/pages/login/index' },
            { icon: 'database' as IconName, label: '数据管理', path: '/pages/data-manage/index' },
          ],
    },
  ]

  const handleMenuClick = (item: MenuItem) => {
    if (item.path) {
      if (item.path.includes('tabBar')) {
        Taro.switchTab({ url: item.path })
      } else {
        Taro.navigateTo({ url: item.path })
      }
    }
    item.action?.()
  }

  return (
    <View className='settings-page'>
      <View className='settings-header'>
        <Text className='settings-header__title'>小窝</Text>
      </View>

      <View className='settings-profile'>
        <View className='settings-profile__avatar'>
          <Icon name='chefHat' size={56} color='#c9583a' />
        </View>
        <View className='settings-profile__info'>
          <Text className='settings-profile__name'>{user?.nickname || '未登录'}</Text>
          {user ? (
            <Text className='settings-profile__email'>{user.email}</Text>
          ) : (
            <Text className='settings-profile__email'>登录后可同步数据到云端</Text>
          )}
        </View>
        {user && (
          <View className='settings-profile__sync'>
            <Icon name='refreshCw' size={36} color='#6b6355' />
          </View>
        )}
      </View>

      <View className='settings-theme'>
        <Text className='settings-theme__title'>主题</Text>
        <View className='settings-theme__options'>
          {THEME_OPTIONS.map((opt) => (
            <View
              key={opt.value}
              className={`settings-theme__option ${theme === opt.value ? 'settings-theme__option--active' : ''}`}
              onClick={() => setTheme(opt.value)}
            >
              <Icon name={opt.icon} size={32} color={theme === opt.value ? '#c9583a' : '#6b6355'} />
              <Text className='settings-theme__label'>{opt.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {menuGroups.map((group) => (
        <View key={group.title} className='settings-group'>
          <Text className='settings-group__title'>{group.title}</Text>
          <View className='settings-group__card'>
            {group.items.map((item, index) => (
              <View
                key={item.label}
                className={`settings-item ${index < group.items.length - 1 ? 'settings-item--bordered' : ''}`}
                onClick={() => handleMenuClick(item)}
              >
                <Icon name={item.icon} size={40} color='#6b6355' />
                <Text className='settings-item__label'>{item.label}</Text>
                <Icon name='chevronRight' size={32} color='#a8a08e' />
              </View>
            ))}
          </View>
        </View>
      ))}

      {user && (
        <View className='settings-logout' onClick={handleLogout}>
          <Icon name='logOut' size={36} color='#c44b4b' />
          <Text className='settings-logout__text'>退出登录</Text>
        </View>
      )}

      <View className='settings-footer'>
        <Text className='settings-footer__text'>知味 v1.0.0</Text>
      </View>
    </View>
  )
}
