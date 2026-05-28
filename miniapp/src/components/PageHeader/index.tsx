import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { PropsWithChildren } from 'react'
import './index.scss'

interface Props {
  title?: string
  showBack?: boolean
  rightContent?: React.ReactNode
}

export function PageHeader({ title, showBack = false, rightContent, children }: PropsWithChildren<Props>) {
  return (
    <View className="page-header">
      <View className="page-header-left">
        {showBack && (
          <View className="back-btn" onClick={() => Taro.navigateBack()}>
            <Text className="back-icon">&#8592;</Text>
          </View>
        )}
        {title && <Text className="page-header-title">{title}</Text>}
      </View>
      {rightContent && <View className="page-header-right">{rightContent}</View>}
      {children}
    </View>
  )
}
