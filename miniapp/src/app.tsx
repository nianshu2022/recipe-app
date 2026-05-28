import { PropsWithChildren } from 'react'
import { useDidShow } from '@tarojs/taro'
import './app.scss'

function App({ children }: PropsWithChildren) {
  useDidShow(() => {})

  return children
}

export default App
