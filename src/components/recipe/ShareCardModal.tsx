import { useState } from 'react'
import { X, Download, Copy, Share2, Loader2, Sparkles, Check } from 'lucide-react'
import type { Recipe } from '@/types'
import {
  exportRecipeAsImage,
  generateShareCopyText,
  shareRecipe,
  type PosterTheme,
  type PosterMode,
} from '@/utils/share'
import { useUIStore } from '@/stores/uiStore'
import { formatAmount } from '@/utils/scaling'
import { estimateNutrition } from '@/utils/nutrition'

interface ShareCardModalProps {
  recipe: Recipe
  isOpen: boolean
  onClose: () => void
}

export function ShareCardModal({ recipe, isOpen, onClose }: ShareCardModalProps) {
  const showToast = useUIStore((s) => s.showToast)
  const [theme, setTheme] = useState<PosterTheme>('warm')
  const [mode, setMode] = useState<PosterMode>('full')
  const [exporting, setExporting] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const nutrition = estimateNutrition(recipe.ingredients)

  const handleDownloadImage = async () => {
    setExporting(true)
    try {
      await exportRecipeAsImage(recipe, { theme, mode })
      showToast('🎉 高清海报已保存到您的相册/下载目录', 'success')
    } catch {
      showToast('生成海报失败，请重试', 'error')
    } finally {
      setExporting(false)
    }
  }

  const handleCopyText = async () => {
    const text = generateShareCopyText(recipe)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      showToast('📋 菜谱文案已复制到剪贴板', 'success')
      setTimeout(() => setCopied(false), 2500)
    } catch {
      showToast('复制失败，请手动选择复制', 'error')
    }
  }

  const handleNativeShare = async () => {
    const shared = await shareRecipe(recipe)
    if (!shared) {
      handleCopyText()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-[var(--color-bg)] border border-[var(--color-border)] shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-5 py-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-amber-500" />
            <h2 className="font-display text-base font-bold text-[var(--color-text)]">
              生成精美分享卡片
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Mode Switcher */}
          <div className="flex gap-2 rounded-2xl bg-[var(--color-bg-subtle)] p-1">
            <button
              onClick={() => setMode('full')}
              className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-all ${
                mode === 'full'
                  ? 'bg-[var(--color-bg-card)] text-[var(--color-text)] shadow-xs'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              📜 完整食谱长图
            </button>
            <button
              onClick={() => setMode('checkin')}
              className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-all ${
                mode === 'checkin'
                  ? 'bg-[var(--color-bg-card)] text-[var(--color-text)] shadow-xs'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              🏅 今日下厨打卡卡
            </button>
          </div>

          {/* Theme Selector */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-[var(--color-text-muted)]">海报主题：</span>
            <div className="flex gap-2">
              <button
                onClick={() => setTheme('warm')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                  theme === 'warm'
                    ? 'bg-amber-100 text-amber-900 ring-2 ring-amber-500/50 dark:bg-amber-950/40 dark:text-amber-300'
                    : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] border border-[var(--color-border)]'
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-[#E06D3B]" />
                原木自然
              </button>
              <button
                onClick={() => setTheme('sunset')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                  theme === 'sunset'
                    ? 'bg-rose-100 text-rose-900 ring-2 ring-rose-500/50 dark:bg-rose-950/40 dark:text-rose-300'
                    : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] border border-[var(--color-border)]'
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-[#F25C54]" />
                暖阳落日
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                  theme === 'dark'
                    ? 'bg-zinc-800 text-zinc-100 ring-2 ring-zinc-500 dark:bg-zinc-800 dark:text-zinc-100'
                    : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] border border-[var(--color-border)]'
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-[#F39C12]" />
                极夜黑金
              </button>
            </div>
          </div>

          {/* Interactive Preview Container */}
          <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] shadow-xs">
            <div
              className={`p-5 transition-colors ${
                theme === 'warm'
                  ? 'bg-[#FBF9F5] text-[#2D2825]'
                  : theme === 'sunset'
                    ? 'bg-[#FFF8F3] text-[#33221C]'
                    : 'bg-[#181615] text-[#F7F5F2]'
              }`}
            >
              {mode === 'checkin' ? (
                /* 打卡卡片预览 */
                <div
                  className={`rounded-2xl p-4 shadow-sm border ${
                    theme === 'dark'
                      ? 'bg-[#23201D] border-[#3D3731]'
                      : 'bg-white border-[#EFE9E0]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold tracking-wider text-amber-500 uppercase">
                        TODAY'S KITCHEN
                      </span>
                      <h3 className="text-lg font-bold mt-0.5">{recipe.name}</h3>
                    </div>
                    <div className="rounded-lg border-2 border-dashed border-amber-500/60 px-2 py-1 text-center -rotate-3">
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block">
                        打卡认证
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                      ⏱️ {recipe.duration}分钟
                    </span>
                    <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                      🔥 {nutrition.calories} kcal
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {recipe.ingredients.slice(0, 6).map((ing) => (
                      <span
                        key={ing.id || ing.name}
                        className={`rounded-md px-2 py-0.5 text-[11px] border ${
                          theme === 'dark'
                            ? 'bg-[#181615] border-[#3D3731] text-zinc-300'
                            : 'bg-stone-50 border-stone-200 text-stone-700'
                        }`}
                      >
                        {ing.name} {formatAmount(ing.amount, ing.unit)}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                /* 全量长图预览 */
                <div
                  className={`rounded-2xl p-4 shadow-sm border space-y-4 ${
                    theme === 'dark'
                      ? 'bg-[#23201D] border-[#3D3731]'
                      : 'bg-white border-[#EFE9E0]'
                  }`}
                >
                  <div className="text-center pb-3 border-b border-inherit">
                    <span className="text-[10px] font-bold tracking-widest text-amber-500 uppercase">
                      ✦ 知味精选食谱 ✦
                    </span>
                    <h3 className="text-xl font-bold mt-1">{recipe.name}</h3>
                    <div className="mt-2 flex justify-center gap-2 text-xs">
                      <span>⏱️ {recipe.duration}分钟</span>
                      <span>·</span>
                      <span>👥 {recipe.servings}人份</span>
                      <span>·</span>
                      <span>🔥 {nutrition.calories}kcal</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold mb-2 flex items-center gap-1.5">
                      <span className="h-3 w-1 bg-amber-500 rounded-xs" />
                      食材准备 ({recipe.ingredients.length})
                    </h4>
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      {recipe.ingredients.slice(0, 6).map((ing) => (
                        <div
                          key={ing.id || ing.name}
                          className={`flex justify-between p-1.5 rounded-lg border ${
                            theme === 'dark'
                              ? 'bg-[#181615] border-[#3D3731]'
                              : 'bg-[#FBF9F5] border-[#EFE9E0]'
                          }`}
                        >
                          <span className="truncate">{ing.name}</span>
                          <span className="font-semibold text-amber-500">
                            {formatAmount(ing.amount, ing.unit)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold mb-2 flex items-center gap-1.5">
                      <span className="h-3 w-1 bg-amber-500 rounded-xs" />
                      制作步骤 ({recipe.steps.length})
                    </h4>
                    <div className="space-y-1.5 text-xs">
                      {recipe.steps.slice(0, 2).map((step, idx) => (
                        <div key={idx} className="flex gap-2 items-start">
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                            {idx + 1}
                          </span>
                          <p className="line-clamp-2 opacity-90">{step.description}</p>
                        </div>
                      ))}
                      {recipe.steps.length > 2 && (
                        <p className="text-[10px] text-center opacity-60">
                          ... 余下 {recipe.steps.length - 2} 个步骤将在导出海报中完整展示 ...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)]/50 p-4">
          <div className="flex gap-2">
            <button
              onClick={handleCopyText}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] py-3 text-xs font-medium text-[var(--color-text)] shadow-2xs hover:bg-[var(--color-bg)] active:scale-95"
            >
              {copied ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
              {copied ? '已复制' : '复制文案'}
            </button>
            <button
              onClick={handleNativeShare}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] py-3 text-xs font-medium text-[var(--color-text)] shadow-2xs hover:bg-[var(--color-bg)] active:scale-95"
            >
              <Share2 size={15} />
              发送给好友
            </button>
            <button
              onClick={handleDownloadImage}
              disabled={exporting}
              className="flex-[1.5] flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-xs font-bold text-white shadow-md hover:shadow-lg hover:brightness-105 active:scale-95 disabled:opacity-50"
            >
              {exporting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  生成海报中...
                </>
              ) : (
                <>
                  <Download size={16} />
                  保存高清海报
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
