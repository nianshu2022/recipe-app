import { useParams, Link } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import {
  ArrowLeft, ChevronLeft, ChevronRight, Check, Lightbulb, PartyPopper,
  ChefHat, Mic, MicOff, Maximize, Minimize, Play, Pause, RotateCcw,
} from 'lucide-react'
import { useRecipeStore } from '@/stores/recipeStore'
import { useVoiceControl, matchCommand } from '@/hooks/useVoiceControl'
import { useTimer, formatTime } from '@/hooks/useTimer'
import { useFullscreen } from '@/hooks/useFullscreen'
import { useWakeLock } from '@/hooks/useWakeLock'
import type { Recipe } from '@/types'

export function CookingPage() {
  const { id } = useParams<{ id: string }>()
  const { recipes } = useRecipeStore()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)

  const timer = useTimer()
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen()
  useWakeLock()

  const { prepareForStep } = timer

  const handleVoiceCommand = useCallback((transcript: string) => {
    if (!recipe) return
    const steps = recipe.steps
    matchCommand(transcript, {
      '下一步|下一个': () => setCurrentStep((s) => Math.min(s + 1, steps.length - 1)),
      '上一步|上一个': () => setCurrentStep((s) => Math.max(0, s - 1)),
      '完成|做好了|做完了': () => setCompleted(true),
      '开始计时|计时': () => {
        const stepTimer = steps[currentStep]?.timer
        if (stepTimer) timer.start(stepTimer * 60)
      },
      '暂停|停止|关闭': () => { timer.toggle(); timer.stopAlarm() },
      '继续': () => timer.toggle(),
      '重复|再说一遍': () => {
        const utterance = new SpeechSynthesisUtterance(steps[currentStep]?.description)
        utterance.lang = 'zh-CN'
        speechSynthesis.speak(utterance)
      },
    })
  }, [recipe, currentStep, timer])

  const { isListening } = useVoiceControl({
    enabled: voiceEnabled && !completed,
    onCommand: handleVoiceCommand,
  })

  useEffect(() => {
    if (recipe && !completed) {
      prepareForStep(recipe.steps[currentStep]?.timer)
    }
  }, [currentStep, recipe, completed, prepareForStep])

  useEffect(() => {
    const found = recipes.find((r) => r.id === id)
    if (found) setRecipe(found)
  }, [recipes, id])

  if (!recipe) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--color-bg)]">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-bg-subtle)]">
          <ChefHat size={28} className="text-[var(--color-text-muted)]" />
        </div>
        <p className="mb-4 text-sm text-[var(--color-text-muted)]">菜谱不存在</p>
        <Link to="/" replace className="rounded-xl bg-[var(--color-primary)] px-6 py-2.5 text-sm font-medium text-white">
          返回首页
        </Link>
      </div>
    )
  }

  const steps = recipe.steps
  if (steps.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--color-bg)]">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-bg-subtle)]">
          <ChefHat size={28} className="text-[var(--color-text-muted)]" />
        </div>
        <p className="mb-4 text-sm text-[var(--color-text-muted)]">该菜谱没有步骤</p>
        <Link to="/" replace className="rounded-xl bg-[var(--color-primary)] px-6 py-2.5 text-sm font-medium text-white">
          返回首页
        </Link>
      </div>
    )
  }

  const step = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  if (completed) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--color-bg)] px-8">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-md dark:from-emerald-950/30 dark:to-emerald-900/20">
          <PartyPopper size={40} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-text)]">大功告成</h2>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">{recipe.name} 做好了</p>
        <Link
          to={`/recipe/${recipe.id}`}
          replace
          className="mt-10 rounded-2xl bg-[var(--color-primary)] px-10 py-3.5 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95"
        >
          返回菜谱
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-bg)]">
      <div className="flex items-center gap-3 px-5 py-4">
        <Link
          to={`/recipe/${recipe.id}`}
          replace
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-bg-card)] shadow-xs transition-all duration-200 hover:shadow-sm active:scale-95"
        >
          <ArrowLeft size={18} className="text-[var(--color-text-secondary)]" />
        </Link>
        <h1 className="flex-1 text-base font-semibold text-[var(--color-text)]">{recipe.name}</h1>
        <button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className={`flex h-9 w-9 items-center justify-center rounded-xl shadow-xs transition-all duration-200 active:scale-95 ${
            voiceEnabled ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-[var(--color-bg-card)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
          }`}
          title={voiceEnabled ? '关闭语音控制' : '开启语音控制'}
        >
          {voiceEnabled ? <Mic size={18} /> : <MicOff size={18} />}
        </button>
        <button
          onClick={toggleFullscreen}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-bg-card)] text-[var(--color-text-muted)] shadow-xs transition-all duration-200 hover:text-[var(--color-text-secondary)] active:scale-95"
          title={isFullscreen ? '退出全屏' : '全屏模式'}
        >
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
      </div>

      {voiceEnabled && (
        <div className="mx-5 mb-2 flex items-center justify-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 dark:bg-emerald-950/30">
          <span className={`h-1.5 w-1.5 rounded-full ${isListening ? 'bg-emerald-500 animate-pulse' : 'bg-[var(--color-text-muted)]'}`} />
          <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
            {isListening ? '语音控制 · 说"下一步""上一步""开始计时"' : '正在启动...'}
          </span>
        </div>
      )}

      <div className="mx-5 mb-6">
        <div className="relative h-1.5 overflow-hidden rounded-full bg-[var(--color-bg-subtle)]">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-[var(--color-text)] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-center text-xs text-[var(--color-text-muted)]">
          第 {currentStep + 1} / {steps.length} 步
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-8">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-text)] text-2xl font-bold text-[var(--color-bg)] shadow-lg">
          {step.order}
        </div>
        <p className="text-center text-xl leading-relaxed font-medium text-[var(--color-text)]">
          {step.description}
        </p>

        {timer.total > 0 && (
          <div className="mt-6 w-full max-w-xs">
            <div className="mb-2 flex items-center justify-center gap-3">
              <span className="font-mono text-3xl font-light tracking-wider text-[var(--color-text)]">
                {formatTime(timer.seconds)}
              </span>
            </div>
            <div className="mx-auto mb-3 h-1.5 w-48 overflow-hidden rounded-full bg-[var(--color-bg-subtle)]">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  timer.seconds <= 10 && timer.seconds > 0 ? 'bg-red-500' : 'bg-[var(--color-text)]'
                }`}
                style={{ width: `${timer.percent}%` }}
              />
            </div>
            <div className="flex items-center justify-center gap-2">
              {timer.alarmActive ? (
                <button
                  onClick={timer.stopAlarm}
                  className="animate-pulse flex h-12 items-center justify-center rounded-xl bg-red-500 px-8 text-base font-semibold text-white shadow-lg transition-all duration-200 active:scale-95"
                >
                  关闭铃声
                </button>
              ) : (
                <>
                  <button
                    onClick={() => { timer.ensureAudioCtx(); timer.toggle() }}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-text)] text-[var(--color-bg)] shadow-md transition-all duration-200 active:scale-95"
                  >
                    {timer.running ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
                  </button>
                  <button
                    onClick={timer.reset}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] shadow-xs transition-all duration-200 hover:bg-[var(--color-bg-subtle)] active:scale-95"
                  >
                    <RotateCcw size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {step.tip && (
          <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-[var(--color-bg-card)] px-5 py-4 shadow-xs">
            <Lightbulb size={16} className="mt-0.5 shrink-0 text-amber-500" />
            <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{step.tip}</p>
          </div>
        )}
      </div>

      <div className="border-t border-[var(--color-border)]/60 bg-[var(--color-bg-card)]/80 px-5 py-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="flex items-center gap-1.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] shadow-xs transition-all duration-200 hover:bg-[var(--color-bg-subtle)] active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
          >
            <ChevronLeft size={16} />
            上一步
          </button>
          {currentStep === steps.length - 1 ? (
            <button
              onClick={() => setCompleted(true)}
              className="flex items-center gap-1.5 rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all duration-200 hover:bg-emerald-700 active:scale-95"
            >
              <Check size={16} />
              完成
            </button>
          ) : (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="flex items-center gap-1.5 rounded-2xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all duration-200 hover:bg-[var(--color-primary-dark)] active:scale-95"
            >
              下一步
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
