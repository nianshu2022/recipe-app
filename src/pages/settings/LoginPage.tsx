import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Lock, User, Shield } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

type LoginMode = 'password' | 'code'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, register, loading, sendCode, loginWithCode } = useAuthStore()
  const [isRegister, setIsRegister] = useState(false)
  const [mode, setMode] = useState<LoginMode>('code')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const handleSendCode = useCallback(async () => {
    if (!email.trim()) {
      setError('请先填写邮箱')
      return
    }
    setError('')
    const ok = await sendCode(email.trim())
    if (ok) {
      setCodeSent(true)
      setCountdown(60)
      setError('')
    } else {
      setError('验证码发送失败，请稍后重试')
    }
  }, [email, sendCode])

  const handleSubmit = async () => {
    setError('')
    if (!email.trim()) {
      setError('请填写邮箱')
      return
    }

    if (mode === 'code') {
      if (!code.trim() || code.trim().length !== 6) {
        setError('请填写6位验证码')
        return
      }
      const ok = await loginWithCode(email.trim(), code.trim())
      if (ok) {
        navigate('/settings', { replace: true })
      } else {
        setError('验证码无效或已过期')
      }
    } else {
      if (!password.trim()) {
        setError('请填写密码')
        return
      }
      let ok: boolean
      if (isRegister) {
        ok = await register(email.trim(), password, nickname.trim() || undefined)
      } else {
        ok = await login(email.trim(), password)
      }
      if (ok) {
        navigate('/settings', { replace: true })
      } else {
        setError(isRegister ? '注册失败，邮箱可能已被使用' : '邮箱或密码错误')
      }
    }
  }

  const inputCls =
    'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] py-3 pl-11 pr-4 text-sm text-[var(--color-text)] shadow-xs outline-none transition-all duration-200 placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-stone-300)] focus:ring-2 focus:ring-[var(--color-border-subtle)]'

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Link
          to="/settings"
          replace
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-bg-card)] shadow-xs transition-all duration-200 hover:shadow-sm active:scale-95"
        >
          <ArrowLeft size={18} className="text-[var(--color-text-secondary)]" />
        </Link>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-text)]">
          {isRegister ? '注册' : '登录'}
        </h1>
      </div>

      <div className="rounded-2xl bg-[var(--color-bg-card)] p-6 shadow-xs">
        <div className="space-y-4">
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="邮箱地址"
              className={inputCls}
            />
          </div>

          {isRegister && (
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="昵称（选填）"
                className={inputCls}
              />
            </div>
          )}

          {mode === 'code' ? (
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Shield size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder="6位验证码"
                  maxLength={6}
                  className={inputCls}
                />
              </div>
              <button
                onClick={handleSendCode}
                disabled={countdown > 0}
                className="whitespace-nowrap rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 text-sm font-medium text-[var(--color-text-secondary)] shadow-xs transition-all duration-200 hover:bg-[var(--color-bg-subtle)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {countdown > 0 ? `${countdown}s` : codeSent ? '重新发送' : '获取验证码'}
              </button>
            </div>
          ) : (
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="密码"
                className={inputCls}
              />
            </div>
          )}

          {error && (
            <p className="text-center text-sm text-red-500">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-xl bg-[var(--color-primary)] py-3 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? '处理中...' : isRegister ? '注册' : '登录'}
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => {
              setMode(mode === 'code' ? 'password' : 'code')
              setIsRegister(false)
              setError('')
              setCode('')
              setPassword('')
            }}
            className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-secondary)]"
          >
            {mode === 'code' ? '密码登录' : '验证码登录'}
          </button>
          <button
            onClick={() => { setIsRegister(!isRegister); setError('') }}
            className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-secondary)]"
          >
            {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-[var(--color-text-muted)]">
        登录后可多设备同步菜谱数据
      </p>
    </div>
  )
}
