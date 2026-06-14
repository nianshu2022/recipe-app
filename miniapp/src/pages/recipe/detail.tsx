import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useRouter, useDidShow } from '@tarojs/taro'
import { useRecipeStore } from '@/stores/recipeStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useShoppingStore } from '@/stores/shoppingStore'
import { useUIStore } from '@/stores/uiStore'
import { Icon } from '@/components/Icon'
import { CATEGORY_OPTIONS, CATEGORY_ICONS, DIFFICULTY_OPTIONS } from '@/constants/options'
import type { Recipe } from '@/types'
import './detail.scss'

export default function RecipeDetailPage() {
  const router = useRouter()
  const recipes = useRecipeStore((s) => s.recipes)
  const loadRecipes = useRecipeStore((s) => s.loadRecipes)
  const deleteRecipe = useRecipeStore((s) => s.deleteRecipe)
  const isRecipeCollected = useCollectionStore((s) => s.isRecipeCollected)
  const toggleRecipeInCollection = useCollectionStore((s) => s.toggleRecipeInCollection)
  const loadCollections = useCollectionStore((s) => s.loadCollections)
  const collections = useCollectionStore((s) => s.collections)
  const generateFromRecipes = useShoppingStore((s) => s.generateFromRecipes)
  const showToast = useUIStore((s) => s.showToast)
  const showConfirm = useUIStore((s) => s.showConfirm)

  const [servings, setServings] = useState(0)
  const [recipe, setRecipe] = useState<Recipe | null>(null)

  useDidShow(() => {
    loadRecipes()
    loadCollections()
  })

  useEffect(() => {
    const id = router.params.id
    if (id && recipes.length > 0) {
      const found = recipes.find((r) => r.id === id)
      if (found) {
        setRecipe(found)
        setServings(found.servings)
      }
    }
  }, [router.params.id, recipes])

  if (!recipe) {
    return (
      <View className='detail-loading'>
        <Text>加载中...</Text>
      </View>
    )
  }

  const scale = servings / recipe.servings
  const categoryOption = CATEGORY_OPTIONS.find((c) => c.value === recipe.category)
  const difficultyOption = DIFFICULTY_OPTIONS.find((d) => d.value === recipe.difficulty)
  const isFavorited = isRecipeCollected(recipe.id)

  const getCalorieLevel = (cal: number) => {
    if (cal < 200) return { label: '低卡', color: '#059669', bg: '#ecfdf5' }
    if (cal < 500) return { label: '适中', color: '#d97706', bg: '#fffbeb' }
    return { label: '高卡', color: '#dc2626', bg: '#fef2f2' }
  }

  const handleToggleFavorite = async () => {
    if (collections.length > 0) {
      await toggleRecipeInCollection(collections[0].id, recipe.id)
      showToast(isFavorited ? '已取消收藏' : '已收藏', 'success')
    } else {
      showToast('请先创建收藏夹', 'info')
    }
  }

  const handleEdit = () => {
    Taro.navigateTo({ url: `/pages/recipe/form?id=${recipe.id}` })
  }

  const handleDelete = async () => {
    const confirmed = await showConfirm({
      title: '删除菜谱',
      message: `确定删除「${recipe.name}」吗？此操作不可撤销。`,
      danger: true,
    })
    if (confirmed) {
      await deleteRecipe(recipe.id)
      showToast('已删除', 'success')
      Taro.navigateBack()
    }
  }

  const handleStartCooking = () => {
    Taro.navigateTo({ url: `/pages/cooking/index?id=${recipe.id}` })
  }

  const handleGenerateShoppingList = async () => {
    await generateFromRecipes([recipe])
    Taro.navigateTo({ url: '/pages/shopping/index' })
  }

  const handleShare = () => {
    // Mini program native share
  }

  return (
    <View className='detail-page'>
      <View className='detail-header'>
        <View className='detail-header__back' onClick={() => Taro.navigateBack()}>
          <Icon name='arrowLeft' size={36} color='#6b6355' />
        </View>
        <Text className='detail-header__title'>{recipe.name}</Text>
        <View className='detail-header__btn' onClick={handleEdit}>
          <Icon name='pencil' size={36} color='#6b6355' />
        </View>
        <View className='detail-header__btn' onClick={handleDelete}>
          <Icon name='trash' size={36} color='#c44b4b' />
        </View>
        <View className='detail-header__btn' onClick={handleToggleFavorite}>
          <Icon
            name={isFavorited ? 'heartFilled' : 'heart'}
            size={36}
            color={isFavorited ? '#ef4444' : '#a8a08e'}
          />
        </View>
      </View>

      <ScrollView scrollY className='detail-scroll' enhanced showScrollbar={false}>
        <View className='detail-cover'>
          {recipe.coverImage ? (
            <View className='detail-cover__img' style={{ backgroundImage: `url(${recipe.coverImage})` }} />
          ) : (
            <View className='detail-cover__placeholder'>
              <Icon name={CATEGORY_ICONS[recipe.category] || 'chefHat'} size={96} color='#a8a08e' />
            </View>
          )}
        </View>

        <View className='detail-content'>
          <View className='detail-meta'>
            <View className='detail-meta__pill'>
              <Icon name='clock' size={28} color='#6b6355' />
              <Text>{recipe.duration}分钟</Text>
            </View>
            {difficultyOption && (
              <View className={`detail-meta__pill detail-meta__pill--${recipe.difficulty}`}>
                <Text>{difficultyOption.label}</Text>
              </View>
            )}
            <View className='detail-meta__pill'>
              <Icon name='users' size={28} color='#6b6355' />
              <Text>{recipe.servings}人份</Text>
            </View>
          </View>

          {recipe.nutrition && (
            <View className='detail-nutrition'>
              {(() => {
                const level = getCalorieLevel(recipe.nutrition.calories)
                return (
                  <View className='detail-nutrition__header'>
                    <Text className='detail-nutrition__cal'>{Math.round(recipe.nutrition.calories)} 千卡</Text>
                    <View className='detail-nutrition__badge' style={{ background: level.bg, color: level.color }}>
                      <Text>{level.label}</Text>
                    </View>
                  </View>
                )
              })()}
              <View className='detail-nutrition__bar'>
                <View className='detail-nutrition__segment' style={{ flex: recipe.nutrition.protein, background: '#60a5fa' }} />
                <View className='detail-nutrition__segment' style={{ flex: recipe.nutrition.carbs, background: '#fbbf24' }} />
                <View className='detail-nutrition__segment' style={{ flex: recipe.nutrition.fat, background: '#fb7185' }} />
              </View>
              <View className='detail-nutrition__grid'>
                <View className='detail-nutrition__item'>
                  <Text className='detail-nutrition__value'>{recipe.nutrition.protein}g</Text>
                  <Text className='detail-nutrition__label'>蛋白质</Text>
                </View>
                <View className='detail-nutrition__item'>
                  <Text className='detail-nutrition__value'>{recipe.nutrition.carbs}g</Text>
                  <Text className='detail-nutrition__label'>碳水</Text>
                </View>
                <View className='detail-nutrition__item'>
                  <Text className='detail-nutrition__value'>{recipe.nutrition.fat}g</Text>
                  <Text className='detail-nutrition__label'>脂肪</Text>
                </View>
                <View className='detail-nutrition__item'>
                  <Text className='detail-nutrition__value'>{recipe.nutrition.fiber}g</Text>
                  <Text className='detail-nutrition__label'>纤维</Text>
                </View>
              </View>
            </View>
          )}

          <View className='detail-section'>
            <View className='detail-section__header'>
              <Text className='detail-section__title'>用料清单</Text>
              <View className='detail-stepper'>
                <View className='detail-stepper__btn' onClick={() => setServings(Math.max(1, servings - 1))}>
                  <Icon name='minus' size={32} color='#252220' />
                </View>
                <Text className='detail-stepper__value'>{servings}人份</Text>
                <View className='detail-stepper__btn' onClick={() => setServings(servings + 1)}>
                  <Icon name='plus' size={32} color='#252220' />
                </View>
              </View>
            </View>
            <View className='detail-ingredients'>
              {recipe.ingredients.map((ing, i) => (
                <View key={ing.id} className={`detail-ingredient ${i > 0 ? 'detail-ingredient--bordered' : ''}`}>
                  <Text className='detail-ingredient__name'>{ing.name}</Text>
                  <Text className='detail-ingredient__amount'>
                    {(ing.amount * scale).toFixed(ing.amount * scale % 1 === 0 ? 0 : 1)}{ing.unit}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View className='detail-section'>
            <Text className='detail-section__title'>做法步骤</Text>
            <View className='detail-steps'>
              {recipe.steps.map((step) => (
                <View key={step.order} className='detail-step'>
                  <View className='detail-step__number'>
                    <Text>{step.order}</Text>
                  </View>
                  <View className='detail-step__content'>
                    <Text className='detail-step__desc'>{step.description}</Text>
                    {step.timer && (
                      <View className='detail-step__timer'>
                        <Icon name='clock' size={28} color='#d97706' />
                        <Text className='detail-step__timer-text'>计时 {step.timer} 分钟</Text>
                      </View>
                    )}
                    {step.tip && (
                      <View className='detail-step__tip'>
                        <Icon name='lightbulb' size={28} color='#d97706' />
                        <Text className='detail-step__tip-text'>{step.tip}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View className='detail-actions'>
        <View className='detail-actions__primary' onClick={handleStartCooking}>
          <Icon name='play' size={40} color='#ffffff' />
          <Text className='detail-actions__text'>开始做菜</Text>
        </View>
        <View className='detail-actions__row'>
          <View className='detail-actions__secondary' onClick={handleGenerateShoppingList}>
            <Icon name='shoppingCart' size={36} color='#252220' />
            <Text className='detail-actions__secondary-text'>购物清单</Text>
          </View>
          <View className='detail-actions__secondary' onClick={handleShare}>
            <Icon name='share' size={36} color='#252220' />
            <Text className='detail-actions__secondary-text'>分享</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
