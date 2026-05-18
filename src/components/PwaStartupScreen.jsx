import React, { useEffect, useState } from 'react';

const PwaStartupScreen = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 950);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="pwa-startup-screen" aria-label="Vexora loading screen">
      <img className="pwa-startup-logo" src="/brand/vexora-logo.png" alt="Vexora" />
      <div className="pwa-startup-subtitle">Loading arena</div>
      <div className="pwa-startup-bar">
        <span />
      </div>
    </div>
  );
};

export default PwaStartupScreen;
