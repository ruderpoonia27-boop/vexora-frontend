import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import { cleanupServiceWorker } from '@/lib/serviceWorkerCleanup';

cleanupServiceWorker();

ReactDOM.createRoot(document.getElementById('root')).render(
	<App />
);
