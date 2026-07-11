import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Crown } from 'lucide-react'
import { useSubscriptionStore } from '@/stores/subscriptionStore'

const plans = [
  {
    id: 'free',
    name: '免费版',
    price: '¥0',
    period: '永久',
    features: [
      '创建 1 个周计划',
      '无限食谱',
      '购物清单',
    ],
  },
  {
    id: 'pro-monthly',
    name: 'Pro 月度',
    price: '¥9.9',
    period: '/月',
    days: 30,
    features: [
      '无限周计划',
      '保存和加载模板',
      '营养统计',
      '优先获取新功能',
    ],
  },
  {
    id: 'pro-yearly',
    name: 'Pro 年度',
    price: '¥68',
    period: '/年',
    days: 365,
    popular: true,
    features: [
      '无限周计划',
      '保存和加载模板',
      '营养统计',
      '优先获取新功能',
      '家庭协作（即将上线）',
    ],
  },
]

export function PricingPage() {
  const navigate = useNavigate()
  const { isPro, activatePro } = useSubscriptionStore()
  const currentIsPro = isPro()

  const handlePurchase = (days: number) => {
    activatePro(days)
    navigate('/settings')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-40 -mx-5 -mt-6 flex items-center gap-3 bg-[var(--color-bg)]/95 px-5 py-3 backdrop-blur-sm">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)]"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-semibold text-[var(--color-text)]">升级会员</h1>
      </div>

      {/* Current status */}
      {currentIsPro && (
        <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 p-4 dark:from-amber-950/30 dark:to-orange-950/30">
          <Crown size={24} className="text-amber-500" />
          <div>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">已是 Pro 会员</p>
            <p className="text-xs text-amber-600/70 dark:text-amber-400/70">享受所有高级功能</p>
          </div>
        </div>
      )}

      {/* Plans */}
      <div className="space-y-4">
        {plans.map((plan) => {
          if (plan.id === 'free') {
            return (
              <div
                key={plan.id}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5"
              >
                <div className="mb-3 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-[var(--color-text)]">{plan.price}</span>
                  <span className="text-sm text-[var(--color-text-muted)]">{plan.period}</span>
                </div>
                <h3 className="mb-3 text-base font-semibold text-[var(--color-text)]">{plan.name}</h3>
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                      <Check size={14} className="text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )
          }

          const isPopular = 'popular' in plan && plan.popular

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border bg-[var(--color-bg-card)] p-5 ${
                isPopular
                  ? 'border-[var(--color-primary)] shadow-md'
                  : 'border-[var(--color-border)]'
              }`}
            >
              {isPopular && (
                <span className="absolute -top-3 right-4 rounded-full bg-[var(--color-primary)] px-3 py-0.5 text-xs font-medium text-white">
                  推荐
                </span>
              )}
              <div className="mb-3 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-[var(--color-text)]">{plan.price}</span>
                <span className="text-sm text-[var(--color-text-muted)]">{plan.period}</span>
              </div>
              <h3 className="mb-3 text-base font-semibold text-[var(--color-text)]">{plan.name}</h3>
              <ul className="mb-4 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                    <Check size={14} className="text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handlePurchase(('days' in plan && plan.days) || 30)}
                className={`w-full rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.98] ${
                  isPopular
                    ? 'bg-[var(--color-primary)] text-white shadow-md'
                    : 'bg-[var(--color-bg-subtle)] text-[var(--color-text)] hover:bg-[var(--color-bg-card)]'
                }`}
              >
                {currentIsPro ? '续费' : '立即开通'}
              </button>
            </div>
          )
        })}
      </div>

      {/* FAQ */}
      <div className="rounded-2xl bg-[var(--color-bg-card)] p-5">
        <h3 className="mb-3 text-base font-semibold text-[var(--color-text)]">常见问题</h3>
        <div className="space-y-3 text-sm text-[var(--color-text-secondary)]">
          <div>
            <p className="font-medium text-[var(--color-text)]">可以随时取消吗？</p>
            <p>可以。取消后会员权益将在到期后失效。</p>
          </div>
          <div>
            <p className="font-medium text-[var(--color-text)]">支持哪些支付方式？</p>
            <p>目前支持支付宝和微信支付。</p>
          </div>
        </div>
      </div>
    </div>
  )
}
