import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Search, Plus, Clock, ChefHat, Heart, Sparkles, Download,
} from 'lucide-react'
import { useRecipeStore } from '@/stores/recipeStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useDebounce } from '@/hooks/useDebounce'
import { getSceneRecommendations, getTimeScene, scenes } from '@/utils/recommendations'
import { BrandLoading } from '@/components/ui/BrandLoading'
import { VirtualList } from '@/components/ui/VirtualList'
import { categoryIcons, categoryLabels, difficultyConfig } from '@/constants/categories'
import type { Category, Difficulty, Recipe } from '@/types'

const VIRTUAL_THRESHOLD = 20
const ITEM_HEIGHT = 104

export function HomePage() {
  const {
    loading,
    categoryFilter,
    difficultyFilter,
    setSearchQuery,
    setCategoryFilter,
    setDifficultyFilter,
    filteredRecipes: recipes,
  } = useRecipeStore()

  const [searchParams] = useSearchParams()
  const [inputValue, setInputValue] = useState('')
  const debouncedSearch = useDebounce(inputValue, 300)

  useEffect(() => {
    setSearchQuery(debouncedSearch)
  }, [debouncedSearch, setSearchQuery])

  useEffect(() => {
    const q = searchParams.get('q')
    if (q && !inputValue) {
      setInputValue(q)
    }
  }, [searchParams, inputValue])

  const categories = Object.entries(categoryLabels) as [Category, string][]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="sticky top-0 z-40 -mx-5 -mt-6 flex items-end justify-between bg-[var(--color-bg)]/95 px-5 py-3 backdrop-blur-sm">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-text)]">
            寻味
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {recipes.length > 0 ? `${recipes.length} 道拿手菜` : '记录你的拿手好菜'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/recipe/import"
            aria-label="导入菜谱"
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-95"
          >
            <Download size={20} />
          </Link>
          <Link
            to="/recipe/new"
            aria-label="创建菜谱"
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-white shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
          >
            <Plus size={20} strokeWidth={2.2} />
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="搜索菜谱、食材、标签..."
          className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] py-3 pl-11 pr-4 text-sm text-[var(--color-text)] shadow-xs outline-none transition-all duration-200 placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-stone-300)] focus:shadow-sm focus:ring-2 focus:ring-[var(--color-border-subtle)]"
        />
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setCategoryFilter(null)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
            categoryFilter === null
              ? 'bg-[var(--color-primary)] text-white shadow-sm'
              : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]'
          }`}
        >
          全部
        </button>
        {categories.map(([value, label]) => {
          const Icon = categoryIcons[value]
          return (
            <button
              key={value}
              onClick={() => setCategoryFilter(categoryFilter === value ? null : value)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                categoryFilter === value
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          )
        })}
      </div>

      {/* Difficulty & Tag filters (Horizontal sleek scroll) */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none items-center">
        {Object.entries(difficultyConfig).map(([value, config]) => (
          <button
            key={value}
            onClick={() => setDifficultyFilter(difficultyFilter === value ? null : value as Difficulty)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
              difficultyFilter === value
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]'
            }`}
          >
            {config.label}
          </button>
        ))}

        <span className="shrink-0 text-[var(--color-border)]">|</span>

        {/* Dynamic popular tags */}
        {Array.from(new Set(recipes.flatMap((r) => r.tags || [])))
          .slice(0, 8)
          .map((tag) => (
            <button
              key={tag}
              onClick={() => setInputValue(inputValue === tag ? '' : tag)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                inputValue === tag
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              #{tag}
            </button>
          ))}
      </div>

      {/* Recommendations */}
      {recipes.length > 0 && !categoryFilter && !difficultyFilter && !inputValue && (
        <RecommendationSection recipes={recipes} />
      )}

      {/* Recipe list */}
      {loading ? (
        <BrandLoading>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-[var(--color-bg-card)] p-4 shadow-xs">
                <div className="flex gap-4">
                  <div className="h-20 w-20 rounded-xl bg-[var(--color-bg-subtle)]" />
                  <div className="flex-1 space-y-3 py-1">
                    <div className="h-4 w-32 rounded bg-[var(--color-bg-subtle)]" />
                    <div className="h-3 w-48 rounded bg-[var(--color-bg-subtle)]" />
                    <div className="h-3 w-24 rounded bg-[var(--color-bg-subtle)]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </BrandLoading>
      ) : recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--color-bg-subtle)]">
            <ChefHat size={36} className="text-[var(--color-text-muted)]" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-[var(--color-text)]">还没有菜谱</h3>
          <p className="mb-8 text-sm text-[var(--color-text-muted)]">快来创建你的第一道拿手菜吧</p>
          <Link
            to="/recipe/new"
            className="rounded-2xl bg-[var(--color-primary)] px-8 py-3 text-sm font-medium text-white shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
          >
            创建菜谱
          </Link>
        </div>
      ) : recipes.length > VIRTUAL_THRESHOLD ? (
        <VirtualList
          items={recipes}
          itemHeight={ITEM_HEIGHT}
          containerHeight={600}
          renderItem={(recipe) => <RecipeCard recipe={recipe} />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {recipes.map((recipe, index) => (
            <RecipeCard key={recipe.id} recipe={recipe} index={index} />
          ))}
        </div>
      )}
    </div>
  )
}

