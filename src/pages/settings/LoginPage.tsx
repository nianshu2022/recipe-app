import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Lock, User } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, register, loading } = useAuthStore()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setError('')
    if (!email.trim() || !password.trim()) {
      setError('请填写邮箱和密码')
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

  const inputCls =
    'w-full rounded-xl border border-stone-200 bg-white py-3 pl-11 pr-4 text-sm text-stone-800 shadow-xs outline-none transition-all duration-200 placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-100'

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Link
          to="/settings"
          replace
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-xs transition-all duration-200 hover:shadow-sm active:scale-95"
        >
          <ArrowLeft size={18} className="text-stone-600" />
        </Link>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-stone-900">
          {isRegister ? '注册' : '登录'}
        </h1>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-xs">
        <div className="space-y-4">
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
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
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="昵称（选填）"
                className={inputCls}
              />
            </div>
          )}

          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="密码"
              className={inputCls}
            />
          </div>

          {error && (
            <p className="text-center text-sm text-red-500">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-xl bg-stone-900 py-3 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? '处理中...' : isRegister ? '注册' : '登录'}
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => { setIsRegister(!isRegister); setError('') }}
            className="text-sm text-stone-500 transition-colors hover:text-stone-700"
          >
            {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-stone-400">
        登录后可多设备同步菜谱数据
      </p>
    </div>
  )
}
