function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function formatDate(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getDifficultyText(difficulty) {
  return { easy: '简单', medium: '中等', hard: '困难' }[difficulty] || '简单'
}

function getDifficultyColor(difficulty) {
  return {
    easy: 'difficulty-easy',
    medium: 'difficulty-medium',
    hard: 'difficulty-hard'
  }[difficulty] || 'difficulty-easy'
}

function getCategoryText(category) {
  return {
    'cold-dish': '凉菜', 'hot-dish': '热菜', 'soup': '汤羹',
    'staple': '主食', 'dessert': '甜品', 'drink': '饮品'
  }[category] || category
}

function getCategoryIcon(category) {
  return {
    'cold-dish': '/assets/icons/leaf.svg',
    'hot-dish': '/assets/icons/flame.svg',
    'soup': '/assets/icons/soup.svg',
    'staple': '/assets/icons/wheat.svg',
    'dessert': '/assets/icons/ice-cream.svg',
    'drink': '/assets/icons/cup-soda.svg'
  }[category] || '/assets/icons/utensils.svg'
}

function showToast(title, icon) {
  wx.showToast({ title, icon: icon || 'none', duration: 2000 })
}

function showConfirm(content, title) {
  return new Promise(resolve => {
    wx.showModal({
      title: title || '提示',
      content,
      success: res => resolve(res.confirm)
    })
  })
}

const UNIT_OPTIONS = [
  '克', '千克', '毫升', '升', '勺', '汤匙', '茶匙',
  '个', '块', '片', '根', '棵', '瓣', '张', '颗', '条', '只',
  '碗', '杯', '罐', '盒', '袋', '包', '瓶', '粒', '小块', '朵',
  '适量', '少许'
]

const CATEGORY_OPTIONS = [
  { value: 'cold-dish', label: '凉菜' },
  { value: 'hot-dish', label: '热菜' },
  { value: 'soup', label: '汤羹' },
  { value: 'staple', label: '主食' },
  { value: 'dessert', label: '甜品' },
  { value: 'drink', label: '饮品' }
]

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: '简单' },
  { value: 'medium', label: '中等' },
  { value: 'hard', label: '困难' }
]

const SLOT_LABELS = ['早餐', '午餐', '晚餐', '加餐']
const DAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

const categoryMap = {
  '番茄': '蔬菜', '西红柿': '蔬菜', '土豆': '蔬菜', '胡萝卜': '蔬菜', '洋葱': '蔬菜',
  '青椒': '蔬菜', '红椒': '蔬菜', '大蒜': '蔬菜', '生姜': '蔬菜', '大葱': '蔬菜',
  '小葱': '蔬菜', '白菜': '蔬菜', '生菜': '蔬菜', '黄瓜': '蔬菜', '茄子': '蔬菜',
  '西兰花': '蔬菜', '花菜': '蔬菜', '芹菜': '蔬菜', '韭菜': '蔬菜', '菠菜': '蔬菜',
  '豆芽': '蔬菜', '蘑菇': '蔬菜', '香菇': '蔬菜', '木耳': '蔬菜', '玉米': '蔬菜',
  '南瓜': '蔬菜', '冬瓜': '蔬菜', '丝瓜': '蔬菜', '苦瓜': '蔬菜',
  '猪肉': '肉类', '牛肉': '肉类', '羊肉': '肉类', '鸡肉': '肉类', '鸡胸肉': '肉类',
  '鸡腿': '肉类', '鸡翅': '肉类', '排骨': '肉类', '五花肉': '肉类', '里脊': '肉类',
  '肉末': '肉类', '肉丝': '肉类', '腊肉': '肉类', '培根': '肉类', '香肠': '肉类',
  '虾': '海鲜', '虾仁': '海鲜', '鱼': '海鲜', '鲈鱼': '海鲜', '三文鱼': '海鲜',
  '螃蟹': '海鲜', '蛤蜊': '海鲜', '鱿鱼': '海鲜', '带鱼': '海鲜',
  '鸡蛋': '蛋奶', '鸭蛋': '蛋奶', '牛奶': '蛋奶', '酸奶': '蛋奶', '奶酪': '蛋奶',
  '黄油': '蛋奶', '淡奶油': '蛋奶',
  '盐': '调料', '糖': '调料', '生抽': '调料', '老抽': '调料', '醋': '调料',
  '料酒': '调料', '蚝油': '调料', '豆瓣酱': '调料', '番茄酱': '调料', '芝麻油': '调料',
  '花椒': '调料', '八角': '调料', '桂皮': '调料', '干辣椒': '调料', '胡椒': '调料',
  '五香粉': '调料', '淀粉': '调料', '酱油': '调料', '食用油': '调料', '花生油': '调料',
  '橄榄油': '调料', '菜籽油': '调料',
  '米饭': '主食', '面条': '主食', '面粉': '主食', '饺子皮': '主食', '面包': '主食',
  '馒头': '主食', '年糕': '主食', '粉丝': '主食', '米粉': '主食',
  '豆腐': '豆制品', '豆干': '豆制品', '腐竹': '豆制品', '花生': '干货', '芝麻': '干货',
  '红枣': '干货', '枸杞': '干货', '桂圆': '干货'
}

function guessCategory(name) {
  for (const [keyword, cat] of Object.entries(categoryMap)) {
    if (name.includes(keyword)) return cat
  }
  return '其他'
}

module.exports = {
  generateId, formatDate, getDifficultyText, getDifficultyColor,
  getCategoryText, getCategoryIcon, showToast, showConfirm,
  UNIT_OPTIONS, CATEGORY_OPTIONS, DIFFICULTY_OPTIONS,
  SLOT_LABELS, DAY_LABELS, guessCategory
}
