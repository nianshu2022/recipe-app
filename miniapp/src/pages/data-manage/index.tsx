import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useRecipeStore } from '@/stores/recipeStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useUIStore } from '@/stores/uiStore'
import { Icon } from '@/components/Icon'
import { db } from '@/utils/storage'
import './index.scss'

export default function DataManagePage() {
  const recipes = useRecipeStore((s) => s.recipes)
  const loadRecipes = useRecipeStore((s) => s.loadRecipes)
  const collections = useCollectionStore((s) => s.collections)
  const loadCollections = useCollectionStore((s) => s.loadCollections)
  const showToast = useUIStore((s) => s.showToast)
  const showConfirm = useUIStore((s) => s.showConfirm)

  const [stats, setStats] = useState({ recipes: 0, collections: 0, records: 0 })

  useDidShow(() => {
    loadRecipes()
    loadCollections()
    loadStats()
  })

  const loadStats = async () => {
    const allRecipes = await db.getAllRecipes()
    const allCollections = await db.getAllCollections()
    const allRecords = await db.getAllCookingRecords()
    setStats({
      recipes: allRecipes.length,
      collections: allCollections.length,
      records: allRecords.length,
    })
  }

  const handleExport = async () => {
    try {
      const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        recipes: await db.getAllRecipes(),
        collections: await db.getAllCollections(),
        mealPlans: await db.getAllMealPlans(),
        shoppingLists: await db.getAllShoppingLists(),
        cookingRecords: await db.getAllCookingRecords(),
      }
      const json = JSON.stringify(data, null, 2)

      Taro.setClipboardData({
        data: json,
        success: () => showToast('数据已复制到剪贴板', 'success'),
      })
    } catch {
      showToast('导出失败', 'error')
    }
  }

  const handleImport = async () => {
    try {
      const res = await Taro.getClipboardData()
      if (!res.data) {
        showToast('剪贴板为空', 'error')
        return
      }

      const data = JSON.parse(res.data)
      if (data.version !== 1 || !Array.isArray(data.recipes)) {
        showToast('无效的备份数据', 'error')
        return
      }

      const confirmed = await showConfirm({
        title: '导入数据',
        message: `将导入 ${data.recipes.length} 道菜谱，现有数据不会被覆盖。`,
      })

      if (confirmed) {
        for (const recipe of data.recipes || []) {
          await db.putRecipe(recipe)
        }
        for (const collection of data.collections || []) {
          await db.putCollection(collection)
        }
        for (const plan of data.mealPlans || []) {
          await db.putMealPlan(plan)
        }
        for (const list of data.shoppingLists || []) {
          await db.putShoppingList(list)
        }
        for (const record of data.cookingRecords || []) {
          await db.putCookingRecord(record)
        }

        await loadRecipes()
        await loadCollections()
        await loadStats()
        showToast('导入成功', 'success')
      }
    } catch {
      showToast('导入失败，请检查数据格式', 'error')
    }
  }

  const handleClearAll = async () => {
    const confirmed = await showConfirm({
      title: '清空所有数据',
      message: '此操作不可撤销，确定清空所有数据吗？',
      danger: true,
    })

    if (confirmed) {
      const doubleConfirm = await showConfirm({
        title: '再次确认',
        message: '真的要删除所有菜谱、收藏、餐食计划吗？',
        danger: true,
      })

      if (doubleConfirm) {
        Taro.clearStorageSync()
        await loadRecipes()
        await loadCollections()
        await loadStats()
        showToast('已清空所有数据', 'success')
      }
    }
  }

  return (
    <View className='data-page'>
      <View className='data-header'>
        <View className='data-header__back' onClick={() => Taro.navigateBack()}>
          <Icon name='arrowLeft' size={40} color='#252220' />
        </View>
        <Text className='data-header__title'>数据管理</Text>
        <View style={{ width: '72rpx' }} />
      </View>

      <View className='data-stats'>
        <View className='data-stat'>
          <Text className='data-stat__value'>{stats.recipes}</Text>
          <Text className='data-stat__label'>菜谱</Text>
        </View>
        <View className='data-stat'>
          <Text className='data-stat__value'>{stats.collections}</Text>
          <Text className='data-stat__label'>收藏夹</Text>
        </View>
        <View className='data-stat'>
          <Text className='data-stat__value'>{stats.records}</Text>
          <Text className='data-stat__label'>做菜记录</Text>
        </View>
      </View>

      <View className='data-actions'>
        <Text className='data-actions__title'>备份与恢复</Text>
        <View className='data-actions__card'>
          <View className='data-action' onClick={handleExport}>
            <Icon name='download' size={40} color='#252220' />
            <View className='data-action__content'>
              <Text className='data-action__label'>导出数据</Text>
              <Text className='data-action__desc'>将数据复制到剪贴板</Text>
            </View>
            <Icon name='chevronRight' size={28} color='#a8a08e' />
          </View>
          <View className='data-action data-action--bordered' onClick={handleImport}>
            <Icon name='refreshCw' size={40} color='#252220' />
            <View className='data-action__content'>
              <Text className='data-action__label'>导入数据</Text>
              <Text className='data-action__desc'>从剪贴板恢复数据</Text>
            </View>
            <Icon name='chevronRight' size={28} color='#a8a08e' />
          </View>
        </View>
      </View>

      <View className='data-danger'>
        <Text className='data-danger__title'>危险操作</Text>
        <View className='data-danger__card' onClick={handleClearAll}>
          <Icon name='trash' size={40} color='#c44b4b' />
          <View className='data-danger__content'>
            <Text className='data-danger__label'>清空所有数据</Text>
            <Text className='data-danger__desc'>删除所有本地数据，此操作不可撤销</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
