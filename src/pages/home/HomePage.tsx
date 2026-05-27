import { useEffect, useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Search, Plus, Clock, ChefHat, Flame, Leaf, Soup, Wheat, IceCreamCone, CupSoda,
} from 'lucide-react'
import { useRecipeStore } from '@/stores/recipeStore'
import { seedSampleRecipes } from '@/utils/sampleRecipes'
import {
  scenes, getTimeScene, getSceneRecommendations, getSeasonalRecommendations, getQuickRecipes,
  type Scene,
} from '@/utils/recommendations'
import type { Category, Difficulty } from '@/types'

const categoryIcons: Record<Category, typeof ChefHat> = {
  'cold-dish': Leaf,
  'hot-dish': Flame,
  'soup': Soup,
  'staple': Wheat,
  'dessert': IceCreamCone,
  'drink': CupSoda,
}

const categoryLabels: Record<Category, string> = {
  'cold-dish': '凉菜',
  'hot-dish': '热菜',
  'soup': '汤羹',
  'staple': '主食',
  'dessert': '甜品',
  'drink': '饮品',
}

const difficultyConfig: Record<Difficulty, { label: string; color: string }> = {
  easy: { label: '简单', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' },
  medium: { label: '中等', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' },
  hard: { label: '困难', color: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400' },
}

export function HomePage() {
  const {
    loading,
    searchQuery,
    categoryFilter,
    difficultyFilter,
    setSearchQuery,
    setCategoryFilter,
    setDifficultyFilter,
    loadRecipes,
    filteredRecipes,
    recipes: allRecipes,
  } = useRecipeStore()

  const [activeScene, setActiveScene] = useState<Scene>(getTimeScene())
  const [searchParams] = useSearchParams()

  useEffect(() => {
    loadRecipes()
  }, [loadRecipes])

  useEffect(() => {
    const q = searchParams.get('q')
    if (q && !searchQuery) {
      setSearchQuery(q)
    }
  }, [searchParams, searchQuery, setSearchQuery])

  const handleImportSamples = async () => {
    await seedSampleRecipes()
    await loadRecipes()
  }

  const recipes = filteredRecipes()
  const categories = Object.entries(categoryLabels) as [Category, string][]

  // Recommendations
  const sceneRecipes = useMemo(
    () => getSceneRecommendations(allRecipes, activeScene, 4),
    [allRecipes, activeScene]
  )
  const seasonalRecipes = useMemo(
    () => getSeasonalRecommendations(allRecipes, 4),
    [allRecipes]
  )
  const quickRecipes = useMemo(
    () => getQuickRecipes(allRecipes, 4),
    [allRecipes]
  )

  const showRecommendations = !searchQuery && !categoryFilter && allRecipes.length > 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="sticky top-0 z-40 -mx-5 -mt-6 flex items-end justify-between bg-[var(--color-bg)]/95 px-5 py-3 backdrop-blur-sm">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-text)]">
            菜谱库
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {recipes.length > 0 ? `${recipes.length} 道拿手菜` : '记录你的拿手好菜'}
          </p>
        </div>
        <Link
          to="/recipe/new"
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-white shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
        >
          <Plus size={20} strokeWidth={2.2} />
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索菜谱、食材、标签..."
          className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] py-3 pl-11 pr-4 text-sm text-[var(--color-text)] shadow-xs outline-none transition-all duration-200 placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-stone-300)] focus:shadow-sm focus:ring-2 focus:ring-[var(--color-border-subtle)]"
        />
      </div>

      {/* Scene selector - only show when not filtering */}
      {showRecommendations && (
        <div className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
            今日推荐
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {scenes.map(({ id, label, emoji }) => (
              <button
                key={id}
                onClick={() => setActiveScene(id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  activeScene === id
                    ? 'bg-[var(--color-primary)] text-white shadow-sm'
                    : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]'
                }`}
              >
                <span>{emoji}</span>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Scene recommendations */}
      {showRecommendations && sceneRecipes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-[var(--color-text)]">
              {scenes.find(s => s.id === activeScene)?.emoji} {scenes.find(s => s.id === activeScene)?.label}推荐
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {sceneRecipes.map((recipe) => {
              const CategoryIcon = categoryIcons[recipe.category]
              return (
                <Link
                  key={recipe.id}
                  to={`/recipe/${recipe.id}`}
                  className="group overflow-hidden rounded-2xl bg-[var(--color-bg-card)] shadow-xs transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="flex h-24 items-center justify-center bg-gradient-to-br from-[var(--color-accent-50)] to-[var(--color-bg-subtle)]">
                    <CategoryIcon size={32} className="text-[var(--color-accent-300)]" />
                  </div>
                  <div className="p-3">
                    <h4 className="truncate text-sm font-medium text-[var(--color-text)]">{recipe.name}</h4>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                      {recipe.duration}分钟 · {recipe.difficulty === 'easy' ? '简单' : recipe.difficulty === 'medium' ? '中等' : '困难'}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick recipes */}
      {showRecommendations && quickRecipes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-[var(--color-text)]">⚡ 快手菜（30分钟内）</h3>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
            {quickRecipes.map((recipe) => (
              <Link
                key={recipe.id}
                to={`/recipe/${recipe.id}`}
                className="flex shrink-0 items-center gap-3 rounded-2xl bg-[var(--color-bg-card)] p-3 shadow-xs transition-all duration-200 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-bg-subtle)]">
                  <Clock size={20} className="text-[var(--color-text-muted)]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-text)]">{recipe.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{recipe.duration}分钟</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Seasonal recommendations */}
      {showRecommendations && seasonalRecipes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-[var(--color-text)]">🍂 时令推荐</h3>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
            {seasonalRecipes.map((recipe) => (
              <Link
                key={recipe.id}
                to={`/recipe/${recipe.id}`}
                className="flex shrink-0 items-center gap-3 rounded-2xl bg-[var(--color-bg-card)] p-3 shadow-xs transition-all duration-200 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent-50)]">
                  <Leaf size={20} className="text-[var(--color-accent-400)]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-text)]">{recipe.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{recipe.tags[0]}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

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

      {/* Difficulty filters */}
      <div className="flex gap-2">
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
      </div>

      {/* Recipe list */}
      {loading ? (
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
      ) : recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--color-bg-subtle)]">
            <ChefHat size={36} className="text-[var(--color-text-muted)]" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-[var(--color-text)]">还没有菜谱</h3>
          <p className="mb-8 text-sm text-[var(--color-text-muted)]">快来创建你的第一道拿手菜吧</p>
          <div className="flex gap-3">
            <Link
              to="/recipe/new"
              className="rounded-2xl bg-[var(--color-primary)] px-8 py-3 text-sm font-medium text-white shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
            >
              创建菜谱
            </Link>
            <button
              onClick={handleImportSamples}
              className="rounded-2xl bg-[var(--color-bg-card)] px-8 py-3 text-sm font-medium text-[var(--color-text-secondary)] shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-95"
            >
              导入示例菜谱
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {recipes.map((recipe) => {
            const CategoryIcon = categoryIcons[recipe.category]
            const diff = difficultyConfig[recipe.difficulty]
            return (
              <Link
                key={recipe.id}
                to={`/recipe/${recipe.id}`}
                className="group block overflow-hidden rounded-2xl bg-[var(--color-bg-card)] shadow-xs transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99]"
              >
                <div className="flex gap-4 p-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-bg-subtle)] to-[var(--color-bg)]">
                    <CategoryIcon size={28} className="text-[var(--color-text-muted)]" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                    <div>
                      <h3 className="truncate text-base font-semibold text-[var(--color-text)] transition-colors duration-200 group-hover:text-[var(--color-primary)]">
                        {recipe.name}
                      </h3>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${diff.color}`}>
                          {diff.label}
                        </span>
                        {recipe.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-[var(--color-bg-subtle)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-secondary)]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {recipe.duration}分钟
                      </span>
                      <span>{recipe.servings}人份</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
