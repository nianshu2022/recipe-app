import type { Nutrition } from '@/types'
import type { DailyNutrition } from '@/utils/nutrition'
import { NutritionChart } from './NutritionChart'

interface NutritionPanelProps {
  dailyData: DailyNutrition[]
  totals: Nutrition
  averages: Nutrition
  servings: number
}

export function NutritionPanel({ dailyData, totals, averages }: NutritionPanelProps) {
  return (
    <div className="space-y-4 rounded-2xl bg-[var(--color-bg-card)] p-4 shadow-xs">
      <h3 className="text-sm font-semibold text-[var(--color-text)]">营养概览</h3>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-orange-50 p-3 dark:bg-orange-950/20">
          <p className="text-[10px] uppercase tracking-wider text-orange-600/70 dark:text-orange-400/70">热量</p>
          <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
            {totals.calories.toLocaleString()}
            <span className="text-xs font-normal">kcal</span>
          </p>
          <p className="text-[10px] text-orange-500/60">日均 {averages.calories}</p>
        </div>
        <div className="rounded-xl bg-blue-50 p-3 dark:bg-blue-950/20">
          <p className="text-[10px] uppercase tracking-wider text-blue-600/70 dark:text-blue-400/70">蛋白质</p>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {totals.protein}
            <span className="text-xs font-normal">g</span>
          </p>
          <p className="text-[10px] text-blue-500/60">日均 {averages.protein}g</p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/20">
          <p className="text-[10px] uppercase tracking-wider text-emerald-600/70 dark:text-emerald-400/70">碳水</p>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {totals.carbs}
            <span className="text-xs font-normal">g</span>
          </p>
          <p className="text-[10px] text-emerald-500/60">日均 {averages.carbs}g</p>
        </div>
        <div className="rounded-xl bg-purple-50 p-3 dark:bg-purple-950/20">
          <p className="text-[10px] uppercase tracking-wider text-purple-600/70 dark:text-purple-400/70">脂肪</p>
          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
            {totals.fat}
            <span className="text-xs font-normal">g</span>
          </p>
          <p className="text-[10px] text-purple-500/60">日均 {averages.fat}g</p>
        </div>
      </div>

      {/* Charts */}
      <div className="space-y-4 pt-2">
        <NutritionChart data={dailyData} metric="calories" />
        <NutritionChart data={dailyData} metric="protein" />
      </div>
    </div>
  )
}
