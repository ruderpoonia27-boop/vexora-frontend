import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, FileText, Mail, MessageCircle, ShieldCheck } from 'lucide-react';
import { COMPANY_NAME, PLATFORM_NAME, SUPPORT_EMAIL, SUPPORT_WHATSAPP } from '@/data/legalContent';
import { getPlatformName, useSettings } from '@/hooks/useSettings';
import { isStandaloneMode } from '@/lib/pwa';

const policyLinks = [
  { to: '/terms-and-conditions', label: 'Terms & Conditions' },
  { to: '/privacy-policy', label: 'Privacy Policy' },
  { to: '/refund-policy', label: 'Refund Policy' },
  { to: '/fair-play-policy', label: 'Fair Play Policy' },
  { to: '/community-guidelines', label: 'Community Guidelines' },
  { to: '/contact-us', label: 'Contact Us' }
];

export const Footer = () => {
  const { settings } = useSettings();
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalledView, setIsInstalledView] = useState(() => isStandaloneMode());
  const supportEmail = settings?.contact_email || settings?.contactEmail || SUPPORT_EMAIL;
  const platformName = getPlatformName(settings);
  const companyName = COMPANY_NAME.replaceAll(PLATFORM_NAME, platformName);
  const canInstall = !isInstalledView && installPrompt;

  useEffect(() => {
    if (isStandaloneMode()) {
      setIsInstalledView(true);
      return undefined;
    }

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    const handleInstalled = () => {
      setInstallPrompt(null);
      setIsInstalledView(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <footer className="mt-auto border-t border-border/50 bg-card/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(0,0.9fr)]">
          <div>
            <Link to="/" className="mb-4 flex items-center gap-2 text-primary">
              <img src="/brand/vexora-logo.png" alt={platformName} className="h-16 w-auto object-contain drop-shadow-[0_0_14px_rgba(0,212,255,0.35)]" />
              <span className="sr-only">{platformName}</span>
            </Link>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Competitive mobile esports tournaments, wallet-based entries, referral rewards, and admin-reviewed payouts in one premium arena.
            </p>
            {canInstall && (
              <button
                type="button"
                onClick={installApp}
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-primary/25 bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground shadow-[0_0_22px_rgba(0,212,255,0.18)] transition-colors hover:bg-primary/90"
              >
                <Download className="h-4 w-4" />
                <span>Download App</span>
              </button>
            )}
            <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/8 p-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">{companyName}</p>
                  <p className="mt-1">
                    Support:{' '}
                    <a href={`mailto:${supportEmail}`} className="text-primary hover:text-primary/80">
                      {supportEmail}
                    </a>
                  </p>
                  <p className="mt-1 inline-flex flex-wrap items-center gap-1.5">
                    <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" />
                    <a href={SUPPORT_WHATSAPP} target="_blank" rel="noreferrer" className="text-primary hover:text-primary/80">
                      WhatsApp Channel
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-foreground">Platform</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/home" className="transition-colors hover:text-primary">Home</Link></li>
              <li><Link to="/tournaments" className="transition-colors hover:text-primary">Tournaments</Link></li>
              <li><Link to="/leaderboard" className="transition-colors hover:text-primary">Leaderboard</Link></li>
              <li><Link to="/wallet" className="transition-colors hover:text-primary">Wallet</Link></li>
              <li><Link to="/referral" className="transition-colors hover:text-primary">Referral Center</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-foreground">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {policyLinks.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="inline-flex items-center gap-2 transition-colors hover:text-primary">
                    <FileText className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border/50 pt-8 text-xs text-muted-foreground md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} {platformName}. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/terms-and-conditions" className="transition-colors hover:text-foreground">Terms</Link>
            <Link to="/privacy-policy" className="transition-colors hover:text-foreground">Privacy</Link>
            <Link to="/refund-policy" className="transition-colors hover:text-foreground">Refunds</Link>
            <a href={`mailto:${supportEmail}`} className="inline-flex items-center gap-1 transition-colors hover:text-foreground">
              <Mail className="h-3.5 w-3.5" />
              <span>Support</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
