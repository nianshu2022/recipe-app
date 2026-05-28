import type { Recipe } from '@/types'

export function getShareConfig(recipe: Recipe) {
  return {
    title: recipe.name,
    path: `/pages/recipe/detail?id=${recipe.id}`,
    imageUrl: recipe.coverImage || undefined,
  }
}
