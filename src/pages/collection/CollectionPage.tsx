import { useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Heart, Clock,
} from 'lucide-react'
import { useCollectionStore } from '@/stores/collectionStore'
import { useRecipeStore } from '@/stores/recipeStore'
import { useUIStore } from '@/stores/uiStore'
import { EmptyState } from '@/components/ui/EmptyState'
import { BrandLoading } from '@/components/ui/BrandLoading'
import { categoryIcons, difficultyConfig } from '@/constants/categories'
import type { Recipe } from '@/types'

export function CollectionPage() {
  const navigate = useNavigate()
  const { collections, loadCollections, toggleRecipeInCollection } = useCollectionStore()
  const { recipes, loading } = useRecipeStore()
  const showToast = useUIStore((s) => s.showToast)

  useEffect(() => {
    loadCollections()
  }, [loadCollections])

  const favoritedRecipes = useMemo(() => {
    const favIds = new Set(collections.flatMap((c) => c.recipeIds))
    return recipes.filter((r) => favIds.has(r.id))
  }, [collections, recipes])

  const handleRemoveFavorite = async (recipe: Recipe) => {
    const col = collections.find((c) => c.recipeIds.includes(recipe.id))
    if (col) {
      await toggleRecipeInCollection(col.id, recipe.id)
      showToast('已取消收藏', 'info')
    }
  }

  if (loading) {
    return (
      <BrandLoading>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-[var(--color-bg-card)] p-4 shadow-xs">
              <div className="flex gap-4">
                <div className="h-20 w-20 rounded-xl bg-[var(--color-bg-subtle)]" />
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-4 w-32 rounded bg-[var(--color-bg-subtle)]" />
                  <div className="h-3 w-48 rounded bg-[var(--color-bg-subtle)]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </BrandLoading>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-bg-card)] shadow-xs transition-all duration-200 hover:shadow-sm active:scale-95"
        >
          <ArrowLeft size={18} className="text-[var(--color-text-secondary)]" />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-text)]">
            我的收藏
          </h1>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
            {favoritedRecipes.length > 0 ? `${favoritedRecipes.length} 道收藏` : '收藏喜欢的菜谱'}
          </p>
        </div>
      </div>

      {/* Recipe list */}
      {favoritedRecipes.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="还没有收藏"
          description="浏览菜谱时点击爱心，即可收藏喜欢的菜谱"
          action={{ label: '去逛逛', to: '/' }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {favoritedRecipes.map((recipe, index) => {
            const CategoryIcon = categoryIcons[recipe.category]
            const diff = difficultyConfig[recipe.difficulty]
            const staggerClass = `stagger-${Math.min((index % 8) + 1, 8)}`
            return (
              <div
                key={recipe.id}
                className={`group relative overflow-hidden rounded-3xl bg-[var(--color-bg-card)] border border-[var(--color-border)]/60 p-3.5 shadow-xs transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-[var(--color-primary)]/30 active:scale-[0.98] animate-card-in ${staggerClass}`}
              >
                <Link
                  to={`/recipe/${recipe.id}`}
                  className="flex items-center gap-3.5"
                >
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
                  <div className="min-w-0 flex-1 py-0.5">
                    <h3 className="truncate text-base font-bold text-[var(--color-text)] transition-colors duration-200 group-hover:text-[var(--color-primary)]">
                      {recipe.name}
                    </h3>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${diff.color}`}>
                        {diff.label}
                      </span>
                      {recipe.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="rounded-full bg-[var(--color-bg-subtle)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-text-secondary)]">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center gap-2.5 text-xs text-[var(--color-text-muted)]">
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
                  onClick={() => handleRemoveFavorite(recipe)}
                  aria-label="取消收藏"
                  className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-bg-card)]/80 backdrop-blur-md shadow-2xs text-red-500 transition-all duration-200 hover:scale-110 active:scale-90"
                >
                  <Heart size={16} className="fill-current" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
