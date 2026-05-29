import { useParams, useNavigate, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  ArrowLeft, Clock, Users, ChefHat, Play, Minus, Plus, Lightbulb, Heart, ShoppingCart, Share2, Pencil, Trash2,
} from 'lucide-react'
import { useRecipeStore } from '@/stores/recipeStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useShoppingStore } from '@/stores/shoppingStore'
import { exportRecipeAsImage } from '@/utils/share'
import { estimateNutrition, getCalorieLevel, getMacroPercentages } from '@/utils/nutrition'
import { getAllRecipes } from '@/data/chineseRecipes'
import { scaleIngredients, formatAmount } from '@/utils/scaling'
import type { Recipe } from '@/types'

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { recipes, loadRecipes, deleteRecipe } = useRecipeStore()
  const { collections, loadCollections, toggleRecipeInCollection } = useCollectionStore()
  const { generateFromRecipe } = useShoppingStore()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [servings, setServings] = useState(2)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const isFavorited = recipe
    ? collections.some((c) => c.recipeIds.includes(recipe.id))
    : false

  const handleToggleFavorite = async () => {
    if (!recipe) return
    // Add to first collection, or create a default "我的收藏" if none exists
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
    await deleteRecipe(recipe.id)
    navigate('/', { replace: true })
  }

  useEffect(() => {
    loadRecipes()
    loadCollections()
  }, [loadRecipes, loadCollections])

  useEffect(() => {
    const found = recipes.find((r) => r.id === id)
    if (found) {
      setRecipe(found)
      setServings(found.servings)
      return
    }
    // 回退：查找内置菜谱
    const builtIn = getAllRecipes().find((r) => r.id === id)
    if (builtIn) {
      setRecipe(builtIn)
      setServings(builtIn.servings)
    }
  }, [recipes, id])

  if (!recipe) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100">
          <ChefHat size={28} className="text-stone-300" />
        </div>
        <p className="mb-4 text-sm text-stone-400">菜谱不存在</p>
        <Link
          to="/"
          replace
          className="rounded-xl bg-stone-900 px-6 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-stone-800"
        >
          返回首页
        </Link>
      </div>
    )
  }

  const scaledIngredients = scaleIngredients(recipe.ingredients, recipe.servings, servings)

  return (
    <div className="space-y-8">
      {/* Header - sticky */}
      <div className="sticky top-0 z-40 -mx-4 -mt-4 flex items-center gap-3 bg-[var(--color-bg)]/95 px-4 py-3 backdrop-blur-sm">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-xs transition-all duration-200 hover:shadow-sm active:scale-95"
        >
          <ArrowLeft size={18} className="text-stone-600" />
        </button>
        <h1 className="flex-1 truncate font-display text-lg font-semibold tracking-tight text-stone-900">
          {recipe.name}
        </h1>
        <button
          onClick={() => navigate(`/recipe/${id}/edit`)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-xs transition-all duration-200 hover:shadow-sm active:scale-90"
        >
          <Pencil size={18} className="text-stone-600" />
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-xs transition-all duration-200 hover:shadow-sm active:scale-90"
        >
          <Trash2 size={18} className="text-red-500" />
        </button>
        <button
          onClick={handleToggleFavorite}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-xs transition-all duration-200 hover:shadow-sm active:scale-90"
        >
          <Heart
            size={18}
            className={isFavorited ? 'fill-red-500 text-red-500' : 'text-stone-400'}
          />
        </button>
      </div>

      {/* Cover image */}
      <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-gradient-to-br from-stone-100 to-stone-50 shadow-sm">
        {recipe.coverImage ? (
          <img src={recipe.coverImage} alt={recipe.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ChefHat size={48} className="text-stone-200" />
          </div>
        )}
      </div>

      {/* Meta info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-sm text-stone-600 shadow-xs">
          <Clock size={14} className="text-stone-400" />
          <span>{recipe.duration}分钟</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-sm text-stone-600 shadow-xs">
          <ChefHat size={14} className="text-stone-400" />
          <span>
            {recipe.difficulty === 'easy' ? '简单' : recipe.difficulty === 'medium' ? '中等' : '困难'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-sm text-stone-600 shadow-xs">
          <Users size={14} className="text-stone-400" />
          <span>{recipe.servings}人份</span>
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
          <div className="rounded-2xl bg-white p-5 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-stone-800">营养信息（每份）</h3>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${level.color}`}>
                {level.label} {perServing.calories}kcal
              </span>
            </div>
            {/* Macro bar */}
            <div className="mb-3 flex h-2 overflow-hidden rounded-full">
              <div className="bg-blue-400" style={{ width: `${macros.protein}%` }} />
              <div className="bg-amber-400" style={{ width: `${macros.carbs}%` }} />
              <div className="bg-rose-400" style={{ width: `${macros.fat}%` }} />
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-xs text-stone-400">蛋白质</p>
                <p className="text-sm font-medium text-stone-700">{perServing.protein}g</p>
              </div>
              <div>
                <p className="text-xs text-stone-400">碳水</p>
                <p className="text-sm font-medium text-stone-700">{perServing.carbs}g</p>
              </div>
              <div>
                <p className="text-xs text-stone-400">脂肪</p>
                <p className="text-sm font-medium text-stone-700">{perServing.fat}g</p>
              </div>
              <div>
                <p className="text-xs text-stone-400">膳食纤维</p>
                <p className="text-sm font-medium text-stone-700">{perServing.fiber}g</p>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Ingredients */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-stone-900">用料清单</h2>
          <div className="flex items-center gap-2 rounded-full bg-white px-1 py-1 shadow-xs">
            <button
              onClick={() => setServings(Math.max(1, servings - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 active:scale-90"
            >
              <Minus size={14} />
            </button>
            <span className="min-w-[3.5rem] text-center text-sm font-medium text-stone-800">
              {servings}人份
            </span>
            <button
              onClick={() => setServings(servings + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 active:scale-90"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-xs">
          {scaledIngredients.map((ing, i) => (
            <div
              key={ing.id}
              className={`flex items-center justify-between px-5 py-3.5 text-sm ${
                i > 0 ? 'border-t border-stone-100' : ''
              }`}
            >
              <span className="font-medium text-stone-700">{ing.name}</span>
              <span className="text-stone-400">{formatAmount(ing.amount, ing.unit)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        <h2 className="font-display text-xl font-semibold text-stone-900">操作步骤</h2>
        <div className="space-y-3">
          {recipe.steps.map((step) => (
            <div
              key={step.order}
              className="rounded-2xl bg-white p-5 shadow-xs"
            >
              <div className="mb-3 flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-900 text-xs font-semibold text-white">
                  {step.order}
                </span>
                {step.timer && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                    <Clock size={12} />
                    {step.timer}分钟
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed text-stone-600">{step.description}</p>
              {step.tip && (
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-stone-50 px-3.5 py-2.5">
                  <Lightbulb size={14} className="mt-0.5 shrink-0 text-amber-500" />
                  <p className="text-xs leading-relaxed text-stone-500">{step.tip}</p>
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
          className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-stone-900 py-4 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
        >
          <Play size={18} fill="currentColor" />
          开始做菜
        </Link>
        <button
          onClick={async () => {
            await generateFromRecipe(recipe.id, servings)
            navigate('/shopping')
          }}
          className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-stone-200 bg-white py-4 text-sm font-medium text-stone-700 shadow-xs transition-all duration-200 hover:shadow-sm active:scale-[0.98]"
        >
          <ShoppingCart size={18} />
          生成购物清单
        </button>
        <button
          onClick={() => exportRecipeAsImage(recipe)}
          className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-stone-200 bg-white py-4 text-sm font-medium text-stone-700 shadow-xs transition-all duration-200 hover:shadow-sm active:scale-[0.98]"
        >
          <Share2 size={18} />
          分享菜谱
        </button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-stone-900">确认删除</h3>
            <p className="mt-2 text-sm text-stone-600">
              确定要删除「{recipe.name}」吗？此操作无法撤销。
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-xl border border-stone-200 bg-white py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
