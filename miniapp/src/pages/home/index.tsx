import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useMemo } from 'react'
import { useRecipeStore } from '@/stores/recipeStore'
import { getRandomChineseRecipes } from '@/data/chineseRecipes'
import { scenes, getTimeScene, getSceneRecommendations, getSeasonalRecommendations, getQuickRecipes } from '@/utils/recommendations'
import { Icon, type IconName } from '@/components/Icon'
import type { Category, Difficulty, Scene } from '@/types'
import './index.scss'

const categoryIcons: Record<Category, IconName> = {
  'cold-dish': 'leaf',
  'hot-dish': 'flame',
  'soup': 'soup',
  'staple': 'wheat',
  'dessert': 'iceCreamCone',
  'drink': 'cupSoda',
}

const categoryLabels: Record<Category, string> = {
  'cold-dish': '凉菜',
  'hot-dish': '热菜',
  'soup': '汤羹',
  'staple': '主食',
  'dessert': '甜品',
  'drink': '饮品',
}

const difficultyConfig: Record<Difficulty, { label: string; className: string }> = {
  easy: { label: '简单', className: 'diff-easy' },
  medium: { label: '中等', className: 'diff-medium' },
  hard: { label: '困难', className: 'diff-hard' },
}

export default function HomePage() {
  const {
    recipes,
    loading,
    searchQuery,
    categoryFilter,
    difficultyFilter,
    loadRecipes,
    setSearchQuery,
    setCategoryFilter,
    setDifficultyFilter,
    filteredRecipes,
  } = useRecipeStore()

  const [activeScene, setActiveScene] = useState<Scene>(getTimeScene())

  useDidShow(() => {
    loadRecipes()
  })

  const handleImportSamples = async () => {
    const { db } = await import('@/utils/storage')
    const samples = getRandomChineseRecipes(5)
    for (const recipe of samples) {
      await db.putRecipe(recipe)
    }
    await loadRecipes()
  }

  const filtered = filteredRecipes()
  const categories = Object.entries(categoryLabels) as [Category, string][]
  const showRecommendations = !searchQuery && !categoryFilter && recipes.length > 0

  const sceneRecipes = useMemo(() => getSceneRecommendations(recipes, activeScene, 4), [recipes, activeScene])
  const quickRecipes = useMemo(() => getQuickRecipes(recipes, 4), [recipes])
  const seasonalRecipes = useMemo(() => getSeasonalRecommendations(recipes, 4), [recipes])

  return (
    <View className="home-page">
      {/* Sticky Header */}
      <View className="home-header-sticky">
        <View className="home-header-left">
          <Text className="home-title">菜谱库</Text>
          <Text className="home-subtitle">
            {filtered.length > 0 ? `${filtered.length} 道拿手菜` : '记录你的拿手好菜'}
          </Text>
        </View>
        <View className="home-add-btn" onClick={() => Taro.navigateTo({ url: '/pages/recipe/form' })}>
          <Text className="home-add-icon">+</Text>
        </View>
      </View>

      {/* Search */}
      <View className="search-bar">
        <View className="search-icon-wrap">
          <Icon name="search" size={36} color="#a8a29e" />
        </View>
        <Input
          className="search-input"
          placeholder="搜索菜谱、食材、标签..."
          value={searchQuery}
          onInput={(e) => setSearchQuery(e.detail.value)}
        />
      </View>

      {/* Scene selector */}
      {showRecommendations && (
        <View className="section">
          <Text className="section-label">今日推荐</Text>
          <ScrollView scrollX className="pill-scroll">
            {scenes.map(({ id, label, emoji }) => (
              <View
                key={id}
                className={`pill ${activeScene === id ? 'pill-active' : ''}`}
                onClick={() => setActiveScene(id)}
              >
                <Text className="pill-emoji">{emoji}</Text>
                <Text className="pill-text">{label}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Scene recommendations grid */}
      {showRecommendations && sceneRecipes.length > 0 && (
        <View className="section">
          <Text className="section-title">
            {scenes.find(s => s.id === activeScene)?.emoji} {scenes.find(s => s.id === activeScene)?.label}推荐
          </Text>
          <View className="scene-grid">
            {sceneRecipes.map((recipe) => (
              <View
                key={recipe.id}
                className="scene-card"
                onClick={() => Taro.navigateTo({ url: `/pages/recipe/detail?id=${recipe.id}` })}
              >
                <View className="scene-card-icon-area">
                  <Icon name={categoryIcons[recipe.category]} size={64} color="#e47a4e" />
                </View>
                <View className="scene-card-body">
                  <Text className="scene-card-name">{recipe.name}</Text>
                  <Text className="scene-card-meta">{recipe.duration}分钟 · {difficultyConfig[recipe.difficulty].label}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Quick recipes */}
      {showRecommendations && quickRecipes.length > 0 && (
        <View className="section">
          <Text className="section-title">⚡ 快手菜（30分钟内）</Text>
          <ScrollView scrollX className="card-scroll">
            {quickRecipes.map((recipe) => (
              <View
                key={recipe.id}
                className="quick-card"
                onClick={() => Taro.navigateTo({ url: `/pages/recipe/detail?id=${recipe.id}` })}
              >
                <View className="quick-card-icon-box">
                  <Icon name="clock" size={40} color="#a8a29e" />
                </View>
                <View className="quick-card-info">
                  <Text className="quick-card-name">{recipe.name}</Text>
                  <Text className="quick-card-meta">{recipe.duration}分钟</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Seasonal recommendations */}
      {showRecommendations && seasonalRecipes.length > 0 && (
        <View className="section">
          <Text className="section-title">🍂 时令推荐</Text>
          <ScrollView scrollX className="card-scroll">
            {seasonalRecipes.map((recipe) => (
              <View
                key={recipe.id}
                className="quick-card"
                onClick={() => Taro.navigateTo({ url: `/pages/recipe/detail?id=${recipe.id}` })}
              >
                <View className="quick-card-icon-box seasonal">
                  <Icon name="leaf" size={40} color="#e47a4e" />
                </View>
                <View className="quick-card-info">
                  <Text className="quick-card-name">{recipe.name}</Text>
                  <Text className="quick-card-meta">{recipe.tags[0] || '应季'}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Category filters */}
      <ScrollView scrollX className="pill-scroll">
        <View
          className={`pill ${categoryFilter === null ? 'pill-active' : ''}`}
          onClick={() => setCategoryFilter(null)}
        >
          <Text className="pill-text">全部</Text>
        </View>
        {categories.map(([value, label]) => (
          <View
            key={value}
            className={`pill ${categoryFilter === value ? 'pill-active' : ''}`}
            onClick={() => setCategoryFilter(categoryFilter === value ? null : value)}
          >
            <View className="pill-icon-wrap">
              <Icon name={categoryIcons[value]} size={32} color={categoryFilter === value ? '#c9583a' : '#78716c'} />
            </View>
            <Text className="pill-text">{label}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Difficulty filters */}
      <View className="diff-filters">
        {Object.entries(difficultyConfig).map(([value, config]) => (
          <View
            key={value}
            className={`diff-pill ${difficultyFilter === value ? 'diff-pill-active' : ''}`}
            onClick={() => setDifficultyFilter(difficultyFilter === value ? null : value as Difficulty)}
          >
            <Text className="diff-pill-text">{config.label}</Text>
          </View>
        ))}
      </View>

      {/* Recipe list */}
      {loading ? (
        <View className="skeleton-list">
          {[1, 2, 3].map((i) => (
            <View key={i} className="skeleton-card">
              <View className="skeleton-img" />
              <View className="skeleton-lines">
                <View className="skeleton-line skeleton-line-1" />
                <View className="skeleton-line skeleton-line-2" />
                <View className="skeleton-line skeleton-line-3" />
              </View>
            </View>
          ))}
        </View>
      ) : filtered.length === 0 ? (
        <View className="empty-state">
          <View className="empty-icon-box">
            <Text className="empty-icon">🍳</Text>
          </View>
          <Text className="empty-title">还没有菜谱</Text>
          <Text className="empty-desc">快来创建你的第一道拿手菜吧</Text>
          <View className="empty-actions">
            <View className="empty-btn-primary" onClick={() => Taro.navigateTo({ url: '/pages/recipe/form' })}>
              <Text className="empty-btn-primary-text">创建菜谱</Text>
            </View>
            <View className="empty-btn-secondary" onClick={handleImportSamples}>
              <Text className="empty-btn-secondary-text">导入示例菜谱</Text>
            </View>
          </View>
        </View>
      ) : (
        <View className="recipe-list">
          {filtered.map((recipe) => {
            const diff = difficultyConfig[recipe.difficulty]
            return (
              <View
                key={recipe.id}
                className="recipe-card"
                onClick={() => Taro.navigateTo({ url: `/pages/recipe/detail?id=${recipe.id}` })}
              >
                <View className="recipe-card-icon-box">
                  <Icon name={categoryIcons[recipe.category]} size={56} color="#a8a29e" />
                </View>
                <View className="recipe-card-info">
                  <Text className="recipe-card-name">{recipe.name}</Text>
                  <View className="recipe-card-badges">
                    <Text className={`recipe-card-diff ${diff.className}`}>{diff.label}</Text>
                    {recipe.tags.slice(0, 2).map((tag) => (
                      <Text key={tag} className="recipe-card-tag">{tag}</Text>
                    ))}
                  </View>
                  <View className="recipe-card-footer">
                    <View className="recipe-card-time">
                      <Icon name="clock" size={24} color="#a8a29e" />
                      <Text className="recipe-card-time-text">{recipe.duration}分钟</Text>
                    </View>
                    <Text className="recipe-card-servings">{recipe.servings}人份</Text>
                  </View>
                </View>
              </View>
            )
          })}
        </View>
      )}
    </View>
  )
}
