function scaleIngredient(ingredient, originalServings, targetServings) {
  if (ingredient.scalable === false) {
    return {
      ...ingredient,
      amountText: formatAmount(Number(ingredient.amount || 0), ingredient.unit || ''),
    }
  }
  if (originalServings <= 0 || targetServings <= 0) return ingredient
  const ratio = targetServings / originalServings
  const amount = Math.round(Number(ingredient.amount || 0) * ratio * 100) / 100
  return {
    ...ingredient,
    amount,
    amountText: formatAmount(amount, ingredient.unit || ''),
  }
}

function scaleIngredients(ingredients, originalServings, targetServings) {
  return ingredients.map((ingredient) => scaleIngredient(ingredient, originalServings, targetServings))
}

function formatAmount(amount, unit) {
  if (amount === 0) return ''
  const rounded = Math.round(amount * 100) / 100
  if (rounded === Math.floor(rounded)) return `${rounded}${unit}`
  if (rounded < 0.01) return '少许'
  return `${rounded}${unit}`
}

module.exports = {
  scaleIngredient,
  scaleIngredients,
  formatAmount,
}
