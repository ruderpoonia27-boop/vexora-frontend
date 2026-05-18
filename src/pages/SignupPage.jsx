
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Gift } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { SUPPORT_EMAIL } from '@/data/legalContent';
import { getPlatformName, useSettings } from '@/hooks/useSettings';
import AvatarSelectionGrid from '@/components/AvatarSelectionGrid';
import GameAvatar from '@/components/GameAvatar';
import { DEFAULT_AVATAR_ID } from '@/data/avatarCatalog';

const PENDING_REFERRAL_KEY = 'pendingReferralCode';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [selectedAvatarId, setSelectedAvatarId] = useState(DEFAULT_AVATAR_ID);
  const [searchParams] = useSearchParams();
  
  const { signup } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const detectedReferralCode = useMemo(() => (
    searchParams.get('ref') || sessionStorage.getItem(PENDING_REFERRAL_KEY) || ''
  ), [searchParams]);
  const [referralCode, setReferralCode] = useState(detectedReferralCode);
  const supportEmail = settings?.contact_email || settings?.contactEmail || SUPPORT_EMAIL;
  const platformName = getPlatformName(settings);

  useEffect(() => {
    setReferralCode(detectedReferralCode);
    if (detectedReferralCode) {
      sessionStorage.setItem(PENDING_REFERRAL_KEY, detectedReferralCode);
    }
  }, [detectedReferralCode]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent multiple submissions
    setError('');
    
    if (formData.password !== formData.passwordConfirm) {
      return setError('Passwords do not match.');
    }
    
    if (formData.password.length < 8) {
      return setError('Password must be at least 8 characters long.');
    }

    if (!acceptedPolicies) {
      return setError('You must accept the Terms & Conditions and Privacy Policy to create an account.');
    }
    
    setLoading(true);
    
    try {
      await signup({
        email: formData.email.trim(),
        password: formData.password,
        name: formData.name.trim(),
        referralCode: referralCode.trim(),
        avatarId: selectedAvatarId,
        acceptedPolicies
      });
      sessionStorage.removeItem(PENDING_REFERRAL_KEY);
      
      navigate('/home', { replace: true });
    } catch (err) {
      console.error(err);
      if (err.message === 'Email already exists') {
        setError('This email is already registered. Please login or use a different email.');
      } else {
        setError(err.message || 'Failed to create account. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Helmet>
        <title>Sign Up | {platformName}</title>
      </Helmet>
      
      <div className="w-full max-w-md bg-card border border-border/50 rounded-2xl p-8 shadow-xl box-glow-primary">
        <div className="flex flex-col items-center mb-8">
          <img src="/brand/vexora-logo.png" alt={platformName} className="mb-4 h-24 w-auto object-contain drop-shadow-[0_0_18px_rgba(0,212,255,0.38)]" />
          <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
          <p className="text-muted-foreground text-sm mt-2">Join {platformName} and start competing</p>
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
              <p className="font-semibold">Referral invite detected</p>
              <p className="mt-1 break-all text-primary/80">You can keep this code or change it before signup.</p>
            </div>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-2xl border border-primary/20 bg-primary/8 p-4">
            <div className="mb-3 flex items-center gap-3">
              <GameAvatar avatarId={selectedAvatarId} name={formData.name || 'Player'} size="lg" />
              <div>
                <p className="text-sm font-bold text-foreground">Your Battle Avatar</p>
                <p className="text-xs text-muted-foreground">Choose a gaming identity for your profile and matches.</p>
              </div>
            </div>
            <AvatarSelectionGrid
              selectedAvatarId={selectedAvatarId}
              onSelect={setSelectedAvatarId}
              compact
              title="Select Avatar"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">In-Game Name / Username</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="ProGamer99"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="player@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Referral Code</label>
            <input
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="Optional referral code"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="••••••••"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Confirm Password</label>
            <input
              type="password"
              name="passwordConfirm"
              required
              value={formData.passwordConfirm}
              onChange={handleChange}
              className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="••••••••"
            />
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/40 p-4 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={acceptedPolicies}
              onChange={(event) => setAcceptedPolicies(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border bg-input text-primary focus:ring-primary"
              required
            />
            <span className="leading-6">
              I agree to the{' '}
              <Link to="/terms-and-conditions" className="font-semibold text-primary hover:text-primary/80">
                Terms & Conditions
              </Link>{' '}
              and{' '}
              <Link to="/privacy-policy" className="font-semibold text-primary hover:text-primary/80">
                Privacy Policy
              </Link>.
              <span className="mt-1 block text-xs text-muted-foreground/90">
                For policy questions, contact <a href={`mailto:${supportEmail}`} className="text-primary hover:text-primary/80">{supportEmail}</a>.
              </span>
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-6"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to={referralCode ? `/login?ref=${encodeURIComponent(referralCode)}` : '/login'} className="text-primary hover:underline font-medium">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
