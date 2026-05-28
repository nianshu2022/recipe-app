import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Icon } from '@/components/Icon'
import './index.scss'

export default function LoginPage() {
  const { login, register, loading } = useAuthStore()

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setError('')

    if (!email.trim()) {
      setError('请填写邮箱和密码')
      return
    }

    let success = false
    if (mode === 'login') {
      success = await login(email.trim(), password.trim())
    } else {
      success = await register(email.trim(), password.trim(), nickname.trim())
    }

    if (success) {
      Taro.showToast({ title: mode === 'login' ? '登录成功' : '注册成功', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 1500)
    } else {
      setError(mode === 'login' ? '邮箱或密码错误' : '注册失败，邮箱可能已被使用')
    }
  }

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    setError('')
  }

  return (
    <View className="login-page">
      {/* Header */}
      <View className="login-header">
        <View className="login-back" onClick={() => Taro.navigateBack()}>
          <Icon name="arrowLeft" size={40} color="#44403c" />
        </View>
      </View>

      {/* Title */}
      <View className="login-title-section">
        <Text className="login-app-name">菜谱助手</Text>
        <Text className="login-subtitle">
          {mode === 'login' ? '欢迎回来' : '创建新账号'}
        </Text>
      </View>

      {/* Form */}
      <View className="login-form">
        <View className="form-field">
          <Text className="form-label">邮箱</Text>
          <Input
            className="form-input"
            placeholder="邮箱地址"
            type="text"
            value={email}
            onInput={(e) => setEmail(e.detail.value)}
          />
        </View>

        <View className="form-field">
          <Text className="form-label">密码</Text>
          <Input
            className="form-input"
            placeholder="密码"
            password
            value={password}
            onInput={(e) => setPassword(e.detail.value)}
          />
        </View>

        {mode === 'register' && (
          <View className="form-field">
            <Text className="form-label">昵称</Text>
            <Input
              className="form-input"
              placeholder="昵称（选填）"
              value={nickname}
              onInput={(e) => setNickname(e.detail.value)}
            />
          </View>
        )}

        {error ? (
          <View className="form-error">
            <Text className="form-error-text">{error}</Text>
          </View>
        ) : null}

        <View
          className={`submit-btn ${loading ? 'loading' : ''}`}
          onClick={!loading ? handleSubmit : undefined}
        >
          <Text className="submit-btn-text">
            {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
          </Text>
        </View>

        <View className="toggle-mode" onClick={toggleMode}>
          <Text className="toggle-mode-text">
            {mode === 'login' ? '没有账号？去注册' : '已有账号？去登录'}
          </Text>
        </View>
      </View>
    </View>
  )
}
