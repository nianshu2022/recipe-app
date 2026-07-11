import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, ChefHat } from 'lucide-react'
import type { CookingRecord } from '@/types'
import { db } from '@/db'
import { useRecipeStore } from '@/stores/recipeStore'
import { BrandLoading } from '@/components/ui/BrandLoading'

interface MonthlyStats {
  month: string
  count: number
  topRecipes: { name: string; count: number }[]
}

export function CookingHistoryPage() {
  const navigate = useNavigate()
  const { recipes } = useRecipeStore()
  const [records, setRecords] = useState<CookingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([])

  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = async () => {
    try {
      const allRecords = await db.getAllCookingRecords()
      setRecords(allRecords)
      calculateStats(allRecords)
    } catch (e) {
      console.error('Failed to load cooking records:', e)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (allRecords: CookingRecord[]) => {
    const monthMap = new Map<string, Map<string, number>>()

    for (const record of allRecords) {
      const date = new Date(record.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, new Map())
      }
      const recipeMap = monthMap.get(monthKey)!
      recipeMap.set(record.recipeId, (recipeMap.get(record.recipeId) || 0) + 1)
    }

    const stats: MonthlyStats[] = []
    for (const [month, recipeMap] of monthMap) {
      const topRecipes = Array.from(recipeMap.entries())
        .map(([id, count]) => ({
          name: recipes.find((r) => r.id === id)?.name ?? '未知菜谱',
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)

      stats.push({
        month,
        count: Array.from(recipeMap.values()).reduce((a, b) => a + b, 0),
        topRecipes,
      })
    }

    stats.sort((a, b) => b.month.localeCompare(a.month))
    setMonthlyStats(stats)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-40 -mx-5 -mt-6 flex items-center gap-3 bg-[var(--color-bg)]/95 px-5 py-3 backdrop-blur-sm">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)]"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-semibold text-[var(--color-text)]">烹饪历史</h1>
      </div>

      {loading ? (
        <BrandLoading>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-[var(--color-bg-card)] p-4 shadow-xs">
                <div className="h-4 w-24 rounded bg-[var(--color-bg-subtle)]" />
                <div className="mt-2 h-3 w-16 rounded bg-[var(--color-bg-subtle)]" />
              </div>
            ))}
          </div>
        </BrandLoading>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[var(--color-bg-card)] p-4 shadow-xs">
              <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                <ChefHat size={16} />
                <span className="text-xs">总烹饪次数</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-[var(--color-text)]">{records.length}</p>
            </div>
            <div className="rounded-2xl bg-[var(--color-bg-card)] p-4 shadow-xs">
              <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                <Calendar size={16} />
                <span className="text-xs">本月烹饪</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-[var(--color-text)]">
                {(() => {
                  const now = new Date()
                  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
                  return monthlyStats.find((s) => s.month === currentMonth)?.count ?? 0
                })()}
              </p>
            </div>
          </div>

          {/* Monthly breakdown */}
          {monthlyStats.length === 0 ? (
            <div className="rounded-2xl bg-[var(--color-bg-card)] p-8 text-center shadow-xs">
              <p className="text-sm text-[var(--color-text-muted)]">还没有烹饪记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {monthlyStats.map((stat) => (
                <div key={stat.month} className="rounded-2xl bg-[var(--color-bg-card)] p-4 shadow-xs">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[var(--color-text)]">
                      {stat.month.replace('-', '年')}月
                    </h3>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {stat.count} 次
                    </span>
                  </div>
                  {stat.topRecipes.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-[var(--color-text-muted)]">最常做：</p>
                      {stat.topRecipes.map((recipe, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg bg-[var(--color-bg-subtle)] px-3 py-2">
                          <span className="text-sm text-[var(--color-text)]">{recipe.name}</span>
                          <span className="text-xs text-[var(--color-text-muted)]">{recipe.count}次</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
