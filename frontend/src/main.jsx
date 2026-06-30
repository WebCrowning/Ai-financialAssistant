import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/mobile.css'
import App from './App.jsx'

// Global fetch interceptor to handle authentication failures (expired/invalid tokens)
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const response = await originalFetch(...args);

  // Avoid auto-redirect loops. We only clear localStorage and let the app decide what to show.
  if (response.status === 401 || response.status === 403) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
    if (url.includes('/api/')) {
      try {
        const clone = response.clone();
        const data = await clone.json();
        if (data && (data.message === 'Token is invalid or expired' || data.message === 'Access token required')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // No redirect: prevents immediate navigation back to landing page.
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    }
  }

  return response;
};


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
