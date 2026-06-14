import { useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { Icon } from '@/components/Icon'
import './index.scss'

export default function LoginPage() {
  const login = useAuthStore((s) => s.login)
  const register = useAuthStore((s) => s.register)
  const loading = useAuthStore((s) => s.loading)
  const showToast = useUIStore((s) => s.showToast)

  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      showToast('请填写邮箱和密码', 'error')
      return
    }

    let result
    if (isRegister) {
      result = await register(email.trim(), password, nickname.trim() || email.split('@')[0])
    } else {
      result = await login(email.trim(), password)
    }

    if (result.success) {
      showToast(result.message, 'success')
      Taro.navigateBack()
    } else {
      showToast(result.message, 'error')
    }
  }

  return (
    <View className='login-page'>
      <View className='login-header'>
        <View className='login-header__back' onClick={() => Taro.navigateBack()}>
          <Icon name='arrowLeft' size={40} color='#252220' />
        </View>
      </View>

      <View className='login-content'>
        <View className='login-brand'>
          <Icon name='chefHat' size={80} color='#c9583a' />
          <Text className='login-brand__name'>知味</Text>
          <Text className='login-brand__tagline'>{isRegister ? '创建账号' : '欢迎回来'}</Text>
        </View>

        <View className='login-form'>
          {isRegister && (
            <View className='login-field'>
              <Icon name='user' size={36} color='#a8a08e' />
              <Input
                className='login-field__input'
                placeholder='昵称'
                value={nickname}
                onInput={(e) => setNickname(e.detail.value)}
              />
            </View>
          )}
          <View className='login-field'>
            <Icon name='logIn' size={36} color='#a8a08e' />
            <Input
              className='login-field__input'
              placeholder='邮箱'
              type='text'
              value={email}
              onInput={(e) => setEmail(e.detail.value)}
            />
          </View>
          <View className='login-field'>
            <Icon name='database' size={36} color='#a8a08e' />
            <Input
              className='login-field__input'
              placeholder='密码'
              type='text'
              password
              value={password}
              onInput={(e) => setPassword(e.detail.value)}
            />
          </View>

          <View className='login-submit' onClick={handleSubmit}>
            <Text className='login-submit__text'>
              {loading ? '处理中...' : isRegister ? '注册' : '登录'}
            </Text>
          </View>

          <View className='login-toggle' onClick={() => setIsRegister(!isRegister)}>
            <Text className='login-toggle__text'>
              {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  )
}
