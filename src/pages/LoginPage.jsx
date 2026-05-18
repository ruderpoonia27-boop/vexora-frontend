
import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Gift, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { getPlatformName, useSettings } from '@/hooks/useSettings';

const PENDING_REFERRAL_KEY = 'pendingReferralCode';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  
  const { login } = useAuth();
  const { settings } = useSettings();
  const platformName = getPlatformName(settings);
  const navigate = useNavigate();
  const referralCode = useMemo(() => (
    searchParams.get('ref') || sessionStorage.getItem(PENDING_REFERRAL_KEY) || ''
  ), [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(email, password);
      navigate('/home', { replace: true });
    } catch (err) {
      console.error(err);
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Helmet>
        <title>Login | {platformName}</title>
      </Helmet>
      
      <div className="w-full max-w-md bg-card border border-border/50 rounded-2xl p-8 shadow-xl box-glow-primary">
        <div className="flex flex-col items-center mb-8">
          <img src="/brand/vexora-logo.png" alt={platformName} className="mb-4 h-24 w-auto object-contain drop-shadow-[0_0_18px_rgba(0,212,255,0.38)]" />
          <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
          <p className="text-muted-foreground text-sm mt-2">Enter your credentials to access your account</p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {referralCode ? (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/10 p-3 text-sm text-primary">
            <Gift className="mt-0.5 h-4 w-4" />
            <div>
              <p className="font-semibold">Referral code saved</p>
              <p className="mt-1 break-all text-primary/80">{referralCode}</p>
            </div>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="player@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-6"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link to={referralCode ? `/signup?ref=${encodeURIComponent(referralCode)}` : '/signup'} className="text-primary hover:underline font-medium">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
