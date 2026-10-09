import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import Confetti from 'react-confetti';
import { Check, Clock3, Copy, Gift, Link2, Loader2, MessageCircle, Send, Share2, Ticket, Trophy, UserPlus, Wallet } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { getPlatformName, useSettings } from '@/hooks/useSettings';
import GameAvatar from '@/components/GameAvatar';

const FRIENDS_PER_ENTRY = 3;

const steps = [
  { icon: Share2, title: 'Share your link', text: 'Send it to friends on WhatsApp or anywhere.' },
  { icon: Wallet, title: 'Friend joins and deposits', text: 'They sign up with your link and add money once.' },
  { icon: Ticket, title: 'You play free', text: `Every ${FRIENDS_PER_ENTRY} friends = 1 free entry into a paid solo tournament.` }
];

const formatJoined = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const ReferralPage = () => {
  const { toast } = useToast();
  const { settings } = useSettings();
  const platformName = getPlatformName(settings);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [copiedKey, setCopiedKey] = useState('');
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    let active = true;
    apiClient.get('/referrals/me', { cacheTtl: 0 })
      .then((result) => { if (active) setData(result); })
      .catch((error) => {
        toast({ title: 'Could not load referrals', description: error.message || 'Please try again.', variant: 'destructive' });
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [toast]);

  // Celebrate a newly earned free entry once per browser session.
  const latestAchievement = data?.achievements?.[0];
  useEffect(() => {
    if (!latestAchievement?.id) return undefined;
    const seenKey = `referral-achievement:${latestAchievement.id}`;
    try {
      if (sessionStorage.getItem(seenKey)) return undefined;
      sessionStorage.setItem(seenKey, 'seen');
    } catch {
      return undefined;
    }
    setCelebrate(true);
    const timer = window.setTimeout(() => setCelebrate(false), 5000);
    return () => window.clearTimeout(timer);
  }, [latestAchievement?.id]);

  const copy = async (value, key, label) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(''), 1600);
      toast({ title: `${label} copied` });
    } catch {
      toast({ title: 'Copy failed', description: 'Select it and copy manually.', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="font-semibold">Referrals could not be loaded.</p>
        <button type="button" onClick={() => window.location.reload()} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
          Try again
        </button>
      </div>
    );
  }

  const { referralCode, referralLink, stats, referrals } = data;
  const progress = Number(stats.currentProgress || 0);
  const friendsNeeded = FRIENDS_PER_ENTRY - progress;
  const freeEntries = Number(stats.freeEntriesAvailable ?? stats.freeEntriesEarned ?? 0);
  const countedFriends = referrals.filter((friend) => friend.depositComplete).length;
  const waitingFriends = referrals.length - countedFriends;

  const shareText = `Join me on ${platformName} and play BGMI & Free Fire tournaments! Sign up with my link:`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${referralLink}`)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`;

  const shareInvite = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Join me on ${platformName}`, text: shareText, url: referralLink });
        return;
      } catch {
        // Share sheet dismissed; nothing else to do.
        return;
      }
    }
    window.open(whatsappUrl, '_blank', 'noopener');
  };

  return (
    <div className="min-h-[calc(100vh-64px)] pb-28 pt-8 md:pb-16 md:pt-12">
      <Helmet>
        <title>Refer & Earn | {platformName}</title>
      </Helmet>

      {celebrate ? <Confetti recycle={false} numberOfPieces={220} gravity={0.18} /> : null}

      <div className="container mx-auto max-w-2xl space-y-5 px-4">
        <header className="text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
            <Gift className="h-6 w-6" />
          </span>
          <h1 className="text-3xl font-black tracking-tight md:text-4xl">Invite friends, play free</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground md:text-base">
            Get <strong className="text-foreground">1 free tournament entry</strong> for every {FRIENDS_PER_ENTRY} friends who join with your link and make their first deposit.
          </p>
        </header>

        {/* Progress towards the next free entry */}
        <section className="rounded-2xl border border-primary/25 bg-[linear-gradient(145deg,rgba(0,212,255,0.10),rgba(217,70,239,0.06))] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Next free entry</p>
              <p className="mt-0.5 text-2xl font-black">
                {progress} <span className="text-base font-bold text-muted-foreground">of {FRIENDS_PER_ENTRY} friends</span>
              </p>
            </div>
            <div className="flex gap-2" aria-label={`${progress} of ${FRIENDS_PER_ENTRY} friends counted`}>
              {Array.from({ length: FRIENDS_PER_ENTRY }, (_, index) => (
                <span
                  key={index}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                    index < progress ? 'border-secondary bg-secondary/20 text-secondary' : 'border-dashed border-border text-muted-foreground/50'
                  }`}
                >
                  {index < progress ? <Check className="h-5 w-5" /> : <UserPlus className="h-4 w-4" />}
                </span>
              ))}
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {friendsNeeded === FRIENDS_PER_ENTRY
              ? `Invite ${FRIENDS_PER_ENTRY} friends to unlock a free entry.`
              : `Just ${friendsNeeded} more ${friendsNeeded === 1 ? 'friend' : 'friends'} to go!`}
          </p>

          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/50 px-4 py-3">
            <div className="flex items-center gap-3">
              <Ticket className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm font-bold text-foreground">{freeEntries} free {freeEntries === 1 ? 'entry' : 'entries'} available</p>
                <p className="text-xs text-muted-foreground">Pick "Use Free Entry" when you join a paid solo tournament.</p>
              </div>
            </div>
            {freeEntries > 0 ? (
              <Link to="/tournaments" className="shrink-0 rounded-lg bg-accent px-3 py-2 text-xs font-bold text-accent-foreground hover:bg-accent/90">
                Use now
              </Link>
            ) : null}
          </div>
        </section>

        {/* Share */}
        <section className="rounded-2xl border border-border bg-card/60 p-5">
          <h2 className="text-lg font-bold">Your invite</h2>
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Your code</p>
              <p className="truncate font-mono text-2xl font-black tracking-wider text-primary">{referralCode}</p>
            </div>
            <button
              type="button"
              onClick={() => copy(referralCode, 'code', 'Code')}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-primary/30 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/10"
            >
              {copiedKey === 'code' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copiedKey === 'code' ? 'Copied' : 'Copy'}
            </button>
          </div>

          <button
            type="button"
            onClick={shareInvite}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 font-bold text-primary-foreground transition hover:bg-primary/90"
          >
            <Share2 className="h-5 w-5" /> Share invite link
          </button>

          <div className="mt-2 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => copy(referralLink, 'link', 'Invite link')}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-border px-2 py-2.5 text-sm font-semibold text-foreground hover:border-primary/40"
            >
              {copiedKey === 'link' ? <Check className="h-4 w-4 shrink-0 text-secondary" /> : <Link2 className="h-4 w-4 shrink-0" />} Link
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-border px-2 py-2.5 text-sm font-semibold text-foreground hover:border-secondary/50"
            >
              <MessageCircle className="h-4 w-4 shrink-0 text-secondary" /> WhatsApp
            </a>
            <a
              href={telegramUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-border px-2 py-2.5 text-sm font-semibold text-foreground hover:border-primary/50"
            >
              <Send className="h-4 w-4 shrink-0 text-primary" /> Telegram
            </a>
          </div>
        </section>

        {/* How it works */}
        <section className="rounded-2xl border border-border bg-card/40 p-5">
          <h2 className="mb-4 text-lg font-bold">How it works</h2>
          <ol className="space-y-4">
            {steps.map((step, index) => (
              <li key={step.title} className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-black text-primary">{index + 1}</span>
                <div>
                  <p className="font-semibold text-foreground">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Friends */}
        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 className="text-lg font-bold">Your friends</h2>
            {referrals.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-secondary">{countedFriends} counted</span>
                {waitingFriends > 0 ? <> · <span className="font-semibold text-amber-300">{waitingFriends} waiting</span></> : null}
              </p>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card/40">
            {referrals.length > 0 ? (
              <ul className="divide-y divide-border/60">
                {referrals.map((friend) => (
                  <li key={friend.id} className="flex items-center gap-3 px-4 py-3">
                    <GameAvatar avatarId={friend.avatarId} name={friend.username} size="sm" className="rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{friend.username}</p>
                      <p className="text-xs text-muted-foreground">Joined {formatJoined(friend.joinedAt)}</p>
                    </div>
                    {friend.depositComplete ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary/15 px-2.5 py-1 text-xs font-semibold text-secondary">
                        <Check className="h-3.5 w-3.5" /> Counted
                      </span>
                    ) : (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
                        <Clock3 className="h-3.5 w-3.5" /> Waiting for deposit
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-6 py-10 text-center">
                <UserPlus className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="font-semibold text-foreground">No friends invited yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Share your link. Friends who sign up show here.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {celebrate && latestAchievement ? (
        <div className="page-transition fixed inset-x-4 bottom-28 z-[60] mx-auto max-w-sm rounded-2xl border border-secondary/30 bg-card/95 p-4 shadow-2xl backdrop-blur lg:bottom-8">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
              <Trophy className="h-6 w-6" />
            </span>
            <div>
              <p className="font-black text-secondary">Free entry unlocked!</p>
              <p className="text-sm text-muted-foreground">{FRIENDS_PER_ENTRY} more friends made their first deposit.</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ReferralPage;
