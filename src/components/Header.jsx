import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Gift, LogOut, Shield, User, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { getPlatformName, useSettings } from '@/hooks/useSettings';
import NotificationCenter from './NotificationCenter';
import GameAvatar from './GameAvatar';

export const Header = () => {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const { isAdminAuthenticated, adminLogout } = useAdminAuth();
  const { settings } = useSettings();
  const platformName = getPlatformName(settings);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    if (isAdminAuthenticated) {
      adminLogout();
      navigate('/');
      return;
    }

    logout();
    navigate('/');
  };

  const isActive = (path) => {
    if (path === '/home') {
      return location.pathname === '/' || location.pathname === '/home';
    }
    return location.pathname === path;
  };

  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-[rgba(6,10,22,0.88)] backdrop-blur-2xl supports-[backdrop-filter]:bg-[rgba(6,10,22,0.72)]">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-primary transition-colors hover:text-primary/80">
          <img src="/brand/vexora-logo.png" alt="" className="h-11 w-auto object-contain drop-shadow-[0_0_12px_rgba(0,212,255,0.45)] md:h-12" />
          <span className="text-base font-black tracking-[0.08em] text-glow-primary sm:text-xl">
            Vexora
          </span>
        </Link>

        <nav className="hidden items-center gap-4 lg:flex">
          <Link to="/home" className={`text-sm font-medium transition-colors hover:text-primary ${isActive('/home') ? 'text-primary' : 'text-muted-foreground'}`}>Home</Link>
          <Link to="/tournaments" className={`text-sm font-medium transition-colors hover:text-primary ${isActive('/tournaments') ? 'text-primary' : 'text-muted-foreground'}`}>Tournaments</Link>
          <Link to="/referral" className="mx-1">
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 0 rgba(59,130,246,0)',
                  '0 0 22px rgba(59,130,246,0.2)',
                  '0 0 30px rgba(168,85,247,0.18)'
                ]
              }}
              transition={{ duration: 2.2, repeat: Infinity, repeatType: 'mirror' }}
              className={`relative flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-black uppercase tracking-[0.18em] transition-all duration-300 ${
                isActive('/referral')
                  ? 'border-primary/40 bg-primary text-primary-foreground'
                  : 'border-primary/25 bg-primary/12 text-primary hover:scale-[1.03] hover:bg-primary hover:text-primary-foreground'
              }`}
            >
              <Gift className="h-4 w-4" />
              <span>Referral</span>
            </motion.div>
          </Link>
          <Link to="/leaderboard" className={`text-sm font-medium transition-colors hover:text-primary ${isActive('/leaderboard') ? 'text-primary' : 'text-muted-foreground'}`}>Leaderboard</Link>
          {isAuthenticated ? (
            <Link to="/wallet" className={`text-sm font-medium transition-colors hover:text-primary ${isActive('/wallet') ? 'text-primary' : 'text-muted-foreground'}`}>Wallet</Link>
          ) : null}
          {isAdminAuthenticated ? (
            <Link to="/admin-dashboard" className={`text-sm font-medium transition-colors hover:text-accent ${isActive('/admin-dashboard') ? 'text-accent' : 'text-muted-foreground'}`}>Admin Dashboard</Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated && currentUser?.isAdmin ? (
            <Link
              to="/admin"
              className="hidden items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent transition-all duration-300 hover:bg-accent hover:text-accent-foreground box-glow-accent lg:flex"
              title="Admin Panel"
            >
              <Shield className="h-3.5 w-3.5" />
              <span className="hidden lg:inline-block">Admin</span>
            </Link>
          ) : null}

          {isAuthenticated ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <NotificationCenter />
              <div className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary shadow-[0_0_18px_rgba(59,130,246,0.16),0_0_22px_rgba(168,85,247,0.08)] sm:text-sm">
                <Wallet className="h-4 w-4" />
                <span>Rs.{currentUser?.walletBalance || 0}</span>
              </div>
              <Link
                to="/profile"
                className="rounded-full border border-border/50 bg-card/70 p-1.5 text-muted-foreground transition-all hover:border-primary/40 hover:text-primary hover:shadow-[0_0_16px_rgba(59,130,246,0.14)]"
              >
                {currentUser?.avatarId || currentUser?.avatar_id ? (
                  <GameAvatar avatarId={currentUser.avatarId || currentUser.avatar_id} name={currentUser.name} size="xs" className="rounded-full border-0 shadow-none" showRarityRing={false} />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </Link>
              <button
                onClick={handleLogout}
                className="hidden items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-destructive lg:flex"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : isAdminAuthenticated ? (
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-destructive">
              <LogOut className="h-4 w-4" />
              <span>Admin Logout</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link to="/login" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Login</Link>
              <Link to="/signup" className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 box-glow-primary">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
