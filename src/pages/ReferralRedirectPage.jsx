import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { getPlatformName, useSettings } from '@/hooks/useSettings';

const PENDING_REFERRAL_KEY = 'pendingReferralCode';

const ReferralRedirectPage = () => {
  const { code } = useParams();
  const { settings } = useSettings();
  const platformName = getPlatformName(settings);
  const navigate = useNavigate();

  useEffect(() => {
    if (code) {
      sessionStorage.setItem(PENDING_REFERRAL_KEY, code);
    }
    navigate(`/signup?ref=${encodeURIComponent(code || '')}`, { replace: true });
  }, [code, navigate]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 text-foreground">
      <Helmet>
        <title>Referral Invite | {platformName}</title>
      </Helmet>
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Opening your referral invite...</p>
    </div>
  );
};

export default ReferralRedirectPage;
