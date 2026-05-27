import { useState } from 'react'
import { ChefHat, Sparkles, ArrowRight } from 'lucide-react'
import { seedSampleRecipes } from '@/utils/sampleRecipes'

interface WelcomePageProps {
  onComplete: () => void
}

export function WelcomePage({ onComplete }: WelcomePageProps) {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const handleStart = async (withSamples: boolean) => {
    setLoading(true)
    if (withSamples) {
      await seedSampleRecipes()
    }
    localStorage.setItem('welcomed', '1')
    onComplete()
  }

  const steps = [
    {
      title: '欢迎使用菜谱助手',
      subtitle: '你的私人美食管家',
      content: (
        <div className="flex flex-col items-center gap-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-[var(--color-accent-100)] to-[var(--color-accent-50)]">
            <ChefHat size={48} className="text-[var(--color-accent-500)]" />
          </div>
          <div className="text-center">
            <h2 className="font-display text-2xl font-semibold text-[var(--color-text)]">
              记录你的拿手好菜
            </h2>
            <p className="mt-2 text-[var(--color-text-secondary)]">
              录入菜谱、做菜引导、购物清单、周餐计划
            </p>
          </div>
        </div>
      ),
    },
    {
      title: '开始使用',
      subtitle: '选择一种方式开始',
      content: (
        <div className="flex flex-col items-center gap-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-[var(--color-accent-100)] to-[var(--color-accent-50)]">
            <Sparkles size={48} className="text-[var(--color-accent-500)]" />
          </div>
          <div className="text-center">
            <h2 className="font-display text-2xl font-semibold text-[var(--color-text)]">
              导入示例菜谱？
            </h2>
            <p className="mt-2 text-[var(--color-text-secondary)]">
              我们为你准备了几道经典家常菜
            </p>
          </div>
          <div className="flex w-full flex-col gap-3">
            <button
              onClick={() => handleStart(true)}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] py-4 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? '导入中...' : '导入示例菜谱'}
              {!loading && <ArrowRight size={16} />}
            </button>
            <button
              onClick={() => handleStart(false)}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-bg-card)] py-4 text-sm font-medium text-[var(--color-text-secondary)] shadow-xs transition-all duration-200 hover:bg-[var(--color-bg-subtle)] active:scale-[0.98] disabled:opacity-50"
            >
              从空白开始
            </button>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--color-bg)] p-6">
      <div className="w-full max-w-sm">
        {steps[step].content}

        {step === 0 && (
          <button
            onClick={() => setStep(1)}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] py-4 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
          >
            开始
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
