import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-heritage-cream"><div className="animate-spin h-8 w-8 border-4 border-silk-gold border-t-transparent rounded-full" /></div>}>
      <App />
    </Suspense>
  </StrictMode>,
)
