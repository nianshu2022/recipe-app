function loadRecipes() {
  return wx.getStorageSync('recipes') || []
}

function loadCollections() {
  return wx.getStorageSync('collections') || []
}

function loadMealPlans() {
  return wx.getStorageSync('mealPlans') || []
}

function loadShoppingLists() {
  return wx.getStorageSync('shoppingLists') || []
}

function scaleIngredients(ingredients, originalServings, targetServings) {
  const ratio = targetServings / originalServings
  return ingredients.map(ing => ({
    ...ing,
    amount: Math.round(ing.amount * ratio * 100) / 100
  }))
}

function getMonday(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getWeekDates() {
  const monday = getMonday(new Date())
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    return d
  })
}

module.exports = {
  loadRecipes, loadCollections, loadMealPlans, loadShoppingLists,
  scaleIngredients, getMonday, getWeekDates
}
