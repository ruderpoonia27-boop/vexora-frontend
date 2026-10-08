import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import { cleanupServiceWorker } from '@/lib/serviceWorkerCleanup';
import { captureInstallPrompt } from '@/lib/pwa';

// The service worker only runs in production builds; never let one serve stale files in dev.
if (import.meta.env.DEV) {
	cleanupServiceWorker();
}
captureInstallPrompt();

ReactDOM.createRoot(document.getElementById('root')).render(
	<App />
);
