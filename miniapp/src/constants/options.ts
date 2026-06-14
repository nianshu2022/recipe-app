import type { IconName } from '@/components/Icon'

export const CATEGORY_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'cold-dish', label: '凉菜' },
  { value: 'hot-dish', label: '热菜' },
  { value: 'soup', label: '汤羹' },
  { value: 'staple', label: '主食' },
  { value: 'dessert', label: '甜品' },
  { value: 'drink', label: '饮品' },
] as const

export const CATEGORY_ICONS: Record<string, IconName> = {
  'cold-dish': 'leaf',
  'hot-dish': 'flame',
  'soup': 'soup',
  'staple': 'wheat',
  'dessert': 'iceCreamCone',
  'drink': 'cupSoda',
}

export const DIFFICULTY_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'easy', label: '简单' },
  { value: 'medium', label: '中等' },
  { value: 'hard', label: '困难' },
] as const

export const SLOT_ICONS = {
  breakfast: 'sun',
  lunch: 'flame',
  dinner: 'moon',
  snack: 'iceCreamCone',
} as const

export const SLOT_COLORS = {
  breakfast: { bg: '#fffbeb', text: '#d97706' },
  lunch: { bg: '#ecfdf5', text: '#059669' },
  dinner: { bg: '#eff6ff', text: '#2563eb' },
  snack: { bg: '#faf5ff', text: '#9333ea' },
} as const
