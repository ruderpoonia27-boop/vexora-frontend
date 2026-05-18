
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { Wallet, ArrowUpCircle, History, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/apiClient';
import { Skeleton } from '@/components/ui/skeleton';
import { getPlatformName, useSettings } from '@/hooks/useSettings';

const WithdrawalPage = () => {
  const { currentUser, refreshUser } = useAuth();
  const { toast } = useToast();
  const { settings } = useSettings();
  const minWithdrawAmount = settings?.min_withdraw_amount || 10;
  const platformName = getPlatformName(settings);

  const [withdrawalsHistory, setWithdrawalsHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchHistory = async () => {
    if (!currentUser) return;
    setHistoryLoading(true);
    try {
      const data = await apiClient.get(`/users/withdrawals/history/${currentUser.id}`);
      setWithdrawalsHistory(data);
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshUser();
      fetchHistory();
    }
  }, [currentUser?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = parseInt(amount, 10);

    if (numAmount < minWithdrawAmount) {
      toast({
        title: "Minimum Amount Not Met",
        description: `Minimum withdrawal amount is ₹${minWithdrawAmount}.`,
        variant: "destructive"
      });
      return;
    }

    if (numAmount > (currentUser?.walletBalance || 0)) {
      toast({ title: "Insufficient Balance", description: "You don't have enough funds in your wallet.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post('/withdrawals', {
        userId: currentUser._id,
        amount: numAmount,
        upiId: upiId
      });

      toast({
        title: "Request Submitted",
        description: "Your withdrawal request is pending approval."
      });

      setAmount('');
      setUpiId('');
      refreshUser();
      fetchHistory();
    } catch (err) {
      toast({ title: "Submission Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-[calc(100vh-64px)] py-12">
      <Helmet>
        <title>Withdraw Funds | {platformName}</title>
      </Helmet>

      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-black mb-2 uppercase tracking-tight">Withdraw Funds</h1>
          <p className="text-muted-foreground">Transfer your winnings securely to your bank or UPI.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Action Column */}
          <div className="lg:col-span-1 space-y-6">

            {/* Balance Card */}
            <div className="bg-card border border-border/50 rounded-3xl p-6 box-glow-primary relative overflow-hidden">
              <div className="absolute -right-6 -top-6 text-primary/10">
                <Wallet className="w-32 h-32" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1 relative z-10">Withdrawable Balance</p>
              <h2 className="text-4xl font-bold text-glow-primary text-primary relative z-10">
                ₹{currentUser.walletBalance || 0}
              </h2>
            </div>

            {/* Withdraw Form */}
            <div className="bg-card border border-border/50 rounded-3xl p-6 relative overflow-hidden">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <ArrowUpCircle className="w-5 h-5 text-accent" /> Request Payout
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Amount (₹)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`Min: ₹${minWithdrawAmount}`}
                    min={minWithdrawAmount}
                    max={currentUser.walletBalance}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent text-foreground"
                    required
                  />
                  {amount && parseInt(amount, 10) < minWithdrawAmount && (
                    <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" /> Minimum amount is ₹{minWithdrawAmount}
                    </p>
                  )}
                  {amount && parseInt(amount, 10) > (currentUser.walletBalance || 0) && (
                    <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" /> Insufficient balance
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Your UPI ID</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. yourname@upi"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent text-foreground text-sm"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      !amount ||
                      parseInt(amount, 10) < minWithdrawAmount ||
                      parseInt(amount, 10) > (currentUser.walletBalance || 0)
                    }
                    className="w-full bg-accent text-accent-foreground font-bold py-3 rounded-xl hover:bg-accent/90 transition-all flex justify-center items-center gap-2 disabled:opacity-50 box-glow-accent"
                  >
                    {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Submit Request'}
                  </button>
                  <p className="text-[10px] text-center text-muted-foreground mt-3">Processing can take up to 24 hours.</p>
                </div>
              </form>
            </div>
          </div>

          {/* History Column */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 min-h-full">
              <div className="flex items-center gap-3 mb-6 border-b border-border/50 pb-4">
                <div className="p-2 bg-muted/50 rounded-lg text-foreground">
                  <History className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold">Withdrawal History</h3>
              </div>

              {historyLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-background/50 rounded-xl">
                      <div>
                        <Skeleton className="h-5 w-24 mb-2" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-8 w-16" />
                    </div>
                  ))}
                </div>
              ) : withdrawalsHistory.length > 0 ? (
                <div className="space-y-4">
                  {withdrawalsHistory.map((req) => (
                    <div key={req._id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-background border border-border/50 rounded-xl hover:border-border transition-colors">
                      <div className="mb-2 sm:mb-0">
                        <p className="font-bold flex items-center gap-2">
                          -₹{req.amount}
                        </p>
                        <div className="text-xs text-muted-foreground mt-1 font-mono bg-muted/20 px-2 py-0.5 rounded inline-block">
                          {req.upi_id}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(req.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        req.status === 'approved' ? 'bg-secondary/20 text-secondary' :
                        req.status === 'rejected' ? 'bg-destructive/20 text-destructive' :
                        'bg-accent/20 text-accent'
                      }`}>
                        {req.status}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground bg-background/50 rounded-2xl border border-dashed border-border/50">
                  <ArrowUpCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No withdrawal history found.</p>
                  <p className="text-sm mt-1">Your recent payout requests will appear here.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default WithdrawalPage;
