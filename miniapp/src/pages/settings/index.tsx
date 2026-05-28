import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { Icon, type IconName } from '@/components/Icon'
import './index.scss'

const themeOptions: { value: 'light' | 'dark' | 'system'; label: string; icon: IconName }[] = [
  { value: 'light', label: '浅色', icon: 'sun' },
  { value: 'dark', label: '深色', icon: 'moon' },
  { value: 'system', label: '跟随系统', icon: 'monitor' },
]

export default function SettingsPage() {
  const { isLoggedIn, user, logout, syncNow } = useAuthStore()
  const { theme, setTheme } = useThemeStore()
  const [syncing, setSyncing] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    Taro.showLoading({ title: '同步中...' })
    try {
      await syncNow()
      Taro.showToast({ title: '同步完成', icon: 'success' })
    } catch {
      Taro.showToast({ title: '同步失败', icon: 'error' })
    } finally {
      setSyncing(false)
      Taro.hideLoading()
    }
  }

  const handleLogout = () => {
    Taro.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          logout()
          Taro.showToast({ title: '已退出', icon: 'success' })
        }
      },
    })
  }

  const menuGroups = [
    {
      title: '我的内容',
      items: [
        { url: '/pages/collection/index', icon: 'heart', label: '我的收藏夹' },
        { url: '/pages/shopping/index', icon: 'shoppingCart', label: '购物清单' },
      ],
    },
    {
      title: '设置',
      items: isLoggedIn
        ? [{ url: '/pages/data-manage/index', icon: 'database', label: '数据管理' }]
        : [
            { url: '/pages/login/index', icon: 'logIn', label: '登录 / 注册' },
            { url: '/pages/data-manage/index', icon: 'database', label: '数据管理' },
          ],
    },
  ]

  return (
    <View className="settings-page">
      {/* Sticky Header */}
      <View className="settings-header">
        <Text className="settings-title">我的</Text>
      </View>

      {/* Profile Card */}
      <View className="profile-card">
        <View className="profile-avatar">
          <Icon name="chefHat" size={48} color="#78716c" />
        </View>
        <View className="profile-info">
          <Text className="profile-name">
            {isLoggedIn ? (user?.nickname ?? '美食家') : '未登录'}
          </Text>
          <Text className="profile-email">
            {isLoggedIn ? user?.email : '登录后可同步数据到云端'}
          </Text>
        </View>
        {isLoggedIn && (
          <View className={`sync-btn ${syncing ? 'syncing' : ''}`} onClick={!syncing ? handleSync : undefined}>
            <Icon name="refreshCw" size={32} color="#78716c" />
          </View>
        )}
      </View>

      {/* Theme Selector */}
      <View className="section">
        <Text className="section-label">外观</Text>
        <View className="theme-card">
          {themeOptions.map(({ value, label, icon }) => (
            <View
              key={value}
              className={`theme-btn ${theme === value ? 'active' : ''}`}
              onClick={() => setTheme(value)}
            >
              <Icon name={icon} size={32} color={theme === value ? '#c9583a' : '#78716c'} />
              <Text className="theme-btn-text">{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Menu Groups */}
      {menuGroups.map((group) => (
        <View key={group.title} className="section">
          <Text className="section-label">{group.title}</Text>
          <View className="menu-card">
            {group.items.map((item, i) => (
              <View
                key={item.label}
                className={`menu-item ${i > 0 ? 'has-border' : ''}`}
                onClick={() => Taro.navigateTo({ url: item.url })}
              >
                <View className="menu-item-left">
                  <Icon name={item.icon} size={36} color="#78716c" />
                  <Text className="menu-item-label">{item.label}</Text>
                </View>
                <Icon name="chevronRight" size={32} color="#a8a29e" />
              </View>
            ))}
          </View>
        </View>
      ))}

      {/* Logout */}
      {isLoggedIn && (
        <View className="logout-btn" onClick={handleLogout}>
          <Icon name="logOut" size={36} color="#ef4444" />
          <Text className="logout-btn-text">退出登录</Text>
        </View>
      )}

      {/* Footer */}
      <View className="footer">
        <Text className="footer-text">菜谱助手 v1.0.0</Text>
        <Text className="footer-sub">你的私人美食管家</Text>
      </View>
    </View>
  )
}
