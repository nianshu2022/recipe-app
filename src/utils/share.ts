import html2canvas from 'html2canvas-pro'
import type { Recipe } from '@/types'
import { formatAmount } from './scaling'

const difficultyLabels = { easy: '简单', medium: '中等', hard: '困难' }

export async function exportRecipeAsImage(recipe: Recipe): Promise<void> {
  // Create a temporary div with the share card
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
        ${recipe.name}
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
            <span style="font-size: 14px; color: #524c40;">${ing.name}</span>
            <span style="font-size: 14px; color: #a8a08e;">${formatAmount(ing.amount, ing.unit)}</span>
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
            <p style="font-size: 14px; line-height: 1.6; color: #6b6355; margin: 0;">${step.description}</p>
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
    link.download = `${recipe.name}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  } finally {
    document.body.removeChild(container)
  }
}
