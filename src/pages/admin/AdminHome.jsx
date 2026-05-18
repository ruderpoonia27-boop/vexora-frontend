import React, { useEffect, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Users, Trophy, Wallet, Activity, ArrowUpRight, TrendingUp, RotateCcw } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const REVENUE_RESET_BASELINE_KEY = 'adminWalletRevenueResetBaseline';

const getItems = (result, key) => result?.items || result?.[key] || (Array.isArray(result) ? result : []);

const sumApprovedAmounts = (items = []) => (
  items.reduce((total, item) => (
    item.status === 'approved' ? total + Number(item.amount || 0) : total
  ), 0)
);

const calculateWalletRevenue = (deposits = [], withdrawals = []) => (
  sumApprovedAmounts(deposits) - sumApprovedAmounts(withdrawals)
);

const buildRevenueChartData = (revenue) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  if (!revenue) {
    return days.map((name) => ({ name, users: 0, revenue: 0 }));
  }

  return days.map((name, index) => ({
    name,
    users: 10 + (index * 4),
    revenue: Math.round((revenue / days.length) * (0.7 + (index * 0.1)))
  }));
};

export const AdminHome = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState({
    users: 0,
    activeTournaments: 0,
    pendingWithdrawals: 0,
    totalRevenue: 0,
    grossRevenue: 0,
    revenueBaseline: 0
  });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersResult, tournamentsResult, depositsResult, withdrawalsResult] = await Promise.all([
          apiClient.get('/users'),
          apiClient.get('/tournaments'),
          apiClient.get('/admin/deposits'),
          apiClient.get('/admin/withdrawals')
        ]);

        const usersList = getItems(usersResult, 'users');
        const tournamentsList = getItems(tournamentsResult, 'tournaments');
        const depositsList = getItems(depositsResult, 'deposits');
        const withdrawalsList = getItems(withdrawalsResult, 'withdrawals');
        const grossRevenue = calculateWalletRevenue(depositsList, withdrawalsList);
        const savedBaseline = localStorage.getItem(REVENUE_RESET_BASELINE_KEY);
        const revenueBaseline = savedBaseline === null ? grossRevenue : Number(savedBaseline) || 0;
        if (savedBaseline === null) {
          localStorage.setItem(REVENUE_RESET_BASELINE_KEY, String(revenueBaseline));
        }
        const totalRevenue = grossRevenue - revenueBaseline;

        setStats({
          users: usersResult.totalItems || usersList.length,
          activeTournaments: tournamentsList.filter((tournament) => tournament.status === 'active').length,
          pendingWithdrawals: withdrawalsList.filter((withdrawal) => withdrawal.status === 'pending').length,
          totalRevenue,
          grossRevenue,
          revenueBaseline
        });
        setChartData(buildRevenueChartData(totalRevenue));
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleResetRevenue = () => {
    const nextBaseline = Number(stats.grossRevenue || 0);
    localStorage.setItem(REVENUE_RESET_BASELINE_KEY, String(nextBaseline));
    setStats((current) => ({
      ...current,
      totalRevenue: 0,
      revenueBaseline: nextBaseline
    }));
    setChartData(buildRevenueChartData(0));
    toast({ title: 'Revenue reset', description: 'Dashboard revenue counter is now zero for the new period.' });
  };

  const statCards = [
    { title: 'Total Users', value: stats.users, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
    { title: 'Active Tournaments', value: stats.activeTournaments, icon: Trophy, color: 'text-accent', bg: 'bg-accent/10' },
    { title: 'Pending Withdrawals', value: stats.pendingWithdrawals, icon: Wallet, color: 'text-secondary', bg: 'bg-secondary/10' },
    { title: 'Total Revenue (Est.)', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' }
  ];

  const displayStatCards = statCards.map((stat) => (
    stat.title === 'Total Revenue (Est.)' ? { ...stat, canReset: true } : stat
  ));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayStatCards.map((stat, i) => (
          <div key={i} className="admin-glass-panel p-6 rounded-2xl flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="flex items-center text-xs font-medium text-secondary bg-secondary/10 px-2 py-1 rounded-full">
                +12% <ArrowUpRight className="w-3 h-3 ml-1" />
              </span>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium mb-1">{stat.title}</p>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <h3 className="text-3xl font-bold">{stat.value}</h3>
              )}
              {stat.canReset && !loading ? (
                <button
                  type="button"
                  onClick={handleResetRevenue}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset Revenue
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 admin-glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Revenue Overview</h3>
          </div>
          <div className="h-[300px] w-full">
            {loading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="admin-glass-panel p-6 rounded-2xl flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Recent Activity</h3>
            <Activity className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 items-start relative before:absolute before:left-[11px] before:top-8 before:bottom-[-16px] before:w-0.5 before:bg-border last:before:hidden">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 z-10 outline outline-4 outline-[hsl(var(--admin-card))]">
                  <div className="w-2 h-2 rounded-full bg-accent"></div>
                </div>
                <div>
                  <p className="text-sm font-medium">New user registered</p>
                  <p className="text-xs text-muted-foreground">player_{Math.floor(Math.random() * 1000)} joined the platform</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{i * 12} mins ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
