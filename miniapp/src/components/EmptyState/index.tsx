import { View, Text } from '@tarojs/components'
import { Icon, type IconName } from '@/components/Icon'
import './index.scss'

interface EmptyStateProps {
  icon: IconName
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon, title, description, action, secondaryAction }: EmptyStateProps) {
  return (
    <View className='empty-state'>
      <View className='empty-state__icon'>
        <Icon name={icon} size={64} color='#a8a08e' />
      </View>
      <Text className='empty-state__title'>{title}</Text>
      {description && (
        <Text className='empty-state__desc'>{description}</Text>
      )}
      {action && (
        <View className='empty-state__action' onClick={action.onClick}>
          <Text className='empty-state__action-text'>{action.label}</Text>
        </View>
      )}
      {secondaryAction && (
        <View className='empty-state__secondary' onClick={secondaryAction.onClick}>
          <Text className='empty-state__secondary-text'>{secondaryAction.label}</Text>
        </View>
      )}
    </View>
  )
}
