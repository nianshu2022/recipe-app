import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Link as LinkIcon, Camera, Loader2, AlertCircle, Check, ExternalLink } from 'lucide-react'
import { useRecipeStore } from '@/stores/recipeStore'
import { useUIStore } from '@/stores/uiStore'
import { fetchAndParseRecipe, parseRecipeFromText } from '@/utils/recipeImport'
import type { Ingredient, Step } from '@/types'

type ImportMode = 'url' | 'paste'

export function ImportRecipePage() {
  const navigate = useNavigate()
  const { addRecipe } = useRecipeStore()
  const showToast = useUIStore((s) => s.showToast)

  const [mode, setMode] = useState<ImportMode>('url')
  const [url, setUrl] = useState('')
  const [pastedText, setPastedText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [recipeName, setRecipeName] = useState('')
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [steps, setSteps] = useState<Step[]>([])
  const [showResult, setShowResult] = useState(false)

  const handleUrlImport = async () => {
    if (!url.trim()) {
      setError('请输入菜谱链接')
      return
    }
    setLoading(true)
    setError('')
    try {
      const recipe = await fetchAndParseRecipe(url)
      setRecipeName(recipe.name)
      setIngredients(recipe.ingredients)
      setSteps(recipe.steps)
      setShowResult(true)
      showToast('解析成功，请检查并保存', 'success')
    } catch (err) {
      setError(err instanceof Error ? err.message : '解析失败，请检查链接是否正确')
    } finally {
      setLoading(false)
    }
  }

  const handleTextImport = () => {
    if (!pastedText.trim()) {
      setError('请粘贴菜谱内容')
      return
    }
    setLoading(true)
    setError('')
    try {
      const recipe = parseRecipeFromText(pastedText)
      setRecipeName(recipe.name)
      setIngredients(recipe.ingredients)
      setSteps(recipe.steps)
      setShowResult(true)
      showToast('解析成功，请检查并保存', 'success')
    } catch {
      setError('解析失败，请检查内容格式')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!recipeName.trim()) {
      showToast('请输入菜名', 'error')
      return
    }
    const validIngredients = ingredients.filter(i => i.name.trim())
    const validSteps = steps.filter(s => s.description.trim())
    if (validIngredients.length === 0) {
      showToast('请至少添加一个食材', 'error')
      return
    }
    if (validSteps.length === 0) {
      showToast('请至少添加一个步骤', 'error')
      return
    }

    await addRecipe({
      userId: 'local',
      name: recipeName.trim(),
      category: 'hot-dish',
      tags: [],
      difficulty: 'easy',
      duration: 30,
      servings: 2,
      ingredients: validIngredients.map((ing, i) => ({ ...ing, id: `save-${i}` })),
      steps: validSteps.map((step, i) => ({ ...step, order: i + 1 })),
    })
    showToast('菜谱已保存', 'success')
    navigate('/', { replace: true })
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-40 -mx-5 -mt-6 flex items-center gap-3 bg-[var(--color-bg)]/95 px-5 py-3 backdrop-blur-sm">
        <Link
          to="/"
          replace
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-bg-card)] shadow-xs transition-all duration-200 hover:shadow-sm active:scale-95"
        >
          <ArrowLeft size={18} className="text-[var(--color-text-secondary)]" />
        </Link>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-text)]">
          导入菜谱
        </h1>
      </div>

      {!showResult ? (
        <div className="space-y-6">
          <div className="flex gap-2">
            <button
              onClick={() => { setMode('url'); setError('') }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium transition-all duration-200 ${
                mode === 'url'
                  ? 'bg-[var(--color-primary)] text-white shadow-md'
                  : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] shadow-xs hover:shadow-sm'
              }`}
            >
              <LinkIcon size={16} />
              链接导入
            </button>
            <button
              onClick={() => { setMode('paste'); setError('') }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium transition-all duration-200 ${
                mode === 'paste'
                  ? 'bg-[var(--color-primary)] text-white shadow-md'
                  : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] shadow-xs hover:shadow-sm'
              }`}
            >
              <Camera size={16} />
              文本粘贴
            </button>
          </div>

          {mode === 'url' ? (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
                  菜谱链接
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => { setUrl(e.target.value); setError('') }}
                    placeholder="粘贴菜谱网页链接..."
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 pr-12 text-sm text-[var(--color-text)] shadow-xs outline-none transition-all duration-200 placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-stone-300)] focus:shadow-sm focus:ring-2 focus:ring-[var(--color-border-subtle)]"
                  />
                  <ExternalLink size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                </div>
              </div>

              {error && (
                <p className="flex items-center gap-1.5 text-xs text-red-500">
                  <AlertCircle size={12} />
                  {error}
                </p>
              )}

              <button
                onClick={handleUrlImport}
                disabled={loading || !url.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] py-3 text-sm font-medium text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    解析中...
                  </>
                ) : (
                  <>
                    <LinkIcon size={16} />
                    开始解析
                  </>
                )}
              </button>

              <div className="rounded-2xl bg-[var(--color-bg-subtle)] p-4">
                <h3 className="mb-2 text-sm font-medium text-[var(--color-text)]">支持的网站</h3>
                <ul className="space-y-1 text-xs text-[var(--color-text-muted)]">
                  <li>下厨房 (xiachufang.com)</li>
                  <li>美食杰 (meishij.net)</li>
                  <li>豆果美食 (douguo.com)</li>
                  <li>香哈网 (xiangha.com)</li>
                  <li>以及其他通用格式的菜谱网站</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
                  菜谱内容
                </label>
                <textarea
                  value={pastedText}
                  onChange={(e) => { setPastedText(e.target.value); setError('') }}
                  placeholder="粘贴菜谱内容，格式如：&#10;&#10;红烧排骨&#10;&#10;用料：&#10;排骨 500克&#10;生抽 2勺&#10;老抽 1勺&#10;&#10;步骤：&#10;1. 排骨焯水&#10;2. 锅中放油，炒糖色&#10;3. 加入排骨翻炒&#10;4. 加水没过排骨，大火烧开&#10;5. 转小火炖40分钟"
                  rows={10}
                  className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 text-sm text-[var(--color-text)] shadow-xs outline-none transition-all duration-200 placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-stone-300)] focus:shadow-sm focus:ring-2 focus:ring-[var(--color-border-subtle)]"
                />
              </div>

              {error && (
                <p className="flex items-center gap-1.5 text-xs text-red-500">
                  <AlertCircle size={12} />
                  {error}
                </p>
              )}

              <button
                onClick={handleTextImport}
                disabled={loading || !pastedText.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] py-3 text-sm font-medium text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    解析中...
                  </>
                ) : (
                  <>
                    <LinkIcon size={16} />
                    开始解析
                  </>
                )}
              </button>

              <div className="rounded-2xl bg-[var(--color-bg-subtle)] p-4">
                <h3 className="mb-2 text-sm font-medium text-[var(--color-text)]">截图识别</h3>
                <p className="text-xs text-[var(--color-text-muted)]">
                  截图识别功能即将上线，敬请期待！
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl bg-[var(--color-bg-subtle)] p-4">
            <p className="text-sm text-[var(--color-text-secondary)]">
              以下是从链接解析出的内容，请检查并修改后保存。
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-text)]">菜名</label>
            <input
              type="text"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              placeholder="菜名"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 text-sm text-[var(--color-text)] shadow-xs outline-none transition-all duration-200 placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-stone-300)] focus:shadow-sm focus:ring-2 focus:ring-[var(--color-border-subtle)]"
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-[var(--color-text)]">食材 ({ingredients.length})</h3>
            {ingredients.map((ing, i) => (
              <div key={ing.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={ing.name}
                  onChange={(e) => {
                    const newIngs = [...ingredients]
                    newIngs[i] = { ...ing, name: e.target.value }
                    setIngredients(newIngs)
                  }}
                  placeholder="食材名"
                  className="min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3.5 py-2.5 text-sm text-[var(--color-text)] shadow-xs outline-none transition-all duration-200 placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-stone-300)] focus:ring-2 focus:ring-[var(--color-border-subtle)]"
                />
                <input
                  type="number"
                  value={ing.amount || ''}
                  onChange={(e) => {
                    const newIngs = [...ingredients]
                    newIngs[i] = { ...ing, amount: Number(e.target.value) }
                    setIngredients(newIngs)
                  }}
                  placeholder="用量"
                  className="w-16 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-2 py-2.5 text-sm text-[var(--color-text)] shadow-xs outline-none transition-all duration-200 placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-stone-300)] focus:ring-2 focus:ring-[var(--color-border-subtle)]"
                />
                <input
                  type="text"
                  value={ing.unit}
                  onChange={(e) => {
                    const newIngs = [...ingredients]
                    newIngs[i] = { ...ing, unit: e.target.value }
                    setIngredients(newIngs)
                  }}
                  placeholder="单位"
                  className="w-14 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-2 py-2.5 text-sm text-[var(--color-text)] shadow-xs outline-none transition-all duration-200 placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-stone-300)] focus:ring-2 focus:ring-[var(--color-border-subtle)]"
                />
                <button
                  onClick={() => setIngredients(ingredients.filter((_, j) => j !== i))}
                  className="shrink-0 rounded-lg p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={() => setIngredients([...ingredients, { id: `new-${Date.now()}`, name: '', amount: 0, unit: '', type: 'main', scalable: true }])}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-[var(--color-border)] py-2.5 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-stone-300)] hover:text-[var(--color-text-secondary)]"
            >
              添加食材
            </button>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-[var(--color-text)]">步骤 ({steps.length})</h3>
            {steps.map((step, i) => (
              <div key={i} className="rounded-2xl bg-[var(--color-bg-card)] p-4 shadow-xs">
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-text)] text-xs font-semibold text-[var(--color-bg)]">
                    {step.order}
                  </span>
                  <button
                    onClick={() => setSteps(steps.filter((_, j) => j !== i).map((s, j) => ({ ...s, order: j + 1 })))}
                    className="rounded-lg p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
                <textarea
                  value={step.description}
                  onChange={(e) => {
                    const newSteps = [...steps]
                    newSteps[i] = { ...step, description: e.target.value }
                    setSteps(newSteps)
                  }}
                  placeholder="描述这一步..."
                  rows={2}
                  className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-none transition-all duration-200 placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-stone-300)] focus:bg-[var(--color-bg-card)] focus:ring-2 focus:ring-[var(--color-border-subtle)]"
                />
              </div>
            ))}
            <button
              onClick={() => setSteps([...steps, { order: steps.length + 1, description: '' }])}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-[var(--color-border)] py-2.5 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-stone-300)] hover:text-[var(--color-text-secondary)]"
            >
              添加步骤
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowResult(false)}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--color-bg-card)] py-3 text-sm font-medium text-[var(--color-text-secondary)] shadow-xs transition-all duration-200 hover:shadow-sm active:scale-[0.98]"
            >
              重新解析
            </button>
            <button
              onClick={handleSave}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] py-3 text-sm font-medium text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
            >
              <Check size={16} />
              保存菜谱
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
