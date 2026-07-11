import type { Recipe, FridgeItem, ShoppingItem } from '@/types'

interface IngredientRequirement {
  name: string
  amount: number
  unit: string
  category: string
}

function aggregateIngredients(recipes: Recipe[], servings: number): IngredientRequirement[] {
  const map = new Map<string, IngredientRequirement>()

  for (const recipe of recipes) {
    const scale = servings / recipe.servings
    for (const ing of recipe.ingredients) {
      const existing = map.get(ing.name)
      const scaledAmount = ing.amount * scale
      if (existing) {
        existing.amount += scaledAmount
      } else {
        map.set(ing.name, {
          name: ing.name,
          amount: scaledAmount,
          unit: ing.unit,
          category: guessCategory(ing.name),
        })
      }
    }
  }

  return Array.from(map.values())
}

function guessCategory(name: string): string {
  const categories: Record<string, string[]> = {
    '蔬菜': ['番茄', '土豆', '胡萝卜', '青椒', '洋葱', '大蒜', '生姜', '白菜', '黄瓜', '西兰花', '四季豆', '葱'],
    '肉类': ['猪肉', '牛肉', '鸡肉', '鸡翅', '排骨', '五花肉'],
    '海鲜': ['虾', '鱼', '螃蟹', '蛤蜊'],
    '蛋奶': ['鸡蛋', '牛奶', '豆腐', '皮蛋'],
    '调料': ['盐', '糖', '生抽', '老抽', '醋', '料酒', '蚝油', '豆瓣酱', '芝麻油', '花椒', '干辣椒'],
    '主食': ['米饭', '面条', '面粉'],
    '干货': ['紫菜', '木耳', '银耳', '红枣', '枸杞', '花生', '红豆', '乌梅', '山楂'],
  }

  for (const [cat, keywords] of Object.entries(categories)) {
    if (keywords.some((kw) => name.includes(kw))) {
      return cat
    }
  }
  return '其他'
}

export interface SmartShoppingResult {
  needToBuy: ShoppingItem[]
  alreadyHave: { name: string; amount: number; unit: string }[]
  expiringSoon: { name: string; daysLeft: number }[]
}

export function calculateSmartShopping(
  recipes: Recipe[],
  fridgeItems: FridgeItem[],
  servings: number,
): SmartShoppingResult {
  const required = aggregateIngredients(recipes, servings)
  const now = new Date()

  const fridgeMap = new Map<string, FridgeItem>()
  for (const item of fridgeItems) {
    const existing = fridgeMap.get(item.name)
    if (existing) {
      existing.amount += item.amount
    } else {
      fridgeMap.set(item.name, { ...item })
    }
  }

  const needToBuy: ShoppingItem[] = []
  const alreadyHave: { name: string; amount: number; unit: string }[] = []
  const expiringSoon: { name: string; daysLeft: number }[] = []

  for (const req of required) {
    const fridge = fridgeMap.get(req.name)
    if (!fridge || fridge.amount < req.amount) {
      const needed = fridge ? req.amount - fridge.amount : req.amount
      needToBuy.push({
        id: `smart-${req.name}`,
        name: req.name,
        amount: Math.round(needed * 10) / 10,
        unit: req.unit,
        category: req.category,
        checked: false,
      })
    } else {
      alreadyHave.push({
        name: req.name,
        amount: fridge.amount,
        unit: fridge.unit,
      })
    }

    if (fridge?.expiryDate) {
      const exp = new Date(fridge.expiryDate)
      const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (daysLeft <= 3 && daysLeft >= 0) {
        expiringSoon.push({ name: req.name, daysLeft })
      }
    }
  }

  return { needToBuy, alreadyHave, expiringSoon }
}
