
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Search, Filter, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/apiClient';
import ConfirmationModal from '@/components/ConfirmationModal';

export const AdminDeposits = () => {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get('/admin/deposits');
      setDeposits(data);
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  const filteredDeposits = deposits.filter(d => {
    const userName = d.expand?.userId?.name?.toLowerCase() || '';
    const userEmail = d.expand?.userId?.email?.toLowerCase() || '';
    const matchesSearch = userName.includes(searchTerm.toLowerCase()) || userEmail.includes(searchTerm.toLowerCase()) || (d.transaction_id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleApproveDeposit = async (deposit) => {
    if (deposit.status !== 'pending') {
      toast({ title: 'Action Not Allowed', description: `This deposit is already ${deposit.status}.`, variant: 'destructive' });
      return;
    }
    setIsProcessing(true);
    try {
      await apiClient.post(`/admin/deposits/${deposit._id}/approve`, {});
      toast({ title: 'Success', description: 'Deposit approved successfully.' });
      fetchDeposits();
    } catch (err) {
      toast({ title: 'Error', description: err.message || 'Failed to approve deposit.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
      setSelectedDeposit(null);
      setActionType(null);
    }
  };

  const handleRejectDeposit = async (deposit) => {
    if (deposit.status !== 'pending') {
      toast({ title: 'Action Not Allowed', description: `This deposit is already ${deposit.status}.`, variant: 'destructive' });
      return;
    }
    setIsProcessing(true);
    try {
      await apiClient.post(`/admin/deposits/${deposit._id}/reject`, {});
      toast({ title: 'Success', description: 'Deposit rejected successfully.' });
      fetchDeposits();
    } catch (err) {
      toast({ title: 'Error', description: err.message || 'Failed to reject deposit.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
      setSelectedDeposit(null);
      setActionType(null);
    }
  };

  const handleConfirmAction = () => {
    if (!selectedDeposit) return;
    if (actionType === 'approve') {
      handleApproveDeposit(selectedDeposit);
    } else if (actionType === 'reject') {
      handleRejectDeposit(selectedDeposit);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Deposit Requests</h2>

      <div className="admin-glass-panel p-4 rounded-2xl flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by user or Tx ID..."
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
        <button onClick={fetchDeposits} className="p-2 bg-muted/50 hover:bg-accent/20 text-foreground rounded-lg" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="admin-glass-panel rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-background/40 border-b border-border">
              <tr>
                <th className="p-4 font-medium text-muted-foreground text-sm">User</th>
                <th className="p-4 font-medium text-muted-foreground text-sm">Amount</th>
                <th className="p-4 font-medium text-muted-foreground text-sm">Details</th>
                <th className="p-4 font-medium text-muted-foreground text-sm">Date</th>
                <th className="p-4 font-medium text-muted-foreground text-sm">Status</th>
                <th className="p-4 font-medium text-muted-foreground text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="p-4"><Skeleton className="h-6 w-32" /></td>
                  <td className="p-4"><Skeleton className="h-6 w-16" /></td>
                  <td className="p-4"><Skeleton className="h-6 w-24" /></td>
                  <td className="p-4"><Skeleton className="h-6 w-20" /></td>
                  <td className="p-4"><Skeleton className="h-6 w-16" /></td>
                  <td className="p-4"><Skeleton className="h-8 w-20 ml-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin-glass-panel rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-background/40 border-b border-border">
                <tr>
                  <th className="p-4 font-medium text-muted-foreground text-sm">User</th>
                  <th className="p-4 font-medium text-muted-foreground text-sm">Amount</th>
                  <th className="p-4 font-medium text-muted-foreground text-sm">Details</th>
                  <th className="p-4 font-medium text-muted-foreground text-sm">Date</th>
                  <th className="p-4 font-medium text-muted-foreground text-sm">Status</th>
                  <th className="p-4 font-medium text-muted-foreground text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredDeposits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No deposit requests found.
                    </td>
                  </tr>
                ) : (
                  filteredDeposits.map((d) => (
                    <tr key={d._id} className="hover:bg-background/30 transition-colors">
                      <td className="p-4">
                        <div className="text-sm font-bold">{d.expand?.userId?.name || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground">{d.expand?.userId?.email}</div>
                      </td>
                      <td className="p-4 text-sm font-bold text-primary">₹{d.amount}</td>
                      <td className="p-4">
                        <div className="text-xs font-medium text-foreground mb-1 uppercase tracking-wider">{d.payment_method || 'N/A'}</div>
                        <div className="text-xs font-mono text-muted-foreground">{d.transaction_id}</div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{new Date(d.createdAt).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          d.status === 'pending' ? 'bg-accent/20 text-accent' :
                          d.status === 'approved' ? 'bg-secondary/20 text-secondary' :
                          'bg-destructive/20 text-destructive'
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          {d.status === 'pending' && (
                            <>
                              <button
                                onClick={() => { setSelectedDeposit(d); setActionType('approve'); }}
                                disabled={isProcessing && selectedDeposit?._id === d._id}
                                className="p-2 bg-secondary/10 hover:bg-secondary/20 text-secondary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => { setSelectedDeposit(d); setActionType('reject'); }}
                                disabled={isProcessing && selectedDeposit?._id === d._id}
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
      )}

      <ConfirmationModal
        isOpen={!!selectedDeposit && !!actionType}
        onOpenChange={(open) => {
          if (!open && !isProcessing) {
            setSelectedDeposit(null);
            setActionType(null);
          }
        }}
        title={actionType === 'approve' ? "Approve Deposit" : "Reject Deposit"}
        message={`Are you sure you want to ${actionType} the deposit of ₹${selectedDeposit?.amount} for ${selectedDeposit?.expand?.userId?.name || 'this user'}?`}
        confirmText={actionType === 'approve' ? "Approve" : "Reject"}
        isDangerous={actionType === 'reject'}
        isLoading={isProcessing}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
};



