import { useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useShoppingStore } from '@/stores/shoppingStore'
import { useUIStore } from '@/stores/uiStore'
import { Icon } from '@/components/Icon'
import { EmptyState } from '@/components/EmptyState'
import './index.scss'

export default function ShoppingListPage() {
  const lists = useShoppingStore((s) => s.lists)
  const currentListId = useShoppingStore((s) => s.currentListId)
  const loadLists = useShoppingStore((s) => s.loadLists)
  const getCurrentList = useShoppingStore((s) => s.getCurrentList)
  const addItem = useShoppingStore((s) => s.addItem)
  const toggleItem = useShoppingStore((s) => s.toggleItem)
  const deleteItem = useShoppingStore((s) => s.deleteItem)
  const clearChecked = useShoppingStore((s) => s.clearChecked)
  const deleteList = useShoppingStore((s) => s.deleteList)
  const showToast = useUIStore((s) => s.showToast)
  const showConfirm = useUIStore((s) => s.showConfirm)

  const [showAdd, setShowAdd] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  useDidShow(() => {
    loadLists()
  })

  const currentList = getCurrentList()

  const handleAddItem = async () => {
    if (!newItemName.trim()) return
    await addItem(newItemName.trim())
    setNewItemName('')
    setShowAdd(false)
  }

  const handleClearChecked = async () => {
    if (!currentList) return
    const checkedCount = currentList.items.filter((i) => i.checked).length
    if (checkedCount === 0) {
      showToast('没有已购项目', 'info')
      return
    }
    const confirmed = await showConfirm({
      title: '清除已购',
      message: `确定清除 ${checkedCount} 个已购项目吗？`,
    })
    if (confirmed) {
      await clearChecked()
      showToast('已清除', 'success')
    }
  }

  const handleDeleteList = async () => {
    if (!currentListId) return
    const confirmed = await showConfirm({
      title: '删除清单',
      message: '确定删除这个购物清单吗？',
      danger: true,
    })
    if (confirmed) {
      await deleteList(currentListId)
      showToast('已删除', 'success')
    }
  }

  const toggleCategory = (cat: string) => {
    const newSet = new Set(expandedCategories)
    if (newSet.has(cat)) newSet.delete(cat)
    else newSet.add(cat)
    setExpandedCategories(newSet)
  }

  if (!currentList || currentList.items.length === 0) {
    return (
      <View className='shopping-page'>
        <View className='shopping-header'>
          <Text className='shopping-header__title'>购物清单</Text>
        </View>
        <EmptyState
          icon='shoppingCart'
          title='购物清单是空的'
          description='从菜谱生成购物清单，或手动添加食材'
          action={showAdd ? undefined : { label: '添加食材', onClick: () => setShowAdd(true) }}
        />
        {showAdd && (
          <View className='shopping-add'>
            <Input
              className='shopping-add__input'
              placeholder='输入食材名称...'
              value={newItemName}
              onInput={(e) => setNewItemName(e.detail.value)}
              onConfirm={handleAddItem}
            />
            <View className='shopping-add__btn' onClick={handleAddItem}>
              <Text>添加</Text>
            </View>
            <View className='shopping-add__close' onClick={() => setShowAdd(false)}>
              <Icon name='x' size={32} color='#a8a08e' />
            </View>
          </View>
        )}
      </View>
    )
  }

  const checkedCount = currentList.items.filter((i) => i.checked).length
  const totalCount = currentList.items.length
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0

  const groupedItems = currentList.items.reduce(
    (acc, item) => {
      const cat = item.category || '其他'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(item)
      return acc
    },
    {} as Record<string, typeof currentList.items>,
  )

  return (
    <View className='shopping-page'>
      <View className='shopping-header'>
        <View className='shopping-header__top'>
          <Text className='shopping-header__title'>购物清单</Text>
          <Text className='shopping-header__count'>{checkedCount}/{totalCount}</Text>
          <View className='shopping-header__actions'>
            <View className='shopping-header__btn' onClick={handleClearChecked}>
              <Icon name='eraser' size={36} color='#252220' />
            </View>
            <View className='shopping-header__btn' onClick={() => setShowAdd(!showAdd)}>
              <Icon name='plus' size={36} color='#252220' />
            </View>
          </View>
        </View>

        <View className='shopping-progress'>
          <View className='shopping-progress__bar'>
            <View className='shopping-progress__fill' style={{ width: `${progress}%` }} />
          </View>
        </View>
      </View>

      {showAdd && (
        <View className='shopping-add'>
          <Input
            className='shopping-add__input'
            placeholder='输入食材名称...'
            value={newItemName}
            onInput={(e) => setNewItemName(e.detail.value)}
            onConfirm={handleAddItem}
          />
          <View className='shopping-add__btn' onClick={handleAddItem}>
            <Text>添加</Text>
          </View>
          <View className='shopping-add__close' onClick={() => setShowAdd(false)}>
            <Icon name='x' size={32} color='#a8a08e' />
          </View>
        </View>
      )}

      <View className='shopping-list'>
        {Object.entries(groupedItems).map(([category, items]) => {
          const catChecked = items.filter((i) => i.checked).length
          const isExpanded = expandedCategories.has(category) || expandedCategories.size === 0

          return (
            <View key={category} className='shopping-category'>
              <View className='shopping-category__header' onClick={() => toggleCategory(category)}>
                <Text className='shopping-category__name'>{category}</Text>
                <View className='shopping-category__badge'>
                  <Text>{catChecked}/{items.length}</Text>
                </View>
                <Icon
                  name='chevronDown'
                  size={28}
                  color='#a8a08e'
                  style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}
                />
              </View>
              {isExpanded && (
                <View className='shopping-category__items'>
                  {items.map((item) => (
                    <View key={item.id} className='shopping-item'>
                      <View
                        className={`shopping-item__checkbox ${item.checked ? 'shopping-item__checkbox--checked' : ''}`}
                        onClick={() => toggleItem(item.id)}
                      >
                        {item.checked && <Icon name='check' size={28} color='#ffffff' />}
                      </View>
                      <Text className={`shopping-item__name ${item.checked ? 'shopping-item__name--checked' : ''}`}>
                        {item.name}
                      </Text>
                      <Text className='shopping-item__amount'>
                        {item.amount}{item.unit}
                      </Text>
                      <View className='shopping-item__delete' onClick={() => deleteItem(item.id)}>
                        <Icon name='trash' size={28} color='#c44b4b' />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )
        })}
      </View>

      <View className='shopping-footer' onClick={handleDeleteList}>
        <Text className='shopping-footer__text'>删除清单</Text>
      </View>
    </View>
  )
}
