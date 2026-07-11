import html2canvas from 'html2canvas-pro'
import type { Recipe } from '@/types'
import { formatAmount } from './scaling'
import { estimateNutrition, getCalorieLevel } from './nutrition'

const difficultyLabels = { easy: '简单', medium: '中等', hard: '困难' }

function escapeHtml(str: string): string {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

export async function shareRecipe(recipe: Recipe): Promise<boolean> {
  const nutrition = estimateNutrition(recipe.ingredients)
  const calorieLevel = getCalorieLevel(nutrition.calories)
  const shareText = `${recipe.name}\n${difficultyLabels[recipe.difficulty]} · ${recipe.duration}分钟 · ${recipe.servings}人份\n热量：${nutrition.calories}kcal (${calorieLevel.label})\n\n来自「知味」`

  if (navigator.share) {
    try {
      await navigator.share({
        title: recipe.name,
        text: shareText,
        url: window.location.origin + `/recipe/${recipe.id}`,
      })
      return true
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        console.error('Share failed:', e)
      }
      return false
    }
  }
  return false
}

export async function copyRecipeLink(recipe: Recipe): Promise<boolean> {
  const url = window.location.origin + `/recipe/${recipe.id}`
  try {
    await navigator.clipboard.writeText(url)
    return true
  } catch {
    return false
  }
}

export async function exportRecipeAsImage(recipe: Recipe): Promise<void> {
  const container = document.createElement('div')
  container.style.cssText = `
    position: fixed; left: -9999px; top: 0;
    width: 375px; padding: 32px;
    font-family: 'Noto Sans SC', -apple-system, sans-serif;
    background: #faf9f7; color: #252220;
  `

  container.innerHTML = `
    <div style="margin-bottom: 24px;">
      <h1 style="font-size: 28px; font-weight: 700; margin: 0 0 8px; color: #252220;">
        ${escapeHtml(recipe.name)}
      </h1>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <span style="background: #f5f3ef; padding: 4px 12px; border-radius: 999px; font-size: 12px; color: #6b6355;">
          ${difficultyLabels[recipe.difficulty]}
        </span>
        <span style="background: #f5f3ef; padding: 4px 12px; border-radius: 999px; font-size: 12px; color: #6b6355;">
          ${recipe.duration}分钟
        </span>
        <span style="background: #f5f3ef; padding: 4px 12px; border-radius: 999px; font-size: 12px; color: #6b6355;">
          ${recipe.servings}人份
        </span>
      </div>
    </div>

    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 16px; font-weight: 600; margin: 0 0 12px; color: #252220;">用料</h2>
      <div style="background: white; border-radius: 12px; overflow: hidden;">
        ${recipe.ingredients
          .map(
            (ing, i) => `
          <div style="display: flex; justify-content: space-between; padding: 10px 16px; ${
            i > 0 ? 'border-top: 1px solid #f5f3ef;' : ''
          }">
            <span style="font-size: 14px; color: #524c40;">${escapeHtml(ing.name)}</span>
            <span style="font-size: 14px; color: #a8a08e;">${escapeHtml(formatAmount(ing.amount, ing.unit))}</span>
          </div>
        `,
          )
          .join('')}
      </div>
    </div>

    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 16px; font-weight: 600; margin: 0 0 12px; color: #252220;">步骤</h2>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        ${recipe.steps
          .map(
            (step) => `
          <div style="background: white; border-radius: 12px; padding: 16px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 999px; background: #252220; color: white; font-size: 12px; font-weight: 600;">
                ${step.order}
              </span>
            </div>
            <p style="font-size: 14px; line-height: 1.6; color: #6b6355; margin: 0;">${escapeHtml(step.description)}</p>
          </div>
        `,
          )
          .join('')}
      </div>
    </div>

    <div style="text-align: center; padding-top: 16px; border-top: 1px solid #e8e4de;">
      <p style="font-size: 11px; color: #a8a08e; margin: 0;">知味 · 知味者，方知生活</p>
    </div>
  `

  document.body.appendChild(container)

  try {
    const canvas = await html2canvas(container, {
      backgroundColor: '#faf9f7',
      scale: 2,
    })

    const link = document.createElement('a')
    const safeName = recipe.name.replace(/[\\/:*?"<>|]/g, '_')
    link.download = `${safeName}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  } finally {
    document.body.removeChild(container)
  }
}
