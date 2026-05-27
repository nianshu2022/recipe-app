import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package, ChefHat, Flame, Leaf, Soup, Wheat, IceCreamCone, CupSoda,
  Clock, Users, RotateCcw, ArrowRight, Sparkles,
} from 'lucide-react'
import { useRecipeStore } from '@/stores/recipeStore'
import { BrandLoading } from '@/components/ui/BrandLoading'
import type { Recipe, Category, Difficulty } from '@/types'

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

const difficultyLabels: Record<Difficulty, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
}

const difficultyColors: Record<Difficulty, string> = {
  easy: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  medium: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  hard: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400',
}

type Phase = 'idle' | 'shaking' | 'revealed'

export function BlindBoxPage() {
  const navigate = useNavigate()
  const { recipes, loading, loadRecipes } = useRecipeStore()
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<Recipe | null>(null)

  useEffect(() => {
    loadRecipes()
  }, [loadRecipes])

  const draw = () => {
    if (recipes.length === 0) return
    setPhase('shaking')
    setResult(null)

    setTimeout(() => {
      const picked = recipes[Math.floor(Math.random() * recipes.length)]
      setResult(picked)
      setPhase('revealed')
    }, 850)
  }

  const redraw = () => {
    setPhase('idle')
    setResult(null)
  }

  if (loading) {
    return <BrandLoading />
  }

  if (recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--color-bg-subtle)]">
          <Package size={36} className="text-[var(--color-text-muted)]" />
        </div>
        <h3 className="mb-2 text-lg font-medium text-[var(--color-text)]">还没有菜谱</h3>
        <p className="mb-8 text-sm text-[var(--color-text-muted)]">先去添加几道菜谱吧</p>
        <button
          onClick={() => navigate('/recipe/new')}
          className="rounded-2xl bg-[var(--color-primary)] px-8 py-3 text-sm font-medium text-white shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
        >
          创建菜谱
        </button>
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
          {phase === 'shaking' && '正在抽取中...'}
          {phase === 'revealed' && '盲盒揭晓！'}
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
                <Package size={48} className="text-[var(--color-primary)]" />
              </div>
              <Sparkles size={20} className="mb-3 text-[var(--color-accent-400)]" />
              <p className="text-base font-medium text-[var(--color-text)]">
                {phase === 'shaking' ? '摇一摇...' : '点击下方按钮抽取'}
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                共 {recipes.length} 道菜谱等待被抽中
              </p>
            </div>
          </div>

          {/* Back face - recipe result */}
          {phase === 'revealed' && result && (
            <div className="backface-hidden rotate-y-180 absolute inset-0">
              <div className="flex flex-col rounded-3xl bg-[var(--color-bg-card)] shadow-lg overflow-hidden" style={{ minHeight: '320px' }}>
                {/* Top gradient */}
                <div className="flex h-28 items-center justify-center bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent-500)]">
                  {(() => {
                    const Icon = categoryIcons[result.category]
                    return <Icon size={48} className="text-white/80" />
                  })()}
                </div>

                {/* Recipe info */}
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="text-xl font-bold text-[var(--color-text)]">{result.name}</h2>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${difficultyColors[result.difficulty]}`}>
                      {difficultyLabels[result.difficulty]}
                    </span>
                    <span className="rounded-full bg-[var(--color-bg-subtle)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-text-secondary)]">
                      {categoryLabels[result.category]}
                    </span>
                    {result.tags.slice(0, 2).map((tag) => (
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
          <button
            onClick={draw}
            className="w-full rounded-2xl bg-[var(--color-primary)] py-4 text-base font-semibold text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
          >
            开始抽取
          </button>
        )}

        {phase === 'shaking' && (
          <div className="h-14" />
        )}

        {phase === 'revealed' && result && (
          <>
            <button
              onClick={() => navigate(`/recipe/${result.id}`)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] py-4 text-base font-semibold text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
            >
              查看详情
              <ArrowRight size={18} />
            </button>
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
