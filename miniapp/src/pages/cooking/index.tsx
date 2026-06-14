import { useState, useEffect, useRef } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useRouter, useDidShow } from '@tarojs/taro'
import { useRecipeStore } from '@/stores/recipeStore'
import { Icon } from '@/components/Icon'
import type { Recipe, Step } from '@/types'
import './index.scss'

export default function CookingPage() {
  const router = useRouter()
  const recipes = useRecipeStore((s) => s.recipes)
  const loadRecipes = useRecipeStore((s) => s.loadRecipes)

  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const timerRef = useRef<any>(null)

  useDidShow(() => {
    loadRecipes()
  })

  useEffect(() => {
    const id = router.params.id
    if (id && recipes.length > 0) {
      const found = recipes.find((r) => r.id === id)
      if (found) setRecipe(found)
    }
  }, [router.params.id, recipes])

  useEffect(() => {
    if (timerRunning && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            setTimerRunning(false)
            Taro.vibrateLong()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [timerRunning, timerSeconds])

  if (!recipe) {
    return (
      <View className='cooking-loading'>
        <Text>加载中...</Text>
      </View>
    )
  }

  const steps = recipe.steps
  const step: Step | undefined = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      stopTimer()
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
      stopTimer()
    } else {
      setCompleted(true)
    }
  }

  const startTimer = () => {
    if (step?.timer) {
      setTimerSeconds(step.timer * 60)
      setTimerRunning(true)
    }
  }

  const stopTimer = () => {
    setTimerRunning(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const resetTimer = () => {
    stopTimer()
    if (step?.timer) {
      setTimerSeconds(step.timer * 60)
    }
  }

  const handleBack = () => {
    stopTimer()
    Taro.navigateBack()
  }

  if (completed) {
    return (
      <View className='cooking-page'>
        <View className='cooking-complete'>
          <View className='cooking-complete__icon'>
            <Icon name='partyPopper' size={96} color='#059669' />
          </View>
          <Text className='cooking-complete__title'>大功告成</Text>
          <Text className='cooking-complete__subtitle'>你完成了「{recipe.name}」</Text>
          <View className='cooking-complete__btn' onClick={handleBack}>
            <Text>返回菜谱</Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className='cooking-page'>
      <View className='cooking-header'>
        <View className='cooking-header__back' onClick={handleBack}>
          <Icon name='arrowLeft' size={40} color='#252220' />
        </View>
        <Text className='cooking-header__title'>{recipe.name}</Text>
        <View className='cooking-header__actions'>
          <View className='cooking-header__btn' onClick={() => setVoiceEnabled(!voiceEnabled)}>
            <Icon name={voiceEnabled ? 'mic' : 'micOff'} size={36} color={voiceEnabled ? '#059669' : '#a8a08e'} />
          </View>
          <View className='cooking-header__btn' onClick={() => setIsFullscreen(!isFullscreen)}>
            <Icon name={isFullscreen ? 'minimize' : 'maximize'} size={36} color='#a8a08e' />
          </View>
        </View>
      </View>

      <View className='cooking-progress'>
        <View className='cooking-progress__bar'>
          <View className='cooking-progress__fill' style={{ width: `${progress}%` }} />
        </View>
        <Text className='cooking-progress__label'>第 {currentStep + 1} / {steps.length} 步</Text>
      </View>

      <View className='cooking-content'>
        <View className='cooking-step-number'>
          <Text>{step.order}</Text>
        </View>
        <Text className='cooking-step-desc'>{step.description}</Text>

        {step.timer && (
          <View className='cooking-timer'>
            <Text className='cooking-timer__display'>{formatTime(timerSeconds)}</Text>
            <View className='cooking-timer__bar'>
              <View
                className='cooking-timer__fill'
                style={{ width: `${(timerSeconds / (step.timer * 60)) * 100}%` }}
              />
            </View>
            <View className='cooking-timer__actions'>
              {!timerRunning ? (
                <View className='cooking-timer__btn' onClick={startTimer}>
                  <Icon name='play' size={36} color='#252220' />
                </View>
              ) : (
                <View className='cooking-timer__btn' onClick={stopTimer}>
                  <Icon name='pause' size={36} color='#252220' />
                </View>
              )}
              <View className='cooking-timer__btn' onClick={resetTimer}>
                <Icon name='rotateCcw' size={36} color='#252220' />
              </View>
            </View>
          </View>
        )}

        {step.tip && (
          <View className='cooking-tip'>
            <Icon name='lightbulb' size={32} color='#d97706' />
            <Text className='cooking-tip__text'>{step.tip}</Text>
          </View>
        )}
      </View>

      <View className='cooking-nav'>
        <View
          className={`cooking-nav__btn cooking-nav__btn--secondary ${currentStep === 0 ? 'cooking-nav__btn--disabled' : ''}`}
          onClick={handlePrev}
        >
          <Icon name='chevronLeft' size={32} color='#252220' />
          <Text>上一步</Text>
        </View>
        <View className='cooking-nav__btn cooking-nav__btn--primary' onClick={handleNext}>
          <Text className='cooking-nav__text'>
            {currentStep === steps.length - 1 ? '完成' : '下一步'}
          </Text>
          {currentStep < steps.length - 1 && (
            <Icon name='chevronRight' size={32} color='#ffffff' />
          )}
          {currentStep === steps.length - 1 && (
            <Icon name='check' size={32} color='#ffffff' />
          )}
        </View>
      </View>
    </View>
  )
}
