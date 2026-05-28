import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useMemo } from 'react'
import { useCollectionStore } from '@/stores/collectionStore'
import { useRecipeStore } from '@/stores/recipeStore'
import { Icon } from '@/components/Icon'
import './index.scss'

export default function CollectionPage() {
  const { collections, loading, loadCollections, addCollection, deleteCollection } =
    useCollectionStore()
  const { recipes, loadRecipes } = useRecipeStore()

  useDidShow(() => {
    loadCollections()
    loadRecipes()
  })

  const getRecipeName = (recipeId: string) => {
    return recipes.find((r) => r.id === recipeId)?.name ?? null
  }

  const handleCreate = () => {
    Taro.showModal({
      title: '新建收藏夹',
      editable: true,
      placeholderText: '请输入收藏夹名称',
      success: (res) => {
        if (res.confirm && res.content?.trim()) {
          addCollection(res.content.trim())
          Taro.showToast({ title: '已创建', icon: 'success' })
        }
      },
    })
  }

  const handleDelete = (id: string, name: string) => {
    Taro.showModal({
      title: '确认删除',
      content: `确定要删除收藏夹「${name}」吗？`,
      success: (res) => {
        if (res.confirm) {
          deleteCollection(id)
          Taro.showToast({ title: '已删除', icon: 'success' })
        }
      },
    })
  }

  return (
    <View className="collection-page">
      {/* Header */}
      <View className="collection-header">
        <View className="collection-back" onClick={() => Taro.navigateBack()}>
          <Icon name="arrowLeft" size={40} color="#44403c" />
        </View>
        <Text className="collection-title">我的收藏夹</Text>
        <View className="collection-create" onClick={handleCreate}>
          <Text className="collection-create-text">新建</Text>
        </View>
      </View>

      {/* List */}
      <View className="collection-list">
        {loading ? (
          <View className="loading">
            <Text className="loading-text">加载中...</Text>
          </View>
        ) : collections.length === 0 ? (
          <View className="empty-state">
            <Icon name="heart" size={64} color="#a8a29e" />
            <Text className="empty-title">还没有收藏夹</Text>
            <Text className="empty-desc">去菜谱库逛逛，把喜欢的菜收藏起来</Text>
            <View className="empty-btn" onClick={handleCreate}>
              <Text className="empty-btn-text">新建收藏夹</Text>
            </View>
          </View>
        ) : (
          collections.map((col) => {
            const firstRecipeName = col.recipeIds.length > 0 ? getRecipeName(col.recipeIds[0]) : null
            return (
              <View key={col.id} className="collection-card">
                <View className="collection-card-info">
                  <Text className="collection-card-name">{col.name}</Text>
                  <Text className="collection-card-count">
                    {col.recipeIds.length} 道菜
                  </Text>
                  {firstRecipeName && (
                    <Text className="collection-card-preview">
                      {firstRecipeName}
                      {col.recipeIds.length > 1 ? ` 等${col.recipeIds.length}道` : ''}
                    </Text>
                  )}
                </View>
                <View
                  className="collection-card-delete"
                  onClick={() => handleDelete(col.id, col.name)}
                >
                  <Text className="collection-card-delete-text">删除</Text>
                </View>
              </View>
            )
          })
        )}
      </View>
    </View>
  )
}
