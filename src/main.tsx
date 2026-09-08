import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/base.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// When a freshly deployed service worker takes control (it uses skipWaiting +
// clientsClaim), reload once so the running page shows the new version instead
// of the previously cached shell. Guarded to fire only on a real update — not
// on the first install, and never in a loop.
if ('serviceWorker' in navigator) {
  const hadController = !!navigator.serviceWorker.controller
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading || !hadController) return
    reloading = true
    window.location.reload()
  })
}
