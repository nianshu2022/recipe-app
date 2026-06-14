import { useState, useEffect } from 'react'
import { View, Text, Input, Textarea, Picker } from '@tarojs/components'
import Taro, { useRouter, useDidShow } from '@tarojs/taro'
import { useRecipeStore } from '@/stores/recipeStore'
import { useUIStore } from '@/stores/uiStore'
import { Icon } from '@/components/Icon'
import { genId } from '@/utils/id'
import { CATEGORY_OPTIONS, DIFFICULTY_OPTIONS } from '@/constants/options'
import { UNIT_OPTIONS } from '@/constants/units'
import type { Recipe, Ingredient, Step, Category, Difficulty } from '@/types'
import './form.scss'

export default function RecipeFormPage() {
  const router = useRouter()
  const recipes = useRecipeStore((s) => s.recipes)
  const loadRecipes = useRecipeStore((s) => s.loadRecipes)
  const addRecipe = useRecipeStore((s) => s.addRecipe)
  const updateRecipe = useRecipeStore((s) => s.updateRecipe)
  const showToast = useUIStore((s) => s.showToast)

  const isEdit = !!router.params.id
  const [name, setName] = useState('')
  const [category, setCategory] = useState<Category>('hot-dish')
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [duration, setDuration] = useState('30')
  const [servings, setServings] = useState('2')
  const [tags, setTags] = useState('')
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [steps, setSteps] = useState<Step[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  useDidShow(() => {
    loadRecipes()
  })

  useEffect(() => {
    if (isEdit && recipes.length > 0) {
      const found = recipes.find((r) => r.id === router.params.id)
      if (found) {
        setName(found.name)
        setCategory(found.category)
        setDifficulty(found.difficulty)
        setDuration(String(found.duration))
        setServings(String(found.servings))
        setTags(found.tags.join(', '))
        setIngredients(found.ingredients)
        setSteps(found.steps)
      }
    }
  }, [isEdit, router.params.id, recipes])

  const categoryPickerRange = CATEGORY_OPTIONS.filter((c) => c.value !== 'all').map((c) => c.label)
  const difficultyPickerRange = DIFFICULTY_OPTIONS.filter((d) => d.value !== 'all').map((d) => d.label)

  const getCategoryValue = (index: number): Category => {
    return CATEGORY_OPTIONS.filter((c) => c.value !== 'all')[index].value as Category
  }

  const getDifficultyValue = (index: number): Difficulty => {
    return DIFFICULTY_OPTIONS.filter((d) => d.value !== 'all')[index].value as Difficulty
  }

  const getCategoryIndex = () => {
    return CATEGORY_OPTIONS.filter((c) => c.value !== 'all').findIndex((c) => c.value === category)
  }

  const getDifficultyIndex = () => {
    return DIFFICULTY_OPTIONS.filter((d) => d.value !== 'all').findIndex((d) => d.value === difficulty)
  }

  const handleAddIngredient = () => {
    setIngredients([
      ...ingredients,
      { id: genId(), name: '', amount: 1, unit: '克', type: 'main', scalable: true },
    ])
  }

  const handleUpdateIngredient = (index: number, field: keyof Ingredient, value: any) => {
    const updated = [...ingredients]
    updated[index] = { ...updated[index], [field]: value }
    setIngredients(updated)
  }

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const handleAddStep = () => {
    setSteps([
      ...steps,
      { order: steps.length + 1, description: '' },
    ])
  }

  const handleUpdateStep = (index: number, field: keyof Step, value: any) => {
    const updated = [...steps]
    updated[index] = { ...updated[index], [field]: value }
    setSteps(updated)
  }

  const handleRemoveStep = (index: number) => {
    const updated = steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 }))
    setSteps(updated)
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = '请输入菜谱名称'
    if (ingredients.length === 0) newErrors.ingredients = '请添加至少一种用料'
    if (steps.length === 0) newErrors.steps = '请添加至少一个步骤'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) {
      showToast('请填写必要信息', 'error')
      return
    }

    const now = new Date().toISOString()
    const recipe: Recipe = {
      id: isEdit ? router.params.id! : genId(),
      userId: '',
      name: name.trim(),
      category,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      difficulty,
      duration: parseInt(duration) || 30,
      servings: parseInt(servings) || 2,
      ingredients,
      steps,
      syncStatus: 'pending',
      createdAt: isEdit ? (recipes.find((r) => r.id === router.params.id)?.createdAt || now) : now,
      updatedAt: now,
    }

    if (isEdit) {
      await updateRecipe(recipe)
      showToast('已更新', 'success')
    } else {
      await addRecipe(recipe)
      showToast('已创建', 'success')
    }
    Taro.navigateBack()
  }

  return (
    <View className='form-page'>
      <View className='form-header'>
        <View className='form-header__back' onClick={() => Taro.navigateBack()}>
          <Icon name='arrowLeft' size={40} color='#252220' />
        </View>
        <Text className='form-header__title'>{isEdit ? '编辑菜谱' : '新建菜谱'}</Text>
        <View className='form-header__save' onClick={handleSave}>
          <Text>保存</Text>
        </View>
      </View>

      <View className='form-content'>
        <View className='form-section'>
          <Text className='form-section__title'>基本信息</Text>
          <View className='form-card'>
            <View className='form-field'>
              <Text className='form-field__label'>菜谱名称 *</Text>
              <Input
                className={`form-field__input ${errors.name ? 'form-field__input--error' : ''}`}
                placeholder='输入菜谱名称'
                value={name}
                onInput={(e) => setName(e.detail.value)}
              />
              {errors.name && <Text className='form-field__error'>{errors.name}</Text>}
            </View>

            <View className='form-row'>
              <View className='form-field form-field--half'>
                <Text className='form-field__label'>分类</Text>
                <Picker mode='selector' range={categoryPickerRange} value={getCategoryIndex()} onChange={(e) => setCategory(getCategoryValue(Number(e.detail.value)))}>
                  <View className='form-field__picker'>
                    <Text>{CATEGORY_OPTIONS.find((c) => c.value === category)?.label}</Text>
                    <Icon name='chevronDown' size={28} color='#a8a08e' />
                  </View>
                </Picker>
              </View>
              <View className='form-field form-field--half'>
                <Text className='form-field__label'>难度</Text>
                <Picker mode='selector' range={difficultyPickerRange} value={getDifficultyIndex()} onChange={(e) => setDifficulty(getDifficultyValue(Number(e.detail.value)))}>
                  <View className='form-field__picker'>
                    <Text>{DIFFICULTY_OPTIONS.find((d) => d.value === difficulty)?.label}</Text>
                    <Icon name='chevronDown' size={28} color='#a8a08e' />
                  </View>
                </Picker>
              </View>
            </View>

            <View className='form-row'>
              <View className='form-field form-field--half'>
                <Text className='form-field__label'>时长(分钟)</Text>
                <Input
                  className='form-field__input'
                  type='number'
                  value={duration}
                  onInput={(e) => setDuration(e.detail.value)}
                />
              </View>
              <View className='form-field form-field--half'>
                <Text className='form-field__label'>份数</Text>
                <Input
                  className='form-field__input'
                  type='number'
                  value={servings}
                  onInput={(e) => setServings(e.detail.value)}
                />
              </View>
            </View>

            <View className='form-field'>
              <Text className='form-field__label'>标签</Text>
              <Input
                className='form-field__input'
                placeholder='用逗号分隔，如：家常, 快手, 下饭'
                value={tags}
                onInput={(e) => setTags(e.detail.value)}
              />
            </View>
          </View>
        </View>

        <View className='form-section'>
          <View className='form-section__header'>
            <Text className='form-section__title'>用料</Text>
            {errors.ingredients && <Text className='form-field__error'>{errors.ingredients}</Text>}
          </View>
          <View className='form-card'>
            {ingredients.map((ing, i) => (
              <View key={ing.id} className='form-ingredient'>
                <Input
                  className='form-ingredient__name'
                  placeholder='食材名称'
                  value={ing.name}
                  onInput={(e) => handleUpdateIngredient(i, 'name', e.detail.value)}
                />
                <Input
                  className='form-ingredient__amount'
                  type='digit'
                  placeholder='用量'
                  value={String(ing.amount)}
                  onInput={(e) => handleUpdateIngredient(i, 'amount', parseFloat(e.detail.value) || 0)}
                />
                <Picker mode='selector' range={UNIT_OPTIONS} value={UNIT_OPTIONS.indexOf(ing.unit)} onChange={(e) => handleUpdateIngredient(i, 'unit', UNIT_OPTIONS[Number(e.detail.value)])}>
                  <View className='form-ingredient__unit'>
                    <Text>{ing.unit}</Text>
                  </View>
                </Picker>
                <View className='form-ingredient__delete' onClick={() => handleRemoveIngredient(i)}>
                  <Icon name='x' size={32} color='#c44b4b' />
                </View>
              </View>
            ))}
            <View className='form-add' onClick={handleAddIngredient}>
              <Icon name='plus' size={32} color='#a8a08e' />
              <Text className='form-add__text'>添加用料</Text>
            </View>
          </View>
        </View>

        <View className='form-section'>
          <View className='form-section__header'>
            <Text className='form-section__title'>步骤</Text>
            {errors.steps && <Text className='form-field__error'>{errors.steps}</Text>}
          </View>
          {steps.map((step, i) => (
            <View key={i} className='form-step'>
              <View className='form-step__header'>
                <View className='form-step__number'>
                  <Text>{step.order}</Text>
                </View>
                <View className='form-step__delete' onClick={() => handleRemoveStep(i)}>
                  <Icon name='trash' size={32} color='#c44b4b' />
                </View>
              </View>
              <Textarea
                className='form-step__textarea'
                placeholder='描述这一步骤...'
                value={step.description}
                onInput={(e) => handleUpdateStep(i, 'description', e.detail.value)}
              />
              <View className='form-step__timer'>
                <Icon name='clock' size={28} color='#a8a08e' />
                <Input
                  className='form-step__timer-input'
                  type='number'
                  placeholder='计时(分钟)'
                  value={step.timer ? String(step.timer) : ''}
                  onInput={(e) => handleUpdateStep(i, 'timer', e.detail.value ? parseInt(e.detail.value) : undefined)}
                />
              </View>
            </View>
          ))}
          <View className='form-add' onClick={handleAddStep}>
            <Icon name='plus' size={32} color='#a8a08e' />
            <Text className='form-add__text'>添加步骤</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
