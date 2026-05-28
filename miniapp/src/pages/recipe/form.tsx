import { View, Text, Input, Textarea, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useCallback, useEffect } from 'react'
import { useRecipeStore } from '@/stores/recipeStore'
import { generateId } from '@/utils/id'
import { UNIT_OPTIONS } from '@/constants/units'
import type { Category, Difficulty, Ingredient, Step } from '@/types'
import './form.scss'

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'cold-dish', label: '凉菜' },
  { value: 'hot-dish', label: '热菜' },
  { value: 'soup', label: '汤羹' },
  { value: 'staple', label: '主食' },
  { value: 'dessert', label: '甜品' },
  { value: 'drink', label: '饮品' },
]

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: '简单' },
  { value: 'medium', label: '中等' },
  { value: 'hard', label: '困难' },
]

function makeEmptyIngredient(): Ingredient {
  return {
    id: generateId(),
    name: '',
    amount: 0,
    unit: 'g',
    type: 'main',
    scalable: true,
  }
}

function makeEmptyStep(order: number): Step {
  return {
    order,
    description: '',
  }
}

export default function RecipeFormPage() {
  const router = Taro.useRouter()
  const editId = router.params.id
  const isEdit = !!editId
  const pageTitle = isEdit ? '编辑菜谱' : '新建菜谱'

  const { recipes, addRecipe, updateRecipe } = useRecipeStore()

  const [name, setName] = useState('')
  const [category, setCategory] = useState<Category>('hot-dish')
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [duration, setDuration] = useState('')
  const [servings, setServings] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [ingredients, setIngredients] = useState<Ingredient[]>([makeEmptyIngredient()])
  const [steps, setSteps] = useState<Step[]>([makeEmptyStep(1)])
  const [submitting, setSubmitting] = useState(false)

  const loadRecipe = useCallback(() => {
    if (!editId) return
    const recipe = recipes.find((r) => r.id === editId)
    if (!recipe) return

    setName(recipe.name)
    setCategory(recipe.category)
    setDifficulty(recipe.difficulty)
    setDuration(recipe.duration ? String(recipe.duration) : '')
    setServings(recipe.servings ? String(recipe.servings) : '')
    setTagsInput(recipe.tags.join(', '))
    setCoverImage(recipe.coverImage || '')
    setIngredients(recipe.ingredients.length > 0 ? recipe.ingredients : [makeEmptyIngredient()])
    setSteps(recipe.steps.length > 0 ? recipe.steps : [makeEmptyStep(1)])
  }, [editId, recipes])

  useDidShow(() => {
    if (isEdit && recipes.length > 0) {
      loadRecipe()
    }
  })

  // Load recipe when recipes are loaded (for edit mode)
  useEffect(() => {
    if (isEdit && recipes.length > 0) {
      loadRecipe()
    }
  }, [isEdit, recipes, loadRecipe])

  const handleChooseImage = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
      })
      if (res.tempFilePaths[0]) {
        setCoverImage(res.tempFilePaths[0])
      }
    } catch {
      // User cancelled
    }
  }

  const updateIngredient = (index: number, field: keyof Ingredient, value: any) => {
    setIngredients((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    )
  }

  const addIngredient = () => {
    setIngredients((prev) => [...prev, makeEmptyIngredient()])
  }

  const removeIngredient = (index: number) => {
    setIngredients((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((_, i) => i !== index)
    })
  }

  const updateStep = (index: number, field: keyof Step, value: any) => {
    setSteps((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    )
  }

  const addStep = () => {
    setSteps((prev) => [...prev, makeEmptyStep(prev.length + 1)])
  }

  const removeStep = (index: number) => {
    setSteps((prev) => {
      if (prev.length <= 1) return prev
      const next = prev.filter((_, i) => i !== index)
      return next.map((s, i) => ({ ...s, order: i + 1 }))
    })
  }

  const validate = (): string | null => {
    if (!name.trim()) return '请输入菜谱名称'
    if (!duration || Number(duration) <= 0) return '请输入烹饪时长'
    if (!servings || Number(servings) <= 0) return '请输入份量'
    const validIngredients = ingredients.filter((i) => i.name.trim())
    if (validIngredients.length === 0) return '请至少添加一种食材'
    const validSteps = steps.filter((s) => s.description.trim())
    if (validSteps.length === 0) return '请至少添加一个步骤'
    return null
  }

  const handleSubmit = async () => {
    const error = validate()
    if (error) {
      Taro.showToast({ title: error, icon: 'none' })
      return
    }

    setSubmitting(true)
    try {
      const tags = tagsInput
        .split(/[,，]/)
        .map((t) => t.trim())
        .filter(Boolean)

      const validIngredients = ingredients.filter((i) => i.name.trim())
      const validSteps = steps
        .filter((s) => s.description.trim())
        .map((s, i) => ({ ...s, order: i + 1 }))

      const recipeData = {
        name: name.trim(),
        category,
        tags,
        coverImage: coverImage || undefined,
        difficulty,
        duration: Number(duration),
        servings: Number(servings),
        ingredients: validIngredients,
        steps: validSteps,
        userId: '',
      }

      if (isEdit && editId) {
        await updateRecipe(editId, recipeData)
      } else {
        await addRecipe(recipeData)
      }

      Taro.showToast({ title: isEdit ? '更新成功' : '创建成功', icon: 'success' })
      setTimeout(() => {
        Taro.navigateBack()
      }, 800)
    } catch (e) {
      Taro.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className="recipe-form-page">
      {/* Header */}
      <View className="form-header">
        <View className="back-btn" onClick={() => Taro.navigateBack()}>
          <Text className="back-icon">&#8592;</Text>
        </View>
        <Text className="form-header-title">{pageTitle}</Text>
        <View className="form-header-right" />
      </View>

      <ScrollView scrollY className="form-scroll">
        <View className="form-body">
          {/* Cover Image */}
          <View className="form-section">
            <Text className="form-section-title">封面图</Text>
            <View className="cover-upload" onClick={handleChooseImage}>
              {coverImage ? (
                <Image className="cover-preview" src={coverImage} mode="aspectFill" />
              ) : (
                <View className="cover-placeholder">
                  <Text className="cover-placeholder-icon">+</Text>
                  <Text className="cover-placeholder-text">点击上传图片</Text>
                </View>
              )}
            </View>
          </View>

          {/* Basic Info */}
          <View className="form-section">
            <View className="form-card">
              {/* Name */}
              <View className="form-field">
                <Text className="form-label">菜名</Text>
                <Input
                  className="form-input"
                  placeholder="给你的菜取个名字"
                  value={name}
                  onInput={(e) => setName(e.detail.value)}
                />
              </View>

              {/* Category */}
              <View className="form-field">
                <Text className="form-label">分类</Text>
                <View className="picker-group">
                  {CATEGORIES.map((cat) => (
                    <View
                      key={cat.value}
                      className={`picker-btn ${category === cat.value ? 'active' : ''}`}
                      onClick={() => setCategory(cat.value)}
                    >
                      <Text className="picker-btn-text">{cat.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Difficulty */}
              <View className="form-field">
                <Text className="form-label">难度</Text>
                <View className="picker-group">
                  {DIFFICULTIES.map((diff) => (
                    <View
                      key={diff.value}
                      className={`picker-btn ${difficulty === diff.value ? 'active' : ''}`}
                      onClick={() => setDifficulty(diff.value)}
                    >
                      <Text className="picker-btn-text">{diff.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Duration & Servings */}
              <View className="form-row">
                <View className="form-field form-field-half">
                  <Text className="form-label">时长（分钟）</Text>
                  <Input
                    className="form-input"
                    type="number"
                    value={duration}
                    onInput={(e) => setDuration(e.detail.value)}
                  />
                </View>
                <View className="form-field form-field-half">
                  <Text className="form-label">参考人数</Text>
                  <Input
                    className="form-input"
                    type="number"
                    value={servings}
                    onInput={(e) => setServings(e.detail.value)}
                  />
                </View>
              </View>

              {/* Tags */}
              <View className="form-field">
                <Text className="form-label">标签</Text>
                <Input
                  className="form-input"
                  placeholder="用逗号分隔，如：家常菜, 快手菜"
                  value={tagsInput}
                  onInput={(e) => setTagsInput(e.detail.value)}
                />
              </View>
            </View>
          </View>

          {/* Ingredients */}
          <View className="form-section">
            <View className="form-section-header">
              <Text className="form-section-title">用料</Text>
              <View className="add-row-btn" onClick={addIngredient}>
                <Text className="add-row-btn-text">+ 添加</Text>
              </View>
            </View>
            {ingredients.map((ingredient, index) => (
              <View key={ingredient.id} className="dynamic-row">
                <View className="dynamic-row-fields">
                  <Input
                    className="form-input ingredient-name-input"
                    placeholder="食材名"
                    value={ingredient.name}
                    onInput={(e) => updateIngredient(index, 'name', e.detail.value)}
                  />
                  <Input
                    className="form-input ingredient-amount-input"
                    type="digit"
                    placeholder="用量"
                    value={ingredient.amount ? String(ingredient.amount) : ''}
                    onInput={(e) =>
                      updateIngredient(index, 'amount', Number(e.detail.value) || 0)
                    }
                  />
                  <ScrollView scrollX className="unit-picker-scroll">
                    <View className="picker-group unit-picker-group">
                      {UNIT_OPTIONS.map((unit) => (
                        <View
                          key={unit}
                          className={`picker-btn picker-btn-sm ${ingredient.unit === unit ? 'active' : ''}`}
                          onClick={() => updateIngredient(index, 'unit', unit)}
                        >
                          <Text className="picker-btn-text">{unit}</Text>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                </View>
                {ingredients.length > 1 && (
                  <View
                    className="remove-row-btn"
                    onClick={() => removeIngredient(index)}
                  >
                    <Text className="remove-row-btn-text">删除</Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Steps */}
          <View className="form-section">
            <View className="form-section-header">
              <Text className="form-section-title">步骤</Text>
              <View className="add-row-btn" onClick={addStep}>
                <Text className="add-row-btn-text">+ 添加</Text>
              </View>
            </View>
            {steps.map((step, index) => (
              <View key={index} className="dynamic-row step-row">
                <View className="step-number">
                  <Text className="step-number-text">{index + 1}</Text>
                </View>
                <View className="dynamic-row-fields step-fields">
                  <Textarea
                    className="form-textarea"
                    placeholder="描述这一步的操作..."
                    value={step.description}
                    onInput={(e) => updateStep(index, 'description', e.detail.value)}
                    autoHeight
                    maxlength={500}
                  />
                  <View className="step-timer-row">
                    <Text className="step-timer-label">计时（分钟）</Text>
                    <Input
                      className="form-input step-timer-input"
                      type="number"
                      value={step.timer ? String(Math.floor(step.timer / 60)) : ''}
                      onInput={(e) => {
                        const mins = Number(e.detail.value) || 0
                        updateStep(index, 'timer', mins > 0 ? mins * 60 : undefined)
                      }}
                    />
                  </View>
                </View>
                {steps.length > 1 && (
                  <View
                    className="remove-row-btn"
                    onClick={() => removeStep(index)}
                  >
                    <Text className="remove-row-btn-text">删除</Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Submit */}
          <View className="form-submit-area">
            <View
              className={`submit-btn ${submitting ? 'disabled' : ''}`}
              onClick={handleSubmit}
            >
              <Text className="submit-btn-text">
                {submitting ? '保存中...' : isEdit ? '更新菜谱' : '保存菜谱'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
