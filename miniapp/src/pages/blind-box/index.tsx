import { useState, useRef } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useRecipeStore } from '@/stores/recipeStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useUIStore } from '@/stores/uiStore'
import { Icon } from '@/components/Icon'
import { CATEGORY_ICONS } from '@/constants/options'
import type { Recipe } from '@/types'
import { getRandomChineseRecipe } from '@/data/chineseRecipes'
import './index.scss'

type Phase = 'idle' | 'shaking' | 'revealed'

export default function BlindBoxPage() {
  const recipes = useRecipeStore((s) => s.recipes)
  const loadRecipes = useRecipeStore((s) => s.loadRecipes)
  const addRecipe = useRecipeStore((s) => s.addRecipe)
  const collections = useCollectionStore((s) => s.collections)
  const toggleRecipeInCollection = useCollectionStore((s) => s.toggleRecipeInCollection)
  const showToast = useUIStore((s) => s.showToast)

  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<Recipe | null>(null)
  const [isRecommended, setIsRecommended] = useState(false)
  const timerRef = useRef<any>(null)

  useDidShow(() => {
    loadRecipes()
  })

  const pickRandom = (list: Recipe[]): Recipe => {
    return list[Math.floor(Math.random() * list.length)]
  }

  const handleDraw = () => {
    setPhase('shaking')
    setResult(null)

    timerRef.current = setTimeout(() => {
      const available = recipes.filter((r) => !r.deletedAt)
      if (available.length === 0) {
        setPhase('idle')
        Taro.showToast({ title: '还没有菜谱哦', icon: 'none' })
        return
      }
      const picked = pickRandom(available)
      setResult(picked)
      setIsRecommended(false)
      setPhase('revealed')
    }, 800)
  }

  const handleRecommend = () => {
    setPhase('shaking')
    setResult(null)

    timerRef.current = setTimeout(() => {
      const picked = getRandomChineseRecipe()
      setResult(picked)
      setIsRecommended(true)
      setPhase('revealed')
    }, 800)
  }

  const handleReset = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setPhase('idle')
    setResult(null)
  }

  const handleViewDetail = () => {
    if (!result) return
    Taro.navigateTo({ url: `/pages/recipe/detail?id=${result.id}` })
  }

  const handleSaveToCollection = async () => {
    if (!result) return
    await addRecipe(result)
    if (collections.length > 0) {
      await toggleRecipeInCollection(collections[0].id, result.id)
    }
    showToast('已保存到我的菜谱', 'success')
  }

  const getDifficultyLabel = (d: string) => {
    return d === 'easy' ? '简单' : d === 'medium' ? '中等' : '困难'
  }

  const coverIcon = result ? (CATEGORY_ICONS[result.category] || 'chefHat') : 'package'

  return (
    <View className='blind-box-page'>
      <View className='blind-box-header'>
        <Text className='blind-box-header__title'>今天吃什么</Text>
        <Text className='blind-box-header__subtitle'>
          {phase === 'idle' && '让味遇帮你做决定'}
          {phase === 'shaking' && '正在抽取...'}
          {phase === 'revealed' && '就是它了!'}
        </Text>
      </View>

      <View className={`blind-box-card ${phase === 'shaking' ? 'blind-box-card--shaking' : ''}`}>
        {phase !== 'revealed' ? (
          <View className='blind-box-card__front'>
            <View className='blind-box-card__icon'>
              <Icon name='package' size={96} color='#c9583a' />
            </View>
            <Icon name='sparkles' size={40} color='#e47a4e' />
            <Text className='blind-box-card__hint'>
              {phase === 'idle' ? '点击下方按钮抽取' : '摇一摇...'}
            </Text>
          </View>
        ) : (
          <View className='blind-box-card__result'>
            {result?.coverImage ? (
              <View
                className='blind-box-card__cover'
                style={{ backgroundImage: `url(${result.coverImage})` }}
              />
            ) : (
              <View className='blind-box-card__cover-placeholder'>
                <Icon name={coverIcon} size={80} color='#a8a08e' />
              </View>
            )}
            <View className='blind-box-card__info'>
              <Text className='blind-box-card__name'>{result?.name}</Text>
              <View className='blind-box-card__tags'>
                <View className='blind-box-card__tag'>
                  <Icon name='clock' size={28} color='#6b6355' />
                  <Text>{result?.duration}分钟</Text>
                </View>
                <View className='blind-box-card__tag'>
                  <Icon name='users' size={28} color='#6b6355' />
                  <Text>{result?.servings}人份</Text>
                </View>
                {result?.difficulty && (
                  <View className={`blind-box-card__diff blind-box-card__diff--${result.difficulty}`}>
                    <Text>{getDifficultyLabel(result.difficulty)}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
      </View>

      <View className='blind-box-actions'>
        {phase === 'idle' && (
          <>
            <View className='blind-box-actions__primary' onClick={handleDraw}>
              <Icon name='package' size={40} color='#ffffff' />
              <Text className='blind-box-actions__text'>从我的菜谱抽取</Text>
            </View>
            <View className='blind-box-actions__secondary' onClick={handleRecommend}>
              <Icon name='sparkles' size={40} color='#c9583a' />
              <Text className='blind-box-actions__text-secondary'>不知道吃什么？随机推荐</Text>
            </View>
          </>
        )}
        {phase === 'shaking' && (
          <View style={{ height: '176rpx' }} />
        )}
        {phase === 'revealed' && (
          <>
            {isRecommended ? (
              <>
                <View className='blind-box-actions__primary' onClick={handleSaveToCollection}>
                  <Icon name='save' size={40} color='#ffffff' />
                  <Text className='blind-box-actions__text'>保存到我的菜谱</Text>
                </View>
                <View className='blind-box-actions__row'>
                  <View className='blind-box-actions__secondary' onClick={handleViewDetail}>
                    <Text className='blind-box-actions__text-secondary'>查看详情</Text>
                    <Icon name='arrowRight' size={32} color='#c9583a' />
                  </View>
                  <View className='blind-box-actions__secondary' onClick={handleReset}>
                    <Icon name='rotateCcw' size={36} color='#c9583a' />
                    <Text className='blind-box-actions__text-secondary'>再抽一次</Text>
                  </View>
                </View>
              </>
            ) : (
              <>
                <View className='blind-box-actions__primary' onClick={handleViewDetail}>
                  <Text className='blind-box-actions__text'>查看详情</Text>
                  <Icon name='arrowRight' size={32} color='#ffffff' />
                </View>
                <View className='blind-box-actions__secondary' onClick={handleReset}>
                  <Icon name='rotateCcw' size={40} color='#c9583a' />
                  <Text className='blind-box-actions__text-secondary'>再抽一次</Text>
                </View>
              </>
            )}
          </>
        )}
      </View>
    </View>
  )
}
