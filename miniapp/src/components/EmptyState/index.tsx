import { View, Text } from '@tarojs/components'
import { PropsWithChildren } from 'react'
import './index.scss'

interface Props {
  icon?: string
  title: string
  description?: string
}

export function EmptyState({ icon, title, description, children }: PropsWithChildren<Props>) {
  return (
    <View className="empty-state">
      {icon && <Text className="empty-state-icon">{icon}</Text>}
      <Text className="empty-state-title">{title}</Text>
      {description && <Text className="empty-state-desc">{description}</Text>}
      {children && <View className="empty-state-action">{children}</View>}
    </View>
  )
}