function RecipeCard({ recipe, index = 0 }: { recipe: Recipe; index?: number }) {
  const CategoryIcon = categoryIcons[recipe.category]
  const diff = difficultyConfig[recipe.difficulty]
  const { collections, toggleRecipeInCollection } = useCollectionStore()
  const isFavorited = collections.some((c) => c.recipeIds.includes(recipe.id))
  const [animating, setAnimating] = useState(false)

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setAnimating(true)
    setTimeout(() => setAnimating(false), 500)
    if (collections.length === 0) {
      const { addCollection } = useCollectionStore.getState()
      const col = await addCollection('我的收藏')
      await toggleRecipeInCollection(col.id, recipe.id)
    } else {
      await toggleRecipeInCollection(collections[0].id, recipe.id)
    }
  }

  const staggerClass = `stagger-${Math.min((index % 8) + 1, 8)}`

  return (
    <div className={`group relative overflow-hidden rounded-3xl bg-[var(--color-bg-card)] border border-[var(--color-border)]/60 shadow-xs transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-[var(--color-primary)]/30 active:scale-[0.98] animate-card-in ${staggerClass}`}>
      <Link to={`/recipe/${recipe.id}`} className="flex gap-3.5 p-3.5">
        {recipe.coverImage ? (
          <img
            src={recipe.coverImage}
            alt={recipe.name}
            loading="lazy"
            className="h-22 w-22 shrink-0 rounded-2xl object-cover shadow-2xs transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-22 w-22 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/10 via-[var(--color-bg-subtle)] to-orange-500/10 shadow-2xs transition-transform duration-300 group-hover:scale-105">
            <CategoryIcon size={32} className="text-amber-600/70 dark:text-amber-400/70" />
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
          <div>
            <h3 className="truncate text-base font-bold text-[var(--color-text)] transition-colors duration-200 group-hover:text-[var(--color-primary)]">
              {recipe.name}
            </h3>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${diff.color}`}>
                {diff.label}
              </span>
              {recipe.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[var(--color-bg-subtle)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-text-secondary)]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1 font-medium">
              <Clock size={12} className="text-amber-500" />
              {recipe.duration}分钟
            </span>
            <span>·</span>
            <span className="font-medium">{recipe.servings}人份</span>
          </div>
        </div>
      </Link>
      <button
        onClick={handleToggleFavorite}
        aria-label={isFavorited ? '取消收藏' : '收藏'}
        className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-bg-card)]/80 backdrop-blur-md shadow-2xs transition-all duration-200 hover:scale-110 active:scale-90"
      >
        <Heart
          size={16}
          className={`transition-colors ${animating ? 'animate-heart-bounce' : ''} ${
            isFavorited ? 'fill-red-500 text-red-500' : 'text-[var(--color-text-muted)] hover:text-red-400'
          }`}
        />
      </button>
    </div>
  )
}

function RecommendationSection({ recipes }: { recipes: Recipe[] }) {
  const timeScene = getTimeScene()
  const sceneInfo = scenes.find((s) => s.id === timeScene)
  const recommendations = getSceneRecommendations(recipes, timeScene, 5)

  if (recommendations.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-amber-500" />
        <h2 className="text-sm font-semibold text-[var(--color-text)]">
          {sceneInfo?.emoji} 为你推荐
        </h2>
        <span className="text-xs text-[var(--color-text-muted)]">
          {sceneInfo?.label}时段
        </span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {recommendations.map((recipe) => (
          <Link
            key={recipe.id}
            to={`/recipe/${recipe.id}`}
            className="shrink-0 w-32 rounded-2xl bg-[var(--color-bg-card)] p-3 shadow-xs transition-all duration-200 hover:shadow-md active:scale-95"
          >
            <div className="mb-2 flex h-16 items-center justify-center rounded-xl bg-[var(--color-bg-subtle)] text-xl">
              {categoryIcons[recipe.category]
                ? (() => {
                    const Icon = categoryIcons[recipe.category]
                    return <Icon size={24} className="text-[var(--color-text-muted)]" />
                  })()
                : recipe.name.charAt(0)}
            </div>
            <p className="truncate text-xs font-medium text-[var(--color-text)]">
              {recipe.name}
            </p>
            <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">
              {recipe.duration}分钟
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
