import { View, Text, Image } from '@tarojs/components'
import Taro, { useRouter, useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import { useState, useEffect, useMemo } from 'react'
import { useRecipeStore } from '@/stores/recipeStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useShoppingStore } from '@/stores/shoppingStore'
import { estimateNutrition, getCalorieLevel, getMacroPercentages } from '@/utils/nutrition'
import { getAllRecipes } from '@/data/chineseRecipes'
import { scaleIngredients, formatAmount } from '@/utils/scaling'
import { Icon } from '@/components/Icon'
import './detail.scss'

const difficultyLabels: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
}

export default function RecipeDetailPage() {
  const router = useRouter()
  const recipeId = router.params.id || ''

  const { recipes, loadRecipes, deleteRecipe } = useRecipeStore()
  const { collections, loadCollections, toggleRecipeInCollection } = useCollectionStore()
  const { generateFromRecipe } = useShoppingStore()

  const [servings, setServings] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const recipe = useMemo(() => {
    const found = recipes.find((r) => r.id === recipeId)
    if (found) return found
    // 回退：查找内置菜谱
    return getAllRecipes().find((r) => r.id === recipeId) ?? null
  }, [recipes, recipeId])

  useEffect(() => {
    Promise.all([loadRecipes(), loadCollections()]).then(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (recipe && servings === 0) {
      setServings(recipe.servings)
    }
  }, [recipe])

  const isFavorited = useMemo(() => {
    return collections.some((c) => c.recipeIds.includes(recipeId))
  }, [collections, recipeId])

  const scaledIngredients = useMemo(() => {
    if (!recipe) return []
    return scaleIngredients(recipe.ingredients, recipe.servings, servings)
  }, [recipe, servings])

  const nutrition = useMemo(() => {
    if (!recipe) return null
    return recipe.nutrition ?? estimateNutrition(recipe.ingredients)
  }, [recipe])

  const perServing = useMemo(() => {
    if (!nutrition || !recipe) return null
    return {
      calories: Math.round(nutrition.calories / recipe.servings),
      protein: Math.round((nutrition.protein / recipe.servings) * 10) / 10,
      carbs: Math.round((nutrition.carbs / recipe.servings) * 10) / 10,
      fat: Math.round((nutrition.fat / recipe.servings) * 10) / 10,
      fiber: Math.round((nutrition.fiber / recipe.servings) * 10) / 10,
    }
  }, [nutrition, recipe])

  const calorieLevel = useMemo(() => {
    if (!perServing) return null
    return getCalorieLevel(perServing.calories)
  }, [perServing])

  const macroPercentages = useMemo(() => {
    if (!perServing) return null
    return getMacroPercentages(perServing)
  }, [perServing])

  useShareAppMessage(() => {
    if (!recipe) return {}
    return { title: recipe.name, path: `/pages/recipe/detail?id=${recipe.id}` }
  })

  useShareTimeline(() => {
    if (!recipe) return {}
    return { title: recipe.name, query: `id=${recipe.id}` }
  })

  const handleDelete = async () => {
    if (!recipe) return
    await deleteRecipe(recipe.id)
    Taro.navigateBack()
  }

  const handleToggleFavorite = async () => {
    if (!recipe) return
    if (collections.length === 0) {
      const { addCollection } = useCollectionStore.getState()
      const col = await addCollection('我的收藏')
      await toggleRecipeInCollection(col.id, recipe.id)
    } else {
      await toggleRecipeInCollection(collections[0].id, recipe.id)
    }
  }

  const handleStartCooking = () => {
    Taro.navigateTo({ url: `/pages/cooking/index?id=${recipeId}&servings=${servings}` })
  }

  const handleGenerateShoppingList = async () => {
    const list = await generateFromRecipe(recipeId, servings)
    if (list) Taro.showToast({ title: '购物清单已生成', icon: 'success' })
  }

  const handleShare = () => {
    Taro.showShareMenu({ withShareTicket: true, menus: ['shareAppMessage', 'shareTimeline'] })
  }

  const adjustServings = (delta: number) => {
    const next = servings + delta
    if (next >= 1 && next <= 20) setServings(next)
  }

  const formatTimer = (seconds: number): string => {
    if (seconds < 60) return `${seconds}秒`
    const mins = Math.floor(seconds / 60)
    return `${mins}分钟`
  }

  if (loading) {
    return (
      <View className="detail-page">
        <View className="detail-header">
          <View className="header-back" onClick={() => Taro.navigateBack()}>
            <Icon name="arrowLeft" size={40} color="#57534e" />
          </View>
          <Text className="header-title">加载中...</Text>
          <View className="header-spacer" />
        </View>
      </View>
    )
  }

  if (!recipe) {
    return (
      <View className="detail-page">
        <View className="detail-header">
          <View className="header-back" onClick={() => Taro.navigateBack()}>
            <Icon name="arrowLeft" size={40} color="#57534e" />
          </View>
          <Text className="header-title">菜谱详情</Text>
          <View className="header-spacer" />
        </View>
        <View className="empty-state">
          <View className="empty-icon-box">
            <Icon name="chefHat" size={64} color="#a8a29e" />
          </View>
          <Text className="empty-text">菜谱不存在</Text>
          <View className="empty-btn" onClick={() => Taro.navigateBack()}>
            <Text className="empty-btn-text">返回首页</Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className="detail-page">
      {/* Sticky Header */}
      <View className="detail-header">
        <View className="header-back" onClick={() => Taro.navigateBack()}>
          <Icon name="arrowLeft" size={40} color="#57534e" />
        </View>
        <Text className="header-title">{recipe.name}</Text>
        <View className="header-actions">
          <View className="header-action-btn" onClick={() => Taro.navigateTo({ url: `/pages/recipe/form?id=${recipeId}` })}>
            <Icon name="pencil" size={36} color="#57534e" />
          </View>
          <View className="header-action-btn" onClick={() => setShowDeleteConfirm(true)}>
            <Icon name="trash" size={36} color="#ef4444" />
          </View>
          <View className="header-action-btn" onClick={handleToggleFavorite}>
            <Icon name={isFavorited ? 'heartFilled' : 'heart'} size={36} color={isFavorited ? '#ef4444' : '#a8a29e'} />
          </View>
        </View>
      </View>

      {/* Cover Image */}
      <View className="cover-wrap">
        {recipe.coverImage ? (
          <Image className="cover-img" src={recipe.coverImage} mode="aspectFill" />
        ) : (
          <View className="cover-placeholder">
            <Icon name="chefHat" size={80} color="#e7e5e4" />
          </View>
        )}
      </View>

      {/* Meta Info */}
      <View className="meta-row">
        <View className="meta-pill">
          <Icon name="clock" size={28} color="#a8a29e" />
          <Text className="meta-pill-text">{recipe.duration}分钟</Text>
        </View>
        <View className="meta-pill">
          <Icon name="chefHat" size={28} color="#a8a29e" />
          <Text className="meta-pill-text">{difficultyLabels[recipe.difficulty]}</Text>
        </View>
        <View className="meta-pill">
          <Icon name="users" size={28} color="#a8a29e" />
          <Text className="meta-pill-text">{recipe.servings}人份</Text>
        </View>
      </View>

      {/* Nutrition Card */}
      {perServing && calorieLevel && macroPercentages && (
        <View className="nutrition-card">
          <View className="nutrition-header">
            <Text className="nutrition-title">营养信息（每份）</Text>
            <View className={`calorie-badge calorie-${calorieLevel.level}`}>
              <Text className="calorie-badge-text">{calorieLevel.label} {perServing.calories}kcal</Text>
            </View>
          </View>
          <View className="macro-bar">
            <View className="macro-segment macro-protein" style={{ width: `${macroPercentages.protein}%` }} />
            <View className="macro-segment macro-carbs" style={{ width: `${macroPercentages.carbs}%` }} />
            <View className="macro-segment macro-fat" style={{ width: `${macroPercentages.fat}%` }} />
          </View>
          <View className="macro-grid">
            <View className="macro-item">
              <Text className="macro-label">蛋白质</Text>
              <Text className="macro-value">{perServing.protein}g</Text>
            </View>
            <View className="macro-item">
              <Text className="macro-label">碳水</Text>
              <Text className="macro-value">{perServing.carbs}g</Text>
            </View>
            <View className="macro-item">
              <Text className="macro-label">脂肪</Text>
              <Text className="macro-value">{perServing.fat}g</Text>
            </View>
            <View className="macro-item">
              <Text className="macro-label">膳食纤维</Text>
              <Text className="macro-value">{perServing.fiber}g</Text>
            </View>
          </View>
        </View>
      )}

      {/* Ingredients */}
      <View className="section">
        <View className="section-header">
          <Text className="section-title">用料清单</Text>
          <View className="servings-adjuster">
            <View className="servings-btn" onClick={() => adjustServings(-1)}>
              <Icon name="minus" size={28} color="#78716c" />
            </View>
            <Text className="servings-value">{servings}人份</Text>
            <View className="servings-btn" onClick={() => adjustServings(1)}>
              <Icon name="plus" size={28} color="#78716c" />
            </View>
          </View>
        </View>
        <View className="ingredient-card">
          {scaledIngredients.map((ing, i) => (
            <View key={ing.id} className={`ingredient-row ${i > 0 ? 'has-border' : ''}`}>
              <Text className="ingredient-name">{ing.name}</Text>
              <Text className="ingredient-amount">{formatAmount(ing.amount, ing.unit)}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Steps */}
      <View className="section">
        <Text className="section-title">操作步骤</Text>
        <View className="steps-list">
          {recipe.steps.map((step) => (
            <View key={step.order} className="step-card">
              <View className="step-header">
                <View className="step-number">
                  <Text className="step-number-text">{step.order}</Text>
                </View>
                {step.timer && step.timer > 0 && (
                  <View className="step-timer-badge">
                    <Icon name="clock" size={24} color="#b45309" />
                    <Text className="step-timer-text">{formatTimer(step.timer)}</Text>
                  </View>
                )}
              </View>
              <Text className="step-desc">{step.description}</Text>
              {step.tip && (
                <View className="step-tip">
                  <Icon name="lightbulb" size={28} color="#f59e0b" />
                  <Text className="step-tip-text">{step.tip}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      <View className="action-buttons">
        <View className="action-btn action-btn-primary" onClick={handleStartCooking}>
          <Icon name="play" size={32} color="#fff" />
          <Text className="action-btn-text primary">开始做菜</Text>
        </View>
        <View className="action-btn action-btn-secondary" onClick={handleGenerateShoppingList}>
          <Icon name="shoppingCart" size={32} color="#78716c" />
          <Text className="action-btn-text">生成购物清单</Text>
        </View>
        <View className="action-btn action-btn-secondary" onClick={handleShare}>
          <Icon name="share" size={32} color="#78716c" />
          <Text className="action-btn-text">分享菜谱</Text>
        </View>
      </View>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <View className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <View className="modal-card" onClick={(e) => e.stopPropagation()}>
            <Text className="modal-title">确认删除</Text>
            <Text className="modal-desc">确定要删除「{recipe.name}」吗？此操作无法撤销。</Text>
            <View className="modal-actions">
              <View className="modal-btn modal-btn-cancel" onClick={() => setShowDeleteConfirm(false)}>
                <Text className="modal-btn-text">取消</Text>
              </View>
              <View className="modal-btn modal-btn-delete" onClick={handleDelete}>
                <Text className="modal-btn-text delete">删除</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
