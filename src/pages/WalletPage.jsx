import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Copy,
  Gift,
  History,
  Loader2,
  Lock,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Swords,
  Trophy,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getPlatformName, useSettings } from '@/hooks/useSettings';
import apiClient from '@/lib/apiClient';
import { fetchWallet, readWalletCache } from '@/lib/walletCache';
import { usePaymentSettings } from '@/hooks/usePaymentSettings';
import { loadCashfree } from '@/lib/cashfree';
import { Skeleton } from '@/components/ui/skeleton';

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];
const ACTIVITY_PAGE_SIZE = 15;

const formatMoney = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
};

const activityIcons = {
  deposit: ArrowDownLeft,
  withdrawal: ArrowUpRight,
  entry_fee: Swords,
  free_entry: Gift,
  reward: Trophy,
  refund: RotateCcw,
  admin_credit: ShieldCheck,
  admin_debit: ShieldCheck
};

const statusStyles = {
  pending: 'bg-amber-400/10 text-amber-300 border-amber-400/30',
  rejected: 'bg-destructive/10 text-red-400 border-destructive/30'
};

const inputClass = 'w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-foreground placeholder:text-muted-foreground/60 transition focus:outline-none focus:ring-2 focus:ring-primary/60';

const StepLabel = ({ number, children }) => (
  <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">{number}</span>
    {children}
  </p>
);

const FieldError = ({ children }) => (
  <p className="mt-1.5 flex items-center gap-1 text-xs text-red-400">
    <AlertCircle className="h-3.5 w-3.5" /> {children}
  </p>
);

