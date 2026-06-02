import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Calendar, Edit3, LogOut, Loader2, Gamepad2, Shield, Sparkles } from 'lucide-react';
import EditProfileModal from '@/components/EditProfileModal';
import apiClient from '@/lib/apiClient';
import { formatStatusLabel } from '@/lib/utils';
import GameAvatar from '@/components/GameAvatar';
import { RARITY_STYLES, getAvatarById } from '@/data/avatarCatalog';
import { getPlatformName, useSettings } from '@/hooks/useSettings';

const UserProfilePage = () => {
  const { currentUser, logout, refreshUser } = useAuth();
  const { settings } = useSettings();
  const platformName = getPlatformName(settings);
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [joinedTournaments, setJoinedTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    refreshUser();
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) {
      setJoinedTournaments([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchJoinedTournaments = async () => {
      setLoading(true);
      try {
        const data = await apiClient.get(`/tournaments?joinedUserId=${currentUser.id}&sortBy=-created`);
        if (!isMounted) return;
        setJoinedTournaments(data.tournaments || []);
      } catch (error) {
        console.error('Error loading joined tournaments:', error);
        if (isMounted) setJoinedTournaments([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchJoinedTournaments();
    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  const winnings = useMemo(() => joinedTournaments.filter((tournament) => {
    const winnerId = tournament.winner?._id || tournament.winner?.id;
    return winnerId && winnerId === currentUser?.id;
  }), [currentUser?.id, joinedTournaments]);

  if (!currentUser) return null;
  const activeAvatar = getAvatarById(currentUser.avatarId || currentUser.avatar_id);

  return (
    <div className="min-h-screen bg-background text-foreground py-12">
      <Helmet>
        <title>My Profile | {platformName}</title>
      </Helmet>

      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card border border-border/50 rounded-3xl p-8 text-center relative overflow-hidden box-glow-primary">
              {currentUser?.isAdmin ? (
                <button
                  onClick={() => navigate('/admin')}
                  className="absolute top-4 right-4 flex items-center gap-1.5 bg-accent/10 text-accent hover:bg-accent hover:text-accent-foreground px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 z-10"
                  title="Admin Panel"
                >
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline-block">Admin Panel</span>
                </button>
              ) : null}

              <div className="mb-4 flex justify-center">
                <GameAvatar avatarId={currentUser.avatarId || currentUser.avatar_id} name={currentUser.name} size="xl" className="rounded-[28px]" />
              </div>
              <h2 className="text-2xl font-bold mb-1">{currentUser.name || 'Player'}</h2>
              <p className="text-muted-foreground text-sm mb-6">{currentUser.email}</p>
              <div className={`mx-auto mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${RARITY_STYLES[activeAvatar.rarity]}`}>
                <Sparkles className="h-3.5 w-3.5" />
                {activeAvatar.rarity} Avatar
              </div>

              <div className="bg-background/50 rounded-xl p-4 mb-6 border border-border/50">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Wallet Balance</p>
                <p className="text-3xl font-bold text-secondary text-glow-secondary">Rs.{currentUser.walletBalance || 0}</p>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-8">
                <Calendar className="w-4 h-4" />
                <span>Member since {new Date(currentUser.created).toLocaleDateString()}</span>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="w-full py-3 bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-4 h-4" /> Edit Profile
                </button>
                <button
                  onClick={logout}
                  className="w-full py-3 bg-destructive/10 text-destructive font-bold rounded-xl hover:bg-destructive hover:text-destructive-foreground transition-all flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div className="bg-card border border-border/50 rounded-3xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-accent/20 rounded-lg text-accent">
                  <Trophy className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Winnings History</h3>
              </div>

              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
              ) : winnings.length > 0 ? (
                <div className="space-y-4">
                  {winnings.map((win) => (
                    <div key={win._id} className="flex items-center justify-between p-4 bg-background rounded-xl border border-border/50">
                      <div>
                        <p className="font-bold">{win.title}</p>
                        <p className="text-xs text-muted-foreground">{new Date(win.winner_declared_at || win.finished_at || win.created).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-accent text-glow-accent">+Rs.{win.winner_prize || 0}</p>
                        <p className="text-xs text-muted-foreground">Prize</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground bg-background/50 rounded-xl border border-dashed border-border/50">
                  <p>No winnings yet. Join tournaments to start earning.</p>
                </div>
              )}
            </div>

            <div className="bg-card border border-border/50 rounded-3xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/20 rounded-lg text-primary">
                  <Gamepad2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Joined Tournaments</h3>
              </div>

              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : joinedTournaments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {joinedTournaments.slice(0, 6).map((tournament) => (
                    <div key={tournament._id} className="p-4 bg-background rounded-xl border border-border/50 hover:border-primary/50 transition-colors">
                      <div className="flex justify-between items-start mb-2 gap-3">
                        <span className="text-xs font-bold text-primary uppercase">{tournament.game_type}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${tournament.status === 'active' ? 'bg-secondary/20 text-secondary' : 'bg-muted text-muted-foreground'}`}>
                          {formatStatusLabel(tournament.status)}
                        </span>
                      </div>
                      <p className="font-bold mb-2">{tournament.title}</p>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Entry: Rs.{tournament.entry_fee}</span>
                        <span>{new Date(tournament.startTime || tournament.created).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground bg-background/50 rounded-xl border border-dashed border-border/50">
                  <p>You have not joined any tournaments yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <EditProfileModal isOpen={isEditModalOpen} onOpenChange={setIsEditModalOpen} />
    </div>
  );
};

export default UserProfilePage;
