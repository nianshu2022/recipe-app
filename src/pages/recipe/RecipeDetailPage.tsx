import { useParams, useNavigate, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  ArrowLeft, Clock, Users, ChefHat, Play, Minus, Plus, Lightbulb, Heart, ShoppingCart, Share2, Pencil, Trash2, Sparkles, MoreVertical,
} from 'lucide-react'
import { useRecipeStore } from '@/stores/recipeStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useShoppingStore } from '@/stores/shoppingStore'
import { useUIStore } from '@/stores/uiStore'
import { BrandLoading } from '@/components/ui/BrandLoading'
import { ShareCardModal } from '@/components/recipe/ShareCardModal'
import { estimateNutrition, getCalorieLevel, getMacroPercentages } from '@/utils/nutrition'
import { scaleIngredients, formatAmount } from '@/utils/scaling'
import { difficultyConfig, categoryIcons } from '@/constants/categories'
import type { Recipe } from '@/types'

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { recipes, deleteRecipe } = useRecipeStore()
  const { collections, loadCollections, toggleRecipeInCollection } = useCollectionStore()
  const { generateFromRecipe } = useShoppingStore()
  const showConfirm = useUIStore((s) => s.showConfirm)
  const showToast = useUIStore((s) => s.showToast)
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [servings, setServings] = useState(2)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [heartAnimating, setHeartAnimating] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCollections()
  }, [loadCollections])

  useEffect(() => {
    if (!id) return
    const found = recipes.find((r) => r.id === id)
    if (found) {
      setRecipe(found)
      setServings(found.servings)
    }
    setLoading(false)
  }, [recipes, id])

  if (loading) {
    return (
      <BrandLoading>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-[var(--color-bg-card)] p-4 shadow-xs">
              <div className="h-4 w-32 rounded bg-[var(--color-bg-subtle)]" />
              <div className="mt-3 h-3 w-48 rounded bg-[var(--color-bg-subtle)]" />
            </div>
          ))}
        </div>
      </BrandLoading>
    )
  }

  if (!recipe) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-bg-subtle)]">
          <ChefHat size={28} className="text-[var(--color-text-muted)]" />
        </div>
        <p className="mb-4 text-sm text-[var(--color-text-muted)]">菜谱不存在</p>
        <Link
          to="/"
          replace
          className="rounded-xl bg-[var(--color-primary)] px-6 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-[var(--color-primary-dark)]"
        >
          返回首页
        </Link>
      </div>
    )
  }

  const scaledIngredients = scaleIngredients(recipe.ingredients, recipe.servings, servings)

  const isFavorited = recipe
    ? collections.some((c) => c.recipeIds.includes(recipe.id))
    : false

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

  const handleDelete = async () => {
    if (!recipe) return
    await showConfirm({
      title: '删除菜谱',
      message: `确定要删除「${recipe.name}」吗？删除后无法恢复。`,
      confirmText: '删除',
      cancelText: '取消',
      variant: 'danger',
      onConfirm: async () => {
        await deleteRecipe(recipe.id)
        showToast('菜谱已删除')
        navigate('/', { replace: true })
      },
    })
  }

  const onToggleFavorite = async () => {
    setHeartAnimating(true)
    setTimeout(() => setHeartAnimating(false), 500)
    await handleToggleFavorite()
  }

  return (
    <div className="space-y-8" onClick={() => moreMenuOpen && setMoreMenuOpen(false)}>
      {/* Header - sticky */}
      <div className="sticky top-0 z-40 -mx-5 -mt-6 flex items-center gap-2.5 bg-[var(--color-bg)]/95 px-5 py-3 backdrop-blur-sm">
        <button
          onClick={() => navigate(-1)}
          aria-label="返回"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-bg-card)] shadow-xs transition-all duration-200 hover:shadow-sm active:scale-95"
        >
          <ArrowLeft size={18} className="text-[var(--color-text-secondary)]" />
        </button>
        <h1 className="flex-1 truncate font-display text-lg font-bold tracking-tight text-[var(--color-text)]">
          {recipe.name}
        </h1>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setShareModalOpen(true)}
            aria-label="分享海报"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-bg-card)] shadow-xs transition-all duration-200 hover:shadow-sm active:scale-90"
          >
            <Share2 size={18} className="text-[var(--color-text-secondary)]" />
          </button>
          <button
            onClick={onToggleFavorite}
            aria-label={isFavorited ? '取消收藏' : '收藏'}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-bg-card)] shadow-xs transition-all duration-200 hover:shadow-sm active:scale-90"
          >
            <Heart
              size={18}
              className={`transition-colors ${heartAnimating ? 'animate-heart-bounce' : ''} ${
                isFavorited ? 'fill-red-500 text-red-500' : 'text-[var(--color-text-secondary)]'
              }`}
            />
          </button>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setMoreMenuOpen(!moreMenuOpen)
              }}
              aria-label="更多操作"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-bg-card)] shadow-xs transition-all duration-200 hover:shadow-sm active:scale-90"
            >
              <MoreVertical size={18} className="text-[var(--color-text-secondary)]" />
            </button>
            {moreMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-11 z-50 min-w-[130px] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-1.5 shadow-lg animate-in fade-in zoom-in-95"
              >
                <button
                  onClick={() => {
                    setMoreMenuOpen(false)
                    navigate(`/recipe/${id}/edit`)
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)]"
                >
                  <Pencil size={15} className="text-[var(--color-text-muted)]" />
                  编辑菜谱
                </button>
                <button
                  onClick={() => {
                    setMoreMenuOpen(false)
                    handleDelete()
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <Trash2 size={15} />
                  删除菜谱
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cover image */}
      <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-bg-subtle)] to-[var(--color-bg)] shadow-sm">
        {recipe.coverImage ? (
          <img src={recipe.coverImage} alt={recipe.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            {(() => {
              const CategoryIcon = categoryIcons[recipe.category]
              return <CategoryIcon size={48} className="text-[var(--color-text-muted)]" />
            })()}
          </div>
        )}
      </div>

      {/* Meta info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-full bg-[var(--color-bg-card)] px-3.5 py-2 text-sm text-[var(--color-text-secondary)] shadow-xs">
          <Clock size={14} className="text-[var(--color-text-muted)]" />
          <span>{recipe.duration}分钟</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-[var(--color-bg-card)] px-3.5 py-2 text-sm text-[var(--color-text-secondary)] shadow-xs">
          <ChefHat size={14} className="text-[var(--color-text-muted)]" />
          <span>{difficultyConfig[recipe.difficulty].label}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-[var(--color-bg-card)] px-3.5 py-2 text-sm text-[var(--color-text-secondary)] shadow-xs">
          <Users size={14} className="text-[var(--color-text-muted)]" />
          <span>{servings}人份</span>
        </div>
      </div>

      {/* Nutrition card */}
      {(() => {
        const nutrition = recipe.nutrition ?? estimateNutrition(recipe.ingredients)
        const perServing = {
          calories: Math.round(nutrition.calories / recipe.servings),
          protein: Math.round((nutrition.protein / recipe.servings) * 10) / 10,
          carbs: Math.round((nutrition.carbs / recipe.servings) * 10) / 10,
          fat: Math.round((nutrition.fat / recipe.servings) * 10) / 10,
          fiber: Math.round((nutrition.fiber / recipe.servings) * 10) / 10,
        }
        const level = getCalorieLevel(perServing.calories)
        const macros = getMacroPercentages(perServing)
        return (
          <div className="rounded-2xl bg-[var(--color-bg-card)] p-5 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--color-text)]">营养信息（每份）</h3>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${level.color}`}>
                {level.label} {perServing.calories}kcal
              </span>
            </div>
            <div className="mb-3 flex h-2 overflow-hidden rounded-full">
              <div className="bg-blue-400" style={{ width: `${macros.protein}%` }} />
              <div className="bg-amber-400" style={{ width: `${macros.carbs}%` }} />
              <div className="bg-rose-400" style={{ width: `${macros.fat}%` }} />
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">蛋白质</p>
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">{perServing.protein}g</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">碳水</p>
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">{perServing.carbs}g</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">脂肪</p>
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">{perServing.fat}g</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">膳食纤维</p>
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">{perServing.fiber}g</p>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Ingredients */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-[var(--color-text)]">用料清单</h2>
          <div className="flex items-center gap-2 rounded-full bg-[var(--color-bg-card)] px-1 py-1 shadow-xs">
            <button
              onClick={() => setServings(Math.max(1, servings - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-subtle)] active:scale-90"
            >
              <Minus size={14} />
            </button>
            <span className="min-w-[3.5rem] text-center text-sm font-medium text-[var(--color-text)]">
              {servings}人份
            </span>
            <button
              onClick={() => setServings(servings + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-subtle)] active:scale-90"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-[var(--color-bg-card)] shadow-xs">
          {scaledIngredients.map((ing, i) => (
            <div
              key={ing.id}
              className={`flex items-center justify-between px-5 py-3.5 text-sm ${
                i > 0 ? 'border-t border-[var(--color-border-subtle)]' : ''
              }`}
            >
              <span className="font-medium text-[var(--color-text)]">{ing.name}</span>
              <span className="text-[var(--color-text-muted)]">{formatAmount(ing.amount, ing.unit)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        <h2 className="font-display text-xl font-semibold text-[var(--color-text)]">操作步骤</h2>
        <div className="space-y-3">
          {recipe.steps.map((step) => (
            <div
              key={step.order}
              className="rounded-2xl bg-[var(--color-bg-card)] p-5 shadow-xs"
            >
              <div className="mb-3 flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-text)] text-xs font-semibold text-[var(--color-bg)]">
                  {step.order}
                </span>
                {step.timer && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                    <Clock size={12} />
                    {step.timer}分钟
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{step.description}</p>
              {step.tip && (
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-[var(--color-bg-subtle)] px-3.5 py-2.5">
                  <Lightbulb size={14} className="mt-0.5 shrink-0 text-amber-500" />
                  <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">{step.tip}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        <Link
          to={`/cooking/${recipe.id}`}
          className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[var(--color-text)] py-4 text-sm font-medium text-[var(--color-bg)] shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
        >
          <Play size={18} fill="currentColor" />
          开始做菜
        </Link>
        <button
          onClick={async () => {
            await generateFromRecipe(recipe.id, servings)
            navigate('/shopping')
          }}
          className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] py-4 text-sm font-medium text-[var(--color-text-secondary)] shadow-xs transition-all duration-200 hover:shadow-sm active:scale-[0.98]"
        >
          <ShoppingCart size={18} />
          生成购物清单
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => setShareModalOpen(true)}
            className="flex flex-1 items-center justify-center gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 py-4 text-sm font-semibold text-amber-700 dark:text-amber-300 shadow-xs transition-all duration-200 hover:bg-amber-500/20 active:scale-[0.98]"
          >
            <Sparkles size={18} />
            生成海报
          </button>
        </div>
      </div>

      {/* Share Card Modal */}
      <ShareCardModal
        recipe={recipe}
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />
    </div>
  )
}
