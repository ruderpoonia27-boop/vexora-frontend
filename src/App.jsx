
import React from 'react';
import { Navigate, Route, Routes, BrowserRouter as Router, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from './components/ui/sonner';
import ScrollToTop from './components/ScrollToTop';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import MobileBottomNav from './components/MobileBottomNav';
import FloatingWhatsAppButton from './components/FloatingWhatsAppButton';
import PwaInstallPrompt from './components/PwaInstallPrompt';
import PwaStartupScreen from './components/PwaStartupScreen';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import AdminLoginPage from './pages/AdminLoginPage';
import TournamentsPage from './pages/TournamentsPage';
import TournamentDetailPage from './pages/TournamentDetailPage';
import SquadLobbyPage from './pages/SquadLobbyPage';
import WalletPage from './pages/WalletPage';
import AdminDashboard from './pages/AdminDashboard';
import UserProfilePage from './pages/UserProfilePage';
import LeaderboardPage from './pages/LeaderboardPage';
import TermsPage from './pages/TermsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import RefundPolicyPage from './pages/RefundPolicyPage';
import FairPlayPolicyPage from './pages/FairPlayPolicyPage';
import CommunityGuidelinesPage from './pages/CommunityGuidelinesPage';
import ContactPage from './pages/ContactPage';
import ReferralPage from './pages/ReferralPage';
import ReferralRedirectPage from './pages/ReferralRedirectPage';
import { AdminPanel } from './pages/admin/AdminPanel';
import AdminTournamentDetailPage from './pages/admin/AdminTournamentDetailPage';

const NotFoundPage = () => <div className="min-h-[60vh] flex flex-col items-center justify-center"><h1 className="text-4xl font-bold mb-4">404</h1><p>Page not found</p></div>;

const PageTransitionWrapper = ({ children }) => {
  const location = useLocation();
  // Disable transition for /admin layout to prevent jumping sidebar
  if (location.pathname.startsWith('/admin')) {
    return <>{children}</>;
  }
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

const ProfileSetupGate = ({ children }) => {
  const { isAuthenticated, currentUser } = useAuth();
  const location = useLocation();
  const needsProfileSetup = isAuthenticated
    && currentUser
    && !currentUser.isAdmin
    && (currentUser.profileSetupCompleted === false || currentUser.profile_setup_completed === false);

  if (needsProfileSetup && location.pathname !== '/profile-setup') {
    return <Navigate to="/profile-setup" replace />;
  }

  return children;
};

// Layout wrapper to conditionally show Footer
const MainLayout = ({ children }) => {
  const location = useLocation();
  const hideFooter = location.pathname.startsWith('/admin');
  const hideMobileNav = location.pathname.startsWith('/admin');
  
  return (
    <>
      <main className={`min-w-0 flex-grow ${hideMobileNav ? '' : 'pb-28 lg:pb-0'}`}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
      {!hideFooter && <Footer />}
      {!hideMobileNav && <MobileBottomNav />}
    </>
  );
};

const AnimatedRoutes = () => {
  return (
    <ProfileSetupGate>
    <Routes>
      <Route path="/" element={<PageTransitionWrapper><HomePage /></PageTransitionWrapper>} />
      <Route path="/home" element={<PageTransitionWrapper><HomePage /></PageTransitionWrapper>} />
      <Route path="/login" element={<PageTransitionWrapper><LoginPage /></PageTransitionWrapper>} />
      <Route path="/signup" element={<PageTransitionWrapper><SignupPage /></PageTransitionWrapper>} />
      <Route path="/profile-setup" element={
          <ProtectedRoute>
              <PageTransitionWrapper><ProfileSetupPage /></PageTransitionWrapper>
          </ProtectedRoute>
      } />
      <Route path="/admin-login" element={<PageTransitionWrapper><AdminLoginPage /></PageTransitionWrapper>} />
      <Route path="/ref/:code" element={<PageTransitionWrapper><ReferralRedirectPage /></PageTransitionWrapper>} />
      
      <Route path="/tournaments" element={<PageTransitionWrapper><TournamentsPage /></PageTransitionWrapper>} />
      <Route path="/tournament/:id" element={<PageTransitionWrapper><TournamentDetailPage /></PageTransitionWrapper>} />
      <Route path="/tournament/:id/squad-lobby" element={
          <ProtectedRoute>
              <PageTransitionWrapper><SquadLobbyPage /></PageTransitionWrapper>
          </ProtectedRoute>
      } />
      <Route path="/leaderboard" element={<PageTransitionWrapper><LeaderboardPage /></PageTransitionWrapper>} />
      <Route path="/terms-and-conditions" element={<PageTransitionWrapper><TermsPage /></PageTransitionWrapper>} />
      <Route path="/privacy-policy" element={<PageTransitionWrapper><PrivacyPolicyPage /></PageTransitionWrapper>} />
      <Route path="/refund-policy" element={<PageTransitionWrapper><RefundPolicyPage /></PageTransitionWrapper>} />
      <Route path="/fair-play-policy" element={<PageTransitionWrapper><FairPlayPolicyPage /></PageTransitionWrapper>} />
      <Route path="/community-guidelines" element={<PageTransitionWrapper><CommunityGuidelinesPage /></PageTransitionWrapper>} />
      <Route path="/contact-us" element={<PageTransitionWrapper><ContactPage /></PageTransitionWrapper>} />
      <Route path="/referral" element={
          <ProtectedRoute>
              <PageTransitionWrapper><ReferralPage /></PageTransitionWrapper>
          </ProtectedRoute>
      } />
      
      <Route path="/wallet" element={
          <ProtectedRoute>
              <PageTransitionWrapper><WalletPage /></PageTransitionWrapper>
          </ProtectedRoute>
      } />
      
      <Route path="/withdrawals" element={
          <ProtectedRoute>
              <Navigate to="/wallet?tab=withdraw" replace />
          </ProtectedRoute>
      } />

      <Route path="/profile" element={
          <ProtectedRoute>
              <PageTransitionWrapper><UserProfilePage /></PageTransitionWrapper>
          </ProtectedRoute>
      } />
      
      <Route path="/admin-dashboard" element={
          <ProtectedRoute requireAdmin={true}>
              <PageTransitionWrapper><AdminDashboard /></PageTransitionWrapper>
          </ProtectedRoute>
      } />

      <Route path="/admin/tournament/:id" element={
          <ProtectedRoute requireAdmin={true}>
              <PageTransitionWrapper><AdminTournamentDetailPage /></PageTransitionWrapper>
          </ProtectedRoute>
      } />

      <Route path="/admin/*" element={
          <ProtectedRoute requireAdmin={true}>
              <PageTransitionWrapper><AdminPanel /></PageTransitionWrapper>
          </ProtectedRoute>
      } />
      
      <Route path="*" element={<PageTransitionWrapper><NotFoundPage /></PageTransitionWrapper>} />
    </Routes>
    </ProfileSetupGate>
  );
};

function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <AdminAuthProvider>
                    <Router>
                        <ScrollToTop />
                        <div className="flex min-h-screen flex-col bg-background text-foreground">
                            <PwaStartupScreen />
                            <Header />
                            <MainLayout>
                                <AnimatedRoutes />
                            </MainLayout>
                            <FloatingWhatsAppButton />
                        </div>
                        <PwaInstallPrompt />
                        <Toaster />
                    </Router>
                </AdminAuthProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
}

export default App;
