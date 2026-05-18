import React from 'react';
import { Gift, Home, Trophy, Wallet, Swords } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const navItems = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/tournaments', label: 'Tournaments', icon: Swords },
  { to: '/referral', label: 'Referral', icon: Gift, featured: true },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/wallet', label: 'Wallet', icon: Wallet }
];

const isActiveRoute = (pathname, itemPath) => {
  if (itemPath === '/home') {
    return pathname === '/' || pathname === '/home';
  }
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
};

export const MobileBottomNav = () => {
  const location = useLocation();

  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] lg:hidden">
      <div className="mx-auto max-w-xl rounded-[26px] border border-primary/20 bg-[rgba(9,14,31,0.86)] backdrop-blur-2xl shadow-[0_16px_60px_rgba(0,0,0,0.55)]">
        <div className="grid grid-cols-5 items-end gap-1 px-2 py-2">
          {navItems.map((item) => {
            const active = isActiveRoute(location.pathname, item.to);
            const Icon = item.icon;

            return (
              <Link key={item.to} to={item.to} className="block self-end">
                <motion.div
                  whileTap={{ scale: item.featured ? 0.96 : 0.94 }}
                  whileHover={{ scale: item.featured ? 1.03 : 1.02 }}
                  animate={item.featured ? {
                    y: [0, -2, 0],
                    boxShadow: [
                      '0 0 0 rgba(59,130,246,0)',
                      '0 0 24px rgba(59,130,246,0.18)',
                      '0 0 32px rgba(168,85,247,0.16)'
                    ]
                  } : undefined}
                  transition={item.featured ? { duration: 2.4, repeat: Infinity, repeatType: 'mirror' } : undefined}
                  className={`relative flex min-h-[64px] flex-col items-center justify-center gap-1 transition-all duration-300 ${
                    item.featured
                      ? 'mx-1 min-h-[72px] translate-y-[-8px] rounded-[24px] border border-primary/25 bg-[linear-gradient(180deg,rgba(34,48,93,0.98),rgba(12,19,40,0.96))] text-primary shadow-[0_14px_34px_rgba(0,0,0,0.4)]'
                      : active
                        ? 'rounded-2xl text-primary'
                        : 'rounded-2xl text-muted-foreground'
                  }`}
                >
                  {active ? (
                    <motion.div
                      layoutId="mobile-nav-active"
                      className={`absolute inset-0 border border-primary/25 bg-primary/10 shadow-[0_0_22px_rgba(59,130,246,0.22),0_0_34px_rgba(168,85,247,0.18)] ${item.featured ? 'rounded-[24px]' : 'rounded-2xl'}`}
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  ) : null}
                  <Icon className={`relative z-10 ${item.featured ? 'h-6 w-6' : 'h-5 w-5'}`} />
                  <span className={`relative z-10 text-[11px] font-semibold leading-none ${active || item.featured ? 'text-foreground' : ''}`}>
                    {item.label}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MobileBottomNav;
