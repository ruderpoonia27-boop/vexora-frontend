import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, CheckCircle, Copy, Filter, Loader2, RefreshCw, Search, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/apiClient';
import ConfirmationModal from '@/components/ConfirmationModal';

const AUTO_REFRESH_MS = 20000;

const statusBadge = {
  pending: 'bg-accent/20 text-accent',
  approved: 'bg-secondary/20 text-secondary',
  rejected: 'bg-destructive/20 text-destructive'
};

const toList = (data) => (Array.isArray(data) ? data : data?.items || data?.withdrawals || []);

export const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [busyIds, setBusyIds] = useState(() => new Set());
  const [copiedId, setCopiedId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const { toast } = useToast();

  const fetchWithdrawals = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setRefreshing(true);
    try {
      const data = await apiClient.get('/admin/withdrawals', { cacheTtl: 0 });
      setWithdrawals(toList(data));
    } catch (error) {
      if (!silent) toast({ title: 'Could not load withdrawals', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchWithdrawals();
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') fetchWithdrawals({ silent: true });
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(intervalId);
  }, [fetchWithdrawals]);

  const setBusy = (id, busy) => setBusyIds((current) => {
    const next = new Set(current);
    if (busy) next.add(id); else next.delete(id);
    return next;
  });

  const replaceRow = (id, patch) => setWithdrawals((rows) => rows.map((row) => (row._id === id ? { ...row, ...patch } : row)));

  const processRequest = async (request, action) => {
    if (busyIds.has(request._id)) return;
    const nextStatus = action === 'approve' ? 'approved' : 'rejected';
    setBusy(request._id, true);
    replaceRow(request._id, { status: nextStatus });

    try {
      const result = await apiClient.post(`/admin/withdrawals/${request._id}/${action}`, {});
      if (result?.wd) replaceRow(request._id, { status: result.wd.status });
      if (result?.alreadyProcessed) {
        toast({ title: `Already ${result.wd?.status}`, description: 'This request was handled already.' });
      } else {
        toast({
          title: action === 'approve' ? 'Approved' : 'Rejected',
          description: action === 'approve'
            ? `₹${request.amount} to ${request.upi_id}`
            : `₹${request.amount} returned to ${request.expand?.userId?.name || 'the user'}'s wallet`
        });
      }
    } catch (error) {
      replaceRow(request._id, { status: 'pending' });
      toast({ title: `Could not ${action}`, description: error.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setBusy(request._id, false);
    }
  };

  const copyUpi = async (request) => {
    try {
      await navigator.clipboard.writeText(request.upi_id);
      setCopiedId(request._id);
      window.setTimeout(() => setCopiedId((current) => (current === request._id ? null : current)), 1500);
    } catch {
      toast({ title: 'Copy failed', description: 'Select the UPI ID and copy it manually.', variant: 'destructive' });
    }
  };

  const pendingCount = useMemo(() => withdrawals.filter((row) => row.status === 'pending').length, [withdrawals]);

  const filteredRequests = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return withdrawals.filter((row) => {
      const haystack = [row.expand?.userId?.name, row.expand?.userId?.email, row.upi_id].join(' ').toLowerCase();
      return (!search || haystack.includes(search)) && (filterStatus === 'all' || row.status === filterStatus);
    });
  }, [withdrawals, searchTerm, filterStatus]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold">Withdrawal Requests</h2>
        {pendingCount > 0 ? (
          <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-bold text-accent">{pendingCount} pending</span>
        ) : null}
      </div>

      <div className="admin-glass-panel flex flex-col gap-4 rounded-2xl p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search name, email or UPI..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-xl border border-border bg-background/50 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="relative w-full sm:w-48">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <select
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value)}
            className="w-full appearance-none rounded-xl border border-border bg-background/50 py-2 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All Status</option>
          </select>
        </div>
        <button
          type="button"
          onClick={() => fetchWithdrawals()}
          className="rounded-lg bg-muted/50 p-2 text-foreground hover:bg-accent/20"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="admin-glass-panel overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-border bg-background/40">
              <tr>
                <th className="p-4 text-sm font-medium text-muted-foreground">User</th>
                <th className="p-4 text-sm font-medium text-muted-foreground">Amount</th>
                <th className="p-4 text-sm font-medium text-muted-foreground">UPI ID</th>
                <th className="p-4 text-sm font-medium text-muted-foreground">Requested</th>
                <th className="p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="p-4 text-right text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td className="p-4"><Skeleton className="h-6 w-32" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-16" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-24" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-20" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-16" /></td>
                    <td className="p-4"><Skeleton className="ml-auto h-8 w-20" /></td>
                  </tr>
                ))
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    {filterStatus === 'pending' ? 'No pending withdrawals. All caught up!' : 'No withdrawal requests found.'}
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => {
                  const busy = busyIds.has(request._id);
                  return (
                    <tr key={request._id} className="transition-colors hover:bg-background/30">
                      <td className="p-4">
                        <div className="text-sm font-bold">{request.expand?.userId?.name || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground">{request.expand?.userId?.email}</div>
                      </td>
                      <td className="p-4 text-sm font-bold text-secondary">₹{request.amount}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-muted/20 px-2 py-1 font-mono text-sm">{request.upi_id}</span>
                          <button
                            type="button"
                            onClick={() => copyUpi(request)}
                            className="rounded p-1.5 text-muted-foreground transition hover:bg-background/50 hover:text-primary"
                            title="Copy UPI ID"
                          >
                            {copiedId === request._id ? <Check className="h-3.5 w-3.5 text-secondary" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="whitespace-nowrap p-4 text-sm text-muted-foreground">
                        {new Date(request.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                      </td>
                      <td className="p-4">
                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${statusBadge[request.status] || statusBadge.pending}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          {busy ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
                          {request.status === 'pending' && !busy ? (
                            <>
                              <button
                                type="button"
                                onClick={() => processRequest(request, 'approve')}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-secondary/15 px-3 py-1.5 text-xs font-bold text-secondary transition-colors hover:bg-secondary/25"
                                title="Approve (mark as paid)"
                              >
                                <CheckCircle className="h-4 w-4" /> Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectTarget(request)}
                                className="rounded-lg bg-destructive/10 p-2 text-destructive transition-colors hover:bg-destructive/20"
                                title="Reject and refund"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!rejectTarget}
        onOpenChange={(open) => {
          if (!open) setRejectTarget(null);
        }}
        title="Reject Withdrawal"
        message={`Reject ₹${rejectTarget?.amount} for ${rejectTarget?.expand?.userId?.name || 'this user'}? The amount will go back to their wallet.`}
        confirmText="Reject"
        isDangerous
        onConfirm={() => {
          const target = rejectTarget;
          setRejectTarget(null);
          if (target) processRequest(target, 'reject');
        }}
      />
    </div>
  );
};
