const difficultyMap = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
}

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} 分钟`
  const hour = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hour} 小时 ${rest} 分钟` : `${hour} 小时`
}

function formatDifficulty(value) {
  return difficultyMap[value] || value
}

module.exports = {
  formatDuration,
  formatDifficulty,
}
