import { View, Text } from '@tarojs/components'
import { useUIStore } from '@/stores/uiStore'
import { Icon } from '@/components/Icon'
import './index.scss'

export function Toast() {
  const toast = useUIStore((s) => s.toast)

  if (!toast.visible) return null

  const iconMap = {
    success: 'check' as const,
    error: 'alertTriangle' as const,
    info: 'lightbulb' as const,
  }

  return (
    <View className={`toast toast--${toast.type}`}>
      <Icon name={iconMap[toast.type]} size={32} color='#ffffff' />
      <Text className='toast__text'>{toast.message}</Text>
    </View>
  )
}
