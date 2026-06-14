const { PNG } = require('pngjs')
const fs = require('fs')
const path = require('path')

const SIZE = 81
const CENTER = Math.floor(SIZE / 2)
const OUTPUT_DIR = path.resolve(__dirname, '..', 'src', 'assets')

const INACTIVE = { r: 168, g: 160, b: 142, a: 255 }
const ACTIVE = { r: 201, g: 88, b: 58, a: 255 }

function createPNG(drawFn, color) {
  const png = new PNG({ width: SIZE, height: SIZE })
  for (let i = 0; i < png.data.length; i++) png.data[i] = 0
  drawFn(png, color)
  return PNG.sync.write(png)
}

function setPixel(png, x, y, color) {
  x = Math.round(x)
  y = Math.round(y)
  if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return
  const idx = (y * SIZE + x) * 4
  png.data[idx] = color.r
  png.data[idx + 1] = color.g
  png.data[idx + 2] = color.b
  png.data[idx + 3] = color.a
}

function drawLine(png, x1, y1, x2, y2, thickness, color) {
  const dx = x2 - x1
  const dy = y2 - y1
  const steps = Math.max(Math.abs(dx), Math.abs(dy)) * 4
  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps
    const x = x1 + dx * t
    const y = y1 + dy * t
    for (let tx = -thickness; tx <= thickness; tx++) {
      for (let ty = -thickness; ty <= thickness; ty++) {
        if (tx * tx + ty * ty <= thickness * thickness) {
          setPixel(png, x + tx, y + ty, color)
        }
      }
    }
  }
}

function drawCircleOutline(png, cx, cy, r, thickness, color) {
  for (let angle = 0; angle < 360; angle++) {
    const rad = (angle * Math.PI) / 180
    const x = cx + r * Math.cos(rad)
    const y = cy + r * Math.sin(rad)
    for (let tx = -thickness; tx <= thickness; tx++) {
      for (let ty = -thickness; ty <= thickness; ty++) {
        if (tx * tx + ty * ty <= thickness * thickness) {
          setPixel(png, x + tx, y + ty, color)
        }
      }
    }
  }
}

function drawFilledCircle(png, cx, cy, r, color) {
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y <= r * r) {
        setPixel(png, cx + x, cy + y, color)
      }
    }
  }
}

function drawRectOutline(png, x1, y1, x2, y2, thickness, color) {
  drawLine(png, x1, y1, x2, y1, thickness, color)
  drawLine(png, x2, y1, x2, y2, thickness, color)
  drawLine(png, x2, y2, x1, y2, thickness, color)
  drawLine(png, x1, y2, x1, y1, thickness, color)
}

// Home - utensils crossed
function drawHome(png, color) {
  const t = 2
  drawLine(png, 16, 42, 40, 18, t, color)
  drawLine(png, 40, 18, 64, 42, t, color)
  drawLine(png, 22, 42, 22, 62, t, color)
  drawLine(png, 58, 42, 58, 62, t, color)
  drawLine(png, 22, 62, 58, 62, t, color)
  drawLine(png, 34, 62, 34, 48, t, color)
  drawLine(png, 46, 62, 46, 48, t, color)
  drawLine(png, 34, 48, 46, 48, t, color)
}

// Plan - calendar range
function drawPlan(png, color) {
  const t = 2
  drawRectOutline(png, 14, 22, 66, 62, t, color)
  drawLine(png, 14, 30, 66, 30, t, color)
  for (let i = 0; i < 7; i++) {
    const x = 21 + i * 7
    drawLine(png, x, 30, x, 62, 1, { r: color.r, g: color.g, b: color.b, a: 80 })
  }
  drawRectOutline(png, 34, 36, 46, 48, t, color)
}

// Blind box - sparkles
function drawBlind(png, color) {
  const t = 2
  // Center star
  drawLine(png, 40, 20, 40, 60, t, color)
  drawLine(png, 20, 40, 60, 40, t, color)
  drawLine(png, 26, 26, 54, 54, t, color)
  drawLine(png, 54, 26, 26, 54, t, color)
  // Small dots at corners
  drawFilledCircle(png, 20, 20, 3, color)
  drawFilledCircle(png, 60, 20, 3, color)
  drawFilledCircle(png, 20, 60, 3, color)
  drawFilledCircle(png, 60, 60, 3, color)
}

// Heart
function drawHeart(png, color) {
  // Draw heart shape using parametric equation
  for (let angle = 0; angle < 360; angle++) {
    const t = (angle * Math.PI) / 180
    const x = 16 * Math.pow(Math.sin(t), 3)
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))
    const px = CENTER + x * 2.2
    const py = CENTER + y * 2.2 - 4
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        if (dx * dx + dy * dy <= 4) {
          setPixel(png, px + dx, py + dy, color)
        }
      }
    }
  }
}

// User
function drawUser(png, color) {
  const t = 2
  drawCircleOutline(png, CENTER, 28, 11, t, color)
  for (let angle = 200; angle < 340; angle++) {
    const rad = (angle * Math.PI) / 180
    const x = CENTER + 22 * Math.cos(rad)
    const y = 56 + 14 * Math.sin(rad)
    for (let tx = -t; tx <= t; tx++) {
      for (let ty = -t; ty <= t; ty++) {
        if (tx * tx + ty * ty <= t * t) {
          setPixel(png, x + tx, y + ty, color)
        }
      }
    }
  }
}

const icons = [
  { name: 'tab-home', draw: drawHome },
  { name: 'tab-plan', draw: drawPlan },
  { name: 'tab-blind', draw: drawBlind },
  { name: 'tab-heart', draw: drawHeart },
  { name: 'tab-user', draw: drawUser },
]

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

for (const icon of icons) {
  const inactiveBuf = createPNG(icon.draw, INACTIVE)
  fs.writeFileSync(path.join(OUTPUT_DIR, `${icon.name}.png`), inactiveBuf)
  const activeBuf = createPNG(icon.draw, ACTIVE)
  fs.writeFileSync(path.join(OUTPUT_DIR, `${icon.name}-active.png`), activeBuf)
  console.log(`Generated: ${icon.name}.png + ${icon.name}-active.png`)
}

// Clean up old icons
const oldIcons = ['tab-calendar.png', 'tab-calendar-active.png', 'tab-fridge.png', 'tab-fridge-active.png']
for (const old of oldIcons) {
  const p = path.join(OUTPUT_DIR, old)
  if (fs.existsSync(p)) {
    fs.unlinkSync(p)
    console.log(`Removed old: ${old}`)
  }
}

console.log('All tabBar icons generated.')
