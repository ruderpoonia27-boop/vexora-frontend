
import React, { Suspense, lazy, memo } from 'react';
import { Navigate, Route, Routes, BrowserRouter as Router, useLocation } from 'react-router-dom';
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

const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const ProfileSetupPage = lazy(() => import('./pages/ProfileSetupPage'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const TournamentsPage = lazy(() => import('./pages/TournamentsPage'));
const TournamentDetailPage = lazy(() => import('./pages/TournamentDetailPage'));
const SquadLobbyPage = lazy(() => import('./pages/SquadLobbyPage'));
const WalletPage = lazy(() => import('./pages/WalletPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const UserProfilePage = lazy(() => import('./pages/UserProfilePage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const RefundPolicyPage = lazy(() => import('./pages/RefundPolicyPage'));
const FairPlayPolicyPage = lazy(() => import('./pages/FairPlayPolicyPage'));
const CommunityGuidelinesPage = lazy(() => import('./pages/CommunityGuidelinesPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const ReferralPage = lazy(() => import('./pages/ReferralPage'));
const ReferralRedirectPage = lazy(() => import('./pages/ReferralRedirectPage'));
const AdminPanel = lazy(() => import('./pages/admin/AdminPanel').then((module) => ({ default: module.AdminPanel })));
const AdminTournamentDetailPage = lazy(() => import('./pages/admin/AdminTournamentDetailPage'));

const NotFoundPage = () => <div className="min-h-[60vh] flex flex-col items-center justify-center"><h1 className="text-4xl font-bold mb-4">404</h1><p>Page not found</p></div>;

const PageTransitionWrapper = ({ children }) => {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) {
    return <>{children}</>;
  }
  return <div key={location.pathname}>{children}</div>;
};

const RouteLoader = () => (
  <div className="container mx-auto min-h-[55vh] px-4 py-10">
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="h-8 w-40 rounded-xl bg-card/80 shimmer" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-36 rounded-2xl bg-card/70 shimmer" />
        <div className="h-36 rounded-2xl bg-card/70 shimmer" />
        <div className="h-36 rounded-2xl bg-card/70 shimmer" />
      </div>
    </div>
  </div>
);

const LazyPage = ({ children }) => (
  <PageTransitionWrapper>
    <Suspense fallback={<RouteLoader />}>
      {children}
    </Suspense>
  </PageTransitionWrapper>
);

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
const MainLayout = memo(({ children }) => {
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
});

const AnimatedRoutes = () => {
  return (
    <ProfileSetupGate>
    <Routes>
      <Route path="/" element={<LazyPage><HomePage /></LazyPage>} />
      <Route path="/home" element={<LazyPage><HomePage /></LazyPage>} />
      <Route path="/login" element={<LazyPage><LoginPage /></LazyPage>} />
      <Route path="/signup" element={<LazyPage><SignupPage /></LazyPage>} />
      <Route path="/profile-setup" element={
          <ProtectedRoute>
              <LazyPage><ProfileSetupPage /></LazyPage>
          </ProtectedRoute>
      } />
      <Route path="/admin-login" element={<LazyPage><AdminLoginPage /></LazyPage>} />
      <Route path="/ref/:code" element={<LazyPage><ReferralRedirectPage /></LazyPage>} />
      
      <Route path="/tournaments" element={<LazyPage><TournamentsPage /></LazyPage>} />
      <Route path="/tournament/:id" element={<LazyPage><TournamentDetailPage /></LazyPage>} />
      <Route path="/tournament/:id/squad-lobby" element={
          <ProtectedRoute>
              <LazyPage><SquadLobbyPage /></LazyPage>
          </ProtectedRoute>
      } />
      <Route path="/leaderboard" element={<LazyPage><LeaderboardPage /></LazyPage>} />
      <Route path="/terms-and-conditions" element={<LazyPage><TermsPage /></LazyPage>} />
      <Route path="/privacy-policy" element={<LazyPage><PrivacyPolicyPage /></LazyPage>} />
      <Route path="/refund-policy" element={<LazyPage><RefundPolicyPage /></LazyPage>} />
      <Route path="/fair-play-policy" element={<LazyPage><FairPlayPolicyPage /></LazyPage>} />
      <Route path="/community-guidelines" element={<LazyPage><CommunityGuidelinesPage /></LazyPage>} />
      <Route path="/contact-us" element={<LazyPage><ContactPage /></LazyPage>} />
      <Route path="/referral" element={
          <ProtectedRoute>
              <LazyPage><ReferralPage /></LazyPage>
          </ProtectedRoute>
      } />
      
      <Route path="/wallet" element={
          <ProtectedRoute>
              <LazyPage><WalletPage /></LazyPage>
          </ProtectedRoute>
      } />
      
      <Route path="/withdrawals" element={
          <ProtectedRoute>
              <Navigate to="/wallet?tab=withdraw" replace />
          </ProtectedRoute>
      } />

      <Route path="/profile" element={
          <ProtectedRoute>
              <LazyPage><UserProfilePage /></LazyPage>
          </ProtectedRoute>
      } />
      
      <Route path="/admin-dashboard" element={
          <ProtectedRoute requireAdmin={true}>
              <LazyPage><AdminDashboard /></LazyPage>
          </ProtectedRoute>
      } />

      <Route path="/admin/tournament/:id" element={
          <ProtectedRoute requireAdmin={true}>
              <LazyPage><AdminTournamentDetailPage /></LazyPage>
          </ProtectedRoute>
      } />

      <Route path="/admin/*" element={
          <ProtectedRoute requireAdmin={true}>
              <LazyPage><AdminPanel /></LazyPage>
          </ProtectedRoute>
      } />
      
      <Route path="*" element={<LazyPage><NotFoundPage /></LazyPage>} />
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
                            <Header />
                            <MainLayout>
                                <AnimatedRoutes />
                            </MainLayout>
                            <FloatingWhatsAppButton />
                        </div>
                        <Toaster />
                    </Router>
                </AdminAuthProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
}

export default App;
