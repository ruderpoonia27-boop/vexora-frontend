import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Trophy, Medal, Award, Loader2 } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import GameAvatar from '@/components/GameAvatar';
import { getPlatformName, useSettings } from '@/hooks/useSettings';

const getRankBadge = (index) => {
  if (index === 0) return <div className="w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center border border-yellow-500/50 box-glow-accent"><Trophy className="w-4 h-4" /></div>;
  if (index === 1) return <div className="w-8 h-8 rounded-full bg-gray-300/20 text-gray-300 flex items-center justify-center border border-gray-300/50"><Medal className="w-4 h-4" /></div>;
  if (index === 2) return <div className="w-8 h-8 rounded-full bg-amber-700/20 text-amber-700 flex items-center justify-center border border-amber-700/50"><Award className="w-4 h-4" /></div>;
  return <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center border border-border text-muted-foreground font-bold text-sm">#{index + 1}</div>;
};

const LeaderboardPage = () => {
  const { settings } = useSettings();
  const platformName = getPlatformName(settings);
  const [realUsers, setRealUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const result = await apiClient.get('/users/leaderboard?limit=25');
        if (!isMounted) return;
        setRealUsers(result.items || []);
      } catch (error) {
        console.error('Failed to load leaderboard users:', error);
        if (isMounted) {
          setRealUsers([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUsers();
    return () => {
      isMounted = false;
    };
  }, []);

  const leaderboard = useMemo(() => realUsers.map((user) => ({
    id: user.id || user._id,
    name: user.name || 'Anonymous Player',
    avatarId: user.avatarId || user.avatar_id,
    totalWinnings: Number(user.totalWinnings || 0)
  })), [realUsers]);

  return (
    <div className="min-h-screen bg-background text-foreground py-12">
      <Helmet>
        <title>Leaderboard | {platformName}</title>
      </Helmet>

      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-glow-accent text-accent">Top 25 Leaderboard</h1>
          <p className="text-muted-foreground text-lg">Ranked by total prize money won in tournaments.</p>
        </div>

        <div className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background/80 text-muted-foreground text-sm uppercase tracking-wider">
                  <th className="p-6 font-medium w-24 text-center">Rank</th>
                  <th className="p-6 font-medium">Player</th>
                  <th className="p-6 font-medium text-right">Winnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  <tr><td colSpan="3" className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-accent" /></td></tr>
                ) : leaderboard.length === 0 ? (
                  <tr><td colSpan="3" className="p-12 text-center text-muted-foreground">No winners yet. Join a tournament and be the first on the board!</td></tr>
                ) : leaderboard.map((user, index) => (
                  <tr key={user.id} className="hover:bg-background/50 transition-colors group">
                    <td className="p-6">
                      <div className="flex justify-center">
                        {getRankBadge(index)}
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <GameAvatar avatarId={user.avatarId} name={user.name} size="sm" className="rounded-xl" />
                        <div>
                          <p className="font-bold text-lg group-hover:text-primary transition-colors">{user.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <p className="font-bold text-secondary text-xl">₹{user.totalWinnings.toLocaleString('en-IN')}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
