import React, { useEffect, useState } from 'react';
import { isStandaloneMode } from '@/lib/pwa';

const PwaStartupScreen = () => {
  const [visible, setVisible] = useState(() => (
    isStandaloneMode() && sessionStorage.getItem('vexoraStartupSeen') !== '1'
  ));

  useEffect(() => {
    if (!visible) return undefined;
    sessionStorage.setItem('vexoraStartupSeen', '1');
    const timer = window.setTimeout(() => setVisible(false), 520);
    return () => window.clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="pwa-startup-screen" aria-label="Vexora loading screen">
      <img className="pwa-startup-logo" src="/brand/vexora-logo.png" alt="Vexora" width="320" height="128" loading="eager" decoding="async" fetchPriority="high" />
      <div className="pwa-startup-subtitle">Loading arena</div>
      <div className="pwa-startup-bar">
        <span />
      </div>
    </div>
  );
};

export default PwaStartupScreen;
