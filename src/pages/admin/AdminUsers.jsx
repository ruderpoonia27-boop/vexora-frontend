import React, { useEffect, useMemo, useState } from 'react';
import { Ban, CheckCircle, Gift, MinusCircle, PlusCircle, RefreshCw, Search, ShieldCheck, Users } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const USERS_PAGE_SIZE = 500;

const getUsersFromResponse = (data) => data.items || data.users || (Array.isArray(data) ? data : []);

export const AdminUsers = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [balanceAction, setBalanceAction] = useState('add');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [freeEntryAmount, setFreeEntryAmount] = useState('');
  const [freeEntryNote, setFreeEntryNote] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const firstPage = await apiClient.get(`/admin/users?page=1&perPage=${USERS_PAGE_SIZE}`, { cacheTtl: 0 });
      const totalPages = Math.max(1, Number(firstPage.totalPages || 1));
      const allUsers = [...getUsersFromResponse(firstPage)];

      for (let page = 2; page <= totalPages; page += 1) {
        const data = await apiClient.get(`/admin/users?page=${page}&perPage=${USERS_PAGE_SIZE}`, { cacheTtl: 0 });
        allUsers.push(...getUsersFromResponse(data));
      }

      setUsers(allUsers);
      setTotalUsers(Number(firstPage.totalItems || allUsers.length));
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'Failed to load users.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return users.filter(user => {
      const matchesSearch = user.name?.toLowerCase().includes(lower) || user.email?.toLowerCase().includes(lower);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'blocked' && user.isBlocked) ||
        (statusFilter === 'active' && !user.isBlocked);
      return matchesSearch && matchesStatus;
    });
  }, [users, searchTerm, statusFilter]);

  const updateUserInList = (updatedUser) => {
    setUsers(prev => prev.map(user => user._id === updatedUser._id ? updatedUser : user));
    setSelectedUser(prev => prev?._id === updatedUser._id ? updatedUser : prev);
  };

  const handleBlockToggle = async (user) => {
    const shouldBlock = !user.isBlocked;
    setProcessingId(user._id);
    try {
      const data = await apiClient.patch(`/admin/users/${user._id}/block`, {
        isBlocked: shouldBlock,
        reason: shouldBlock ? blockReason : ''
      });
      updateUserInList(data.user);
      setBlockReason('');
      toast({
        title: shouldBlock ? 'User Blocked' : 'User Unblocked',
        description: `${user.name || user.email} was ${shouldBlock ? 'blocked' : 'unblocked'}.`
      });
    } catch (error) {
      toast({ title: 'Action Failed', description: error.message, variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleBalanceSubmit = async (event) => {
    event.preventDefault();
    if (!selectedUser) return;

    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      toast({ title: 'Invalid Amount', description: 'Enter an amount greater than 0.', variant: 'destructive' });
      return;
    }

    setProcessingId(selectedUser._id);
    try {
      const data = await apiClient.post(`/admin/users/${selectedUser._id}/balance`, {
        action: balanceAction,
        amount: numericAmount,
        note
      });
      updateUserInList(data.user);
      setAmount('');
      setNote('');
      toast({ title: 'Balance Updated', description: `${selectedUser.name}'s wallet was updated.` });
    } catch (error) {
      toast({ title: 'Update Failed', description: error.message, variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleFreeEntrySubmit = async (event) => {
    event.preventDefault();
    if (!selectedUser) return;

    const numericAmount = Number(freeEntryAmount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0 || !Number.isInteger(numericAmount)) {
      toast({ title: 'Invalid Amount', description: 'Enter a whole number greater than 0.', variant: 'destructive' });
      return;
    }

    setProcessingId(selectedUser._id);
    try {
      const data = await apiClient.post(`/admin/users/${selectedUser._id}/freeEntries`, {
        amount: numericAmount,
        note: freeEntryNote
      });
      updateUserInList(data.user);
      setFreeEntryAmount('');
      setFreeEntryNote('');
      toast({ title: 'Free Entries Granted', description: `${selectedUser.name}'s reward entries were updated.` });
    } catch (error) {
      toast({ title: 'Grant Failed', description: error.message, variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (value) => {
    if (!value) return 'Unknown';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    return date.toLocaleString();
  };

  const selectedBalance = selectedUser?.walletBalance || selectedUser?.wallet_balance || 0;
  const selectedFreeEntries = Number(
    selectedUser?.freeEntriesAvailable
    ?? selectedUser?.referral_stats?.free_entries_available
    ?? 0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> Users
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Review accounts, control access, adjust wallet balances, and grant free entries.</p>
          <p className="text-xs text-muted-foreground mt-1">Showing {filteredUsers.length} of {totalUsers || users.length} users.</p>
        </div>
        <button onClick={fetchUsers} className="flex items-center gap-2 bg-muted/50 hover:bg-accent/20 px-4 py-2 rounded-xl text-sm font-medium">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="admin-glass-panel p-4 rounded-2xl grid grid-cols-1 md:grid-cols-[1fr_180px] gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-background/50 border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full bg-background/50 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
        >
          <option value="all">All Users</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
        <div className="admin-glass-panel rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-background/40 border-b border-border">
                <tr>
                  <th className="p-4 font-medium text-muted-foreground text-sm">User</th>
                  <th className="p-4 font-medium text-muted-foreground text-sm">Joined</th>
                  <th className="p-4 font-medium text-muted-foreground text-sm">Balance</th>
                  <th className="p-4 font-medium text-muted-foreground text-sm">Status</th>
                  <th className="p-4 font-medium text-muted-foreground text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      <td className="p-4"><Skeleton className="h-6 w-40" /></td>
                      <td className="p-4"><Skeleton className="h-6 w-28" /></td>
                      <td className="p-4"><Skeleton className="h-6 w-20" /></td>
                      <td className="p-4"><Skeleton className="h-6 w-16" /></td>
                      <td className="p-4"><Skeleton className="h-8 w-24 ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">No users found.</td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user._id} className={`hover:bg-background/30 transition-colors ${selectedUser?._id === user._id ? 'bg-primary/5' : ''}`}>
                      <td className="p-4">
                        <div className="font-bold text-sm flex items-center gap-2">
                          {user.name || 'Unnamed User'}
                          {user.isAdmin && <ShieldCheck className="w-4 h-4 text-accent" />}
                        </div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{formatDate(user.createdAt || user.created)}</td>
                      <td className="p-4 text-sm font-bold text-secondary">Rs.{user.walletBalance || user.wallet_balance || 0}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          user.isBlocked ? 'bg-destructive/20 text-destructive' : 'bg-secondary/20 text-secondary'
                        }`}>
                          {user.isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="px-3 py-1.5 bg-muted/50 hover:bg-primary/20 text-xs font-bold rounded-lg transition-colors"
                          >
                            Manage
                          </button>
                          <button
                            onClick={() => handleBlockToggle(user)}
                            disabled={user.isAdmin || processingId === user._id}
                            className={`p-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                              user.isBlocked
                                ? 'bg-secondary/10 hover:bg-secondary/20 text-secondary'
                                : 'bg-destructive/10 hover:bg-destructive/20 text-destructive'
                            }`}
                            title={user.isBlocked ? 'Unblock user' : 'Block user'}
                          >
                            {user.isBlocked ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="admin-glass-panel rounded-2xl p-6 h-fit">
          {selectedUser ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold">{selectedUser.name || 'Unnamed User'}</h3>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-background/50 border border-border rounded-xl p-3">
                  <p className="text-muted-foreground text-xs mb-1">Wallet</p>
                  <p className="font-bold text-secondary">Rs.{selectedBalance}</p>
                </div>
                <div className="bg-background/50 border border-border rounded-xl p-3">
                  <p className="text-muted-foreground text-xs mb-1">Joined</p>
                  <p className="font-medium">{formatDate(selectedUser.createdAt || selectedUser.created)}</p>
                </div>
                <div className="bg-background/50 border border-primary/20 rounded-xl p-3 col-span-2">
                  <p className="text-muted-foreground text-xs mb-1">Free Entries Available</p>
                  <p className="font-bold text-primary">{selectedFreeEntries}</p>
                </div>
              </div>

              <form onSubmit={handleBalanceSubmit} className="space-y-4 border-t border-border/50 pt-5">
                <h4 className="font-bold text-sm">Wallet Action</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBalanceAction('add')}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-bold border ${
                      balanceAction === 'add' ? 'bg-secondary/20 text-secondary border-secondary/40' : 'bg-background/40 border-border text-muted-foreground'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" /> Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setBalanceAction('deduct')}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-bold border ${
                      balanceAction === 'deduct' ? 'bg-destructive/20 text-destructive border-destructive/40' : 'bg-background/40 border-border text-muted-foreground'
                    }`}
                  >
                    <MinusCircle className="w-4 h-4" /> Deduct
                  </button>
                </div>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Amount"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional admin note"
                  rows={3}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
                />
                <button
                  type="submit"
                  disabled={processingId === selectedUser._id}
                  className="w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {processingId === selectedUser._id ? 'Saving...' : 'Update Balance'}
                </button>
              </form>

              <form onSubmit={handleFreeEntrySubmit} className="space-y-4 border-t border-border/50 pt-5">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <Gift className="w-4 h-4 text-primary" /> Free Entry Reward
                </h4>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={freeEntryAmount}
                  onChange={(e) => setFreeEntryAmount(e.target.value)}
                  placeholder="How many free entries?"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
                <textarea
                  value={freeEntryNote}
                  onChange={(e) => setFreeEntryNote(e.target.value)}
                  placeholder="Optional reward note"
                  rows={3}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
                />
                <button
                  type="submit"
                  disabled={processingId === selectedUser._id}
                  className="w-full bg-primary/90 text-primary-foreground font-bold py-2.5 rounded-xl hover:bg-primary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Gift className="w-4 h-4" />
                  {processingId === selectedUser._id ? 'Granting...' : 'Grant Free Entries'}
                </button>
              </form>

              <div className="space-y-3 border-t border-border/50 pt-5">
                <h4 className="font-bold text-sm">Access Control</h4>
                {!selectedUser.isBlocked && (
                  <input
                    type="text"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder="Block reason"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-destructive text-foreground"
                  />
                )}
                {selectedUser.isBlocked && selectedUser.blockedReason && (
                  <p className="text-sm text-muted-foreground bg-background/50 border border-border rounded-xl p-3">
                    Reason: {selectedUser.blockedReason}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => handleBlockToggle(selectedUser)}
                  disabled={selectedUser.isAdmin || processingId === selectedUser._id}
                  className={`w-full font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50 ${
                    selectedUser.isBlocked
                      ? 'bg-secondary text-secondary-foreground hover:bg-secondary/90'
                      : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  }`}
                >
                  {selectedUser.isBlocked ? 'Unblock User' : 'Block User'}
                </button>
              </div>
            </div>
          ) : (
            <div className="min-h-80 flex flex-col items-center justify-center text-center text-muted-foreground">
              <Users className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium">Select a user to manage details.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
