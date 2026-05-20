import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Loader2, Sparkles } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { getPlatformName, useSettings } from '@/hooks/useSettings';
import AvatarSelectionGrid from '@/components/AvatarSelectionGrid';
import GameAvatar from '@/components/GameAvatar';
import { DEFAULT_AVATAR_ID } from '@/data/avatarCatalog';

const isProfileSetupComplete = (user) => (
  user?.profileSetupCompleted !== false && user?.profile_setup_completed !== false
);

const ProfileSetupPage = () => {
  const { currentUser, refreshUser } = useAuth();
  const { settings } = useSettings();
  const platformName = getPlatformName(settings);
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [avatarId, setAvatarId] = useState(DEFAULT_AVATAR_ID);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isProfileSetupComplete(currentUser)) {
      navigate('/home', { replace: true });
      return;
    }

    setAvatarId(currentUser?.avatarId || currentUser?.avatar_id || DEFAULT_AVATAR_ID);
  }, [currentUser, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;

    const trimmedName = name.trim();
    if (trimmedName.length < 3) {
      setError('Name must be at least 3 characters long.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await apiClient.put(`/users/${currentUser._id || currentUser.id}`, {
        name: trimmedName,
        avatarId
      });
      await refreshUser();
      navigate('/home', { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Helmet>
        <title>Set Up Profile | {platformName}</title>
      </Helmet>

      <div className="w-full max-w-lg bg-card border border-border/50 rounded-2xl p-8 shadow-xl box-glow-primary">
        <div className="flex flex-col items-center mb-8 text-center">
          <img src="/brand/vexora-logo.png" alt={platformName} width="150" height="80" loading="lazy" decoding="async" className="mb-4 h-20 w-auto object-contain drop-shadow-[0_0_18px_rgba(0,212,255,0.38)]" />
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
            <Sparkles className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Choose Your Player Identity</h1>
          <p className="text-muted-foreground text-sm mt-2">Pick a display name and avatar before entering the arena.</p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-2xl border border-primary/20 bg-primary/8 p-4">
            <div className="mb-3 flex items-center gap-3">
              <GameAvatar avatarId={avatarId} name={name || 'Player'} size="lg" />
              <div>
                <p className="text-sm font-bold text-foreground">Your Battle Avatar</p>
                <p className="text-xs text-muted-foreground">This will appear on your profile and matches.</p>
              </div>
            </div>
            <AvatarSelectionGrid
              selectedAvatarId={avatarId}
              onSelect={setAvatarId}
              compact
              title="Select Avatar"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">In-Game Name / Username</label>
            <input
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="ProGamer99"
              maxLength={24}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue to Home'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetupPage;
