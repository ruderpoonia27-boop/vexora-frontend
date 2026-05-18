
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Search, Filter, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/apiClient';
import ConfirmationModal from '@/components/ConfirmationModal';

export const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get('/admin/withdrawals');
      setWithdrawals(data);
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const filteredRequests = withdrawals.filter(r => {
    const userName = r.expand?.userId?.name?.toLowerCase() || '';
    const userEmail = r.expand?.userId?.email?.toLowerCase() || '';
    const matchesSearch = userName.includes(searchTerm.toLowerCase()) || userEmail.includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleApproveWithdrawal = async (request) => {
    if (request.status !== 'pending') {
      toast({ title: 'Action Not Allowed', description: `This request is already ${request.status}.`, variant: 'destructive' });
      return;
    }
    setIsProcessing(true);
    try {
      await apiClient.post(`/admin/withdrawals/${request._id}/approve`, {});
      toast({ title: 'Success', description: 'Withdrawal approved successfully.' });
      fetchWithdrawals();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: error.message || 'Failed to approve withdrawal.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
      setSelectedRequest(null);
      setActionType(null);
    }
  };

  const handleRejectWithdrawal = async (request) => {
    if (request.status !== 'pending') {
      toast({ title: 'Action Not Allowed', description: `This request is already ${request.status}.`, variant: 'destructive' });
      return;
    }
    setIsProcessing(true);
    try {
      await apiClient.post(`/admin/withdrawals/${request._id}/reject`, {});
      toast({ title: 'Success', description: 'Withdrawal rejected successfully. Amount refunded to user.' });
      fetchWithdrawals();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: error.message || 'Failed to reject withdrawal.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
      setSelectedRequest(null);
      setActionType(null);
    }
  };

  const handleConfirmAction = () => {
    if (!selectedRequest) return;
    if (actionType === 'approve') {
      handleApproveWithdrawal(selectedRequest);
    } else if (actionType === 'reject') {
      handleRejectWithdrawal(selectedRequest);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Withdrawal Requests</h2>

      <div className="admin-glass-panel p-4 rounded-2xl flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-background/50 border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="relative w-full sm:w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-background/50 border border-border rounded-xl pl-10 pr-4 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <button onClick={fetchWithdrawals} className="p-2 bg-muted/50 hover:bg-accent/20 text-foreground rounded-lg" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="admin-glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-background/40 border-b border-border">
              <tr>
                <th className="p-4 font-medium text-muted-foreground text-sm">User</th>
                <th className="p-4 font-medium text-muted-foreground text-sm">Amount</th>
                <th className="p-4 font-medium text-muted-foreground text-sm">UPI ID</th>
                <th className="p-4 font-medium text-muted-foreground text-sm">Date</th>
                <th className="p-4 font-medium text-muted-foreground text-sm">Status</th>
                <th className="p-4 font-medium text-muted-foreground text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="p-4"><Skeleton className="h-6 w-32" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-16" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-24" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-20" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-16" /></td>
                    <td className="p-4"><Skeleton className="h-8 w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No withdrawal requests found.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((r) => (
                  <tr key={r._id} className="hover:bg-background/30 transition-colors">
                    <td className="p-4">
                      <div className="text-sm font-bold">{r.expand?.userId?.name || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground">{r.expand?.userId?.email}</div>
                    </td>
                    <td className="p-4 text-sm font-bold text-secondary">₹{r.amount}</td>
                    <td className="p-4 text-sm font-mono bg-muted/20 px-2 py-1 rounded inline-block mt-2">{r.upi_id}</td>
                    <td className="p-4 text-sm text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        r.status === 'pending' ? 'bg-accent/20 text-accent' : 
                        r.status === 'approved' ? 'bg-secondary/20 text-secondary' : 
                        'bg-destructive/20 text-destructive'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        {r.status === 'pending' && (
                          <>
                            <button
                              onClick={() => { setSelectedRequest(r); setActionType('approve'); }}
                              disabled={isProcessing && selectedRequest?._id === r._id}
                              className="p-2 bg-secondary/10 hover:bg-secondary/20 text-secondary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setSelectedRequest(r); setActionType('reject'); }}
                              disabled={isProcessing && selectedRequest?._id === r._id}
                              className="p-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!selectedRequest && !!actionType}
        onOpenChange={(open) => {
          if (!open && !isProcessing) {
            setSelectedRequest(null);
            setActionType(null);
          }
        }}
        title={actionType === 'approve' ? "Approve Withdrawal" : "Reject Withdrawal"}
        message={`Are you sure you want to ${actionType} the withdrawal of ₹${selectedRequest?.amount} for ${selectedRequest?.expand?.userId?.name || 'this user'}?`}
        confirmText={actionType === 'approve' ? "Approve" : "Reject"}
        isDangerous={actionType === 'reject'}
        isLoading={isProcessing}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
};
