import {
  ChefHat, Flame, Leaf, Soup, Wheat, IceCreamCone, CupSoda,
  type LucideIcon,
} from 'lucide-react'
import type { Category, Difficulty } from '@/types'

export const categoryIcons: Record<Category, LucideIcon> = {
  'cold-dish': Leaf,
  'hot-dish': Flame,
  'soup': Soup,
  'staple': Wheat,
  'dessert': IceCreamCone,
  'drink': CupSoda,
}

export const categoryLabels: Record<Category, string> = {
  'cold-dish': '凉菜',
  'hot-dish': '热菜',
  'soup': '汤羹',
  'staple': '主食',
  'dessert': '甜品',
  'drink': '饮品',
}

export const difficultyConfig: Record<Difficulty, { label: string; color: string }> = {
  easy: { label: '简单', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' },
  medium: { label: '中等', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' },
  hard: { label: '困难', color: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400' },
}

export const categoryOptions: { value: Category; label: string }[] = [
  { value: 'cold-dish', label: '凉菜' },
  { value: 'hot-dish', label: '热菜' },
  { value: 'soup', label: '汤羹' },
  { value: 'staple', label: '主食' },
  { value: 'dessert', label: '甜品' },
  { value: 'drink', label: '饮品' },
]

export const difficultyOptions: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: '简单' },
  { value: 'medium', label: '中等' },
  { value: 'hard', label: '困难' },
]
