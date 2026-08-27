import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, Sparkles, Key, Globe, Cpu, Check, AlertCircle, Eye, EyeOff, FlaskConical, ShieldCheck,
} from 'lucide-react'
import { useAiSettingsStore, PROVIDER_PRESETS, type AiProvider } from '@/stores/aiSettingsStore'
import { useUIStore } from '@/stores/uiStore'

export function AiSettingsPage() {
  const {
    enabled,
    provider,
    apiKey,
    baseUrl,
    model,
    setEnabled,
    setProvider,
    setApiKey,
    setBaseUrl,
    setModel,
    testConnection,
  } = useAiSettingsStore()

  const showToast = useUIStore((s) => s.showToast)
  const [showPassword, setShowPassword] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleProviderChange = (newProvider: AiProvider) => {
    setProvider(newProvider)
    setTestResult(null)
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    const result = await testConnection()
    setTesting(false)
    setTestResult(result)
    if (result.success) {
      showToast('API Key 验证成功！', 'success')
      if (!enabled) setEnabled(true)
    } else {
      showToast('连接失败，请检查配置', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-40 -mx-5 -mt-6 flex items-center gap-3 bg-[var(--color-bg)]/95 px-5 py-3 backdrop-blur-sm">
        <Link
          to="/settings"
          replace
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-bg-card)] shadow-xs transition-all duration-200 hover:shadow-sm active:scale-95"
        >
          <ArrowLeft size={18} className="text-[var(--color-text)]" />
        </Link>
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-purple-500" />
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-text)]">
            AI 模型配置
          </h1>
        </div>
      </div>

      {/* Intro Banner */}
      <div className="rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-600 dark:text-purple-400">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--color-text)]">接入你的专属 AI 大模型</h2>
            <p className="mt-1 text-xs text-[var(--color-text-muted)] leading-relaxed">
              配置你的 API Key 后，在「智能冰箱」等模块可直接由 DeepSeek / OpenAI 等模型实时创作创意菜谱与营养建议。
            </p>
          </div>
        </div>
      </div>

      {/* Enable Toggle Card */}
      <div className="flex items-center justify-between rounded-3xl bg-[var(--color-bg-card)] border border-[var(--color-border)]/60 p-5 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-[var(--color-text)]">启用自定义 AI 接入</h3>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            {enabled ? '已开启自定义大模型直连' : '关闭时将使用本地大厨智能模板'}
          </p>
        </div>
        <button
          onClick={() => setEnabled(!enabled)}
          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            enabled ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
              enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Provider Selector */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          选择模型提供商
        </h3>
        <div className="grid grid-cols-1 gap-2.5">
          {(Object.entries(PROVIDER_PRESETS) as [AiProvider, typeof PROVIDER_PRESETS[AiProvider]][]).map(
            ([key, config]) => {
              const isSelected = provider === key
              return (
                <button
                  key={key}
                  onClick={() => handleProviderChange(key)}
                  className={`flex flex-col items-start rounded-2xl border p-4 text-left transition-all duration-200 ${
                    isSelected
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-xs'
                      : 'border-[var(--color-border)] bg-[var(--color-bg-card)] hover:border-[var(--color-primary)]/40'
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-sm font-bold text-[var(--color-text)]">{config.name}</span>
                    {isSelected && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)] text-white">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">{config.tip}</p>
                </button>
              )
            }
          )}
        </div>
      </div>

      {/* Detailed Config Form */}
      <div className="space-y-4 rounded-3xl bg-[var(--color-bg-card)] border border-[var(--color-border)]/60 p-5 shadow-xs">
        {/* API Key */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text)]">
            <Key size={14} className="text-amber-500" />
            API Key (密匙)
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value)
                setTestResult(null)
              }}
              placeholder={provider === 'deepseek' ? 'sk-...' : '请输入 API Key'}
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] py-3 pl-4 pr-11 text-sm text-[var(--color-text)] outline-none transition-all placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Base URL */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text)]">
            <Globe size={14} className="text-blue-500" />
            Base URL (接口地址)
          </label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => {
              setBaseUrl(e.target.value)
              setTestResult(null)
            }}
            placeholder="https://api.deepseek.com"
            className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] py-3 px-4 text-sm font-mono text-[var(--color-text)] outline-none transition-all placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]"
          />
        </div>

        {/* Model Name */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text)]">
            <Cpu size={14} className="text-emerald-500" />
            Model (模型名称)
          </label>
          <input
            type="text"
            value={model}
            onChange={(e) => {
              setModel(e.target.value)
              setTestResult(null)
            }}
            placeholder={provider === 'deepseek' ? 'deepseek-chat' : 'gpt-4o-mini'}
            className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] py-3 px-4 text-sm font-mono text-[var(--color-text)] outline-none transition-all placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]"
          />
        </div>

        {/* Test Connection Button */}
        <div className="pt-2">
          <button
            onClick={handleTest}
            disabled={testing || !apiKey}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] py-3 text-sm font-bold text-white shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            <FlaskConical size={16} className={testing ? 'animate-spin' : ''} />
            {testing ? '正在测试连通性...' : '测试连通性'}
          </button>
        </div>

        {/* Test Result Box */}
        {testResult && (
          <div
            className={`rounded-2xl p-3.5 text-xs font-medium ${
              testResult.success
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                : 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/30'
            }`}
          >
            <div className="flex items-center gap-2">
              {testResult.success ? <Check size={16} /> : <AlertCircle size={16} />}
              <span>{testResult.message}</span>
            </div>
          </div>
        )}
      </div>

      {/* Security Privacy Notice */}
      <div className="flex items-start gap-2.5 rounded-2xl bg-[var(--color-bg-card)] p-4 text-xs text-[var(--color-text-muted)] shadow-xs">
        <ShieldCheck size={18} className="text-emerald-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-[var(--color-text)]">隐私与安全声明：</strong>
          您填写的 API Key 仅保存在您本地设备的浏览器缓存中，所有请求均直接从您的浏览器向模型服务商发起，知味绝不会将您的 Key 上传至任何第三方服务器。
        </p>
      </div>
    </div>
  )
}
