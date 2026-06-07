import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, ImagePlus, X, Check, AlertCircle } from 'lucide-react'
import { useRecipeStore } from '@/stores/recipeStore'
import { useUIStore } from '@/stores/uiStore'
import { categoryOptions, difficultyOptions } from '@/constants/categories'
import type { Category, Difficulty, Ingredient, Step } from '@/types'
import { generateId } from '@/utils/id'
import { UNIT_OPTIONS } from '@/constants/units'

const inputCls =
  'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 text-sm text-[var(--color-text)] shadow-xs outline-none transition-all duration-200 placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-stone-300)] focus:shadow-sm focus:ring-2 focus:ring-[var(--color-border-subtle)]'

export function RecipeFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { recipes, addRecipe, updateRecipe, loadRecipes } = useRecipeStore()
  const showToast = useUIStore((s) => s.showToast)
  const isEditing = !!id

  const [name, setName] = useState('')
  const [category, setCategory] = useState<Category>('hot-dish')
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [duration, setDuration] = useState(30)
  const [servings, setServings] = useState(2)
  const [tags, setTags] = useState('')
  const [coverImage, setCoverImage] = useState<string | undefined>()
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: generateId(), name: '', amount: 0, unit: '', type: 'main', scalable: true },
  ])
  const [steps, setSteps] = useState<Step[]>([{ order: 1, description: '' }])
  const [errors, setErrors] = useState<{ name?: string; ingredients?: string; steps?: string }>({})

  useEffect(() => {
    if (isEditing) loadRecipes()
  }, [isEditing, loadRecipes])

  useEffect(() => {
    if (isEditing && recipes.length > 0) {
      const recipe = recipes.find(r => r.id === id)
      if (recipe) {
        setName(recipe.name)
        setCategory(recipe.category)
        setDifficulty(recipe.difficulty)
        setDuration(recipe.duration)
        setServings(recipe.servings)
        setTags(recipe.tags.join(', '))
        setCoverImage(recipe.coverImage)
        setIngredients(recipe.ingredients.length > 0 ? recipe.ingredients : [{ id: generateId(), name: '', amount: 0, unit: '', type: 'main', scalable: true }])
        setSteps(recipe.steps.length > 0 ? recipe.steps : [{ order: 1, description: '' }])
      }
    }
  }, [isEditing, id, recipes])

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      { id: generateId(), name: '', amount: 0, unit: '', type: 'main', scalable: true },
    ])
  }

  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter((i) => i.id !== id))
  }

  const updateIngredient = (
    id: string,
    field: keyof Ingredient,
    value: string | number | boolean,
  ) => {
    setIngredients(ingredients.map((i) => (i.id === id ? { ...i, [field]: value } : i)))
  }

  const addStep = () => {
    setSteps([...steps, { order: steps.length + 1, description: '' }])
  }

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 }))
    setSteps(newSteps)
  }

  const updateStep = (
    index: number,
    field: keyof Step,
    value: string | number | undefined,
  ) => {
    setSteps(steps.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) {
      showToast('图片大小不能超过 5MB', 'error')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setCoverImage(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    const newErrors: typeof errors = {}
    if (!name.trim()) newErrors.name = '请输入菜名'
    const validIngredients = ingredients.filter((i) => i.name.trim())
    const validSteps = steps.filter((s) => s.description.trim())
    if (validIngredients.length === 0) newErrors.ingredients = '请至少添加一个食材'
    if (validSteps.length === 0) newErrors.steps = '请至少添加一个步骤'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      showToast('请填写必填项', 'error')
      return
    }
    setErrors({})

    const recipeData = {
      name: name.trim(),
      category,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      difficulty,
      duration,
      servings,
      coverImage,
      ingredients: validIngredients,
      steps: validSteps,
    }

    if (isEditing) {
      await updateRecipe(id, recipeData)
      showToast('菜谱已更新', 'success')
    } else {
      await addRecipe({ userId: 'local', ...recipeData })
      showToast('菜谱已创建', 'success')
    }
    navigate('/', { replace: true })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="sticky top-0 z-40 -mx-5 -mt-6 flex items-center justify-between bg-[var(--color-bg)]/95 px-5 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link
            to={isEditing ? `/recipe/${id}` : '/'}
            replace
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-bg-card)] shadow-xs transition-all duration-200 hover:shadow-sm active:scale-95"
          >
            <ArrowLeft size={18} className="text-[var(--color-text-secondary)]" />
          </Link>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-text)]">
            {isEditing ? '编辑菜谱' : '新建菜谱'}
          </h1>
        </div>
        <button
          onClick={handleSubmit}
          className="flex h-9 items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 text-sm font-medium text-white shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
        >
          <Check size={16} strokeWidth={2.5} />
          {isEditing ? '更新' : '保存'}
        </button>
      </div>

      {/* Basic info */}
      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">菜名<span className="ml-0.5 text-red-500">*</span></label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); if (errors.name) setErrors(prev => ({ ...prev, name: undefined })) }}
            placeholder="给你的菜取个名字"
            autoFocus
            className={`${inputCls} ${errors.name ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
          />
          {errors.name && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
              <AlertCircle size={12} />{errors.name}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">分类</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className={inputCls}
            >
              {categoryOptions.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">难度</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className={inputCls}
            >
              {difficultyOptions.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">时长（分钟）</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              min={1}
              max={1440}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">参考人数</label>
            <input
              type="number"
              value={servings}
              onChange={(e) => setServings(Number(e.target.value))}
              min={1}
              max={100}
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">标签</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="用逗号分隔，如：家常菜, 快手菜"
            className={inputCls}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">封面图</label>
          {coverImage ? (
            <div className="relative overflow-hidden rounded-xl">
              <img src={coverImage} alt="封面预览" className="h-48 w-full object-cover" />
              <button
                onClick={() => setCoverImage(undefined)}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <label className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--color-border)] transition-colors hover:border-[var(--color-stone-300)] hover:bg-[var(--color-bg-subtle)]">
              <ImagePlus size={24} className="text-[var(--color-text-muted)]" />
              <span className="text-xs text-[var(--color-text-muted)]">点击上传图片</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          )}
        </div>
      </div>

      {/* Ingredients */}
      <div className="space-y-4">
        <h2 className="font-display text-lg font-semibold text-[var(--color-text)]">用料<span className="ml-1 text-xs font-normal text-red-500">*必填</span></h2>
        {errors.ingredients && (
          <p className="flex items-center gap-1 text-xs text-red-500">
            <AlertCircle size={12} />{errors.ingredients}
          </p>
        )}
        <div className="space-y-2">
          {ingredients.map((ing) => (
            <div key={ing.id} className="flex items-center gap-2">
              <input
                type="text"
                value={ing.name}
                onChange={(e) => {
                  updateIngredient(ing.id, 'name', e.target.value)
                  if (errors.ingredients) setErrors(prev => ({ ...prev, ingredients: undefined }))
                }}
                placeholder="食材名"
                className="min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3.5 py-2.5 text-sm text-[var(--color-text)] shadow-xs outline-none transition-all duration-200 placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-stone-300)] focus:ring-2 focus:ring-[var(--color-border-subtle)]"
              />
              <input
                type="number"
                value={ing.amount || ''}
                onChange={(e) => updateIngredient(ing.id, 'amount', Number(e.target.value))}
                placeholder="用量"
                className="w-16 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-2 py-2.5 text-sm text-[var(--color-text)] shadow-xs outline-none transition-all duration-200 placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-stone-300)] focus:ring-2 focus:ring-[var(--color-border-subtle)] sm:w-20"
              />
              <select
                value={ing.unit}
                onChange={(e) => updateIngredient(ing.id, 'unit', e.target.value)}
                className={`w-14 appearance-none rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-1 py-2.5 text-sm shadow-xs outline-none transition-all duration-200 focus:border-[var(--color-stone-300)] focus:ring-2 focus:ring-[var(--color-border-subtle)] sm:w-16 ${ing.unit ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}`}
              >
                <option value="">单位</option>
                {UNIT_OPTIONS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              <button
                onClick={() => removeIngredient(ing.id)}
                className="shrink-0 rounded-lg p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addIngredient}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-[var(--color-border)] py-2.5 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-stone-300)] hover:text-[var(--color-text-secondary)]"
        >
          <Plus size={14} />
          添加用料
        </button>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        <h2 className="font-display text-lg font-semibold text-[var(--color-text)]">步骤<span className="ml-1 text-xs font-normal text-red-500">*必填</span></h2>
        {errors.steps && (
          <p className="flex items-center gap-1 text-xs text-red-500">
            <AlertCircle size={12} />{errors.steps}
          </p>
        )}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={index} className="rounded-2xl bg-[var(--color-bg-card)] p-4 shadow-xs">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-text)] text-xs font-semibold text-[var(--color-bg)]">
                  {step.order}
                </span>
                <button
                  onClick={() => removeStep(index)}
                  className="rounded-lg p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <textarea
                value={step.description}
                onChange={(e) => {
                  updateStep(index, 'description', e.target.value)
                  if (errors.steps) setErrors(prev => ({ ...prev, steps: undefined }))
                }}
                placeholder="描述这一步的操作..."
                rows={2}
                className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-none transition-all duration-200 placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-stone-300)] focus:bg-[var(--color-bg-card)] focus:ring-2 focus:ring-[var(--color-border-subtle)]"
              />
              <div className="mt-2.5 flex items-center gap-2">
                <label className="text-xs text-[var(--color-text-muted)]">计时（分钟）</label>
                <input
                  type="number"
                  value={step.timer || ''}
                  onChange={(e) =>
                    updateStep(
                      index,
                      'timer',
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  min={0}
                  className="w-16 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-2 py-1.5 text-xs outline-none transition-all duration-200 focus:border-[var(--color-stone-300)]"
                />
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={addStep}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-[var(--color-border)] py-2.5 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-stone-300)] hover:text-[var(--color-text-secondary)]"
        >
          <Plus size={14} />
          添加步骤
        </button>
      </div>
    </div>
  )
}
