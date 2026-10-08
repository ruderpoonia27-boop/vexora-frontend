import { useEffect, useState } from 'react';

// Chrome fires `beforeinstallprompt` once, often before React mounts, so capture it at startup.
let deferredPrompt = null;
const listeners = new Set();
const notify = () => listeners.forEach((listener) => listener());

export const captureInstallPrompt = () => {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notify();
  });
};

export const isRunningAsApp = () => (
  window.matchMedia?.('(display-mode: standalone)').matches
  || window.matchMedia?.('(display-mode: minimal-ui)').matches
  || window.navigator.standalone === true
  || document.referrer.startsWith('android-app://')
);

export const isIOS = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent)
  || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);

export const isAndroid = () => /android/i.test(window.navigator.userAgent);

export const useInstallPrompt = () => {
  const [, forceRender] = useState(0);

  useEffect(() => {
    const listener = () => forceRender((count) => count + 1);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return 'unavailable';
    const promptEvent = deferredPrompt;
    deferredPrompt = null;
    notify();
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    return outcome;
  };

  return {
    canInstall: Boolean(deferredPrompt),
    installed: isRunningAsApp(),
    ios: isIOS(),
    promptInstall
  };
};

export const useOnlineStatus = () => {
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return online;
};
