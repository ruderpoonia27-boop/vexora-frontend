
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Trophy, Wallet, Settings, ArrowLeft, Menu, X, Banknote, Users, Megaphone } from 'lucide-react';
import { getPlatformName, useSettings } from '@/hooks/useSettings';

import { AdminHome } from './AdminHome';
import { AdminTournaments } from './AdminTournaments';
import { AdminDeposits } from './AdminDeposits';
import { AdminWithdrawals } from './AdminWithdrawals';
import { AdminSettings } from './AdminSettings';
import { AdminUsers } from './AdminUsers';
import { AdminAnnouncements } from './AdminAnnouncements';

export const AdminPanel = () => {
  const { currentUser } = useAuth();
  const { settings } = useSettings();
  const platformName = getPlatformName(settings);
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!currentUser || !currentUser.isAdmin) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // Read initial tab from state if passed via navigation
  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location]);

  if (!currentUser || !currentUser.isAdmin) {
    return null; // Don't render anything while redirecting
  }

  const tabs = [
    { id: 'home', label: 'Dashboard', icon: LayoutDashboard, component: AdminHome },
    { id: 'announcements', label: 'Announcements', icon: Megaphone, component: AdminAnnouncements },
    { id: 'tournaments', label: 'Tournaments', icon: Trophy, component: AdminTournaments },
    { id: 'users', label: 'Users', icon: Users, component: AdminUsers },
    { id: 'deposits', label: 'Deposits', icon: Banknote, component: AdminDeposits },
    { id: 'withdrawals', label: 'Withdrawals', icon: Wallet, component: AdminWithdrawals },
    { id: 'settings', label: 'Settings', icon: Settings, component: AdminSettings },
  ];

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || AdminHome;

  const NavContent = () => (
    <>
      <div className="px-6 py-8 border-b border-border/50">
        <h1 className="text-2xl font-black text-primary tracking-tight uppercase flex items-center gap-2 text-glow-primary">
          <ShieldIcon /> Admin
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Control Center</p>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
              activeTab === tab.id 
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </nav>
      <div className="p-6 border-t border-border/50">
        <button 
          onClick={() => navigate('/profile')}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground bg-background border border-border rounded-xl hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex flex-col md:flex-row">
      <Helmet>
        <title>Admin Control Panel | {platformName}</title>
      </Helmet>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[hsl(var(--admin-sidebar))] border-r border-border/50 shrink-0 sticky top-0 h-screen overflow-y-auto">
        <NavContent />
      </aside>

      {/* Mobile Header & Menu */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[hsl(var(--admin-sidebar))] border-b border-border/50 sticky top-0 z-50">
        <h1 className="text-lg font-black text-primary uppercase flex items-center gap-2 text-glow-primary">
          <ShieldIcon /> Admin
        </h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-foreground">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {isMobileMenuOpen && (
          <aside className="page-transition md:hidden fixed inset-x-0 bottom-0 z-40 bg-[hsl(var(--admin-sidebar))] flex flex-col top-[65px] h-[calc(100vh-65px)] overflow-y-auto">
            <NavContent />
          </aside>
        )}

      {/* Main Content Area */}
      <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-10">
          <div key={activeTab} className="page-transition h-full">
            <ActiveComponent />
          </div>
      </main>
    </div>
  );
};

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-half">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2-1 4-2 7-2 2.5 0 4.5 1 6 2a1 1 0 0 1 1 1v7z"/>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
  </svg>
);

export default AdminPanel;
