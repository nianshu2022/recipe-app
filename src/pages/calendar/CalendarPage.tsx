import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays, Trash2 } from 'lucide-react'
import { useCalendarStore } from '@/stores/calendarStore'
import { useRecipeStore } from '@/stores/recipeStore'

const dayNames = ['一', '二', '三', '四', '五', '六', '日']
const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

export function CalendarPage() {
  const {
    records, loading, loadRecords, deleteRecord, getRecordsForDate,
    getMonthStats, getDatesWithRecords,
  } = useCalendarStore()
  const { recipes, loadRecipes } = useRecipeStore()

  const [viewYear, setViewYear] = useState(new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(new Date().getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => {
    loadRecords()
    loadRecipes()
  }, [loadRecords, loadRecipes])

  const getRecipeName = (id: string) => recipes.find((r) => r.id === id)?.name ?? '未知菜谱'

  // Calendar grid
  const firstDay = new Date(viewYear, viewMonth - 1, 1)
  const lastDay = new Date(viewYear, viewMonth, 0)
  const startDayOfWeek = (firstDay.getDay() + 6) % 7 // Monday = 0
  const daysInMonth = lastDay.getDate()
  const today = new Date().toISOString().split('T')[0]

  const calendarDays: (number | null)[] = [
    ...Array(startDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const datesWithRecords = getDatesWithRecords(viewYear, viewMonth)
  const stats = getMonthStats(viewYear, viewMonth)
  const selectedRecords = selectedDate ? getRecordsForDate(selectedDate) : []

  const prevMonth = () => {
    if (viewMonth === 1) {
      setViewYear(viewYear - 1)
      setViewMonth(12)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const nextMonth = () => {
    if (viewMonth === 12) {
      setViewYear(viewYear + 1)
      setViewMonth(1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  const formatDate = (day: number) =>
    `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-text)]">
          味历
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">记录每一次下厨</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-[var(--color-bg-card)] p-4 text-center shadow-xs">
          <p className="text-2xl font-semibold text-[var(--color-text)]">{stats.totalCooked}</p>
          <p className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">做菜次数</p>
        </div>
        <div className="rounded-2xl bg-[var(--color-bg-card)] p-4 text-center shadow-xs">
          <p className="text-2xl font-semibold text-[var(--color-text)]">{stats.uniqueRecipes}</p>
          <p className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">不同菜品</p>
        </div>
        <div className="rounded-2xl bg-[var(--color-bg-card)] p-4 text-center shadow-xs">
          <p className="text-2xl font-semibold text-[var(--color-text)]">{stats.cookingDays}</p>
          <p className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">下厨天数</p>
        </div>
      </div>

      {/* Calendar */}
      <div className="rounded-2xl bg-[var(--color-bg-card)] p-5 shadow-xs">
        {/* Month navigation */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-subtle)] active:scale-90"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-sm font-semibold text-[var(--color-text)]">
            {viewYear}年 {monthNames[viewMonth - 1]}
          </h2>
          <button
            onClick={nextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-subtle)] active:scale-90"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Day names */}
        <div className="mb-2 grid grid-cols-7 gap-1">
          {dayNames.map((d) => (
            <div key={d} className="text-center text-[11px] font-medium text-[var(--color-text-muted)]">
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />
            const dateStr = formatDate(day)
            const isToday = dateStr === today
            const hasRecord = datesWithRecords.has(dateStr)
            const isSelected = dateStr === selectedDate

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`relative flex h-10 w-full items-center justify-center rounded-xl text-sm transition-all duration-200 ${
                  isSelected
                    ? 'bg-[var(--color-primary)] text-white font-medium shadow-sm'
                    : isToday
                      ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium'
                      : 'text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)]'
                }`}
              >
                {day}
                {hasRecord && !isSelected && (
                  <span className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${
                    isToday ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-text-muted)]'
                  }`} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected date records */}
      {selectedDate && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[var(--color-text)]">
            {selectedDate.replace(/-/g, '/')} 的做菜记录
          </h3>
          {selectedRecords.length === 0 ? (
            <p className="py-4 text-center text-sm text-[var(--color-text-muted)]">这天还没有做菜记录</p>
          ) : (
            <div className="space-y-2">
              {selectedRecords.map((record) => (
                <div
                  key={record.id}
                  className="group flex items-center gap-3 rounded-2xl bg-[var(--color-bg-card)] px-4 py-3 shadow-xs"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-bg-subtle)] text-sm font-medium text-[var(--color-text-muted)]">
                    {getRecipeName(record.recipeId).charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--color-text)]">
                      {getRecipeName(record.recipeId)}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {record.servings}人份
                      {record.notes && ` · ${record.notes}`}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteRecord(record.id)}
                    className="rounded-lg p-1.5 text-[var(--color-text-muted)] opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {records.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-bg-subtle)]">
            <CalendarDays size={28} className="text-[var(--color-text-muted)]" />
          </div>
          <p className="text-sm text-[var(--color-text-muted)]">完成做菜后会自动记录到这里</p>
        </div>
      )}
    </div>
  )
}
