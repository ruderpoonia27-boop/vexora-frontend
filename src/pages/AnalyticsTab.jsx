
import React, { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import apiClient from '@/lib/apiClient';
import { Loader2, Users, Trophy, IndianRupee, Activity } from 'lucide-react';

const COLORS = ['hsl(190 100% 50%)', 'hsl(293 80% 60%)', 'hsl(135 100% 50%)', 'hsl(0 100% 50%)'];

const AnalyticsTab = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // In a real app, this would use backend aggregation or the analytics_events collection.
        // For demonstration within constraints, we fetch lists and compute basic stats client-side.
        const [usersRes, tournamentsRes, joinsRes] = await Promise.all([
           apiClient.get('/users'),
           apiClient.get('/tournaments'),
           apiClient.get('/joins')
        ]);

        const tournamentItems = tournamentsRes.items || tournamentsRes.tournaments || tournamentsRes;
        const totalUsers = usersRes.totalItems || usersRes.items?.length || usersRes.length || 0;
        const totalTournaments = tournamentsRes.totalItems || tournamentItems.length || 0;
        
        let totalRevenue = 0;
        let bgmiCount = 0;
        let ffCount = 0;
        
        tournamentItems.forEach(t => {
          totalRevenue += (t.entry_fee * (t.joined_count || 0));
          if (t.game_type === 'BGMI') bgmiCount++;
          if (t.game_type === 'Free Fire') ffCount++;
        });

        // Mock revenue data for chart
        const revenueData = [
          { name: 'Mon', revenue: 4000 },
          { name: 'Tue', revenue: 3000 },
          { name: 'Wed', revenue: 6000 },
          { name: 'Thu', revenue: 8000 },
          { name: 'Fri', revenue: 5000 },
          { name: 'Sat', revenue: 12000 },
          { name: 'Sun', revenue: 15000 },
        ];

        const gameData = [
          { name: 'BGMI', value: bgmiCount || 10 },
          { name: 'Free Fire', value: ffCount || 5 }
        ];

        setStats({ totalUsers, totalTournaments, totalRevenue, revenueData, gameData, joinsCount: joinsRes.totalItems });
      } catch (err) {
        console.error("Error loading analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  if (!stats) return null;

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card border border-border/50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2 text-muted-foreground"><Users className="w-5 h-5 text-primary" /> Total Users</div>
          <h3 className="text-3xl font-bold text-foreground">{stats.totalUsers}</h3>
        </div>
        <div className="bg-card border border-border/50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2 text-muted-foreground"><Trophy className="w-5 h-5 text-accent" /> Tournaments</div>
          <h3 className="text-3xl font-bold text-foreground">{stats.totalTournaments}</h3>
        </div>
        <div className="bg-card border border-border/50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2 text-muted-foreground"><IndianRupee className="w-5 h-5 text-secondary" /> Est. Revenue</div>
          <h3 className="text-3xl font-bold text-foreground">₹{stats.totalRevenue.toLocaleString()}</h3>
        </div>
        <div className="bg-card border border-border/50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2 text-muted-foreground"><Activity className="w-5 h-5 text-primary" /> Total Joins</div>
          <h3 className="text-3xl font-bold text-foreground">{stats.joinsCount}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart */}
        <div className="bg-card border border-border/50 rounded-2xl p-6">
          <h3 className="font-bold mb-6">Revenue Trends (Last 7 Days)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1f3a', borderColor: '#2d3748', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="revenue" fill="hsl(190 100% 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Game Distribution Chart */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 flex flex-col">
          <h3 className="font-bold mb-6">Game Popularity</h3>
          <div className="h-[300px] flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.gameData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {stats.gameData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1f3a', borderColor: '#2d3748', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {stats.gameData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                {entry.name} ({entry.value})
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
