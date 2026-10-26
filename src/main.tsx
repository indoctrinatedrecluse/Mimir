import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ErrorBoundary } from './components/common/ErrorBoundary'

// Catch and display any unhandled error before or outside React mount
window.addEventListener('error', (event) => {
  console.error('[Mímir Runic Loom] Unhandled window error:', event.error || event.message);
  const root = document.getElementById('root');
  if (root && (!root.innerHTML || root.innerHTML.trim() === '')) {
    root.innerHTML = `
      <div style="background:#05070a;color:#f87171;font-family:monospace;padding:32px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;">
        <div style="border:1px solid rgba(239,68,68,0.4);border-radius:12px;padding:24px;max-width:600px;background:#090d14;">
          <h2 style="margin:0 0 12px 0;font-size:18px;color:#fca5a5;">ᚦ Mímir Initialization Exception</h2>
          <p style="color:#cbd5e1;font-size:13px;line-height:1.5;">${(event.error?.message || event.message || 'Unknown initialization error').replace(/</g, '&lt;')}</p>
          <pre style="margin-top:12px;font-size:11px;color:#94a3b8;white-space:pre-wrap;background:#030508;padding:12px;border-radius:8px;">${(event.error?.stack || '').replace(/</g, '&lt;')}</pre>
          <button onclick="location.reload()" style="margin-top:16px;background:#b45309;color:#fff;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-weight:bold;">Reawaken Sanctum</button>
        </div>
      </div>
    `;
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

