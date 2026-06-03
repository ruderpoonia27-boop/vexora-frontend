import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Search, Filter, ChevronLeft, ChevronRight, SlidersHorizontal, Trophy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/lib/apiClient';
import TournamentCard from '@/components/TournamentCard';
import { TournamentCardSkeleton } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';
import { getPlatformName, useSettings } from '@/hooks/useSettings';

const defaultFilters = {
  gameType: [],
  status: [],
  sortBy: '-created'
};

const allowedStatuses = ['pending', 'active', 'completed', 'dismissed', 'cancelled'];

const getUserId = (user) => user?._id || user?.id || user;

const formatDateTime = (value) => {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleString();
};

const TournamentsPage = () => {
  const { isAuthenticated, currentUser } = useAuth();
  const { settings } = useSettings();
  const platformName = getPlatformName(settings);
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [activeView, setActiveView] = useState('all');
  const perPage = 12;

  const [filters, setFilters] = useState(defaultFilters);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const currentUserId = currentUser?.id || currentUser?._id;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [filters, debouncedSearch, activeView]);

  useEffect(() => {
    let isMounted = true;

    const fetchTournaments = async (showLoading = true) => {
      if (activeView === 'joined' && !isAuthenticated) {
        if (isMounted) {
          setTournaments([]);
          setTotalItems(0);
          setLoading(false);
        }
        return;
      }

      if (showLoading && isMounted) {
        setLoading(true);
      }

      try {
        if (!showLoading && document.visibilityState === 'hidden') {
          return;
        }

        const params = new URLSearchParams({
          page,
          limit: perPage,
          sortBy: filters.sortBy
        });

        if (debouncedSearch) params.set('search', debouncedSearch);
        if (filters.gameType.length > 0) params.set('gameType', filters.gameType.join(','));
        if (filters.status.length > 0) params.set('status', filters.status.join(','));
        if (activeView === 'joined' && currentUserId) params.set('joinedUserId', currentUserId);

        const data = await apiClient.get(`/tournaments?${params.toString()}`, { cacheTtl: 0 });
        if (!isMounted) return;
        const nextTournaments = data.items || data.tournaments || [];
        setTournaments(nextTournaments);
        setTotalItems(data.totalItems || nextTournaments.length || 0);
      } catch (error) {
        if (isMounted) {
          console.error('Fetch error', error);
          setTournaments([]);
          setTotalItems(0);
        }
      } finally {
        if (showLoading && isMounted) setLoading(false);
      }
    };

    fetchTournaments(true);

    const handleFocus = () => {
      fetchTournaments(false);
    };

    const intervalId = window.setInterval(() => {
      fetchTournaments(false);
    }, 30000);

    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [activeView, currentUserId, debouncedSearch, filters, isAuthenticated, page]);

  const handleFilterChange = (category, value) => {
    setFilters((previous) => {
      const current = previous[category] || [];
      const updated = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...previous, [category]: updated };
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setFilters(defaultFilters);
  };

  const handleJoin = (tournament) => {
    if (!isAuthenticated) navigate('/login');
    else navigate(`/tournament/${tournament.id}`);
  };

  const totalPages = Math.ceil(totalItems / perPage) || 1;
  const viewTitle = useMemo(() => activeView === 'joined' ? 'Your Joined Tournaments' : 'All Tournaments', [activeView]);
  const enrichedTournaments = useMemo(() => tournaments.map((tournament) => {
    const isJoined = currentUserId
      ? (tournament.currentPlayers || []).some((player) => getUserId(player) === currentUserId)
      : false;
    const startTime = tournament.startTime || tournament.match_start_time;
    const roomVisible = isJoined
      && Boolean(tournament.room_id || tournament.roomId)
      && (
        tournament.status === 'completed'
        || tournament.status === 'dismissed'
        || !startTime
        || new Date(startTime).getTime() <= Date.now()
      );

    return {
      ...tournament,
      isJoined,
      roomVisible,
      startTimeLabel: formatDateTime(startTime)
    };
  }), [currentUserId, tournaments]);

  return (
    <div className="min-h-screen bg-background text-foreground py-12">
      <Helmet>
        <title>Browse Tournaments | {platformName}</title>
      </Helmet>

      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-glow-primary">Tournaments</h1>
            <p className="text-muted-foreground text-lg">Browse open matches or jump straight into the tournaments you already joined.</p>
          </div>

          <div className="w-full md:w-auto flex items-center gap-3">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tournaments..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full bg-input border border-border/50 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
              />
            </div>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="p-3 bg-card border border-border/50 rounded-xl text-foreground hover:bg-accent/10 hover:text-accent hover:border-accent/50 transition-colors md:hidden"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-3">
          <button
            onClick={() => setActiveView('all')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${activeView === 'all' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border/50 text-muted-foreground hover:text-foreground'}`}
          >
            All Tournaments
          </button>
          <button
            onClick={() => setActiveView('joined')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${activeView === 'joined' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border/50 text-muted-foreground hover:text-foreground'}`}
          >
            Joined Tournaments
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className={`lg:col-span-1 space-y-6 ${isFilterOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-card border border-border/50 rounded-3xl p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold flex items-center gap-2"><Filter className="w-4 h-4" /> Filters</h3>
                <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-primary transition-colors">Clear All</button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Game Type</h4>
                  <div className="space-y-2">
                    {['BGMI', 'Free Fire'].map((game) => (
                      <label key={game} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={filters.gameType.includes(game)}
                          onChange={() => handleFilterChange('gameType', game)}
                          className="w-4 h-4 rounded border-border/50 text-primary bg-input focus:ring-primary focus:ring-offset-background"
                        />
                        <span className="text-sm group-hover:text-primary transition-colors">{game}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Status</h4>
                  <div className="space-y-2">
                    {allowedStatuses.map((status) => (
                      <label key={status} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={filters.status.includes(status)}
                          onChange={() => handleFilterChange('status', status)}
                          className="w-4 h-4 rounded border-border/50 text-primary bg-input focus:ring-primary focus:ring-offset-background"
                        />
                        <span className="text-sm capitalize group-hover:text-primary transition-colors">{status}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Sort By</h4>
                  <select
                    value={filters.sortBy}
                    onChange={(event) => setFilters((previous) => ({ ...previous, sortBy: event.target.value }))}
                    className="w-full bg-input border border-border/50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    <option value="-created">Newest First</option>
                    <option value="-prize_pool">Total Prize Pool (High to Low)</option>
                    <option value="-joined_count">Most Joined</option>
                    <option value="entry_fee">Entry Fee (Low to High)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-sm text-muted-foreground">
              <span>{viewTitle}</span>
              <span>Showing {enrichedTournaments.length} of {totalItems} tournaments</span>
            </div>

            {activeView === 'joined' && !isAuthenticated ? (
              <EmptyState
                icon={Trophy}
                title="Login to view joined tournaments"
                message="Your joined matches are available here once you sign in."
                actionText="Go to Login"
                onAction={() => navigate('/login')}
              />
            ) : loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, index) => <TournamentCardSkeleton key={index} />)}
              </div>
            ) : enrichedTournaments.length > 0 ? (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {enrichedTournaments.map((tournament) => (
                    <div key={tournament.id} className="h-full content-auto">
                      <TournamentCard tournament={tournament} onJoin={handleJoin} />
                    </div>
                  ))}
                </div>

                {totalPages > 1 ? (
                  <div className="flex items-center justify-center gap-4 pt-8 border-t border-border/50">
                    <button
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-lg border border-border/50 hover:bg-card disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-medium">Page {page} of {totalPages}</span>
                    <button
                      onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                      disabled={page === totalPages}
                      className="p-2 rounded-lg border border-border/50 hover:bg-card disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <EmptyState
                icon={Search}
                title={activeView === 'joined' ? 'No joined tournaments yet' : 'No tournaments found'}
                message={activeView === 'joined'
                  ? 'The tournaments you join will show up here for quick access.'
                  : 'We could not find any tournaments matching your current filters. Try adjusting your search criteria.'}
                actionText={activeView === 'joined' ? 'Browse All Tournaments' : 'Clear Filters'}
                onAction={() => activeView === 'joined' ? setActiveView('all') : clearFilters()}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentsPage;
