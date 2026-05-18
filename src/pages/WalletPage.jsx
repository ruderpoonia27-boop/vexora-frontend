import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  Clock3,
  Copy,
  CreditCard,
  History,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Wallet
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getPlatformName, useSettings } from '@/hooks/useSettings';
import { usePaymentSettings } from '@/hooks/usePaymentSettings';
import apiClient from '@/lib/apiClient';
import { Skeleton } from '@/components/ui/skeleton';

const requestTabs = [
  { key: 'deposit', label: 'Deposit', icon: ArrowDownCircle },
  { key: 'withdraw', label: 'Withdraw', icon: ArrowUpCircle },
  { key: 'activity', label: 'Activity', icon: History }
];

const activityFilters = [
  { key: 'all', label: 'All Activity' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' }
];

const formatDateTime = (value) => {
  if (!value) return 'Just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';
  return date.toLocaleString();
};

const getActivityConfig = (item) => {
  if (item.type === 'refund') {
    return {
      title: 'Refund Received',
      amountPrefix: '+',
      amountClass: 'text-secondary',
      badgeClass: 'bg-secondary/15 text-secondary border border-secondary/30'
    };
  }

  if (item.type === 'reward') {
    return {
      title: item.description || 'Tournament Winning Reward',
      amountPrefix: '+',
      amountClass: 'text-accent',
      badgeClass: 'bg-accent/15 text-accent border border-accent/30'
    };
  }

  if (item.type === 'withdrawal') {
    return {
      title: 'Withdrawal Request',
      amountPrefix: '-',
      amountClass: 'text-accent',
      badgeClass:
        item.status === 'approved'
          ? 'bg-secondary/15 text-secondary border border-secondary/30'
          : item.status === 'rejected'
            ? 'bg-destructive/15 text-destructive border border-destructive/30'
            : 'bg-accent/15 text-accent border border-accent/30'
    };
  }

  return {
    title: 'Deposit Request',
    amountPrefix: '+',
    amountClass: 'text-primary',
    badgeClass:
      item.status === 'approved'
        ? 'bg-secondary/15 text-secondary border border-secondary/30'
        : item.status === 'rejected'
          ? 'bg-destructive/15 text-destructive border border-destructive/30'
          : 'bg-primary/15 text-primary border border-primary/30'
  };
};

const WalletPage = () => {
  const { currentUser, refreshUser } = useAuth();
  const { toast } = useToast();
  const { settings, loading: settingsLoading } = useSettings();
  const { paymentSettings, loading: paymentSettingsLoading } = usePaymentSettings();
  const [searchParams, setSearchParams] = useSearchParams();

  const minDeposit = settings?.min_deposit_amount || 10;
  const minWithdraw = settings?.min_withdraw_amount || 50;
  const platformName = getPlatformName(settings);
  const upiId = paymentSettings?.upi_id || 'tournament@upi';
  const qrCode = paymentSettings?.qr_code || '';

  const initialTab = searchParams.get('tab') === 'withdraw' ? 'withdraw' : 'deposit';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [activityFilter, setActivityFilter] = useState('all');

  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState('upi');
  const [transactionId, setTransactionId] = useState('');
  const [depositSubmitting, setDepositSubmitting] = useState(false);

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawUpiId, setWithdrawUpiId] = useState('');
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);

  const [depositsHistory, setDepositsHistory] = useState([]);
  const [withdrawalsHistory, setWithdrawalsHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if ((searchParams.get('tab') || 'deposit') !== activeTab) {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.set('tab', activeTab);
        return next;
      }, { replace: true });
    }
  }, [activeTab, searchParams, setSearchParams]);

  const fetchWalletData = async () => {
    if (!currentUser?.id) return;
    setHistoryLoading(true);
    try {
      const [depositData, withdrawalData] = await Promise.all([
        apiClient.get(`/users/deposits/${currentUser.id}`),
        apiClient.get(`/users/withdrawals/history/${currentUser.id}`)
      ]);
      setDepositsHistory(Array.isArray(depositData) ? depositData : []);
      setWithdrawalsHistory(
        Array.isArray(withdrawalData)
          ? withdrawalData.map((item) => ({ ...item, type: 'withdrawal' }))
          : []
      );
    } catch (error) {
      toast({
        title: 'Unable to load wallet activity',
        description: error.message || 'Please try again in a moment.',
        variant: 'destructive'
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser?.id) return undefined;

    const refreshAll = async () => {
      await refreshUser();
      await fetchWalletData();
    };

    refreshAll();
    const handleFocus = () => {
      refreshAll();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentUser?.id]);

  const walletActivity = useMemo(() => (
    [...depositsHistory, ...withdrawalsHistory].sort(
      (left, right) => new Date(right.createdAt || right.created || 0) - new Date(left.createdAt || left.created || 0)
    )
  ), [depositsHistory, withdrawalsHistory]);

  const filteredActivity = useMemo(() => {
    if (activityFilter === 'all') {
      return walletActivity;
    }
    return walletActivity.filter((item) => (item.status || 'approved') === activityFilter);
  }, [activityFilter, walletActivity]);

  const pendingWithdrawalAmount = useMemo(() => (
    withdrawalsHistory
      .filter((item) => item.status === 'pending')
      .reduce((total, item) => total + Number(item.amount || 0), 0)
  ), [withdrawalsHistory]);

  const availableToWithdraw = Math.max(0, Number(currentUser?.walletBalance || 0) - pendingWithdrawalAmount);

  const activityStats = useMemo(() => ({
    pending: walletActivity.filter((item) => item.status === 'pending').length,
    approved: walletActivity.filter((item) => item.type === 'refund' || item.status === 'approved').length,
    rejected: walletActivity.filter((item) => item.status === 'rejected').length
  }), [walletActivity]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast({ title: 'Copied', description: 'UPI ID copied to clipboard.' });
    window.setTimeout(() => setCopied(false), 1800);
  };

  const handleDepositSubmit = async (event) => {
    event.preventDefault();
    const amount = Number(depositAmount);

    if (Number.isNaN(amount) || amount < minDeposit) {
      toast({ title: 'Invalid amount', description: `Minimum deposit is Rs.${minDeposit}.`, variant: 'destructive' });
      return;
    }
    if (!transactionId.trim()) {
      toast({ title: 'Transaction ID required', description: 'Please enter your payment reference.', variant: 'destructive' });
      return;
    }

    setDepositSubmitting(true);
    try {
      await apiClient.post('/users/wallet-request', {
        userId: currentUser._id,
        amount,
        transactionId: transactionId.trim(),
        method: depositMethod
      });
      toast({ title: 'Deposit request sent', description: 'Your payment is waiting for admin approval.' });
      setDepositAmount('');
      setTransactionId('');
      await fetchWalletData();
    } catch (error) {
      toast({ title: 'Deposit failed', description: error.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setDepositSubmitting(false);
    }
  };

  const handleWithdrawSubmit = async (event) => {
    event.preventDefault();
    const amount = Number(withdrawAmount);

    if (Number.isNaN(amount) || amount < minWithdraw) {
      toast({ title: 'Invalid amount', description: `Minimum withdrawal is Rs.${minWithdraw}.`, variant: 'destructive' });
      return;
    }
    if (amount > availableToWithdraw) {
      toast({ title: 'Insufficient balance', description: 'Your available balance is lower than this request.', variant: 'destructive' });
      return;
    }
    if (!withdrawUpiId.trim()) {
      toast({ title: 'UPI ID required', description: 'Enter the UPI ID where you want to receive funds.', variant: 'destructive' });
      return;
    }

    setWithdrawSubmitting(true);
    try {
      await apiClient.post('/withdrawals', {
        userId: currentUser._id,
        amount,
        upiId: withdrawUpiId.trim()
      });
      toast({ title: 'Withdrawal request sent', description: 'Your payout request is now pending admin approval.' });
      setWithdrawAmount('');
      setWithdrawUpiId('');
      await refreshUser();
      await fetchWalletData();
    } catch (error) {
      toast({ title: 'Withdrawal failed', description: error.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-[calc(100vh-64px)] py-8 md:py-12">
      <Helmet>
        <title>Wallet | {platformName}</title>
      </Helmet>

      <div className="container mx-auto max-w-5xl px-4">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight md:text-4xl">Wallet Control Center</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
              Handle deposits, withdrawals, and wallet activity from one esports-ready dashboard.
            </p>
          </div>
          <button
            type="button"
            onClick={async () => {
              await refreshUser();
              await fetchWalletData();
            }}
            className="inline-flex items-center gap-2 self-start rounded-2xl border border-primary/25 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary transition-all duration-300 hover:scale-[1.02] hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_24px_rgba(59,130,246,0.28)]"
          >
            <RefreshCw className="h-4 w-4" /> Refresh Wallet
          </button>
        </div>

        <section className="relative overflow-hidden rounded-[28px] border border-primary/20 bg-[linear-gradient(145deg,rgba(11,18,40,0.96),rgba(15,24,52,0.9))] p-5 shadow-[0_0_26px_rgba(59,130,246,0.14)] md:p-6">
          <div className="absolute -right-8 -top-8 text-primary/10">
            <Wallet className="h-28 w-28" />
          </div>
          <div className="relative z-10 flex flex-col gap-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/70">Wallet Balance</p>
                <p className="mt-2 text-4xl font-black text-primary text-glow-primary md:text-5xl">Rs.{currentUser.walletBalance || 0}</p>
                <p className="mt-2 text-xs text-muted-foreground">Live balance synced with approved wallet actions.</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('deposit')}
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-all hover:scale-[1.02] hover:bg-primary/90"
                >
                  <ArrowDownCircle className="h-4 w-4" /> Deposit
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('withdraw')}
                  className="inline-flex items-center gap-2 rounded-2xl bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground transition-all hover:scale-[1.02] hover:bg-accent/90"
                >
                  <ArrowUpCircle className="h-4 w-4" /> Withdraw
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('activity')}
                  className="inline-flex items-center gap-2 rounded-2xl border border-border/70 bg-background/45 px-4 py-2.5 text-sm font-bold text-foreground transition-all hover:border-primary/20 hover:text-primary"
                >
                  <History className="h-4 w-4" /> Activity
                </button>
              </div>
            </div>

          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-[28px] border border-border/60 bg-[rgba(8,13,28,0.9)] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.34)] backdrop-blur-2xl md:p-5">
            <div className="mb-4 flex flex-wrap gap-2 rounded-2xl border border-primary/15 bg-background/40 p-1">
              {requestTabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative flex flex-1 items-center justify-center gap-2 rounded-[18px] px-4 py-3 text-sm font-bold transition-all duration-300 ${
                      active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {active ? (
                      <motion.span
                        layoutId="wallet-active-tab"
                        className="absolute inset-0 rounded-[18px] border border-primary/25 bg-primary/12 shadow-[0_0_22px_rgba(59,130,246,0.22),0_0_36px_rgba(168,85,247,0.14)]"
                        transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                      />
                    ) : null}
                    <Icon className="relative z-10 h-4 w-4" />
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'deposit' ? (
                <motion.div
                  key="deposit"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-5"
                >
                  <div className="flex items-start gap-3 rounded-2xl border border-primary/15 bg-primary/8 p-3.5">
                    <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Pay with UPI or QR and submit your transaction ID for admin approval.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 rounded-2xl border border-border/60 bg-background/35 p-1">
                    <button
                      type="button"
                      onClick={() => setDepositMethod('upi')}
                      className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                        depositMethod === 'upi'
                          ? 'bg-primary/12 text-primary shadow-[0_0_18px_rgba(59,130,246,0.18)]'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Smartphone className="h-4 w-4" /> UPI Payment
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDepositMethod('qr_code')}
                      className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                        depositMethod === 'qr_code'
                          ? 'bg-primary/12 text-primary shadow-[0_0_18px_rgba(59,130,246,0.18)]'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <QrCode className="h-4 w-4" /> QR Payment
                      </span>
                    </button>
                  </div>

                  <div className="rounded-[24px] border border-border/60 bg-background/35 p-4">
                    {(settingsLoading || paymentSettingsLoading) ? (
                      <Skeleton className="h-44 w-full rounded-2xl" />
                    ) : depositMethod === 'upi' ? (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">Send your deposit to this UPI ID from any supported app.</p>
                        <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-[rgba(18,28,62,0.55)] px-4 py-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-primary/70">Official UPI</p>
                            <p className="mt-1 break-all font-mono text-base font-bold text-foreground">{upiId}</p>
                          </div>
                          <button
                            type="button"
                            onClick={handleCopy}
                            className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-primary transition-all hover:scale-105 hover:bg-primary hover:text-primary-foreground"
                          >
                            {copied ? <CheckCircle2 className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 text-center">
                        <p className="text-sm text-muted-foreground">Scan and pay, then submit your UTR below.</p>
                        {qrCode ? (
                          <img
                            src={qrCode}
                            alt="Payment QR code"
                            className="mx-auto h-44 w-44 rounded-2xl border border-border bg-white object-contain p-2"
                          />
                        ) : (
                          <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-2xl border border-dashed border-border bg-background/40 text-muted-foreground">
                            <QrCode className="h-14 w-14 opacity-30" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleDepositSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Amount</label>
                        <input
                          type="number"
                          value={depositAmount}
                          onChange={(event) => setDepositAmount(event.target.value)}
                          min={minDeposit}
                          placeholder={`Minimum Rs.${minDeposit}`}
                          className="w-full rounded-2xl border border-border bg-background/60 px-4 py-3 text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        {depositAmount && Number(depositAmount) < minDeposit ? (
                          <p className="flex items-center gap-1 text-xs text-destructive">
                            <AlertCircle className="h-3.5 w-3.5" /> Minimum deposit is Rs.{minDeposit}
                          </p>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Transaction ID / UTR</label>
                        <input
                          type="text"
                          value={transactionId}
                          onChange={(event) => setTransactionId(event.target.value)}
                          placeholder="Enter payment reference"
                          className="w-full rounded-2xl border border-border bg-background/60 px-4 py-3 text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={depositSubmitting || !depositAmount || !transactionId.trim()}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 font-bold text-primary-foreground transition-all duration-300 hover:scale-[1.01] hover:bg-primary/90 hover:shadow-[0_0_28px_rgba(59,130,246,0.3)] disabled:opacity-50"
                    >
                      {depositSubmitting ? <RefreshCw className="h-5 w-5 animate-spin" /> : <ArrowDownCircle className="h-5 w-5" />}
                      Submit Deposit Request
                    </button>
                  </form>
                </motion.div>
              ) : activeTab === 'withdraw' ? (
                <motion.div
                  key="withdraw"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-5"
                >
                  <div className="flex items-start gap-3 rounded-2xl border border-accent/15 bg-accent/8 p-3.5">
                    <CreditCard className="mt-0.5 h-5 w-5 text-accent" />
                    <div>
                      <p className="font-semibold text-foreground">Withdraw winnings to your personal UPI</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Requests stay pending until admin approval. Your wallet balance updates when the request is approved.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-background/35 p-4 text-sm text-muted-foreground">
                    Available to withdraw right now: <span className="font-bold text-foreground">Rs.{availableToWithdraw}</span>
                    {pendingWithdrawalAmount > 0 ? (
                      <span className="block pt-1 text-xs">Pending payout reserve: Rs.{pendingWithdrawalAmount}</span>
                    ) : null}
                  </div>

                  <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Withdrawal Amount</label>
                        <input
                          type="number"
                          value={withdrawAmount}
                          onChange={(event) => setWithdrawAmount(event.target.value)}
                          min={minWithdraw}
                          max={availableToWithdraw}
                          placeholder={`Minimum Rs.${minWithdraw}`}
                          className="w-full rounded-2xl border border-border bg-background/60 px-4 py-3 text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                        {withdrawAmount && Number(withdrawAmount) < minWithdraw ? (
                          <p className="flex items-center gap-1 text-xs text-destructive">
                            <AlertCircle className="h-3.5 w-3.5" /> Minimum withdrawal is Rs.{minWithdraw}
                          </p>
                        ) : null}
                        {withdrawAmount && Number(withdrawAmount) > availableToWithdraw ? (
                          <p className="flex items-center gap-1 text-xs text-destructive">
                            <AlertCircle className="h-3.5 w-3.5" /> Available amount is Rs.{availableToWithdraw}
                          </p>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Your UPI ID</label>
                        <input
                          type="text"
                          value={withdrawUpiId}
                          onChange={(event) => setWithdrawUpiId(event.target.value)}
                          placeholder="example@upi"
                          className="w-full rounded-2xl border border-border bg-background/60 px-4 py-3 text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={withdrawSubmitting || !withdrawAmount || !withdrawUpiId.trim()}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3.5 font-bold text-accent-foreground transition-all duration-300 hover:scale-[1.01] hover:bg-accent/90 hover:shadow-[0_0_28px_rgba(168,85,247,0.3)] disabled:opacity-50"
                    >
                      {withdrawSubmitting ? <RefreshCw className="h-5 w-5 animate-spin" /> : <ArrowUpCircle className="h-5 w-5" />}
                      Submit Withdrawal Request
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="activity"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-bold">Recent Activity</h2>
                      <p className="text-sm text-muted-foreground">Compact history of your deposits, withdrawals, refunds, and rewards.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activityFilters.map((filter) => (
                        <button
                          key={filter.key}
                          type="button"
                          onClick={() => setActivityFilter(filter.key)}
                          className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] transition-all ${
                            activityFilter === filter.key
                              ? 'bg-primary/14 text-primary shadow-[0_0_18px_rgba(59,130,246,0.18)]'
                              : 'bg-background/45 text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {historyLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((item) => (
                        <div key={item} className="rounded-2xl border border-border/60 bg-background/35 p-3.5">
                          <Skeleton className="mb-2 h-4 w-28" />
                          <Skeleton className="mb-2 h-3 w-20" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      ))}
                    </div>
                  ) : filteredActivity.length > 0 ? (
                    <div className="space-y-3">
                      {filteredActivity.map((item) => {
                        const config = getActivityConfig(item);
                        const statusLabel = item.type === 'refund' ? 'Refunded' : item.type === 'reward' ? 'Reward' : (item.status || 'pending');
                        return (
                          <div key={`${item.type}_${item._id}`} className="rounded-2xl border border-border/60 bg-background/35 p-3.5 transition-all hover:border-primary/20 hover:bg-background/50">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-foreground">{config.title}</p>
                                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] ${config.badgeClass}`}>
                                    {statusLabel}
                                  </span>
                                </div>
                                <p className={`mt-1 text-base font-black ${config.amountClass}`}>
                                  {config.amountPrefix}Rs.{item.amount}
                                </p>

                                {item.type === 'deposit' ? (
                                  <p className="mt-1 truncate text-xs text-muted-foreground">
                                    {(item.payment_method || 'UPI').toUpperCase()} • {item.transaction_id}
                                  </p>
                                ) : null}

                                {item.type === 'withdrawal' ? (
                                  <p className="mt-1 truncate text-xs text-muted-foreground">{item.upi_id}</p>
                                ) : null}

                                {item.type === 'refund' ? (
                                  <p className="mt-1 text-xs text-muted-foreground">{item.reason || 'Refund for dismissed match'}</p>
                                ) : null}

                                {item.type === 'reward' ? (
                                  <p className="mt-1 text-xs text-muted-foreground">{item.description || 'Squad Tournament Winning Reward'}</p>
                                ) : null}

                                <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(item.createdAt || item.created)}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-3xl border border-dashed border-border/60 bg-background/35 px-6 py-12 text-center">
                      <History className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
                      <p className="font-semibold text-foreground">No wallet activity yet</p>
                      <p className="mt-1 text-sm text-muted-foreground">Your deposit, withdrawal, and refund updates will show up here.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
        </section>
      </div>
    </div>
  );
};

export default WalletPage;
