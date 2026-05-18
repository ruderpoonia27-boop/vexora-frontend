
import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import AvatarSelectionGrid from '@/components/AvatarSelectionGrid';
import GameAvatar from '@/components/GameAvatar';
import { DEFAULT_AVATAR_ID } from '@/data/avatarCatalog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const EditProfileModal = ({ isOpen, onOpenChange }) => {
  const { currentUser, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    avatarId: currentUser?.avatarId || currentUser?.avatar_id || DEFAULT_AVATAR_ID,
    oldPassword: '',
    password: '',
    passwordConfirm: ''
  });

  React.useEffect(() => {
    if (!isOpen) return;
    setFormData({
      name: currentUser?.name || '',
      avatarId: currentUser?.avatarId || currentUser?.avatar_id || DEFAULT_AVATAR_ID,
      oldPassword: '',
      password: '',
      passwordConfirm: ''
    });
  }, [currentUser?.avatarId, currentUser?.avatar_id, currentUser?.name, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password && formData.password !== formData.passwordConfirm) {
      return toast({ title: "Validation Error", description: "New passwords do not match.", variant: "destructive" });
    }

    setIsLoading(true);
    try {
      const updateData = { name: formData.name, avatarId: formData.avatarId };
      
      if (formData.password) {
        updateData.oldPassword = formData.oldPassword;
        updateData.password = formData.password;
        updateData.passwordConfirm = formData.passwordConfirm;
      }

      await apiClient.put(`/users/${currentUser._id}`, updateData);
      await refreshUser();
      
      toast({ title: "Success", description: "Profile updated successfully." });
      onOpenChange(false);
      setFormData((current) => ({ ...current, oldPassword: '', password: '', passwordConfirm: '' }));
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: error.message || "Failed to update profile.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border/50 max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-primary text-glow-primary">Edit Profile</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="rounded-2xl border border-primary/20 bg-primary/8 p-4">
            <div className="mb-3 flex items-center gap-3">
              <GameAvatar avatarId={formData.avatarId} name={formData.name || currentUser?.name || 'Player'} size="lg" />
              <div>
                <p className="text-sm font-bold text-foreground">Avatar Loadout</p>
                <p className="text-xs text-muted-foreground">Swap your gaming profile avatar anytime.</p>
              </div>
            </div>
            <AvatarSelectionGrid
              selectedAvatarId={formData.avatarId}
              onSelect={(avatarId) => setFormData((current) => ({ ...current, avatarId }))}
              compact
              title="Choose Avatar"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Display Name</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          <div className="pt-4 border-t border-border/50">
            <h4 className="text-sm font-bold text-foreground mb-3">Change Password (Optional)</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Current Password</label>
                <input
                  type="password"
                  name="oldPassword"
                  value={formData.oldPassword}
                  onChange={handleChange}
                  className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">New Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Confirm New Password</label>
                <input
                  type="password"
                  name="passwordConfirm"
                  value={formData.passwordConfirm}
                  onChange={handleChange}
                  className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 mt-4 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all box-glow-primary flex items-center justify-center"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileModal;
