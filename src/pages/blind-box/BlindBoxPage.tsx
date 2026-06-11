import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package, Clock, Users, RotateCcw, ArrowRight, Sparkles, Save,
} from 'lucide-react'
import { useRecipeStore } from '@/stores/recipeStore'
import { BrandLoading } from '@/components/ui/BrandLoading'
import { getRandomChineseRecipe } from '@/data/chineseRecipes'
import { categoryIcons, categoryLabels, difficultyConfig } from '@/constants/categories'
import type { Recipe } from '@/types'

type Phase = 'idle' | 'shaking' | 'revealed'
type Source = 'local' | 'recommend'

export function BlindBoxPage() {
  const navigate = useNavigate()
  const { recipes, loading, loadRecipes, addRecipe } = useRecipeStore()
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<Recipe | null>(null)
  const [source, setSource] = useState<Source>('local')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadRecipes()
  }, [loadRecipes])

  const draw = () => {
    if (recipes.length === 0) return
    setPhase('shaking')
    setResult(null)
    setSource('local')
    setSaved(false)

    setTimeout(() => {
      const picked = recipes[Math.floor(Math.random() * recipes.length)]
      setResult(picked)
      setPhase('revealed')
    }, 850)
  }

  const drawGlobal = () => {
    setPhase('shaking')
    setResult(null)
    setSource('recommend')
    setSaved(false)

    setTimeout(() => {
      setResult(getRandomChineseRecipe())
      setPhase('revealed')
    }, 850)
  }

  const redraw = () => {
    if (source === 'recommend') {
      drawGlobal()
    } else {
      draw()
    }
  }

  const handleSave = async () => {
    if (!result) return
    await addRecipe({
      userId: result.userId,
      name: result.name,
      category: result.category,
      tags: result.tags,
      coverImage: result.coverImage,
      difficulty: result.difficulty,
      duration: result.duration,
      servings: result.servings,
      ingredients: result.ingredients,
      steps: result.steps,
      nutrition: result.nutrition,
      deletedAt: result.deletedAt,
    })
    setSaved(true)
  }

  if (loading) {
    return <BrandLoading />
  }

  if (recipes.length === 0 && phase === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--color-bg-subtle)]">
          <Package size={36} className="text-[var(--color-text-muted)]" />
        </div>
        <h3 className="mb-2 text-lg font-medium text-[var(--color-text)]">还没有菜谱</h3>
        <p className="mb-4 text-sm text-[var(--color-text-muted)]">先去添加几道菜谱，或试试随机推荐</p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/recipe/new')}
            className="rounded-2xl bg-[var(--color-primary)] px-8 py-3 text-sm font-medium text-white shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
          >
            创建菜谱
          </button>
          <button
            onClick={drawGlobal}
            className="flex items-center gap-2 rounded-2xl bg-[var(--color-bg-card)] px-6 py-3 text-sm font-medium text-[var(--color-text-secondary)] shadow-xs transition-all duration-200 hover:shadow-md active:scale-95"
          >
            <Sparkles size={16} />
            随机推荐
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-text)]">
          今天吃什么
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          {phase === 'idle' && '让盲盒帮你决定'}
          {phase === 'shaking' && (source === 'recommend' ? '正在随机推荐中...' : '正在抽取中...')}
          {phase === 'revealed' && (source === 'recommend' ? '随机推荐揭晓！' : '盲盒揭晓！')}
        </p>
      </div>

      {/* Blind box card */}
      <div className="perspective-1000 mx-auto w-full max-w-xs">
        <div className={`relative transition-transform duration-500 ${phase === 'revealed' ? 'rotate-y-180' : ''}`} style={{ transformStyle: 'preserve-3d' }}>
          {/* Front face - blind box */}
          <div className={`backface-hidden ${phase === 'revealed' ? 'invisible' : ''}`}>
            <div
              className={`flex flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-[var(--color-accent-50)] to-[var(--color-bg-card)] p-8 shadow-lg ${
                phase === 'shaking' ? 'animate-shake' : ''
              }`}
              style={{ minHeight: '320px' }}
            >
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-[var(--color-primary)]/10">
                {source === 'recommend' ? (
                  <Sparkles size={48} className="text-[var(--color-primary)]" />
                ) : (
                  <Package size={48} className="text-[var(--color-primary)]" />
                )}
              </div>
              <Sparkles size={20} className="mb-3 text-[var(--color-accent-400)]" />
              <p className="text-base font-medium text-[var(--color-text)]">
                {phase === 'shaking'
                  ? (source === 'recommend' ? '正在挑选中...' : '摇一摇...')
                  : '点击下方按钮抽取'}
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                {source === 'recommend'
                  ? '内置中式菜谱推荐'
                  : `共 ${recipes.length} 道菜谱等待被抽中`}
              </p>
            </div>
          </div>

          {/* Back face - recipe result */}
          {phase === 'revealed' && result && (
            <div className="backface-hidden rotate-y-180 absolute inset-0">
              <div className="flex flex-col rounded-3xl bg-[var(--color-bg-card)] shadow-lg overflow-hidden" style={{ minHeight: '320px' }}>
                {/* Top - image or gradient */}
                {result.coverImage ? (
                  <div className="relative h-28 overflow-hidden">
                    <img src={result.coverImage} alt={result.name} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-card)] to-transparent" />
                  </div>
                ) : (
                  <div className="flex h-28 items-center justify-center bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent-500)]">
                    {(() => {
                      const Icon = categoryIcons[result.category]
                      return <Icon size={48} className="text-white/80" />
                    })()}
                  </div>
                )}

                {/* Recipe info */}
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-xl font-bold text-[var(--color-text)]">{result.name}</h2>
                    {source === 'recommend' && (
                      <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                        推荐
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${difficultyConfig[result.difficulty].color}`}>
                      {difficultyConfig[result.difficulty].label}
                    </span>
                    <span className="rounded-full bg-[var(--color-bg-subtle)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-text-secondary)]">
                      {categoryLabels[result.category]}
                    </span>
                    {result.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="rounded-full bg-[var(--color-bg-subtle)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-text-secondary)]">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-auto flex items-center gap-4 pt-4 text-xs text-[var(--color-text-muted)]">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {result.duration}分钟
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {result.servings}人份
                    </span>
                    <span>{result.ingredients.length}种食材</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        {phase === 'idle' && (
          <>
            <button
              onClick={draw}
              className="w-full rounded-2xl bg-[var(--color-primary)] py-4 text-base font-semibold text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
            >
              <Package size={18} className="mr-2 inline" />
              从我的菜谱抽取
            </button>
            <button
              onClick={drawGlobal}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-bg-card)] py-3.5 text-sm font-medium text-[var(--color-text-secondary)] shadow-xs transition-all duration-200 hover:shadow-md active:scale-[0.98]"
            >
              <Sparkles size={16} />
              不知道吃什么？随机推荐
            </button>
          </>
        )}

        {phase === 'shaking' && (
          <div className="h-14" />
        )}

        {phase === 'revealed' && result && (
          <>
            {source === 'recommend' && !saved && (
              <button
                onClick={handleSave}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 text-base font-semibold text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
              >
                <Save size={18} />
                保存到我的菜谱
              </button>
            )}
            {source === 'recommend' && saved && (
              <div className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-50 py-4 text-base font-semibold text-emerald-700">
                已保存
              </div>
            )}
            {source === 'local' && (
              <button
                onClick={() => navigate(`/recipe/${result.id}`)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] py-4 text-base font-semibold text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
              >
                查看详情
                <ArrowRight size={18} />
              </button>
            )}
            <button
              onClick={redraw}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-bg-card)] py-3.5 text-sm font-medium text-[var(--color-text-secondary)] shadow-xs transition-all duration-200 hover:shadow-md active:scale-[0.98]"
            >
              <RotateCcw size={16} />
              再抽一次
            </button>
          </>
        )}
      </div>
    </div>
  )
}
