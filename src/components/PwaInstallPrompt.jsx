import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { isStandaloneMode } from '@/lib/pwa';

const PwaInstallPrompt = () => {
  const location = useLocation();
  const [installPrompt, setInstallPrompt] = useState(null);
  const [visible, setVisible] = useState(true);
  const isHomePage = location.pathname === '/' || location.pathname === '/home';

  useEffect(() => {
    if (isStandaloneMode()) {
      return undefined;
    }

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    const handleInstalled = () => {
      setInstallPrompt(null);
      setVisible(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  useEffect(() => {
    if (isHomePage && !isStandaloneMode()) {
      setVisible(true);
    }
  }, [isHomePage]);

  const installApp = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
    setVisible(false);
  };

  const dismiss = () => {
    setVisible(false);
  };

  if (!visible || !installPrompt || !isHomePage) return null;

  return (
    <div className="fixed inset-x-3 bottom-[calc(6.8rem+env(safe-area-inset-bottom))] z-[70] mx-auto max-w-md rounded-2xl border border-primary/25 bg-[rgba(9,14,31,0.94)] p-3 pl-10 text-foreground shadow-[0_18px_60px_rgba(0,0,0,0.55),0_0_28px_rgba(0,212,255,0.16)] backdrop-blur-2xl lg:bottom-6 lg:right-6 lg:left-auto">
      <button
        type="button"
        onClick={dismiss}
        className="absolute left-2 top-2 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground"
        aria-label="Dismiss install prompt"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-3">
        <img src="/icons/vexora-icon-96.png" alt="Vexora" className="h-11 w-11 shrink-0 rounded-xl object-cover shadow-[0_0_18px_rgba(0,212,255,0.26)]" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black">Install Vexora</p>
          <p className="text-xs text-muted-foreground">Open fullscreen from your home screen.</p>
        </div>
        <button
          type="button"
          onClick={installApp}
          className="rounded-xl bg-primary px-3 py-2 text-xs font-black text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Install
        </button>
      </div>
    </div>
  );
};

export default PwaInstallPrompt;
