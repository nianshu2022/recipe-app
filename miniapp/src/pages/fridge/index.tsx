import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useMemo } from 'react'
import { useFridgeStore } from '@/stores/fridgeStore'
import { useRecipeStore } from '@/stores/recipeStore'
import { Icon } from '@/components/Icon'
import './index.scss'

const quickItems = [
  { name: '鸡蛋', unit: '个', amount: 10, category: '蛋奶', expiryDays: 14 },
  { name: '牛奶', unit: '盒', amount: 1, category: '蛋奶', expiryDays: 7 },
  { name: '鸡胸肉', unit: 'g', amount: 500, category: '肉类', expiryDays: 3 },
  { name: '番茄', unit: '个', amount: 4, category: '蔬菜', expiryDays: 5 },
  { name: '土豆', unit: '个', amount: 3, category: '蔬菜', expiryDays: 14 },
  { name: '豆腐', unit: '块', amount: 1, category: '豆制品', expiryDays: 3 },
  { name: '虾仁', unit: 'g', amount: 300, category: '海鲜', expiryDays: 2 },
  { name: '生菜', unit: '棵', amount: 1, category: '蔬菜', expiryDays: 3 },
]

export default function FridgePage() {
  const {
    items,
    loading,
    categoryFilter,
    loadItems,
    addItem,
    removeItem,
    consumeItem,
    setCategoryFilter,
    getExpiringSoon,
    getExpired,
    getFilteredItems,
    getCategoryCounts,
    getRecommendations,
  } = useFridgeStore()

  const { recipes, loadRecipes } = useRecipeStore()

  const [showAdd, setShowAdd] = useState(false)
  const [showQuick, setShowQuick] = useState(false)
  const [newName, setNewName] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newUnit, setNewUnit] = useState('')

  useDidShow(() => {
    loadItems()
    loadRecipes()
  })

  const handleAdd = async () => {
    if (!newName.trim()) return
    await addItem(newName.trim(), Number(newAmount) || 0, newUnit.trim() || '份')
    setNewName('')
    setNewAmount('')
    setNewUnit('')
    setShowAdd(false)
  }

  const handleQuickAdd = async (item: typeof quickItems[0]) => {
    await addItem(item.name, item.amount, item.unit, item.category, item.expiryDays)
    Taro.showToast({ title: `已添加 ${item.name}`, icon: 'success' })
  }

  const expiringSoon = useMemo(() => getExpiringSoon(), [items])
  const expired = useMemo(() => getExpired(), [items])
  const filtered = useMemo(() => getFilteredItems(), [items, categoryFilter])
  const categoryCounts = useMemo(() => getCategoryCounts(), [items])
  const recommendations = useMemo(() => getRecommendations(), [items])
  const categories = Object.keys(categoryCounts)

  const formatExpiry = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000)
    if (diff < 0) return '已过期'
    if (diff === 0) return '今天到期'
    if (diff === 1) return '明天到期'
    return `${diff}天后到期`
  }

  const handleRemove = (id: string) => {
    Taro.showModal({
      title: '确认移除',
      content: '确定要移除这个食材吗？',
      success: (res) => {
        if (res.confirm) removeItem(id)
      },
    })
  }

  return (
    <View className="fridge-page">
      {/* Header */}
      <View className="fridge-header">
        <View className="fridge-header-left">
          <Text className="fridge-title">冰箱食材</Text>
          <Text className="fridge-subtitle">
            {items.length > 0 ? `${items.length} 种食材` : '管理你的食材库存'}
          </Text>
        </View>
        <View className="fridge-header-actions">
          <View className="fridge-btn-secondary" onClick={() => { setShowQuick(!showQuick); setShowAdd(false) }}>
            <Icon name="lightbulb" size={36} color="#78716c" />
          </View>
          <View className="fridge-btn-primary" onClick={() => { setShowAdd(!showAdd); setShowQuick(false) }}>
            <Icon name="plus" size={36} color="#fff" />
          </View>
        </View>
      </View>

      {/* Quick add panel */}
      {showQuick && (
        <View className="panel">
          <View className="panel-header">
            <Text className="panel-title">快速录入</Text>
            <View className="panel-close" onClick={() => setShowQuick(false)}>
              <Icon name="x" size={32} color="#a8a29e" />
            </View>
          </View>
          <View className="quick-grid">
            {quickItems.map((item) => (
              <View
                key={item.name}
                className="quick-pill"
                onClick={() => handleQuickAdd(item)}
              >
                <Text className="quick-pill-text">{item.name} {item.amount}{item.unit}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Manual add panel */}
      {showAdd && (
        <View className="panel">
          <View className="panel-header">
            <Text className="panel-title">添加食材</Text>
            <View className="panel-close" onClick={() => { setShowAdd(false); setNewName(''); setNewAmount(''); setNewUnit('') }}>
              <Icon name="x" size={32} color="#a8a29e" />
            </View>
          </View>
          <View className="add-form">
            <Input
              className="add-input add-input-name"
              placeholder="食材名称"
              value={newName}
              onInput={(e) => setNewName(e.detail.value)}
            />
            <Input
              className="add-input add-input-amount"
              placeholder="数量"
              type="digit"
              value={newAmount}
              onInput={(e) => setNewAmount(e.detail.value)}
            />
            <Input
              className="add-input add-input-unit"
              placeholder="单位"
              value={newUnit}
              onInput={(e) => setNewUnit(e.detail.value)}
            />
          </View>
          <View className="add-submit" onClick={handleAdd}>
            <Text className="add-submit-text">添加</Text>
          </View>
        </View>
      )}

      {/* Expiring alerts */}
      {(expiringSoon.length > 0 || expired.length > 0) && (
        <View className="alerts">
          {expired.length > 0 && (
            <View className="alert alert-danger">
              <Icon name="alertTriangle" size={32} color="#dc2626" />
              <Text className="alert-text">{expired.map((i) => i.name).join('、')} 已过期</Text>
            </View>
          )}
          {expiringSoon.length > 0 && (
            <View className="alert alert-warning">
              <Icon name="clock" size={32} color="#b45309" />
              <Text className="alert-text">{expiringSoon.map((i) => `${i.name}(${formatExpiry(i.expiryDate!)})`).join('、')}</Text>
            </View>
          )}
        </View>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && items.length > 0 && (
        <View className="recommend-card">
          <Text className="recommend-label">根据现有食材推荐</Text>
          <View className="recommend-list">
            {recommendations.map((r) => (
              <View key={r} className="recommend-pill">
                <Text className="recommend-pill-text">{r}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Category filter */}
      {categories.length > 0 && (
        <ScrollView scrollX className="filter-scroll">
          <View
            className={`filter-pill ${categoryFilter === null ? 'active' : ''}`}
            onClick={() => setCategoryFilter(null)}
          >
            <Text className="filter-pill-text">全部</Text>
          </View>
          {categories.map((cat) => (
            <View
              key={cat}
              className={`filter-pill ${categoryFilter === cat ? 'active' : ''}`}
              onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
            >
              <Text className="filter-pill-text">{cat} ({categoryCounts[cat]})</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Item list */}
      {loading ? (
        <View className="skeleton-list">
          {[1, 2, 3].map((i) => (
            <View key={i} className="skeleton-card">
              <View className="skeleton-icon" />
              <View className="skeleton-lines">
                <View className="skeleton-line skeleton-line-1" />
                <View className="skeleton-line skeleton-line-2" />
              </View>
            </View>
          ))}
        </View>
      ) : items.length === 0 ? (
        <View className="empty-state">
          <View className="empty-icon-box">
            <Icon name="refrigerator" size={64} color="#a8a29e" />
          </View>
          <Text className="empty-title">冰箱空空如也</Text>
          <Text className="empty-desc">录入你买了什么吧</Text>
        </View>
      ) : (
        <View className="item-list">
          {filtered.map((item) => {
            const isExpiring = item.expiryDate && new Date(item.expiryDate) <= new Date(Date.now() + 3 * 86400000)
            const isExpired = item.expiryDate && new Date(item.expiryDate) <= new Date()
            return (
              <View key={item.id} className={`item-card ${isExpired ? 'expired' : ''}`}>
                <View className={`item-icon ${isExpired ? 'icon-danger' : isExpiring ? 'icon-warning' : ''}`}>
                  <Text className="item-icon-text">{item.amount > 0 ? `${item.amount}` : ''}</Text>
                </View>
                <View className="item-info">
                  <View className="item-name-row">
                    <Text className="item-name">{item.name}</Text>
                    <Text className="item-category">{item.category}</Text>
                  </View>
                  <Text className="item-meta">
                    {item.amount > 0 ? `${item.amount}${item.unit}` : ''}
                    {item.expiryDate && ` · ${formatExpiry(item.expiryDate)}`}
                  </Text>
                </View>
                <View className="item-actions">
                  {item.amount > 0 && (
                    <View className="item-action" onClick={() => consumeItem(item.id, 1)}>
                      <Icon name="minus" size={28} color="#78716c" />
                    </View>
                  )}
                  <View className="item-action action-danger" onClick={() => handleRemove(item.id)}>
                    <Icon name="trash" size={28} color="#ef4444" />
                  </View>
                </View>
              </View>
            )
          })}
        </View>
      )}
    </View>
  )
}
