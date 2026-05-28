import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useMemo } from 'react'
import { useCalendarStore } from '@/stores/calendarStore'
import { useRecipeStore } from '@/stores/recipeStore'
import './index.scss'

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']
const MONTH_NAMES = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

export default function CalendarPage() {
  const {
    records,
    selectedDate,
    loadRecords,
    setSelectedDate,
    deleteRecord,
    getMonthStats,
    getDatesWithRecords,
    getRecordsForDate,
  } = useCalendarStore()
  const { recipes, loadRecipes } = useRecipeStore()

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  useDidShow(() => {
    loadRecords()
    loadRecipes()
  })

  const stats = useMemo(() => getMonthStats(year, month), [year, month, records])
  const datesWithRecords = useMemo(() => getDatesWithRecords(year, month), [year, month, records])

  const selectedRecords = useMemo(() => {
    if (!selectedDate) return []
    return getRecordsForDate(selectedDate)
  }, [selectedDate, records])

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1)
    let startWeekday = firstDay.getDay()
    // Monday-first: convert Sunday (0) to 7
    if (startWeekday === 0) startWeekday = 7
    const daysInMonth = new Date(year, month, 0).getDate()

    const days: (number | null)[] = []
    // Fill leading empty cells
    for (let i = 1; i < startWeekday; i++) {
      days.push(null)
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d)
    }
    return days
  }, [year, month])

  const formatDate = (day: number) => {
    return `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`
  }

  const handlePrevMonth = () => {
    if (month === 1) {
      setYear(year - 1)
      setMonth(12)
    } else {
      setMonth(month - 1)
    }
    setSelectedDate(null)
  }

  const handleNextMonth = () => {
    if (month === 12) {
      setYear(year + 1)
      setMonth(1)
    } else {
      setMonth(month + 1)
    }
    setSelectedDate(null)
  }

  const handleDayTap = (day: number) => {
    const dateStr = formatDate(day)
    setSelectedDate(selectedDate === dateStr ? null : dateStr)
  }

  const getRecipeName = (recipeId: string) => {
    return recipes.find((r) => r.id === recipeId)?.name ?? '未知菜谱'
  }

  const handleDeleteRecord = (id: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      success: (res) => {
        if (res.confirm) deleteRecord(id)
      },
    })
  }

  return (
    <View className="calendar-page">
      {/* Stats cards */}
      <View className="stats-row">
        <View className="stats-card">
          <Text className="stats-value">{stats.totalCooked}</Text>
          <Text className="stats-label">做菜次数</Text>
        </View>
        <View className="stats-card">
          <Text className="stats-value">{stats.uniqueRecipes}</Text>
          <Text className="stats-label">不同菜品</Text>
        </View>
        <View className="stats-card">
          <Text className="stats-value">{stats.cookingDays}</Text>
          <Text className="stats-label">下厨天数</Text>
        </View>
      </View>

      {/* Month header */}
      <View className="month-header">
        <View className="month-arrow" onClick={handlePrevMonth}>
          <Text className="month-arrow-text">{'<'}</Text>
        </View>
        <Text className="month-title">
          {year}年 {MONTH_NAMES[month - 1]}
        </Text>
        <View className="month-arrow" onClick={handleNextMonth}>
          <Text className="month-arrow-text">{'>'}</Text>
        </View>
      </View>

      {/* Weekday labels */}
      <View className="weekday-row">
        {WEEKDAYS.map((w) => (
          <View key={w} className="weekday-cell">
            <Text className="weekday-text">{w}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View className="calendar-grid">
        {calendarDays.map((day, i) => {
          if (day === null) {
            return <View key={`empty-${i}`} className="calendar-cell empty" />
          }
          const dateStr = formatDate(day)
          const hasRecord = datesWithRecords.has(dateStr)
          const isSelected = selectedDate === dateStr
          const isToday =
            day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear()

          return (
            <View
              key={dateStr}
              className={`calendar-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
              onClick={() => handleDayTap(day)}
            >
              <Text className={`calendar-day ${isSelected ? 'selected-text' : ''}`}>
                {day}
              </Text>
              {hasRecord && <View className="calendar-dot" />}
            </View>
          )
        })}
      </View>

      {/* Selected date records */}
      {selectedDate && (
        <View className="records-section">
          <Text className="records-title">{selectedDate} 的做菜记录</Text>
          {selectedRecords.length === 0 ? (
            <View className="records-empty">
              <Text className="records-empty-text">这天还没有做菜记录</Text>
            </View>
          ) : (
            selectedRecords.map((record) => (
              <View key={record.id} className="record-card">
                <View className="record-info">
                  <Text className="record-name">{getRecipeName(record.recipeId)}</Text>
                  <Text className="record-servings">{record.servings}人份</Text>
                </View>
                <View
                  className="record-delete"
                  onClick={() => handleDeleteRecord(record.id)}
                >
                  <Text className="record-delete-text">删除</Text>
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </View>
  )
}
