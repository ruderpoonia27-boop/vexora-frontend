import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import Confetti from 'react-confetti';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  Copy,
  Loader2,
  Rocket,
  Send,
  Share2,
  Sparkles,
  Swords,
  Trophy,
  Users
} from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { getPlatformName, useSettings } from '@/hooks/useSettings';
import GameAvatar from '@/components/GameAvatar';

const stageConfig = (item) => {
  if (item.depositComplete) {
    return {
      percent: 100,
      statusLabel: 'Deposit Complete',
      barClass: 'from-secondary via-primary to-accent'
    };
  }

  return {
    percent: 50,
    statusLabel: 'Signup Complete',
    barClass: 'from-primary via-primary to-primary/40'
  };
};

const ReferralPage = () => {
  const { toast } = useToast();
  const { settings } = useSettings();
  const platformName = getPlatformName(settings);
  const [loading, setLoading] = useState(true);
  const [referralData, setReferralData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showAchievement, setShowAchievement] = useState(false);
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  const loadReferralData = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get('/referrals/me');
      setReferralData(data);
    } catch (error) {
      toast({
        title: 'Unable to load referral center',
        description: error.message || 'Please refresh and try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferralData();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const latestAchievement = referralData?.achievements?.[0] || null;

  useEffect(() => {
    if (!latestAchievement?.id) return;

    const seenKey = `referral-achievement:${latestAchievement.id}`;
    if (sessionStorage.getItem(seenKey)) {
      return;
    }

    sessionStorage.setItem(seenKey, 'seen');
    setShowAchievement(true);

    const timer = window.setTimeout(() => setShowAchievement(false), 5200);
    return () => window.clearTimeout(timer);
  }, [latestAchievement?.id]);

  const completionRatio = useMemo(() => (
    `${referralData?.stats?.currentProgress || 0} / 3`
  ), [referralData?.stats?.currentProgress]);

  const handleCopy = async (value, label) => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast({ title: `${label} copied`, description: 'Ready to share with your squad.' });
    window.setTimeout(() => setCopied(false), 1800);
  };

  const handleNativeShare = async () => {
    if (!referralData?.referralLink) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join me on ${platformName}`,
          text: `Use my referral code ${referralData.referralCode} and start your grind on ${platformName}.`,
          url: referralData.referralLink
        });
        return;
      } catch {
        // User cancelled share; fall through to web share buttons.
      }
    }

    await handleCopy(referralData.referralLink, 'Referral link');
  };

  const socialShareLinks = useMemo(() => {
    const link = encodeURIComponent(referralData?.referralLink || '');
    const message = encodeURIComponent(`Join me on ${platformName} with my referral code ${referralData?.referralCode || ''}`);
    return {
      whatsapp: `https://wa.me/?text=${message}%20${link}`,
      telegram: `https://t.me/share/url?url=${link}&text=${message}`
    };
  }, [platformName, referralData?.referralCode, referralData?.referralLink]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!referralData) {
    return null;
  }

  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-x-clip bg-background py-8 md:py-12">
      <Helmet>
        <title>Referral Center | {platformName}</title>
      </Helmet>

      {showAchievement ? (
        <Confetti
          width={viewport.width}
          height={viewport.height}
          recycle={false}
          numberOfPieces={240}
          gravity={0.16}
        />
      ) : null}

      <div className="container relative z-10 mx-auto max-w-6xl px-4">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-primary">
              <Sparkles className="h-4 w-4" /> Referral Center
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight md:text-4xl">
              Squad Rewards
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Share your code. Every 3 first deposits unlocks 1 free entry.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-2xl border border-primary/25 bg-card/70 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-primary/75">Entries</p>
              <p className="mt-1 text-2xl font-black text-primary">{referralData.stats.freeEntriesEarned}</p>
            </div>
            <div className="rounded-2xl border border-accent/25 bg-card/70 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-accent/80">Squads</p>
              <p className="mt-1 text-2xl font-black text-accent">{referralData.stats.squadsCompleted}</p>
            </div>
            <div className="rounded-2xl border border-secondary/25 bg-card/70 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-secondary/80">Progress</p>
              <p className="mt-1 text-2xl font-black text-secondary">{completionRatio}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-3xl border border-primary/15 bg-card/70 p-4 shadow-[0_12px_36px_rgba(0,0,0,0.24)] md:p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-primary/12 p-3 text-primary">
                <Rocket className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Share Your Invite</h2>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-2xl border border-primary/20 bg-primary/8 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-primary/80">Referral Code</p>
                <p className="mt-2 break-all text-2xl font-black text-primary text-glow-primary">{referralData.referralCode}</p>
                <button
                  type="button"
                  onClick={() => handleCopy(referralData.referralCode, 'Referral code')}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-sm font-bold text-primary transition-all hover:scale-[1.02] hover:bg-primary hover:text-primary-foreground"
                >
                  <Copy className="h-4 w-4" /> {copied ? 'Copied' : 'Copy Code'}
                </button>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/35 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Referral Link</p>
                <p className="mt-2 break-all rounded-xl border border-primary/15 bg-background/60 px-3 py-2 font-mono text-sm text-foreground">
                  {referralData.referralLink}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(referralData.referralLink, 'Referral link')}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-primary-foreground transition-all hover:scale-[1.02] hover:bg-primary/90"
                  >
                    <Copy className="h-4 w-4" /> Copy Link
                  </button>
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="inline-flex items-center gap-2 rounded-xl border border-accent/25 bg-accent/10 px-3 py-2 text-sm font-bold text-accent transition-all hover:scale-[1.02] hover:bg-accent hover:text-accent-foreground"
                  >
                    <Share2 className="h-4 w-4" /> Share
                  </button>
                  <a
                    href={socialShareLinks.whatsapp}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-secondary/25 bg-secondary/10 px-3 py-2 text-sm font-bold text-secondary transition-all hover:scale-[1.02]"
                  >
                    <Send className="h-4 w-4" /> WhatsApp
                  </a>
                  <a
                    href={socialShareLinks.telegram}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-sm font-bold text-primary transition-all hover:scale-[1.02]"
                  >
                    <Send className="h-4 w-4" /> Telegram
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-2xl border border-secondary/20 bg-secondary/10 px-4 py-3 text-sm text-muted-foreground">
              <Swords className="h-4 w-4 text-secondary" />
              <span><strong className="text-foreground">{referralData.stats.completedReferrals}</strong> completed referrals. Target: <strong className="text-foreground">3</strong> for each free entry.</span>
            </div>
          </section>

          <section className="rounded-3xl border border-border/60 bg-card/70 p-4 shadow-[0_12px_36px_rgba(0,0,0,0.24)] md:p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-accent/12 p-3 text-accent">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Referral Progress</h2>
              </div>
            </div>

            <div className="space-y-3">
              {referralData.referrals.length > 0 ? referralData.referrals.map((item) => {
                const stage = stageConfig(item);
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-border/60 bg-background/35 p-4"
                  >
                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <GameAvatar avatarId={item.avatarId} name={item.username} size="sm" className="rounded-xl" />
                        <div>
                          <p className="font-bold text-foreground">{item.username}</p>
                          <p className="text-xs text-muted-foreground">{item.email || 'Arena recruit'}</p>
                        </div>
                      </div>
                      <div className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${
                        item.depositComplete
                          ? 'bg-secondary/15 text-secondary'
                          : 'bg-primary/15 text-primary'
                      }`}>
                        {item.depositComplete ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                        {stage.statusLabel}
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-full border border-primary/15 bg-background/70">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stage.percent}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-2 rounded-full bg-gradient-to-r ${stage.barClass}`}
                      />
                    </div>
                  </motion.div>
                );
              }) : (
                <div className="rounded-2xl border border-dashed border-border/60 bg-background/35 px-6 py-10 text-center">
                  <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                  <p className="font-semibold text-foreground">No invited players yet</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <AnimatePresence>
        {showAchievement && latestAchievement ? (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            className="fixed inset-x-4 bottom-28 z-[60] mx-auto max-w-md rounded-[28px] border border-secondary/30 bg-[rgba(12,20,40,0.96)] p-5 shadow-[0_0_40px_rgba(34,197,94,0.18)] backdrop-blur-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-secondary/15 p-3 text-secondary">
                <Trophy className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-secondary/80">Achievement Unlocked</p>
                <p className="mt-2 text-xl font-black text-secondary">{latestAchievement.title}</p>
                <p className="mt-1 text-sm text-foreground">{latestAchievement.subtitle}</p>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default ReferralPage;
