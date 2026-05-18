
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Loader2, Trophy, Wallet, Users, BarChart3, Edit, Trash2, CalendarClock, ShieldCheck } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { useToast } from '@/hooks/use-toast';
import { getPlatformName, useSettings } from '@/hooks/useSettings';
import apiClient from '@/lib/apiClient';

import CreateTournamentModal from '@/components/CreateTournamentModal';
import EditTournamentModal from '@/components/EditTournamentModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import WalletRequestApprovalModal from '@/components/WalletRequestApprovalModal';
import DeclareWinnerModal from '@/components/DeclareWinnerModal';
import AnalyticsTab from './AnalyticsTab';
import { TableRowSkeleton } from '@/components/Skeleton';

const AdminDashboard = () => {
  const { toast } = useToast();
  const { settings } = useSettings();
  const platformName = getPlatformName(settings);
  
  const { data: tournaments, loading: tLoading } = useRealtimeSubscription('tournaments', { sort: '-created' });
  const { data: requests, loading: rLoading } = useRealtimeSubscription('wallet_requests', { sort: '-created', expand: 'userId' });
  const { data: users, loading: uLoading } = useRealtimeSubscription('users', { sort: '-created' });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTournament, setEditTournament] = useState(null);
  const [deleteTournament, setDeleteTournament] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reviewRequest, setReviewRequest] = useState(null);
  const [isWinnerOpen, setIsWinnerOpen] = useState(false);

  const handleDeleteTournament = async () => {
    if (!deleteTournament) return;
    const tournamentId = deleteTournament._id || deleteTournament.id;
    if (!tournamentId) {
      toast({ title: "Error", description: "Tournament ID is missing.", variant: "destructive" });
      return;
    }
    setIsDeleting(true);
    try {
      await apiClient.delete(`/tournaments/${tournamentId}`);
      toast({ title: "Deleted", description: "Tournament deleted successfully." });
      setDeleteTournament(null);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to delete tournament.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-8">
      <Helmet>
        <title>Admin Dashboard | {platformName}</title>
      </Helmet>
      
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-accent text-glow-accent">Admin Control Panel</h1>
            <p className="text-muted-foreground">Manage tournaments, wallets, users, and view analytics.</p>
          </div>
        </div>

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="bg-card border border-border mb-8 overflow-x-auto flex w-full justify-start md:justify-center p-1 h-auto rounded-xl">
            <TabsTrigger value="analytics" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary py-3 px-6 whitespace-nowrap"><BarChart3 className="w-4 h-4 mr-2" /> Analytics</TabsTrigger>
            <TabsTrigger value="tournaments" className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent py-3 px-6 whitespace-nowrap"><Trophy className="w-4 h-4 mr-2" /> Tournaments</TabsTrigger>
            <TabsTrigger value="wallets" className="data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary py-3 px-6 whitespace-nowrap"><Wallet className="w-4 h-4 mr-2" /> Wallet Requests</TabsTrigger>
            <TabsTrigger value="winners" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary py-3 px-6 whitespace-nowrap"><Trophy className="w-4 h-4 mr-2" /> Winners</TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-muted data-[state=active]:text-foreground py-3 px-6 whitespace-nowrap"><Users className="w-4 h-4 mr-2" /> Users</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <AnalyticsTab />
          </TabsContent>

          <TabsContent value="tournaments" className="bg-card border border-border/50 rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Manage Tournaments</h2>
              <button onClick={() => setIsCreateOpen(true)} className="px-4 py-2 bg-accent text-accent-foreground rounded-lg font-bold hover:bg-accent/90 transition-colors box-glow-accent text-sm md:text-base">
                + Create 
              </button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border/50">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-background/80 text-muted-foreground text-sm">
                    <th className="p-4 font-medium">Game Name</th>
                    <th className="p-4 font-medium">Entry/Prize</th>
                    <th className="p-4 font-medium">Slots</th>
                    <th className="p-4 font-medium">Match Details</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {tLoading ? (
                    <>
                      <TableRowSkeleton columns={6} />
                      <TableRowSkeleton columns={6} />
                      <TableRowSkeleton columns={6} />
                    </>
                  ) : tournaments.length === 0 ? (
                    <tr><td colSpan="6" className="p-8 text-center text-muted-foreground">No tournaments found.</td></tr>
                  ) : tournaments.map((t) => (
                    <tr key={t._id} className="hover:bg-background/30 transition-colors">
                      <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${t.name === 'BGMI' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>{t.name}</span></td>
                      <td className="p-4"><div className="text-sm">₹{t.entry_fee}</div><div className="text-sm font-bold text-accent">₹{t.base_prize + (t.entry_fee * (t.joined_count || 0))}</div></td>
                      <td className="p-4 text-sm">{t.joined_count || 0}/{t.total_slots}</td>
                      <td className="p-4">
                        {t.match_start_time ? (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <CalendarClock className="w-3 h-3" /> {new Date(t.match_start_time).toLocaleDateString()}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground mb-1">TBA</div>
                        )}
                        {t.room_id ? (
                          <div className="flex items-center gap-1 text-xs font-mono text-accent">
                            <ShieldCheck className="w-3 h-3" /> Setup Complete
                          </div>
                        ) : (
                          <div className="text-xs text-destructive">Room Missing</div>
                        )}
                      </td>
                      <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-medium ${t.status === 'active' ? 'bg-secondary/20 text-secondary' : t.status === 'completed' ? 'bg-accent/20 text-accent' : t.status === 'pending' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>{t.status}</span></td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditTournament(t)} className="p-2 hover:bg-accent/10 hover:text-accent rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteTournament(t)} className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="wallets" className="bg-card border border-border/50 rounded-2xl p-6 shadow-xl">
             <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Wallet Requests</h2>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border/50">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-background/80 text-muted-foreground text-sm">
                    <th className="p-4 font-medium">User</th>
                    <th className="p-4 font-medium">Amount</th>
                    <th className="p-4 font-medium">TXN ID</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {rLoading ? (
                    <>
                      <TableRowSkeleton columns={5} />
                      <TableRowSkeleton columns={5} />
                    </>
                  ) : requests.length === 0 ? (
                    <tr><td colSpan="5" className="p-8 text-center text-muted-foreground">No requests found.</td></tr>
                  ) : requests.map((r) => (
<tr key={r._id} className="hover:bg-background/30 transition-colors">
                       <td className="p-4 text-sm">{r.user?.name || r.user?.email || 'Unknown User'}</td>
                      <td className="p-4 font-bold text-secondary">₹{r.amount}</td>
                      <td className="p-4 font-mono text-xs">{r.transaction_id}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${r.status === 'pending' ? 'bg-accent/20 text-accent' : r.status === 'approved' ? 'bg-secondary/20 text-secondary' : 'bg-destructive/20 text-destructive'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {r.status === 'pending' ? (
                          <button onClick={() => setReviewRequest(r)} className="text-xs bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground px-3 py-1.5 rounded transition-colors font-bold">Review</button>
                        ) : (<span className="text-xs text-muted-foreground">Processed</span>)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="winners" className="bg-card border border-border/50 rounded-2xl p-6 shadow-xl">
             <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Tournament Winners</h2>
              <button onClick={() => setIsWinnerOpen(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-colors box-glow-primary">
                Declare Winner
              </button>
            </div>
            <div className="p-12 text-center border border-dashed border-border/50 rounded-lg bg-background/50">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">Select a tournament above to distribute prizes securely to users.</p>
            </div>
          </TabsContent>

          <TabsContent value="users" className="bg-card border border-border/50 rounded-2xl p-6 shadow-xl">
             <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Registered Users</h2>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border/50">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-background/80 text-muted-foreground text-sm">
                    <th className="p-4 font-medium">Name</th>
                    <th className="p-4 font-medium">Email</th>
                    <th className="p-4 font-medium">Joined Date</th>
                    <th className="p-4 font-medium text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {uLoading ? (
                    <>
                      <TableRowSkeleton columns={4} />
                      <TableRowSkeleton columns={4} />
                    </>
                  ) : users.length === 0 ? (
                    <tr><td colSpan="4" className="p-8 text-center text-muted-foreground">No users found.</td></tr>
                  ) : users.map((u) => (
                    <tr key={u._id} className="hover:bg-background/30 transition-colors">
                      <td className="p-4 font-medium text-sm">{u.name || 'No Name'}</td>
                      <td className="p-4 text-sm text-muted-foreground">{u.email}</td>
                      <td className="p-4 text-sm text-muted-foreground">{new Date(u.created).toLocaleDateString()}</td>
                      <td className="p-4 text-right font-bold text-secondary text-glow-secondary">₹{u.wallet_balance || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

        </Tabs>
      </div>

      <CreateTournamentModal isOpen={isCreateOpen} onOpenChange={setIsCreateOpen} />
      <EditTournamentModal isOpen={!!editTournament} onOpenChange={(open) => !open && setEditTournament(null)} tournament={editTournament} />
      <WalletRequestApprovalModal isOpen={!!reviewRequest} onOpenChange={(open) => !open && setReviewRequest(null)} request={reviewRequest} />
      <DeclareWinnerModal isOpen={isWinnerOpen} onOpenChange={setIsWinnerOpen} />
      
      <ConfirmationModal 
        isOpen={!!deleteTournament}
        onOpenChange={(open) => !open && setDeleteTournament(null)}
        title="Delete Tournament"
        message="Are you sure you want to delete this tournament? This action cannot be undone."
        confirmText="Delete"
        isDangerous={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteTournament}
      />
    </div>
  );
};

export default AdminDashboard;