const ManualDepositForm = ({ wallet, onDone }) => {
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [utr, setUtr] = useState('');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { paymentSettings, loading: paymentLoading } = usePaymentSettings({ autoRefresh: false });
  const { minDeposit } = wallet.limits;
  const upiId = paymentSettings.upi_id;
  const qrCode = paymentSettings.qr_code;
  const numericAmount = Number(amount);
  const amountValid = Number.isFinite(numericAmount) && numericAmount >= minDeposit;
  const utrValid = /^[A-Za-z0-9]{6,30}$/.test(utr.trim());
  const upiLink = upiId && amountValid
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&am=${numericAmount}&cu=INR`
    : '';

  const copyUpi = async () => {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast({ title: 'Copy failed', description: 'Select the UPI ID and copy it manually.', variant: 'destructive' });
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!amountValid || !utrValid) return;
    setSubmitting(true);
    try {
      await apiClient.post('/wallet/deposit', { amount: numericAmount, utr: utr.trim() });
      toast({ title: 'Deposit submitted', description: `${formatMoney(numericAmount)} will be added once the payment is verified.` });
      onDone();
    } catch (error) {
      toast({ title: 'Deposit failed', description: error.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <StepLabel number={1}>Choose amount</StepLabel>
        <AmountField amount={amount} onChange={setAmount} minDeposit={minDeposit} />
      </div>

      <div>
        <StepLabel number={2}>Pay {amountValid ? formatMoney(numericAmount) : ''} using any UPI app</StepLabel>
        {paymentLoading ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : upiId ? (
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-background/40 p-4 sm:flex-row sm:items-center">
            {qrCode ? (
              <img
                src={qrCode}
                alt="UPI payment QR code"
                className="mx-auto h-36 w-36 shrink-0 rounded-lg bg-white object-contain p-1.5 sm:mx-0"
              />
            ) : null}
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">{qrCode ? 'Scan the QR or pay to this UPI ID' : 'Pay to this UPI ID'}</p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="min-w-0 break-all font-mono text-base font-bold text-foreground">{upiId}</p>
                  <button
                    type="button"
                    onClick={copyUpi}
                    aria-label="Copy UPI ID"
                    className="shrink-0 rounded-lg border border-border p-2 text-muted-foreground transition hover:border-primary/50 hover:text-primary"
                  >
                    {copied ? <Check className="h-4 w-4 text-secondary" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {upiLink ? (
                <a
                  href={upiLink}
                  className="inline-flex items-center justify-center rounded-lg border border-primary/40 px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10 md:hidden"
                >
                  Open UPI app
                </a>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            Payment details are not set up yet. Please contact support.
          </p>
        )}
      </div>

      <div>
        <StepLabel number={3}>Enter the UTR / transaction ID</StepLabel>
        <input
          type="text"
          value={utr}
          onChange={(event) => setUtr(event.target.value.replace(/\s/g, ''))}
          placeholder="12-digit UTR from your payment app"
          className={inputClass}
        />
        {utr && !utrValid ? <FieldError>UTR should be 6–30 letters or numbers</FieldError> : null}
      </div>

      <button
        type="submit"
        disabled={submitting || !amountValid || !utrValid}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 font-bold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? <RefreshCw className="h-5 w-5 animate-spin" /> : <ArrowDownLeft className="h-5 w-5" />}
        Submit deposit
      </button>
      <p className="text-center text-xs text-muted-foreground">Money is added to your wallet after we verify the payment.</p>
    </form>
  );
};

const AmountField = ({ amount, onChange, minDeposit }) => {
  const numericAmount = Number(amount);
  return (
    <>
      <div className="mb-3 flex flex-wrap gap-2">
        {QUICK_AMOUNTS.filter((value) => value >= minDeposit).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange(String(value))}
            className={`rounded-lg border px-3.5 py-1.5 text-sm font-semibold transition ${
              numericAmount === value
                ? 'border-primary bg-primary/15 text-primary'
                : 'border-border bg-background/40 text-muted-foreground hover:text-foreground'
            }`}
          >
            {formatMoney(value)}
          </button>
        ))}
      </div>
      <input
        type="number"
        inputMode="decimal"
        min={minDeposit}
        value={amount}
        onChange={(event) => onChange(event.target.value)}
        placeholder={`Enter amount (min ${formatMoney(minDeposit)})`}
        className={inputClass}
      />
      {amount && numericAmount < minDeposit ? <FieldError>Minimum deposit is {formatMoney(minDeposit)}</FieldError> : null}
    </>
  );
};

const PHONE_STORAGE_KEY = 'depositPhone';

const readSavedPhone = () => {
  try {
    return localStorage.getItem(PHONE_STORAGE_KEY) || '';
  } catch {
    return '';
  }
};

const OnlineDepositForm = ({ wallet }) => {
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState(readSavedPhone);
  const [submitting, setSubmitting] = useState(false);

  const { minDeposit } = wallet.limits;
  const numericAmount = Number(amount);
  const amountValid = Number.isFinite(numericAmount) && numericAmount >= minDeposit;
  const phoneValid = /^[6-9]\d{9}$/.test(phone);

  const submit = async (event) => {
    event.preventDefault();
    if (!amountValid || !phoneValid) return;
    setSubmitting(true);
    try {
      try {
        localStorage.setItem(PHONE_STORAGE_KEY, phone);
      } catch {
        // Only a convenience for next time.
      }
      const order = await apiClient.post('/wallet/cashfree/order', { amount: numericAmount, phone });
      const cashfree = await loadCashfree(order.mode);
      // Cashfree redirects back to /wallet?cf_order=... once the payment finishes.
      await cashfree.checkout({ paymentSessionId: order.paymentSessionId, redirectTarget: '_self' });
    } catch (error) {
      toast({ title: 'Payment could not start', description: error.message || 'Please try again.', variant: 'destructive' });
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-semibold text-foreground">Amount</p>
        <AmountField amount={amount} onChange={setAmount} minDeposit={minDeposit} />
      </div>

      <div>
        <label htmlFor="deposit-phone" className="mb-2 block text-sm font-semibold text-foreground">Mobile number</label>
        <div className="flex">
          <span className="flex items-center rounded-l-xl border border-r-0 border-border bg-background/40 px-3 text-sm text-muted-foreground">+91</span>
          <input
            id="deposit-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            value={phone}
            onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="10-digit mobile number"
            className={`${inputClass} rounded-l-none`}
          />
        </div>
        {phone && !phoneValid ? <FieldError>Enter a valid 10-digit mobile number</FieldError> : null}
      </div>

      <button
        type="submit"
        disabled={submitting || !amountValid || !phoneValid}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 font-bold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
        {amountValid ? `Pay ${formatMoney(numericAmount)}` : 'Pay'}
      </button>
      <p className="text-center text-xs text-muted-foreground">
        UPI, cards and net banking · Secured by Cashfree · Added to your wallet instantly
      </p>
    </form>
  );
};

const DepositForm = ({ wallet, onDone }) => {
  const onlineAvailable = Boolean(wallet.gateway?.cashfree);
  const [method, setMethod] = useState(onlineAvailable ? 'online' : 'manual');

  if (!onlineAvailable) return <ManualDepositForm wallet={wallet} onDone={onDone} />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-background/40 p-1">
        {[
          { key: 'online', label: 'Pay online' },
          { key: 'manual', label: 'Manual UPI + UTR' }
        ].map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setMethod(option.key)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              method === option.key ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {method === 'online'
        ? <OnlineDepositForm wallet={wallet} />
        : <ManualDepositForm wallet={wallet} onDone={onDone} />}
    </div>
  );
};

const WithdrawForm = ({ wallet, onDone }) => {
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { minWithdraw } = wallet.limits;
  const available = wallet.available;
  const numericAmount = Number(amount);
  const belowMin = amount && numericAmount < minWithdraw;
  const aboveAvailable = amount && numericAmount > available;
  const amountValid = Number.isFinite(numericAmount) && numericAmount > 0 && !belowMin && !aboveAvailable;
  const upiValid = /^[A-Za-z0-9._-]{2,256}@[A-Za-z]{2,64}$/.test(upiId.trim());

  const submit = async (event) => {
    event.preventDefault();
    if (!amountValid || !upiValid) return;
    setSubmitting(true);
    try {
      await apiClient.post('/wallet/withdraw', { amount: numericAmount, upiId: upiId.trim() });
      toast({ title: 'Withdrawal requested', description: `${formatMoney(numericAmount)} will be sent to ${upiId.trim()} after approval.` });
      onDone();
    } catch (error) {
      toast({ title: 'Withdrawal failed', description: error.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (available < minWithdraw) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
        <p className="font-semibold text-foreground">Not enough balance to withdraw</p>
        <p className="mt-1 text-sm text-muted-foreground">
          The minimum withdrawal is {formatMoney(minWithdraw)}. You have {formatMoney(available)} available.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="withdraw-amount" className="text-sm font-semibold text-foreground">Amount</label>
          <span className="text-xs text-muted-foreground">Available {formatMoney(available)}</span>
        </div>
        <div className="relative">
          <input
            id="withdraw-amount"
            type="number"
            inputMode="decimal"
            min={minWithdraw}
            max={available}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder={`Min ${formatMoney(minWithdraw)}`}
            className={`${inputClass} pr-16`}
          />
          <button
            type="button"
            onClick={() => setAmount(String(available))}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-primary/15 px-2.5 py-1 text-xs font-bold text-primary hover:bg-primary/25"
          >
            MAX
          </button>
        </div>
        {belowMin ? <FieldError>Minimum withdrawal is {formatMoney(minWithdraw)}</FieldError> : null}
        {aboveAvailable ? <FieldError>You only have {formatMoney(available)} available</FieldError> : null}
      </div>

      <div>
        <label htmlFor="withdraw-upi" className="mb-2 block text-sm font-semibold text-foreground">Your UPI ID</label>
        <input
          id="withdraw-upi"
          type="text"
          autoComplete="off"
          value={upiId}
          onChange={(event) => setUpiId(event.target.value.replace(/\s/g, ''))}
          placeholder="name@bank"
          className={inputClass}
        />
        {upiId && !upiValid ? <FieldError>Enter a valid UPI ID, like name@bank</FieldError> : null}
      </div>

      <button
        type="submit"
        disabled={submitting || !amountValid || !upiValid}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3.5 font-bold text-accent-foreground transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? <RefreshCw className="h-5 w-5 animate-spin" /> : <ArrowUpRight className="h-5 w-5" />}
        Request withdrawal
      </button>
      <p className="text-center text-xs text-muted-foreground">
        The amount is held from your balance now. If the request is rejected, it comes back automatically.
      </p>
    </form>
  );
};

const ActivityRow = ({ item }) => {
  const Icon = activityIcons[item.kind] || History;
  const sign = item.direction === 'in' ? '+' : item.direction === 'out' ? '−' : '';
  const isRejected = item.status === 'rejected';
  const amountClass = isRejected
    ? 'text-muted-foreground line-through'
    : item.direction === 'in'
      ? 'text-secondary'
      : 'text-foreground';

  return (
    <li className="flex items-center gap-3 px-4 py-3.5">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
        item.direction === 'in' ? 'bg-secondary/10 text-secondary' : 'bg-background/70 text-muted-foreground'
      }`}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {[item.subtitle, formatDate(item.createdAt)].filter(Boolean).join(' · ')}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className={`text-sm font-bold tabular-nums ${amountClass}`}>
          {item.kind === 'free_entry' ? 'Free' : `${sign}${formatMoney(item.amount)}`}
        </p>
        {statusStyles[item.status] ? (
          <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${statusStyles[item.status]}`}>
            {item.status}
          </span>
        ) : null}
      </div>
    </li>
  );
};

const WalletPage = () => {
  const { currentUser, refreshUser } = useAuth();
  const { toast } = useToast();
  const { settings } = useSettings();
  const platformName = getPlatformName(settings);
  const [searchParams, setSearchParams] = useSearchParams();

  const requestedPanel = searchParams.get('tab');
  const [panel, setPanel] = useState(['deposit', 'withdraw'].includes(requestedPanel) ? requestedPanel : null);
  const [wallet, setWallet] = useState(readWalletCache);
  const [loading, setLoading] = useState(() => !readWalletCache());
  const [activityFilter, setActivityFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(ACTIVITY_PAGE_SIZE);

  const loadWallet = useCallback(async () => {
    try {
      setWallet(await fetchWallet());
    } catch (error) {
      if (!readWalletCache()) {
        toast({ title: 'Could not load wallet', description: error.message || 'Please try again.', variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!currentUser?.id) return undefined;
    loadWallet();
    // Warm the payment QR (a large image) so the deposit form opens instantly.
    apiClient.get('/payment-settings', { cacheTtl: 60000 }).catch(() => {});
    window.addEventListener('focus', loadWallet);
    return () => window.removeEventListener('focus', loadWallet);
  }, [currentUser?.id, loadWallet]);

  const openPanel = (next) => {
    setPanel((current) => (current === next ? null : next));
    setSearchParams((current) => {
      const params = new URLSearchParams(current);
      params.delete('tab');
      return params;
    }, { replace: true });
  };

  const returnedOrderId = searchParams.get('cf_order');
  const [confirmingPayment, setConfirmingPayment] = useState(Boolean(returnedOrderId));

  useEffect(() => {
    if (!returnedOrderId || !currentUser?.id) return undefined;
    let cancelled = false;

    const confirmPayment = async () => {
      let outcome = 'pending';
      for (let attempt = 0; attempt < 6 && !cancelled; attempt += 1) {
        try {
          const result = await apiClient.get(`/wallet/cashfree/order/${encodeURIComponent(returnedOrderId)}`, { cacheTtl: 0 });
          outcome = result.status;
          if (outcome !== 'pending') break;
        } catch {
          // Keep retrying; the webhook will also settle the payment.
        }
        await new Promise((resolve) => { window.setTimeout(resolve, 2500); });
      }
      if (cancelled) return;

      if (outcome === 'paid') {
        toast({ title: 'Money added', description: 'Your deposit was successful.' });
      } else if (outcome === 'pending') {
        toast({ title: 'Payment processing', description: 'It will be added to your wallet automatically once confirmed.' });
      } else {
        toast({
          title: 'Payment not completed',
          description: `No money was added. If your account was debited, contact support with order ID ${returnedOrderId}.`,
          variant: 'destructive'
        });
      }

      setConfirmingPayment(false);
      setSearchParams((current) => {
        const params = new URLSearchParams(current);
        params.delete('cf_order');
        return params;
      }, { replace: true });
      await Promise.all([loadWallet(), refreshUser()]);
    };

    confirmPayment();
    return () => {
      cancelled = true;
    };
  }, [returnedOrderId, currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDone = async () => {
    setPanel(null);
    await Promise.all([loadWallet(), refreshUser()]);
  };

  const activity = useMemo(() => wallet?.activity || [], [wallet]);
  const pendingCount = activity.filter((item) => item.status === 'pending').length;
  const filteredActivity = useMemo(() => {
    if (activityFilter === 'pending') return activity.filter((item) => item.status === 'pending');
    if (activityFilter === 'in') return activity.filter((item) => item.direction === 'in' && item.status !== 'rejected');
    if (activityFilter === 'out') return activity.filter((item) => item.direction === 'out' && item.status !== 'rejected');
    return activity;
  }, [activity, activityFilter]);

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: pendingCount ? `Pending (${pendingCount})` : 'Pending' },
    { key: 'in', label: 'Money in' },
    { key: 'out', label: 'Money out' }
  ];

  if (!currentUser) return null;

  return (
    <div className="min-h-[calc(100vh-64px)] pb-28 pt-8 md:pb-16 md:pt-12">
      <Helmet>
        <title>Wallet | {platformName}</title>
      </Helmet>

      <div className="container mx-auto max-w-2xl space-y-6 px-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight md:text-3xl">Wallet</h1>
          <button
            type="button"
            onClick={() => Promise.all([loadWallet(), refreshUser()])}
            aria-label="Refresh wallet"
            className="rounded-xl border border-border p-2.5 text-muted-foreground transition hover:border-primary/50 hover:text-primary"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Balance */}
        <section className="rounded-2xl border border-primary/20 bg-[linear-gradient(145deg,rgba(0,212,255,0.10),rgba(217,70,239,0.06))] p-5 md:p-6">
          <p className="text-sm text-muted-foreground">Available balance</p>
          {loading && !wallet ? (
            <Skeleton className="mt-2 h-10 w-40" />
          ) : (
            <p className="mt-1 text-4xl font-black tabular-nums text-foreground md:text-5xl">
              {formatMoney(wallet?.available ?? currentUser.walletBalance)}
            </p>
          )}

          {confirmingPayment ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-primary">
              <Loader2 className="h-4 w-4 animate-spin" /> Confirming your payment…
            </p>
          ) : null}

          {wallet && (wallet.pending.deposits > 0 || wallet.pending.withdrawals > 0) ? (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-amber-300">
              {wallet.pending.deposits > 0 ? <span>+{formatMoney(wallet.pending.deposits)} deposit being verified</span> : null}
              {wallet.pending.withdrawals > 0 ? <span>{formatMoney(wallet.pending.withdrawals)} withdrawal in process</span> : null}
            </div>
          ) : null}

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => openPanel('deposit')}
              disabled={!wallet}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold transition disabled:opacity-40 ${
                panel === 'deposit' ? 'bg-primary text-primary-foreground ring-2 ring-primary/40 ring-offset-2 ring-offset-background' : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              <ArrowDownLeft className="h-5 w-5" /> Deposit
            </button>
            <button
              type="button"
              onClick={() => openPanel('withdraw')}
              disabled={!wallet}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold transition disabled:opacity-40 ${
                panel === 'withdraw' ? 'bg-accent text-accent-foreground ring-2 ring-accent/40 ring-offset-2 ring-offset-background' : 'bg-accent text-accent-foreground hover:bg-accent/90'
              }`}
            >
              <ArrowUpRight className="h-5 w-5" /> Withdraw
            </button>
          </div>
        </section>

        {/* Deposit / withdraw form */}
        {panel && wallet ? (
          <section className="page-transition rounded-2xl border border-border bg-card/60 p-5 md:p-6" key={panel}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold">{panel === 'deposit' ? 'Add money' : 'Withdraw to UPI'}</h2>
              <button
                type="button"
                onClick={() => setPanel(null)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-background/60 hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {panel === 'deposit'
              ? <DepositForm wallet={wallet} onDone={handleDone} />
              : <WithdrawForm wallet={wallet} onDone={handleDone} />}
          </section>
        ) : null}

        {/* Activity */}
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Activity</h2>
            <div className="flex flex-wrap gap-1.5">
              {filters.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => {
                    setActivityFilter(filter.key);
                    setVisibleCount(ACTIVITY_PAGE_SIZE);
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    activityFilter === filter.key
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card/40">
            {loading && !wallet ? (
              <ul className="divide-y divide-border/60">
                {[1, 2, 3, 4].map((key) => (
                  <li key={key} className="flex items-center gap-3 px-4 py-3.5">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-4 w-14" />
                  </li>
                ))}
              </ul>
            ) : filteredActivity.length ? (
              <>
                <ul className="divide-y divide-border/60">
                  {filteredActivity.slice(0, visibleCount).map((item) => <ActivityRow key={item.id} item={item} />)}
                </ul>
                {filteredActivity.length > visibleCount ? (
                  <button
                    type="button"
                    onClick={() => setVisibleCount((count) => count + ACTIVITY_PAGE_SIZE)}
                    className="w-full border-t border-border/60 py-3 text-sm font-semibold text-primary transition hover:bg-background/40"
                  >
                    Show more
                  </button>
                ) : null}
              </>
            ) : (
              <div className="px-6 py-12 text-center">
                <History className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="font-semibold text-foreground">
                  {activityFilter === 'all' ? 'No activity yet' : 'Nothing here'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {activityFilter === 'all'
                    ? 'Deposits, withdrawals, entry fees and prizes will appear here.'
                    : 'No transactions match this filter.'}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default WalletPage;
