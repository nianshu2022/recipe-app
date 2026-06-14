import { db } from '@/db'
import type { Recipe, Collection, Menu, MealPlan, ShoppingList, CookingRecord } from '@/types'

interface BackupData {
  version: 1
  exportedAt: string
  recipes: Recipe[]
  collections: Collection[]
  menus: Menu[]
  mealPlans: MealPlan[]
  shoppingLists: ShoppingList[]
  cookingRecords: CookingRecord[]
}

export async function exportData(): Promise<string> {
  const data: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    recipes: await db.getAllRecipes(),
    collections: await db.getAllCollections(),
    menus: await db.getAllMenus(),
    mealPlans: await db.getAllMealPlans(),
    shoppingLists: await db.getAllShoppingLists(),
    cookingRecords: await db.getAllCookingRecords(),
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

    return { success: true, message: `成功导入 ${totalImported} 条数据（${count} 道菜谱）` }
  } catch (e) {
    return { success: false, message: `导入失败: ${e instanceof Error ? e.message : '未知错误'}` }
  }
}
