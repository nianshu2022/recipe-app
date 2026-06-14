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
        <div className="space-y-3">
          {favoritedRecipes.map((recipe) => {
            const CategoryIcon = categoryIcons[recipe.category]
            const diff = difficultyConfig[recipe.difficulty]
            return (
              <div
                key={recipe.id}
                className="group flex items-center gap-3 overflow-hidden rounded-2xl bg-[var(--color-bg-card)] p-4 shadow-xs transition-all duration-300 hover:shadow-md"
              >
                <Link
                  to={`/recipe/${recipe.id}`}
                  className="flex min-w-0 flex-1 items-center gap-4"
                >
                  {recipe.coverImage ? (
                    <img src={recipe.coverImage} alt={recipe.name} className="h-20 w-20 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-bg-subtle)] to-[var(--color-bg)]">
                      <CategoryIcon size={28} className="text-[var(--color-text-muted)]" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold text-[var(--color-text)]">
                      {recipe.name}
                    </h3>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${diff.color}`}>
                        {diff.label}
                      </span>
                      {recipe.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="rounded-full bg-[var(--color-bg-subtle)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-secondary)]">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {recipe.duration}分钟
                      </span>
                      <span>{recipe.servings}人份</span>
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => handleRemoveFavorite(recipe)}
                  aria-label="取消收藏"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-red-500 opacity-0 transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-950/20 group-hover:opacity-100 active:scale-90"
                >
                  <Heart size={18} className="fill-current" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
