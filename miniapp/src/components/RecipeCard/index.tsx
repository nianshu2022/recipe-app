import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import type { Recipe } from '@/types'
import './index.scss'

const categoryLabels: Record<string, string> = {
  'cold-dish': '凉菜',
  'hot-dish': '热菜',
  'soup': '汤羹',
  'staple': '主食',
  'dessert': '甜品',
  'drink': '饮品',
}

const difficultyLabels: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
}

interface Props {
  recipe: Recipe
}

export function RecipeCard({ recipe }: Props) {
  return (
    <View
      className="recipe-card"
      onClick={() => Taro.navigateTo({ url: `/pages/recipe/detail?id=${recipe.id}` })}
    >
      {recipe.coverImage ? (
        <Image className="recipe-card-image" src={recipe.coverImage} mode="aspectFill" />
      ) : (
        <View className="recipe-card-placeholder">
          <Text className="recipe-card-placeholder-icon">🍳</Text>
        </View>
      )}
      <View className="recipe-card-body">
        <Text className="recipe-card-name">{recipe.name}</Text>
        <View className="recipe-card-meta">
          <Text className="recipe-card-badge">{categoryLabels[recipe.category] ?? recipe.category}</Text>
          <Text className="recipe-card-badge">{difficultyLabels[recipe.difficulty]}</Text>
          <Text className="recipe-card-time">{recipe.duration}分钟</Text>
        </View>
        {recipe.tags.length > 0 && (
          <View className="recipe-card-tags">
            {recipe.tags.slice(0, 3).map((tag) => (
              <Text key={tag} className="recipe-card-tag">{tag}</Text>
            ))}
          </View>
        )}
      </View>
    </View>
  )
}
