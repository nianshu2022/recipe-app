import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initStatusBar } from './utils/statusbar'

initStatusBar()

// 检查 Service Worker 更新
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistration().then((reg) => {
    if (reg) {
      reg.update()
    }
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
