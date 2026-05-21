export const cleanupServiceWorker = () => {
  const clearCaches = () => {
    if (!('caches' in window)) return Promise.resolve();
    return caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))));
  };

  clearCaches().catch((error) => {
    console.warn('Cache cleanup failed:', error);
  });

  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.getRegistrations()
    .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
    .catch((error) => {
      console.warn('Service worker cleanup failed:', error);
    });
};
