import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import FraudApp from './FraudApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FraudApp />
  </StrictMode>,
)
