import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { cleanupLegacyBrowserStorage } from './utils/storage.ts'

const CHUNK_RELOAD_KEY = 'flowpdpa:chunk-reload-at'

// A user may keep an old hashed bundle open while a new deployment replaces
// its lazy-loaded chunks. Recover once with a cache-busting navigation.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()

  const lastReloadAt = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0)
  if (Date.now() - lastReloadAt < 30_000) return

  sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()))
  const url = new URL(window.location.href)
  url.searchParams.set('__app_reload', String(Date.now()))
  window.location.replace(url)
})

window.setTimeout(() => sessionStorage.removeItem(CHUNK_RELOAD_KEY), 30_000)

cleanupLegacyBrowserStorage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
