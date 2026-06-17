import { useEffect, useState } from 'react'
import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useRecipeStore } from '@/stores/recipeStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useUIStore } from '@/stores/uiStore'
import { Icon, type IconName } from '@/components/Icon'
import { EmptyState } from '@/components/EmptyState'
import type { Category, Difficulty, Recipe } from '@/types'
import { CATEGORY_OPTIONS, CATEGORY_ICONS, DIFFICULTY_OPTIONS } from '@/constants/options'
import { loadSampleRecipes } from '@/utils/sampleRecipes'
import './index.scss'

export default function HomePage() {
  const recipes = useRecipeStore((s) => s.recipes)
  const loading = useRecipeStore((s) => s.loading)
  const searchQuery = useRecipeStore((s) => s.searchQuery)
  const selectedCategory = useRecipeStore((s) => s.selectedCategory)
  const selectedDifficulty = useRecipeStore((s) => s.selectedDifficulty)
  const loadRecipes = useRecipeStore((s) => s.loadRecipes)
  const setSearchQuery = useRecipeStore((s) => s.setSearchQuery)
  const setSelectedCategory = useRecipeStore((s) => s.setSelectedCategory)
  const setSelectedDifficulty = useRecipeStore((s) => s.setSelectedDifficulty)
  const getFilteredRecipes = useRecipeStore((s) => s.getFilteredRecipes)
  const isRecipeCollected = useCollectionStore((s) => s.isRecipeCollected)
  const toggleRecipeInCollection = useCollectionStore((s) => s.toggleRecipeInCollection)
  const loadCollections = useCollectionStore((s) => s.loadCollections)
  const showToast = useUIStore((s) => s.showToast)

  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery)

  useDidShow(() => {
    loadRecipes()
    loadCollections()
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(debouncedQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [debouncedQuery])

  const filteredRecipes = getFilteredRecipes()

  const handleToggleFavorite = async (e: any, recipeId: string) => {
    e.stopPropagation()
    const collections = useCollectionStore.getState().collections
    if (collections.length > 0) {
      await toggleRecipeInCollection(collections[0].id, recipeId)
    }
  }

  const handleImportSamples = async () => {
    await loadSampleRecipes()
    await loadRecipes()
    showToast('已导入示例菜谱', 'success')
  }

  const handleCreateRecipe = () => {
    Taro.navigateTo({ url: '/pages/recipe/form' })
  }

  const handleGoBlindBox = () => {
    Taro.switchTab({ url: '/pages/blind-box/index' })
  }

  const handleRecipeClick = (recipe: Recipe) => {
    Taro.navigateTo({ url: `/pages/recipe/detail?id=${recipe.id}` })
  }

  const renderRecipeCard = (recipe: Recipe, index: number) => {
    const difficultyOption = DIFFICULTY_OPTIONS.find((d) => d.value === recipe.difficulty)
    const categoryOption = CATEGORY_OPTIONS.find((c) => c.value === recipe.category)
    const categoryIcon = CATEGORY_ICONS[recipe.category] || 'chefHat'

    return (
      <View
        key={recipe.id}
        className='recipe-card'
        style={{ animationDelay: `${index * 0.06}s` }}
        onClick={() => handleRecipeClick(recipe)}
      >
        <View className='recipe-card__cover'>
          {recipe.coverImage ? (
            <View className='recipe-card__img' style={{ backgroundImage: `url(${recipe.coverImage})` }} />
          ) : (
            <View className='recipe-card__placeholder'>
              <Icon name={categoryIcon} size={48} color='#a8a08e' />
            </View>
          )}
        </View>
        <View className='recipe-card__content'>
          <View className='recipe-card__header'>
            <Text className='recipe-card__name'>{recipe.name}</Text>
            <View
              className='recipe-card__fav'
              onClick={(e) => handleToggleFavorite(e, recipe.id)}
            >
              <Icon
                name={isRecipeCollected(recipe.id) ? 'heartFilled' : 'heart'}
                size={36}
                color={isRecipeCollected(recipe.id) ? '#ef4444' : '#a8a08e'}
              />
            </View>
          </View>
          <View className='recipe-card__tags'>
            {difficultyOption && (
              <View className={`recipe-card__badge recipe-card__badge--${recipe.difficulty}`}>
                <Text>{difficultyOption.label}</Text>
              </View>
            )}
            {categoryOption && (
              <View className='recipe-card__badge recipe-card__badge--category'>
                <Text>{categoryOption.label}</Text>
              </View>
            )}
            {recipe.tags.slice(0, 2).map((tag) => (
              <View key={tag} className='recipe-card__badge recipe-card__badge--tag'>
                <Text>{tag}</Text>
              </View>
            ))}
          </View>
          <View className='recipe-card__meta'>
            <View className='recipe-card__meta-item'>
              <Icon name='clock' size={28} color='#a8a08e' />
              <Text className='recipe-card__meta-text'>{recipe.duration}分钟</Text>
            </View>
            <Text className='recipe-card__meta-text'>{recipe.servings}人份</Text>
          </View>
        </View>
      </View>
    )
  }

  const renderContent = () => {
    if (loading) {
      return (
        <View className='skeleton-list'>
          {[1, 2, 3].map((i) => (
            <View key={i} className='skeleton-card'>
              <View className='skeleton-card__cover' />
              <View className='skeleton-card__content'>
                <View className='skeleton-card__line skeleton-card__line--long' />
                <View className='skeleton-card__line skeleton-card__line--short' />
              </View>
            </View>
          ))}
        </View>
      )
    }

    if (filteredRecipes.length === 0) {
      return (
        <EmptyState
          icon='chefHat'
          title='还没有菜谱'
          description='创建你的第一道菜谱，或导入示例菜谱开始探索'
          action={{ label: '创建菜谱', onClick: handleCreateRecipe }}
          secondaryAction={{ label: '导入示例菜谱', onClick: handleImportSamples }}
        />
      )
    }

    return (
      <View className='recipe-list'>
        {filteredRecipes.map(renderRecipeCard)}
      </View>
    )
  }

  return (
    <View className='home-page'>
      <View className='home-header'>
        <View className='home-header__top'>
          <View>
            <Text className='home-header__title'>寻味</Text>
            <Text className='home-header__count'>{filteredRecipes.length} 道菜谱</Text>
          </View>
          <View className='home-header__actions'>
            <View className='home-header__btn' onClick={handleGoBlindBox}>
              <Icon name='dice' size={40} color='#252220' />
            </View>
            <View className='home-header__btn home-header__btn--primary' onClick={handleCreateRecipe}>
              <Icon name='plus' size={40} color='#ffffff' />
            </View>
          </View>
        </View>

        <View className='home-search'>
          <Icon name='search' size={36} color='#a8a08e' />
          <Input
            className='home-search__input'
            placeholder='搜索菜谱...'
            value={debouncedQuery}
            onInput={(e) => setDebouncedQuery(e.detail.value)}
          />
          {debouncedQuery && (
            <View className='home-search__clear' onClick={() => setDebouncedQuery('')}>
              <Icon name='x' size={32} color='#a8a08e' />
            </View>
          )}
        </View>

        <ScrollView scrollX className='home-filters' enhanced showScrollbar={false}>
          <View className='home-filters__pills'>
            {CATEGORY_OPTIONS.map((cat) => {
              const catIcon = cat.value !== 'all' ? CATEGORY_ICONS[cat.value] : undefined
              return (
                <View
                  key={cat.value}
                  className={`pill ${selectedCategory === cat.value ? 'pill--active' : ''}`}
                  onClick={() => setSelectedCategory(cat.value as Category | 'all')}
                >
                  {catIcon && <Icon name={catIcon} size={28} color={selectedCategory === cat.value ? '#ffffff' : '#6b6355'} />}
                  <Text>{cat.label}</Text>
                </View>
              )
            })}
          </View>
        </ScrollView>

        <ScrollView scrollX className='home-filters' enhanced showScrollbar={false}>
          <View className='home-filters__pills'>
            {DIFFICULTY_OPTIONS.map((diff) => (
              <View
                key={diff.value}
                className={`pill ${selectedDifficulty === diff.value ? 'pill--active' : ''}`}
                onClick={() => setSelectedDifficulty(diff.value as Difficulty | 'all')}
              >
                <Text>{diff.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {renderContent()}
    </View>
  )
}
