import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { useRecipeStore } from '@/stores/recipeStore'
import type { Category, Difficulty, Ingredient, Step } from '@/types'
import { generateId } from '@/utils/id'

const categories: { value: Category; label: string }[] = [
  { value: 'cold-dish', label: '凉菜' },
  { value: 'hot-dish', label: '热菜' },
  { value: 'soup', label: '汤羹' },
  { value: 'staple', label: '主食' },
  { value: 'dessert', label: '甜品' },
  { value: 'drink', label: '饮品' },
]

const difficulties: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: '简单' },
  { value: 'medium', label: '中等' },
  { value: 'hard', label: '困难' },
]

const inputCls =
  'w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 shadow-xs outline-none transition-all duration-200 placeholder:text-stone-400 focus:border-stone-400 focus:shadow-sm focus:ring-2 focus:ring-stone-100'

export function RecipeFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { recipes, addRecipe, updateRecipe, loadRecipes } = useRecipeStore()
  const isEditing = !!id

  const [name, setName] = useState('')
  const [category, setCategory] = useState<Category>('hot-dish')
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [duration, setDuration] = useState(30)
  const [servings, setServings] = useState(2)
  const [tags, setTags] = useState('')
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: generateId(), name: '', amount: 0, unit: '', type: 'main', scalable: true },
  ])
  const [steps, setSteps] = useState<Step[]>([{ order: 1, description: '' }])

  useEffect(() => {
    loadRecipes()
  }, [loadRecipes])

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

  const handleSubmit = async () => {
    if (!name.trim()) return
    const validIngredients = ingredients.filter((i) => i.name.trim())
    const validSteps = steps.filter((s) => s.description.trim())
    if (validIngredients.length === 0 || validSteps.length === 0) return

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
      ingredients: validIngredients,
      steps: validSteps,
    }

    if (isEditing) {
      await updateRecipe(id, recipeData)
    } else {
      await addRecipe({ userId: 'local', ...recipeData })
    }
    navigate('/')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to={isEditing ? `/recipe/${id}` : '/'}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-xs transition-all duration-200 hover:shadow-sm active:scale-95"
        >
          <ArrowLeft size={18} className="text-stone-600" />
        </Link>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-stone-900">
          {isEditing ? '编辑菜谱' : '新建菜谱'}
        </h1>
      </div>

      {/* Basic info */}
      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700">菜名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="给你的菜取个名字"
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700">分类</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className={inputCls}
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700">难度</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className={inputCls}
            >
              {difficulties.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700">时长（分钟）</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              min={1}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700">参考人数</label>
            <input
              type="number"
              value={servings}
              onChange={(e) => setServings(Number(e.target.value))}
              min={1}
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700">标签</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="用逗号分隔，如：家常菜, 快手菜"
            className={inputCls}
          />
        </div>
      </div>

      {/* Ingredients */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-stone-900">用料</h2>
          <button
            onClick={addIngredient}
            className="flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary-dark"
          >
            <Plus size={14} />
            添加
          </button>
        </div>
        <div className="space-y-2">
          {ingredients.map((ing) => (
            <div key={ing.id} className="flex items-center gap-2">
              <input
                type="text"
                value={ing.name}
                onChange={(e) => updateIngredient(ing.id, 'name', e.target.value)}
                placeholder="食材名"
                className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-800 shadow-xs outline-none transition-all duration-200 placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-100"
              />
              <input
                type="number"
                value={ing.amount || ''}
                onChange={(e) => updateIngredient(ing.id, 'amount', Number(e.target.value))}
                placeholder="用量"
                className="w-16 rounded-xl border border-stone-200 bg-white px-2 py-2.5 text-sm text-stone-800 shadow-xs outline-none transition-all duration-200 placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-100 sm:w-20"
              />
              <input
                type="text"
                value={ing.unit}
                onChange={(e) => updateIngredient(ing.id, 'unit', e.target.value)}
                placeholder="单位"
                className="w-12 rounded-xl border border-stone-200 bg-white px-2 py-2.5 text-sm text-stone-800 shadow-xs outline-none transition-all duration-200 placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-100 sm:w-16"
              />
              <button
                onClick={() => removeIngredient(ing.id)}
                className="shrink-0 rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-stone-900">步骤</h2>
          <button
            onClick={addStep}
            className="flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary-dark"
          >
            <Plus size={14} />
            添加
          </button>
        </div>
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={index} className="rounded-2xl bg-white p-4 shadow-xs">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-900 text-xs font-semibold text-white">
                  {step.order}
                </span>
                <button
                  onClick={() => removeStep(index)}
                  className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <textarea
                value={step.description}
                onChange={(e) => updateStep(index, 'description', e.target.value)}
                placeholder="描述这一步的操作..."
                rows={2}
                className="w-full resize-none rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 outline-none transition-all duration-200 placeholder:text-stone-400 focus:border-stone-400 focus:bg-white focus:ring-2 focus:ring-stone-100"
              />
              <div className="mt-2.5 flex items-center gap-2">
                <label className="text-xs text-stone-400">计时（分钟）</label>
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
                  className="w-16 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs outline-none transition-all duration-200 focus:border-stone-400"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!name.trim()}
        className="w-full rounded-2xl bg-stone-900 py-4 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none disabled:hover:scale-100"
      >
        {isEditing ? '更新菜谱' : '保存菜谱'}
      </button>
    </div>
  )
}
