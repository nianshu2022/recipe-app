import type { DailyNutrition } from '@/utils/nutrition'

interface NutritionChartProps {
  data: DailyNutrition[]
  metric: 'calories' | 'protein' | 'carbs' | 'fat'
  max?: number
}

const METRIC_CONFIG = {
  calories: { label: '热量', unit: 'kcal', color: 'bg-orange-400', lightColor: 'bg-orange-100' },
  protein: { label: '蛋白质', unit: 'g', color: 'bg-blue-400', lightColor: 'bg-blue-100' },
  carbs: { label: '碳水', unit: 'g', color: 'bg-emerald-400', lightColor: 'bg-emerald-100' },
  fat: { label: '脂肪', unit: 'g', color: 'bg-purple-400', lightColor: 'bg-purple-100' },
}

export function NutritionChart({ data, metric, max: maxProp }: NutritionChartProps) {
  const config = METRIC_CONFIG[metric]
  const values = data.map((d) => d[metric])
  const maxValue = maxProp ?? Math.max(...values, 1)

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-[var(--color-text-muted)]">
          本周{config.label}
        </span>
        <span className="text-xs text-[var(--color-text-muted)]">
          日均 {Math.round(values.reduce((a, b) => a + b, 0) / 7)}{config.unit}
        </span>
      </div>

      <div className="flex items-end gap-1.5" style={{ height: 80 }}>
        {data.map((d, i) => {
          const value = d[metric]
          const height = maxValue > 0 ? (value / maxValue) * 100 : 0
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full flex-1 flex items-end">
                <div
                  className={`w-full rounded-t ${config.color} transition-all duration-300`}
                  style={{ height: `${Math.max(height, 4)}%` }}
                />
              </div>
              <span className="text-[10px] text-[var(--color-text-muted)]">{d.day}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
