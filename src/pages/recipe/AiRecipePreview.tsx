import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Wand2, Loader2, Check, X } from 'lucide-react'
import type { Recipe } from '@/types'
import { useRecipeStore } from '@/stores/recipeStore'
import { useUIStore } from '@/stores/uiStore'

interface AiRecipePreviewProps {
  recipe: Recipe
  onSave: () => void
  onDiscard: () => void
}

export function AiRecipePreview({ recipe, onSave, onDiscard }: AiRecipePreviewProps) {
  const navigate = useNavigate()
  const { addRecipe } = useRecipeStore()
  const showToast = useUIStore((s) => s.showToast)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await addRecipe({
        userId: 'local',
        name: recipe.name,
        category: recipe.category,
        tags: recipe.tags,
        difficulty: recipe.difficulty,
        duration: recipe.duration,
        servings: recipe.servings,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        nutrition: recipe.nutrition,
      })
      showToast('食谱已保存')
      onSave()
      navigate('/')
    } catch {
      showToast('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="ios-blur-header sticky top-0 z-40 -mx-5 -mt-6 flex items-center gap-3 px-5 py-3">
        <button
          onClick={onDiscard}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)]"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <Wand2 size={18} className="text-purple-500" />
          <h1 className="text-xl font-semibold text-[var(--color-text)]">AI 生成食谱</h1>
        </div>
      </div>

      {/* Recipe preview */}
      <div className="rounded-2xl bg-[var(--color-bg-card)] p-5 shadow-xs">
        <h2 className="mb-2 text-xl font-bold text-[var(--color-text)]">{recipe.name}</h2>
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-600 dark:bg-purple-950/30 dark:text-purple-400">
            AI 生成
          </span>
          <span className="rounded-full bg-[var(--color-bg-subtle)] px-3 py-1 text-xs font-medium text-[var(--color-text-secondary)]">
            {recipe.difficulty === 'easy' ? '简单' : recipe.difficulty === 'medium' ? '中等' : '困难'}
          </span>
          <span className="rounded-full bg-[var(--color-bg-subtle)] px-3 py-1 text-xs font-medium text-[var(--color-text-secondary)]">
            {recipe.duration}分钟
          </span>
          <span className="rounded-full bg-[var(--color-bg-subtle)] px-3 py-1 text-xs font-medium text-[var(--color-text-secondary)]">
            {recipe.servings}人份
          </span>
        </div>

        {/* Ingredients */}
        <div className="mb-4">
          <h3 className="mb-2 text-sm font-semibold text-[var(--color-text)]">食材</h3>
          <div className="space-y-1">
            {recipe.ingredients.map((ing) => (
              <div key={ing.id} className="flex items-center justify-between rounded-lg bg-[var(--color-bg-subtle)] px-3 py-2">
                <span className="text-sm text-[var(--color-text)]">{ing.name}</span>
                <span className="text-xs text-[var(--color-text-muted)]">{ing.amount}{ing.unit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-[var(--color-text)]">步骤</h3>
          <div className="space-y-2">
            {recipe.steps.map((step) => (
              <div key={step.order} className="rounded-lg bg-[var(--color-bg-subtle)] p-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-text)] text-[10px] font-semibold text-[var(--color-bg)]">
                    {step.order}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onDiscard}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] py-3 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]"
        >
          <X size={16} />
          丢弃
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-3 text-sm font-medium text-white shadow-md transition-all active:scale-[0.98] disabled:opacity-40"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          保存食谱
        </button>
      </div>
    </div>
  )
}
