import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Wand2, Loader2, Check } from 'lucide-react'
import { useFridgeStore } from '@/stores/fridgeStore'
import { useUIStore } from '@/stores/uiStore'
import { generateRecipeWithAI, generateFallbackRecipe } from '@/utils/aiRecipe'
import type { Recipe } from '@/types'
import { AiRecipePreview } from '@/pages/recipe/AiRecipePreview'

export function AiRecipePage() {
  const navigate = useNavigate()
  const { items: fridgeItems } = useFridgeStore()
  const showToast = useUIStore((s) => s.showToast)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [servings, setServings] = useState(2)
  const [generating, setGenerating] = useState(false)
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null)

  const toggleItem = (id: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleGenerate = async () => {
    const selected = fridgeItems.filter((i) => selectedItems.has(i.id))
    if (selected.length === 0) return

    setGenerating(true)
    try {
      const recipe = await generateRecipeWithAI(
        {
          ingredients: selected.map((i) => ({
            name: i.name,
            amount: i.amount,
            unit: i.unit,
          })),
          servings,
        },
      )
      if (recipe) {
        setGeneratedRecipe(recipe)
      } else {
        showToast('AI 生成失败，已使用默认模板')
        setGeneratedRecipe(generateFallbackRecipe(
          selected.map((i) => ({
            name: i.name,
            amount: i.amount,
            unit: i.unit,
          })),
          servings,
        ))
      }
    } catch {
      showToast('AI 生成失败，已使用默认模板')
      setGeneratedRecipe(generateFallbackRecipe(
        selected.map((i) => ({
          name: i.name,
          amount: i.amount,
          unit: i.unit,
        })),
        servings,
      ))
    } finally {
      setGenerating(false)
    }
  }

  if (generatedRecipe) {
    return (
      <AiRecipePreview
        recipe={generatedRecipe}
        onSave={() => navigate(-1)}
        onDiscard={() => setGeneratedRecipe(null)}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="ios-blur-header sticky top-0 z-40 -mx-5 -mt-6 flex items-center gap-3 px-5 py-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)]"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <Wand2 size={18} className="text-purple-500" />
          <h1 className="text-xl font-semibold text-[var(--color-text)]">AI 生成食谱</h1>
        </div>
      </div>

      <p className="text-sm text-[var(--color-text-muted)]">
        选择冰箱中的食材，AI 将为你生成一道菜谱
      </p>

      {/* Servings */}
      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">用餐人数</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              onClick={() => setServings(n)}
              className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all ${
                servings === n
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]'
              }`}
            >
              {n}人
            </button>
          ))}
        </div>
      </div>

      {/* Fridge items */}
      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
          选择食材（已选 {selectedItems.size} 种）
        </label>
        {fridgeItems.length === 0 ? (
          <div className="rounded-2xl bg-[var(--color-bg-card)] p-6 text-center shadow-xs">
            <p className="text-sm text-[var(--color-text-muted)]">冰箱空空如也，请先添加食材</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {fridgeItems.map((item) => (
              <button
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`flex items-center gap-2 rounded-xl p-3 text-left transition-all ${
                  selectedItems.has(item.id)
                    ? 'bg-purple-100 ring-2 ring-purple-500 dark:bg-purple-950/30'
                    : 'bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-subtle)]'
                }`}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium ${
                  selectedItems.has(item.id)
                    ? 'bg-purple-500 text-white'
                    : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)]'
                }`}>
                  {selectedItems.has(item.id) ? <Check size={14} /> : item.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--color-text)]">{item.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{item.amount}{item.unit}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={selectedItems.size === 0 || generating}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 py-4 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.98] disabled:opacity-40"
      >
        {generating ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            AI 正在创作...
          </>
        ) : (
          <>
            <Wand2 size={18} />
            生成食谱
          </>
        )}
      </button>
    </div>
  )
}
