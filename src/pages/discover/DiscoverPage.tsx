import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, ChefHat, Flame, Leaf, Soup, Wheat, IceCreamCone, CupSoda,
  Download, Check, Clock,
} from 'lucide-react'
import { getAllRecipes } from '@/data/chineseRecipes'
import type { Category, Difficulty, Recipe } from '@/types'

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

export function DiscoverPage() {
  const allRecipes = useMemo(() => getAllRecipes(), [])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<Category | null>(null)
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | null>(null)
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    let list = allRecipes
    if (categoryFilter) list = list.filter((r) => r.category === categoryFilter)
    if (difficultyFilter) list = list.filter((r) => r.difficulty === difficultyFilter)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter((r) =>
        r.name.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q))
      )
    }
    return list
  }, [allRecipes, categoryFilter, difficultyFilter, searchQuery])

  const categories = Object.entries(categoryLabels) as [Category, string][]

  const handleImportOne = async (recipe: Recipe) => {
    if (importedIds.has(recipe.id)) return
    const { db } = await import('@/db')
    await db.putRecipe(recipe)
    setImportedIds((prev) => new Set(prev).add(recipe.id))
  }

  const handleImportAll = async () => {
    const { db } = await import('@/db')
    const toImport = filtered.filter((r) => !importedIds.has(r.id))
    for (const recipe of toImport) {
      await db.putRecipe(recipe)
    }
    setImportedIds((prev) => {
      const next = new Set(prev)
      for (const r of toImport) next.add(r.id)
      return next
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="sticky top-0 z-40 -mx-5 -mt-6 flex items-end justify-between bg-[var(--color-bg)]/95 px-5 py-3 backdrop-blur-sm">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-text)]">
            觅食
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {filtered.length} 道内置菜谱
          </p>
        </div>
        <button
          onClick={handleImportAll}
          className="flex h-11 items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-5 text-sm font-medium text-white shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
        >
          <Download size={16} />
          全部导入
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索菜谱名称、标签..."
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
      <div className="space-y-3">
        {filtered.map((recipe) => {
          const CategoryIcon = categoryIcons[recipe.category]
          const diff = difficultyConfig[recipe.difficulty]
          const isImported = importedIds.has(recipe.id)
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
                  <img src={recipe.coverImage} alt={recipe.name} className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-bg-subtle)] to-[var(--color-bg)]">
                    <CategoryIcon size={24} className="text-[var(--color-text-muted)]" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-[var(--color-text)]">
                    {recipe.name}
                  </h3>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${diff.color}`}>
                      {diff.label}
                    </span>
                    {recipe.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="rounded-full bg-[var(--color-bg-subtle)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-text-secondary)]">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-[var(--color-text-muted)]">
                    <span className="flex items-center gap-0.5">
                      <Clock size={10} />
                      {recipe.duration}分钟
                    </span>
                    <span>{recipe.servings}人份</span>
                  </div>
                </div>
              </Link>
              <button
                onClick={() => handleImportOne(recipe)}
                disabled={isImported}
                className={`flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-medium transition-all duration-200 ${
                  isImported
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                    : 'bg-[var(--color-primary)] text-white shadow-sm hover:scale-105 active:scale-95'
                }`}
              >
                {isImported ? <Check size={14} /> : <Download size={14} />}
                {isImported ? '已导入' : '导入'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
