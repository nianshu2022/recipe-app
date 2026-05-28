import { View } from '@tarojs/components'
import { PropsWithChildren } from 'react'
import './index.scss'

interface Props {
  noPadding?: boolean
}

export function PageContainer({ children, noPadding }: PropsWithChildren<Props>) {
  return (
    <View className={`page-container ${noPadding ? 'no-padding' : ''}`}>
      {children}
    </View>
  )
}
