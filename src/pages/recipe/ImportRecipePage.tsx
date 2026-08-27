import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Link as LinkIcon,
  FileText,
  Loader2,
  AlertCircle,
  Check,
  ExternalLink,
  Sparkles,
  Clock,
  Flame,
  Tag,
  Plus,
  Trash2,
} from 'lucide-react'
import { useRecipeStore } from '@/stores/recipeStore'
import { useUIStore } from '@/stores/uiStore'
import {
  fetchAndParseRecipe,
  parseRecipeFromText,
  validateRecipeForImport,
  type ParsedRecipe,
} from '@/utils/recipeImport'
import type { Ingredient, Step, Category, Difficulty } from '@/types'

type ImportMode = 'paste' | 'url'

const SAMPLE_TEMPLATES = [
  {
    name: '小红书文案示例',
    icon: '📕',
    text: `今日份神仙美味！【番茄土豆炖牛腩】🍅🐮
巨下饭巨好吃，全家人都赞不绝口～

🌿【食材准备】
牛腩 500g
土豆 2个
西红柿 2个
生姜 3片
生抽 2勺
老抽 1勺
盐 适量

👩‍🍳【制作步骤】
1. 牛腩切块冷水下锅焯水5分钟捞出沥干
2. 热锅凉油爆香生姜，下牛腩翻炒均匀
3. 倒入番茄丁炒出红汁，加入开水小火焖40分钟
4. 放入土豆块再煮15分钟，加盐调味即可出锅

#家常菜 #快手菜 #减脂餐 #周末下厨`,
  },
  {
    name: '极简清单示例',
    icon: '🍗',
    text: `可乐鸡翅

食材：鸡翅中8个、可乐1罐、生抽2勺、老抽半勺、料酒1勺、生姜3片

做法：
1. 鸡翅两面划两刀，冷水下锅加料酒焯水3分钟捞出
2. 锅中微油，鸡翅两面煎至金黄微焦
3. 倒入一罐可乐，加入生抽、老抽、姜片
4. 大火烧开后转中小火焖煮15分钟
5. 最后大火收汁至浓稠裹匀即可`,
  },
]

const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: 'hot-dish', label: '热菜' },
  { value: 'cold-dish', label: '凉菜' },
  { value: 'soup', label: '汤羹' },
  { value: 'staple', label: '主食' },
  { value: 'dessert', label: '甜品' },
  { value: 'drink', label: '饮品' },
]

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: '简单' },
  { value: 'medium', label: '中等' },
  { value: 'hard', label: '困难' },
]

