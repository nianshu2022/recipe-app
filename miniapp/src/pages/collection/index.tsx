import { useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useCollectionStore } from '@/stores/collectionStore'
import { useRecipeStore } from '@/stores/recipeStore'
import { useUIStore } from '@/stores/uiStore'
import { Icon } from '@/components/Icon'
import { EmptyState } from '@/components/EmptyState'
import type { Recipe } from '@/types'
import './index.scss'

export default function CollectionPage() {
  const collections = useCollectionStore((s) => s.collections)
  const loadCollections = useCollectionStore((s) => s.loadCollections)
  const createCollection = useCollectionStore((s) => s.createCollection)
  const toggleRecipeInCollection = useCollectionStore((s) => s.toggleRecipeInCollection)
  const isRecipeCollected = useCollectionStore((s) => s.isRecipeCollected)
  const recipes = useRecipeStore((s) => s.recipes)
  const loadRecipes = useRecipeStore((s) => s.loadRecipes)
  const showToast = useUIStore((s) => s.showToast)
  const showConfirm = useUIStore((s) => s.showConfirm)

  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')

  useDidShow(() => {
    loadCollections()
    loadRecipes()
  })

  const collectedRecipes = recipes.filter((r) => !r.deletedAt && isRecipeCollected(r.id))

  const handleCreateCollection = async () => {
    if (!newName.trim()) return
    await createCollection(newName.trim())
    setNewName('')
    setShowCreate(false)
    showToast('收藏夹已创建', 'success')
  }

  const handleRecipeClick = (recipe: Recipe) => {
    Taro.navigateTo({ url: `/pages/recipe/detail?id=${recipe.id}` })
  }

  const handleUnfavorite = async (e: any, recipeId: string) => {
    e.stopPropagation()
    for (const collection of collections) {
      if (collection.recipeIds.includes(recipeId)) {
        await toggleRecipeInCollection(collection.id, recipeId)
      }
    }
  }

  return (
    <View className='collection-page'>
      <View className='collection-header'>
        <View className='collection-header__top'>
          <View>
            <Text className='collection-header__title'>我的收藏</Text>
            <Text className='collection-header__count'>{collectedRecipes.length} 道菜谱</Text>
          </View>
          <View className='collection-header__actions'>
            <View className='collection-header__btn' onClick={() => setShowCreate(!showCreate)}>
              <Icon name='plus' size={40} color='#252220' />
            </View>
          </View>
        </View>

        {showCreate && (
          <View className='collection-create'>
            <Input
              className='collection-create__input'
              placeholder='收藏夹名称...'
              value={newName}
              onInput={(e) => setNewName(e.detail.value)}
              onConfirm={handleCreateCollection}
            />
            <View className='collection-create__btn' onClick={handleCreateCollection}>
              <Text>创建</Text>
            </View>
          </View>
        )}
      </View>

      {collectedRecipes.length === 0 ? (
        <EmptyState
          icon='heart'
          title='还没有收藏'
          description='浏览菜谱时点击心形图标收藏喜欢的菜谱'
        />
      ) : (
        <View className='collection-list'>
          {collectedRecipes.map((recipe) => (
            <View
              key={recipe.id}
              className='collection-card'
              onClick={() => handleRecipeClick(recipe)}
            >
              <View className='collection-card__cover'>
                {recipe.coverImage ? (
                  <View className='collection-card__img' style={{ backgroundImage: `url(${recipe.coverImage})` }} />
                ) : (
                  <View className='collection-card__placeholder'>
                    <Icon name='chefHat' size={48} color='#a8a08e' />
                  </View>
                )}
              </View>
              <View className='collection-card__content'>
                <Text className='collection-card__name'>{recipe.name}</Text>
                <View className='collection-card__meta'>
                  <Icon name='clock' size={28} color='#a8a08e' />
                  <Text className='collection-card__meta-text'>{recipe.duration}分钟</Text>
                </View>
              </View>
              <View
                className='collection-card__unfav'
                onClick={(e) => handleUnfavorite(e, recipe.id)}
              >
                <Icon name='heartFilled' size={36} color='#ef4444' />
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
