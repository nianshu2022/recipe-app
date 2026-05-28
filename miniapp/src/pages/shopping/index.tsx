import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useMemo } from 'react'
import { useShoppingStore } from '@/stores/shoppingStore'
import { Icon } from '@/components/Icon'
import type { ShoppingItem } from '@/types'
import './index.scss'

export default function ShoppingListPage() {
  const {
    lists,
    loading,
    loadLists,
    toggleItem,
    addItem,
    removeItem,
    clearChecked,
    deleteList,
    getCurrentList,
  } = useShoppingStore()

  const [newItemName, setNewItemName] = useState('')
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())

  useDidShow(() => {
    loadLists()
  })

  const currentList = getCurrentList()

  const checkedCount = useMemo(() => {
    if (!currentList) return 0
    return currentList.items.filter((i) => i.checked).length
  }, [currentList])

  const totalCount = currentList?.items.length ?? 0

  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0

  // Group items by category
  const groupedItems = useMemo(() => {
    if (!currentList) return new Map<string, ShoppingItem[]>()
    const groups = new Map<string, ShoppingItem[]>()
    for (const item of currentList.items) {
      const cat = item.category || '其他'
      if (!groups.has(cat)) groups.set(cat, [])
      groups.get(cat)!.push(item)
    }
    return groups
  }, [currentList])

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) {
        next.delete(cat)
      } else {
        next.add(cat)
      }
      return next
    })
  }

  const handleAddItem = () => {
    if (!newItemName.trim() || !currentList) return
    addItem(currentList.id, newItemName.trim())
    setNewItemName('')
  }

  const handleToggleItem = (itemId: string) => {
    if (!currentList) return
    toggleItem(currentList.id, itemId)
  }

  const handleRemoveItem = (itemId: string) => {
    if (!currentList) return
    removeItem(currentList.id, itemId)
  }

  const handleClearChecked = () => {
    if (!currentList || checkedCount === 0) return
    Taro.showModal({
      title: '确认清除',
      content: `确定要清除 ${checkedCount} 个已购项目吗？`,
      success: (res) => {
        if (res.confirm && currentList) {
          clearChecked(currentList.id)
        }
      },
    })
  }

  const handleDeleteList = () => {
    if (!currentList) return
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除整个购物清单吗？',
      success: (res) => {
        if (res.confirm && currentList) {
          deleteList(currentList.id)
          Taro.showToast({ title: '已删除', icon: 'success' })
        }
      },
    })
  }

  return (
    <View className="shopping-page">
      {/* Header */}
      <View className="shopping-header">
        <View className="shopping-back" onClick={() => Taro.navigateBack()}>
          <Icon name="arrowLeft" size={40} color="#44403c" />
        </View>
        <Text className="shopping-title">购物清单</Text>
        <Text className="shopping-count">
          {checkedCount}/{totalCount} 已购
        </Text>
      </View>

      {/* Add item */}
      {currentList && (
        <View className="add-row">
          <Input
            className="add-input"
            placeholder="输入食材名称"
            value={newItemName}
            onInput={(e) => setNewItemName(e.detail.value)}
            onConfirm={handleAddItem}
          />
          <View className="add-btn" onClick={handleAddItem}>
            <Text className="add-btn-text">添加</Text>
          </View>
        </View>
      )}

      {/* Progress bar */}
      {totalCount > 0 && (
        <View className="progress-section">
          <View className="progress-bar">
            <View className="progress-fill" style={{ width: `${progress}%` }} />
          </View>
        </View>
      )}

      {/* Items */}
      {loading ? (
        <View className="loading">
          <Text className="loading-text">加载中...</Text>
        </View>
      ) : !currentList || totalCount === 0 ? (
        <View className="empty-state">
          <Icon name="shoppingCart" size={64} color="#a8a29e" />
          <Text className="empty-title">清单是空的</Text>
          <Text className="empty-desc">从菜谱生成一份购物清单吧</Text>
        </View>
      ) : (
        <ScrollView scrollY className="items-scroll">
          {Array.from(groupedItems.entries()).map(([category, items]) => (
            <View key={category} className="category-group">
              <View
                className="category-header"
                onClick={() => toggleCategory(category)}
              >
                <Text className="category-name">{category}</Text>
                <Text className="category-count">{items.filter(i => i.checked).length}/{items.length}</Text>
                <View className="category-toggle">
                  <Icon
                    name="chevronRight"
                    size={28}
                    color="#a8a29e"
                  />
                </View>
              </View>
              {!collapsedCategories.has(category) &&
                items.map((item) => (
                  <View key={item.id} className="shopping-item">
                    <View
                      className={`item-checkbox ${item.checked ? 'checked' : ''}`}
                      onClick={() => handleToggleItem(item.id)}
                    >
                      {item.checked && <Icon name="check" size={28} color="#fff" />}
                    </View>
                    <View className="item-info">
                      <Text className={`item-name ${item.checked ? 'item-checked' : ''}`}>
                        {item.name}
                      </Text>
                      {item.amount > 0 && (
                        <Text className="item-amount">
                          {item.amount}{item.unit}
                        </Text>
                      )}
                    </View>
                    <View
                      className="item-delete"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <Text className="item-delete-text">删除</Text>
                    </View>
                  </View>
                ))}
            </View>
          ))}

          {/* Clear checked button */}
          {checkedCount > 0 && (
            <View className="clear-btn" onClick={handleClearChecked}>
              <Text className="clear-btn-text">清除已购 ({checkedCount})</Text>
            </View>
          )}

          {/* Delete list */}
          <View className="delete-list-btn" onClick={handleDeleteList}>
            <Text className="delete-list-text">删除清单</Text>
          </View>
        </ScrollView>
      )}
    </View>
  )
}
