const { PNG } = require('pngjs')
const fs = require('fs')
const path = require('path')

const SIZE = 81
const CENTER = Math.floor(SIZE / 2)
const OUTPUT_DIR = path.resolve(__dirname, '..', 'src', 'assets')

// Colors matching web app
const INACTIVE = { r: 168, g: 168, b: 160, a: 255 } // stone-400
const ACTIVE = { r: 28, g: 25, b: 23, a: 255 } // stone-900

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

function drawRectOutline(png, x1, y1, x2, y2, thickness, color) {
  drawLine(png, x1, y1, x2, y1, thickness, color)
  drawLine(png, x2, y1, x2, y2, thickness, color)
  drawLine(png, x2, y2, x1, y2, thickness, color)
  drawLine(png, x1, y2, x1, y1, thickness, color)
}

// Icon: Home (Lucide Home style - house)
function drawHome(png, color) {
  const t = 2 // thickness
  // Roof (triangle)
  drawLine(png, 16, 42, 40, 18, t, color)
  drawLine(png, 40, 18, 64, 42, t, color)
  // Walls
  drawLine(png, 22, 42, 22, 62, t, color)
  drawLine(png, 58, 42, 58, 62, t, color)
  drawLine(png, 22, 62, 58, 62, t, color)
  // Door
  drawLine(png, 34, 62, 34, 48, t, color)
  drawLine(png, 46, 62, 46, 48, t, color)
  drawLine(png, 34, 48, 46, 48, t, color)
}

// Icon: Calendar (Lucide Calendar style)
function drawCalendar(png, color) {
  const t = 2
  // Outer rect
  drawRectOutline(png, 16, 24, 64, 62, t, color)
  // Top bar
  drawLine(png, 16, 32, 64, 32, t, color)
  // Left pin
  drawLine(png, 30, 18, 30, 28, t, color)
  // Right pin
  drawLine(png, 50, 18, 50, 28, t, color)
  // Grid dots (3 rows x 4 cols)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const x = 26 + col * 10
      const y = 40 + row * 8
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          setPixel(png, x + dx, y + dy, color)
        }
      }
    }
  }
}

// Icon: CalendarRange (Lucide CalendarRange style - week view)
function drawPlan(png, color) {
  const t = 2
  // Outer rect
  drawRectOutline(png, 14, 22, 66, 62, t, color)
  // Top bar
  drawLine(png, 14, 30, 66, 30, t, color)
  // 7 vertical lines
  for (let i = 0; i < 7; i++) {
    const x = 21 + i * 7
    drawLine(png, x, 30, x, 62, 1, { r: color.r, g: color.g, b: color.b, a: 80 })
  }
  // Highlight box (current day)
  drawRectOutline(png, 34, 36, 46, 48, t, color)
}

// Icon: Refrigerator (Lucide Refrigerator style)
function drawFridge(png, color) {
  const t = 2
  // Outer rect
  drawRectOutline(png, 22, 14, 58, 64, t, color)
  // Divider line
  drawLine(png, 22, 34, 58, 34, t, color)
  // Top handle
  drawLine(png, 50, 20, 50, 28, t, color)
  // Bottom handle
  drawLine(png, 50, 42, 50, 50, t, color)
}

// Icon: User (Lucide User style - circle head + shoulders)
function drawUser(png, color) {
  const t = 2
  // Head circle
  drawCircleOutline(png, CENTER, 28, 11, t, color)
  // Shoulders arc
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
  { name: 'tab-calendar', draw: drawCalendar },
  { name: 'tab-plan', draw: drawPlan },
  { name: 'tab-fridge', draw: drawFridge },
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

console.log('All tabBar icons generated.')
