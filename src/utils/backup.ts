import { db } from '@/db'
import type { Recipe, Collection, Menu, MealPlan, ShoppingList, CookingRecord, FridgeItem, MealPlanTemplate } from '@/types'

interface BackupData {
  version: 1
  exportedAt: string
  recipes: Recipe[]
  collections: Collection[]
  menus: Menu[]
  mealPlans: MealPlan[]
  mealPlanTemplates?: MealPlanTemplate[]
  shoppingLists: ShoppingList[]
  cookingRecords: CookingRecord[]
  fridgeItems?: FridgeItem[]
}

export async function exportData(): Promise<string> {
  const data: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    recipes: await db.getAllRecipes(),
    collections: await db.getAllCollections(),
    menus: await db.getAllMenus(),
    mealPlans: await db.getAllMealPlans(),
    mealPlanTemplates: await db.getAllMealPlanTemplates(),
    shoppingLists: await db.getAllShoppingLists(),
    cookingRecords: await db.getAllCookingRecords(),
    fridgeItems: await db.getAllFridgeItems(),
  }
  return JSON.stringify(data, null, 2)
}

export function downloadBackup(json: string) {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `知味备份_${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const CATEGORY_NAMES: Record<string, string> = {
  'hot-dish': '热菜',
  'cold-dish': '凉菜',
  'soup': '汤羹',
  'staple': '主食',
  'dessert': '甜品',
  'drink': '饮品',
}

const DIFFICULTY_NAMES: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
}

export async function exportCookbookAsMarkdown(): Promise<string> {
  const recipes = await db.getAllRecipes()
  if (recipes.length === 0) {
    return '# 📖 知味 · 私人美食菜谱书\n\n暂无已保存的菜谱。'
  }

  const dateStr = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const lines: string[] = [
    `# 📖 知味 · 私人美食菜谱书`,
    `> 导出日期：${dateStr} · 菜谱总数：${recipes.length} 道`,
    ``,
    `## 📑 目录`,
    ...recipes.map((r, i) => `${i + 1}. [${r.name}](#${r.name.toLowerCase().replace(/\s+/g, '-')}) · *${CATEGORY_NAMES[r.category] || r.category}*`),
    ``,
    `---`,
    ``,
  ]

  for (const r of recipes) {
    lines.push(`## ${r.name}`)
    lines.push(`- **分类**：${CATEGORY_NAMES[r.category] || r.category}`)
    lines.push(`- **难度**：${DIFFICULTY_NAMES[r.difficulty] || r.difficulty}`)
    lines.push(`- **耗时**：${r.duration} 分钟`)
    lines.push(`- **分量**：${r.servings} 人份`)
    if (r.tags && r.tags.length > 0) {
      lines.push(`- **标签**：${r.tags.map((t: string) => `#${t}`).join(' ')}`)
    }
    if (r.description) {
      lines.push(`\n> ${r.description}`)
    }

    lines.push(`\n### 🥦 食材清单`)
    for (const ing of r.ingredients) {
      const amountStr = ing.amount > 0 ? ` ${ing.amount}${ing.unit || ''}` : ''
      lines.push(`- [ ] **${ing.name}**${amountStr}`)
    }

    lines.push(`\n### 🍳 烹饪步骤`)
    for (const step of r.steps) {
      const timerStr = step.timer ? ` ⏱️ *(${step.timer}分钟)*` : ''
      lines.push(`${step.order}. ${step.description}${timerStr}`)
      if (step.tip) {
        lines.push(`   > 💡 小贴士：${step.tip}`)
      }
    }

    lines.push(`\n---\n`)
  }

  lines.push(`\n*由「知味」私人美食管家自动生成*\n`)
  return lines.join('\n')
}

export function downloadCookbook(markdown: string) {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `知味美食菜谱书_${new Date().toISOString().slice(0, 10)}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function isValidRecord(record: unknown): record is Record<string, unknown> {
  return typeof record === 'object' && record !== null && !Array.isArray(record)
}

function sanitizeRecord(record: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue
    sanitized[key] = value
  }
  return sanitized
}

function validateId(record: Record<string, unknown>): boolean {
  return typeof record.id === 'string' && record.id.length > 0
}

export async function importData(json: string): Promise<{ success: boolean; message: string }> {
  try {
    const data = JSON.parse(json) as BackupData

    if (data.version !== 1 || !Array.isArray(data.recipes)) {
      return { success: false, message: '无效的备份文件' }
    }

    let count = 0
    let totalImported = 0

    for (const recipe of data.recipes) {
      if (!isValidRecord(recipe) || !validateId(recipe)) continue
      await db.putRecipe(sanitizeRecord(recipe) as unknown as Recipe)
      count++
      totalImported++
    }
    for (const collection of data.collections ?? []) {
      if (!isValidRecord(collection) || !validateId(collection)) continue
      await db.putCollection(sanitizeRecord(collection) as unknown as Collection)
      totalImported++
    }
    for (const menu of data.menus ?? []) {
      if (!isValidRecord(menu) || !validateId(menu)) continue
      await db.putMenu(sanitizeRecord(menu) as unknown as Menu)
      totalImported++
    }
    for (const plan of data.mealPlans ?? []) {
      if (!isValidRecord(plan) || !validateId(plan)) continue
      await db.putMealPlan(sanitizeRecord(plan) as unknown as MealPlan)
      totalImported++
    }
    for (const list of data.shoppingLists ?? []) {
      if (!isValidRecord(list) || !validateId(list)) continue
      await db.putShoppingList(sanitizeRecord(list) as unknown as ShoppingList)
      totalImported++
    }
    for (const record of data.cookingRecords ?? []) {
      if (!isValidRecord(record) || !validateId(record)) continue
      await db.putCookingRecord(sanitizeRecord(record) as unknown as CookingRecord)
      totalImported++
    }
    for (const template of data.mealPlanTemplates ?? []) {
      if (!isValidRecord(template) || !validateId(template)) continue
      await db.putMealPlanTemplate(sanitizeRecord(template) as unknown as MealPlanTemplate)
      totalImported++
    }
    for (const item of data.fridgeItems ?? []) {
      if (!isValidRecord(item) || !validateId(item)) continue
      await db.putFridgeItem(sanitizeRecord(item) as unknown as FridgeItem)
      totalImported++
    }

    return { success: true, message: `成功导入 ${totalImported} 条数据（${count} 道菜谱）` }
  } catch (e) {
    return { success: false, message: `导入失败: ${e instanceof Error ? e.message : '未知错误'}` }
  }
}
