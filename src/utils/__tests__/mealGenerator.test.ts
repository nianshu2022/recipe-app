import { describe, it, expect } from 'vitest'
import { generateMealPlan } from '../mealGenerator'
import type { Recipe, FridgeItem } from '@/types'

const mockRecipes: Recipe[] = [
  {
    id: 'r1',
    userId: 'local',
    name: '快手西红柿炒蛋',
    category: 'hot-dish',
    tags: ['快手菜'],
    difficulty: 'easy',
    duration: 10,
    servings: 2,
    syncStatus: 'synced',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ingredients: [
      { id: '1', name: '西红柿', amount: 2, unit: '个', type: 'main', scalable: true },
      { id: '2', name: '鸡蛋', amount: 3, unit: '个', type: 'main', scalable: true },
    ],
    steps: [{ order: 1, description: '翻炒均匀' }],
  },
  {
    id: 'r2',
    userId: 'local',
    name: '慢炖土豆牛腩煲',
    category: 'soup',
    tags: ['硬菜'],
    difficulty: 'hard',
    duration: 60,
    servings: 4,
    syncStatus: 'synced',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ingredients: [
      { id: '3', name: '牛腩', amount: 500, unit: 'g', type: 'main', scalable: true },
      { id: '4', name: '土豆', amount: 2, unit: '个', type: 'main', scalable: true },
    ],
    steps: [{ order: 1, description: '炖煮1小时' }],
  },
  {
    id: 'r3',
    userId: 'local',
    name: '燕麦牛奶粥',
    category: 'staple',
    tags: ['早餐'],
    difficulty: 'easy',
    duration: 10,
    servings: 1,
    syncStatus: 'synced',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ingredients: [
      { id: '5', name: '燕麦', amount: 50, unit: 'g', type: 'main', scalable: true },
      { id: '6', name: '牛奶', amount: 200, unit: 'ml', type: 'main', scalable: true },
    ],
    steps: [{ order: 1, description: '煮沸' }],
  },
]

describe('mealGenerator', () => {
  it('generates 7 days of meal plan without error', () => {
    const plan = generateMealPlan(mockRecipes)
    expect(plan.length).toBe(7)
    expect(plan[0]).toHaveProperty('breakfast')
    expect(plan[0]).toHaveProperty('lunch')
    expect(plan[0]).toHaveProperty('dinner')
  })

  it('favors quick recipes in quick mode', () => {
    const plan = generateMealPlan(mockRecipes, {}, { strategy: 'quick', maxDuration: 20 })
    expect(plan.length).toBe(7)
    // r2 (duration 60) should not appear in quick plan
    const allAssigned = plan.flatMap((day) => Object.values(day).flat())
    expect(allAssigned).not.toContain('r2')
  })

  it('favors fridge items in fridge mode', () => {
    const fridgeItems: FridgeItem[] = [
      {
        id: 'f1',
        userId: 'local',
        name: '西红柿',
        amount: 3,
        unit: '个',
        category: 'vegetable',
        purchaseDate: new Date().toISOString(),
        syncStatus: 'synced',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'f2',
        userId: 'local',
        name: '鸡蛋',
        amount: 6,
        unit: '个',
        category: 'dairy',
        purchaseDate: new Date().toISOString(),
        syncStatus: 'synced',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]
    const plan = generateMealPlan(mockRecipes, {}, { strategy: 'fridge', fridgeItems })
    expect(plan.length).toBe(7)
    const allAssigned = plan.flatMap((day) => Object.values(day).flat())
    expect(allAssigned).toContain('r1')
  })
})

