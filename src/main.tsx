import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './pages.css'
import './brand-theme.css'
import './notion-theme.css'
import './customer-flow.css'
import './staff-workspace.css'
import './liquid-glass-system.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
