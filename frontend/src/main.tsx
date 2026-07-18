import '@/styles/reset.css'
import '@/styles/design-system.css'
import '@/styles/animations.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'

// Set initial theme on app startup
const savedTheme = localStorage.getItem('tracemind_theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

