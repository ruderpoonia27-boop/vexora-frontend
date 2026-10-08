import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Download, RefreshCw, Share, WifiOff, X } from 'lucide-react';
import { isAndroid, useInstallPrompt, useOnlineStatus } from '@/lib/pwa';

const UPDATE_CHECK_MS = 30 * 60 * 1000;
// Optional direct download of the Android app (set once the APK is built and hosted).
const APK_URL = import.meta.env.VITE_ANDROID_APK_URL || '';
const INSTALL_DISMISS_KEY = 'installBannerDismissedAt';
const INSTALL_DISMISS_DAYS = 7;

const readDismissedAt = () => {
  try {
    return Number(localStorage.getItem(INSTALL_DISMISS_KEY) || 0);
  } catch {
    return 0;
  }
};

const OfflineBar = () => {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-[70] flex items-center justify-center gap-2 bg-amber-500 px-4 pb-2 pt-[max(env(safe-area-inset-top),0.5rem)] text-sm font-semibold text-black"
    >
      <WifiOff className="h-4 w-4" /> You're offline. Wallet and tournaments will update when you reconnect.
    </div>
  );
};

const UpdatePrompt = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    // This component mounts after the window load event, so register right away instead of waiting for it.
    immediate: true,
    onRegisteredSW(swUrl, registration) {
      if (!registration) return;
      // Check for a new version periodically and whenever the app comes back to the foreground.
      const check = () => {
        if (navigator.onLine && document.visibilityState === 'visible') registration.update().catch(() => {});
      };
      window.setInterval(check, UPDATE_CHECK_MS);
      document.addEventListener('visibilitychange', check);
    }
  });
  const [updating, setUpdating] = useState(false);

  if (!needRefresh) return null;

  return (
    <div className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+6.5rem)] z-[70] mx-auto max-w-md rounded-2xl border border-primary/30 bg-card/95 p-4 shadow-2xl backdrop-blur lg:bottom-6">
      <div className="flex items-center gap-3">
        <RefreshCw className="h-5 w-5 shrink-0 text-primary" />
        <p className="flex-1 text-sm font-medium text-foreground">A new version of Vexora is ready.</p>
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          className="rounded-lg px-2 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          Later
        </button>
        <button
          type="button"
          disabled={updating}
          onClick={() => {
            setUpdating(true);
            updateServiceWorker(true);
          }}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-60"
        >
          {updating ? 'Updating…' : 'Update'}
        </button>
      </div>
    </div>
  );
};

const InstallBanner = () => {
  const { canInstall, installed, ios, promptInstall } = useInstallPrompt();
  const [dismissedAt, setDismissedAt] = useState(readDismissedAt);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [ready, setReady] = useState(false);

  // Let the page settle before asking.
  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 4000);
    return () => window.clearTimeout(timer);
  }, []);

  const offerApk = Boolean(APK_URL) && isAndroid();
  const recentlyDismissed = Date.now() - dismissedAt < INSTALL_DISMISS_DAYS * 24 * 60 * 60 * 1000;
  if (!ready || installed || recentlyDismissed || (!canInstall && !ios && !offerApk)) return null;

  const dismiss = () => {
    const now = Date.now();
    setDismissedAt(now);
    try {
      localStorage.setItem(INSTALL_DISMISS_KEY, String(now));
    } catch {
      // Banner simply shows again next visit.
    }
  };

  return (
    <div className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+6.5rem)] z-[60] mx-auto max-w-md rounded-2xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur lg:bottom-6">
      <div className="flex items-start gap-3">
        <img src="/icons/vexora-icon-96.png" alt="" className="h-11 w-11 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground">Install the Vexora app</p>
          {showIosHelp ? (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Tap <Share className="inline h-3.5 w-3.5 align-text-bottom" /> <strong>Share</strong> in Safari, then <strong>Add to Home Screen</strong>.
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">Faster, full screen, and one tap from your home screen.</p>
          )}
        </div>
        <button type="button" onClick={dismiss} aria-label="Not now" className="rounded-lg p-1 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      {!showIosHelp && (canInstall || ios) ? (
        <button
          type="button"
          onClick={async () => {
            if (canInstall) {
              const outcome = await promptInstall();
              if (outcome === 'dismissed') dismiss();
            } else {
              setShowIosHelp(true);
            }
          }}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"
        >
          <Download className="h-4 w-4" /> Install app
        </button>
      ) : null}
      {offerApk ? (
        <a
          href={APK_URL}
          className={`mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${
            canInstall ? 'border border-border text-foreground' : 'bg-primary text-primary-foreground'
          }`}
        >
          <Download className="h-4 w-4" /> Download Android APK
        </a>
      ) : null}
    </div>
  );
};

const AppShellNotices = () => (
  <>
    <OfflineBar />
    <UpdatePrompt />
    <InstallBanner />
  </>
);

export default AppShellNotices;
