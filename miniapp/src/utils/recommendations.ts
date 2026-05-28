import type { Recipe } from '@/types'

export type Scene = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'quick' | 'healthy'

interface SceneInfo {
  id: Scene
  label: string
  emoji: string
  tags: string[]
  maxDuration?: number
  categories?: string[]
}

export const scenes: SceneInfo[] = [
  { id: 'breakfast', label: '早餐', emoji: '🌅', tags: ['早餐', '快手菜'], maxDuration: 20, categories: ['主食', '甜品'] },
  { id: 'lunch', label: '午餐', emoji: '☀️', tags: ['家常菜', '下饭菜'] },
  { id: 'dinner', label: '晚餐', emoji: '🌙', tags: ['家常菜', '下饭菜', '硬菜'] },
  { id: 'snack', label: '下午茶', emoji: '🍵', tags: ['甜品', '饮品'], categories: ['甜品', '饮品'] },
  { id: 'quick', label: '快手菜', emoji: '⚡', tags: ['快手菜'], maxDuration: 30 },
  { id: 'healthy', label: '减脂餐', emoji: '🥗', tags: ['减脂餐', '低卡'] },
]

export function getSeason(): 'spring' | 'summer' | 'autumn' | 'winter' {
  const month = new Date().getMonth()
  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  if (month >= 8 && month <= 10) return 'autumn'
  return 'winter'
}

const seasonTags: Record<string, string[]> = {
  spring: ['春菜', '野菜', '清淡'],
  summer: ['凉菜', '清爽', '开胃'],
  autumn: ['炖汤', '滋补', '暖胃'],
  winter: ['火锅', '炖菜', '暖身'],
}

export function getTimeScene(): Scene {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 10) return 'breakfast'
  if (hour >= 10 && hour < 14) return 'lunch'
  if (hour >= 14 && hour < 17) return 'snack'
  return 'dinner'
}

export function getSceneRecommendations(
  recipes: Recipe[],
  scene: Scene,
  limit = 6
): Recipe[] {
  const sceneInfo = scenes.find(s => s.id === scene)
  if (!sceneInfo) return []

  const scored = recipes.map(recipe => {
    let score = 0

    const tagMatch = sceneInfo.tags.some(tag => recipe.tags.includes(tag))
    if (tagMatch) score += 3

    if (sceneInfo.categories?.includes(recipe.category)) {
      score += 2
    }

    if (sceneInfo.maxDuration && recipe.duration <= sceneInfo.maxDuration) {
      score += 2
    }

    const season = getSeason()
    const seasonBonus = seasonTags[season].some(tag => recipe.tags.includes(tag))
    if (seasonBonus) score += 1

    if (scene === 'breakfast' && recipe.difficulty === 'easy') {
      score += 1
    }

    return { recipe, score }
  })

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.recipe)
}

export function getSeasonalRecommendations(recipes: Recipe[], limit = 4): Recipe[] {
  const season = getSeason()
  const tags = seasonTags[season]

  const scored = recipes.map(recipe => {
    let score = 0
    const tagMatch = tags.some(tag => recipe.tags.includes(tag))
    if (tagMatch) score += 3
    return { recipe, score }
  })

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.recipe)
}

export function getQuickRecipes(recipes: Recipe[], limit = 4): Recipe[] {
  return recipes
    .filter(r => r.duration <= 30)
    .sort((a, b) => a.duration - b.duration)
    .slice(0, limit)
}