export function ImportRecipePage() {
  const navigate = useNavigate()
  const { addRecipe } = useRecipeStore()
  const showToast = useUIStore((s) => s.showToast)

  const [mode, setMode] = useState<ImportMode>('paste')
  const [url, setUrl] = useState('')
  const [pastedText, setPastedText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 解析结果状态
  const [recipeName, setRecipeName] = useState('')
  const [category, setCategory] = useState<Category>('hot-dish')
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [duration, setDuration] = useState(25)
  const [servings, setServings] = useState(2)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [steps, setSteps] = useState<Step[]>([])
  const [showResult, setShowResult] = useState(false)

  const applyParsedData = (recipe: ParsedRecipe) => {
    setRecipeName(recipe.name)
    setCategory(recipe.category)
    setDifficulty(recipe.difficulty)
    setDuration(recipe.duration)
    setServings(recipe.servings || 2)
    setTags(recipe.tags || [])
    setIngredients(recipe.ingredients)
    setSteps(recipe.steps)
    setShowResult(true)
    showToast('✨ 识别成功，请确认或微调后保存', 'success')
  }

  const handleUrlImport = async () => {
    if (!url.trim()) {
      setError('请输入菜谱链接')
      return
    }
    setLoading(true)
    setError('')
    try {
      const recipe = await fetchAndParseRecipe(url)
      applyParsedData(recipe)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : '网页解析受同源限制或格式不支持，建议复制网页文本粘贴导入'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleTextImport = () => {
    if (!pastedText.trim()) {
      setError('请先粘贴菜谱文字内容')
      return
    }
    setLoading(true)
    setError('')
    try {
      const recipe = parseRecipeFromText(pastedText)
      const warnings = validateRecipeForImport(recipe)
      if (warnings.length > 0 && recipe.ingredients.length === 0 && recipe.steps.length === 0) {
        setError(warnings.join('；'))
        return
      }
      applyParsedData(recipe)
    } catch {
      setError('解析失败，请检查文本格式')
    } finally {
      setLoading(false)
    }
  }

  const handleAddTag = () => {
    if (!tagInput.trim()) return
    const newTag = tagInput.trim().replace(/^#/, '')
    if (!tags.includes(newTag)) {
      setTags([...tags, newTag])
    }
    setTagInput('')
  }

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((item) => item !== t))
  }

  const handleSave = async () => {
    if (!recipeName.trim()) {
      showToast('请输入菜名', 'error')
      return
    }
    const validIngredients = ingredients.filter((i) => i.name.trim())
    const validSteps = steps.filter((s) => s.description.trim())

    if (validIngredients.length === 0) {
      showToast('请至少保留一个有效食材', 'error')
      return
    }
    if (validSteps.length === 0) {
      showToast('请至少保留一个烹饪步骤', 'error')
      return
    }

    await addRecipe({
      userId: 'local',
      name: recipeName.trim(),
      category,
      tags,
      difficulty,
      duration: duration || 20,
      servings: servings || 2,
      ingredients: validIngredients.map((ing, i) => ({
        ...ing,
        id: `ing-${Date.now()}-${i}`,
        type: ing.type || 'main',
        scalable: ing.scalable !== false,
      })),
      steps: validSteps.map((step, i) => ({
        order: i + 1,
        description: step.description.trim(),
        timer: step.timer,
      })),
    })

    showToast('🎉 菜谱已成功录入你的个人美食库', 'success')
    navigate('/', { replace: true })
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="sticky top-0 z-40 -mx-5 -mt-6 flex items-center gap-3 bg-[var(--color-bg)]/95 px-5 py-3.5 backdrop-blur-md">
        <Link
          to="/"
          replace
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-bg-card)] shadow-xs transition-all duration-200 hover:shadow-sm active:scale-95"
        >
          <ArrowLeft size={18} className="text-[var(--color-text-secondary)]" />
        </Link>
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-[var(--color-text)] flex items-center gap-2">
            <Sparkles size={20} className="text-amber-500" />
            智能导入菜谱
          </h1>
          <p className="text-xs text-[var(--color-text-muted)]">
            一键智能识别食材用量、步骤与烹饪时长
          </p>
        </div>
      </div>

      {!showResult ? (
        <div className="space-y-5">
          {/* Mode Switcher */}
          <div className="flex gap-2 rounded-2xl bg-[var(--color-bg-subtle)] p-1">
            <button
              onClick={() => {
                setMode('paste')
                setError('')
              }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all duration-200 ${
                mode === 'paste'
                  ? 'bg-[var(--color-bg-card)] text-[var(--color-text)] shadow-xs'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              <FileText size={16} />
              文本/文案粘贴
            </button>
            <button
              onClick={() => {
                setMode('url')
                setError('')
              }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all duration-200 ${
                mode === 'url'
                  ? 'bg-[var(--color-bg-card)] text-[var(--color-text)] shadow-xs'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              <LinkIcon size={16} />
              链接网页解析
            </button>
          </div>

          {mode === 'paste' ? (
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-[var(--color-text)]">
                    菜谱内容（支持小红书、备忘录、微信推文）
                  </label>
                  {pastedText && (
                    <button
                      onClick={() => setPastedText('')}
                      className="text-xs text-[var(--color-text-muted)] hover:text-red-500"
                    >
                      清空
                    </button>
                  )}
                </div>
                <textarea
                  value={pastedText}
                  onChange={(e) => {
                    setPastedText(e.target.value)
                    setError('')
                  }}
                  placeholder="在此粘贴任意格式的菜谱文本...&#10;&#10;例如从小红书/下厨房复制的文案，系统将自动清洗提炼食材、调料、步骤与计时。"
                  rows={9}
                  className="w-full resize-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 text-sm text-[var(--color-text)] shadow-xs outline-none transition-all duration-200 placeholder:text-[var(--color-text-muted)] focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10"
                />
              </div>

              {/* Sample Templates */}
              <div>
                <span className="text-xs font-medium text-[var(--color-text-muted)]">
                  💡 没有准备好的内容？点击体验示例：
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SAMPLE_TEMPLATES.map((sample) => (
                    <button
                      key={sample.name}
                      onClick={() => {
                        setPastedText(sample.text)
                        setError('')
                      }}
                      className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)] shadow-2xs transition-all hover:border-amber-500/40 hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text)] active:scale-95"
                    >
                      <span>{sample.icon}</span>
                      <span>{sample.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-600 dark:bg-red-950/30 dark:text-red-400">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleTextImport}
                disabled={loading || !pastedText.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-3.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:brightness-105 active:scale-[0.98] disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    正在智能提炼结构...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    一键智能解析
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
                  菜谱网址链接
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value)
                      setError('')
                    }}
                    placeholder="例如：https://www.xiachufang.com/recipe/..."
                    className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3.5 pr-12 text-sm text-[var(--color-text)] shadow-xs outline-none transition-all duration-200 placeholder:text-[var(--color-text-muted)] focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10"
                  />
                  <ExternalLink
                    size={16}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-600 dark:bg-red-950/30 dark:text-red-400">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleUrlImport}
                disabled={loading || !url.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-3.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:brightness-105 active:scale-[0.98] disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    正在抓取与解析...
                  </>
                ) : (
                  <>
                    <LinkIcon size={18} />
                    开始提取网页菜谱
                  </>
                )}
              </button>

              <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-4 shadow-2xs">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                  解析小贴士
                </h3>
                <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">
                  部分自媒体或社区网页存在防盗链与 CORS
                  限制，如遇到网页抓取失败，建议直接在对应平台一键复制全文，切换到「文本/文案粘贴」进行秒级解析。
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 解析结果确认与编辑 */
        <div className="space-y-5">
          {/* Summary Banner */}
          <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-4 border border-amber-500/20">
            <div>
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                ✨ 智能提炼完成
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                识别到 {ingredients.length} 种食材 · {steps.length} 个步骤 · 预估 {duration} 分钟
              </p>
            </div>
            <button
              onClick={() => setShowResult(false)}
              className="rounded-xl bg-[var(--color-bg-card)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] shadow-xs hover:text-[var(--color-text)]"
            >
              重新粘贴
            </button>
          </div>

          {/* Basic Info */}
          <div className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 shadow-xs">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]">
                菜谱名称
              </label>
              <input
                type="text"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                placeholder="例如：番茄炖牛腩"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-base font-semibold text-[var(--color-text)] outline-none focus:border-amber-500"
              />
            </div>

            {/* Category & Difficulty */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">
                  分类
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs font-medium text-[var(--color-text)] outline-none"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">
                  难度
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs font-medium text-[var(--color-text)] outline-none"
                >
                  {DIFFICULTY_OPTIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Duration & Servings */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--color-text-muted)] flex items-center gap-1">
                  <Clock size={12} />
                  烹饪时长(分钟)
                </label>
                <input
                  type="number"
                  value={duration || ''}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs font-medium text-[var(--color-text)] outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--color-text-muted)] flex items-center gap-1">
                  <Flame size={12} />
                  基准人数
                </label>
                <input
                  type="number"
                  value={servings || ''}
                  onChange={(e) => setServings(Number(e.target.value))}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs font-medium text-[var(--color-text)] outline-none"
                />
              </div>
            </div>

            {/* Tags */}
            <div className="pt-1">
              <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)] flex items-center gap-1">
                <Tag size={12} />
                标签
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-bg-subtle)] px-2.5 py-1 text-xs text-[var(--color-text-secondary)]"
                  >
                    #{t}
                    <button
                      onClick={() => handleRemoveTag(t)}
                      className="text-[var(--color-text-muted)] hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                    placeholder="输入新标签..."
                    className="w-24 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-xs text-[var(--color-text)] outline-none"
                  />
                  <button
                    onClick={handleAddTag}
                    className="rounded-lg bg-[var(--color-bg-subtle)] p-1 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Ingredients Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--color-text)]">
                食材清单 ({ingredients.length})
              </h3>
              <button
                onClick={() =>
                  setIngredients([
                    ...ingredients,
                    {
                      id: `new-${Date.now()}`,
                      name: '',
                      amount: 0,
                      unit: '',
                      type: 'main',
                      scalable: true,
                    },
                  ])
                }
                className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400"
              >
                <Plus size={14} />
                添加食材
              </button>
            </div>

            <div className="space-y-2">
              {ingredients.map((ing, i) => (
                <div
                  key={ing.id || i}
                  className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-2.5 shadow-2xs"
                >
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) => {
                      const newIngs = [...ingredients]
                      newIngs[i] = { ...ing, name: e.target.value }
                      setIngredients(newIngs)
                    }}
                    placeholder="食材名"
                    className="min-w-0 flex-1 bg-transparent px-1 text-sm font-medium text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]"
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
                    className="w-16 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-center text-xs text-[var(--color-text)] outline-none"
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
                    className="w-14 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-center text-xs text-[var(--color-text)] outline-none"
                  />
                  <button
                    onClick={() => setIngredients(ingredients.filter((_, j) => j !== i))}
                    className="rounded-lg p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Steps Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--color-text)]">
                烹饪步骤 ({steps.length})
              </h3>
              <button
                onClick={() =>
                  setSteps([...steps, { order: steps.length + 1, description: '' }])
                }
                className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400"
              >
                <Plus size={14} />
                添加步骤
              </button>
            </div>

            <div className="space-y-2.5">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-3.5 shadow-2xs"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-text)] text-xs font-bold text-[var(--color-bg)]">
                      {i + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                        <Clock size={12} />
                        <input
                          type="number"
                          value={step.timer || ''}
                          onChange={(e) => {
                            const newSteps = [...steps]
                            newSteps[i] = {
                              ...step,
                              timer: e.target.value ? Number(e.target.value) : undefined,
                            }
                            setSteps(newSteps)
                          }}
                          placeholder="定时(分)"
                          className="w-16 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-1.5 py-0.5 text-center text-xs text-[var(--color-text)] outline-none"
                        />
                      </div>
                      <button
                        onClick={() =>
                          setSteps(
                            steps
                              .filter((_, j) => j !== i)
                              .map((s, j) => ({ ...s, order: j + 1 }))
                          )
                        }
                        className="rounded-lg p-1 text-[var(--color-text-muted)] hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={step.description}
                    onChange={(e) => {
                      const newSteps = [...steps]
                      newSteps[i] = { ...step, description: e.target.value }
                      setSteps(newSteps)
                    }}
                    placeholder="描述该步骤的具体操作..."
                    rows={2}
                    className="w-full resize-none rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg)] p-2.5 text-sm text-[var(--color-text)] outline-none transition-all placeholder:text-[var(--color-text-muted)] focus:border-amber-500/50"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Action Bar */}
          <div className="sticky bottom-4 z-30 flex gap-3 rounded-2xl bg-[var(--color-bg)]/80 p-2 backdrop-blur-md">
            <button
              onClick={() => setShowResult(false)}
              className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] py-3 text-sm font-medium text-[var(--color-text-secondary)] shadow-xs transition-all hover:bg-[var(--color-bg-subtle)] active:scale-[0.98]"
            >
              返回重新识别
            </button>
            <button
              onClick={handleSave}
              className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:brightness-105 active:scale-[0.98]"
            >
              <Check size={18} />
              保存到我的菜谱库
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

