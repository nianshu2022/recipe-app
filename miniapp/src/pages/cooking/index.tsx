import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRecipeStore } from '@/stores/recipeStore'
import { useCalendarStore } from '@/stores/calendarStore'
import { Icon } from '@/components/Icon'
import './index.scss'

export default function CookingPage() {
  const router = useRouter()
  const recipeId = router.params.id

  const { recipes, loadRecipes } = useRecipeStore()
  const { addRecord } = useCalendarStore()

  const [currentStep, setCurrentStep] = useState(0)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    loadRecipes()
  }, [])

  const recipe = recipes.find((r) => r.id === recipeId)
  const steps = recipe?.steps ?? []
  const totalSteps = steps.length
  const step = steps[currentStep]
  const stepTimer = step?.timer ?? 0

  // Timer logic
  useEffect(() => {
    if (timerRunning && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setTimerRunning(false)
            Taro.vibrateShort({ type: 'heavy' })
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

  // Reset timer when step changes
  useEffect(() => {
    setTimerRunning(false)
    setTimerSeconds(stepTimer)
    if (timerRef.current) clearInterval(timerRef.current)
  }, [currentStep, stepTimer])

  const toggleTimer = useCallback(() => {
    if (timerSeconds === 0) {
      setTimerSeconds(stepTimer)
      setTimerRunning(true)
    } else {
      setTimerRunning((prev) => !prev)
    }
  }, [timerSeconds, stepTimer])

  const resetTimer = useCallback(() => {
    setTimerRunning(false)
    setTimerSeconds(stepTimer)
    if (timerRef.current) clearInterval(timerRef.current)
  }, [stepTimer])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1)
  }

  const handleNext = () => {
    if (currentStep < totalSteps - 1) setCurrentStep(currentStep + 1)
  }

  const handleComplete = async () => {
    if (recipe) {
      await addRecord(recipe.id, recipe.servings)
    }
    Taro.showToast({ title: '烹饪完成!', icon: 'success' })
    setTimeout(() => Taro.navigateBack(), 1500)
  }

  if (!recipe) {
    return (
      <View className="cooking-page">
        <View className="cooking-loading">
          <Text className="cooking-loading-text">加载中...</Text>
        </View>
      </View>
    )
  }

  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0

  return (
    <View className="cooking-page">
      {/* Top bar */}
      <View className="cooking-topbar">
        <View className="cooking-back" onClick={() => Taro.navigateBack()}>
          <Icon name="arrowLeft" size={40} color="#44403c" />
        </View>
        <Text className="cooking-title">{recipe.name}</Text>
        <View className="cooking-spacer" />
      </View>

      {/* Progress bar */}
      <View className="cooking-progress">
        <View className="cooking-progress-bar">
          <View className="cooking-progress-fill" style={{ width: `${progress}%` }} />
        </View>
        <Text className="cooking-progress-text">
          第 {currentStep + 1} / {totalSteps} 步
        </Text>
      </View>

      {/* Step content */}
      <View className="cooking-step">
        <View className="step-badge">
          <Text className="step-badge-text">{currentStep + 1}</Text>
        </View>

        <Text className="step-description">{step?.description}</Text>

        {stepTimer > 0 && (
          <View className="step-timer">
            <Text className="step-timer-display">{formatTime(timerSeconds)}</Text>
            <View className="step-timer-controls">
              <View className="timer-btn" onClick={toggleTimer}>
                <Text className="timer-btn-text">
                  {timerRunning ? '暂停' : timerSeconds === stepTimer ? '开始' : '继续'}
                </Text>
              </View>
              <View className="timer-btn timer-btn-secondary" onClick={resetTimer}>
                <Text className="timer-btn-text">重置</Text>
              </View>
            </View>
          </View>
        )}

        {step?.tip && (
          <View className="step-tip">
            <Text className="step-tip-text">{step.tip}</Text>
          </View>
        )}
      </View>

      {/* Bottom bar */}
      <View className="cooking-bottom">
        <View
          className={`cooking-btn cooking-btn-secondary ${currentStep === 0 ? 'disabled' : ''}`}
          onClick={handlePrev}
        >
          <Text className="cooking-btn-text">上一步</Text>
        </View>

        {currentStep < totalSteps - 1 ? (
          <View className="cooking-btn cooking-btn-primary" onClick={handleNext}>
            <Text className="cooking-btn-text cooking-btn-text-primary">下一步</Text>
          </View>
        ) : (
          <View className="cooking-btn cooking-btn-success" onClick={handleComplete}>
            <Text className="cooking-btn-text cooking-btn-text-primary">完成</Text>
          </View>
        )}
      </View>
    </View>
  )
}
