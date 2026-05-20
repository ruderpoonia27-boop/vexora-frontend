
import React, { useState } from 'react';
import { Loader2, Check, X } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const WalletRequestApprovalModal = ({ isOpen, onOpenChange, request, onSuccess }) => {
  const { toast } = useToast();
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  if (!request) return null;

  const handleAction = async (actionType) => {
    if (request.status !== 'pending') {
      return toast({ title: "Error", description: "This request has already been processed.", variant: "destructive" });
    }

    if (actionType === 'approve') setIsApproving(true);
    else setIsRejecting(true);

    try {
      await apiClient.put(`/wallet-requests/${request._id}`, {
        status: actionType === 'approve' ? 'approved' : 'rejected'
      });

      toast({ 
        title: "Success", 
        description: `Request ${actionType === 'approve' ? 'approved and amount added to wallet' : 'rejected'}.` 
      });
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: `Failed to ${actionType} request.`, variant: "destructive" });
    } finally {
      setIsApproving(false);
      setIsRejecting(false);
    }
  };

  const screenshotUrl = request.screenshot ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:34567'}/uploads/${request.screenshot}` : null;
  const user = request.user || request.expand?.userId;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border/50 max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-accent">Review Request</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-background p-3 rounded-lg border border-border">
              <p className="text-muted-foreground mb-1">User</p>
              <p className="font-bold text-foreground truncate">{user?.name || user?.email || 'Unknown'}</p>
            </div>
            <div className="bg-background p-3 rounded-lg border border-border">
              <p className="text-muted-foreground mb-1">Amount</p>
              <p className="font-bold text-secondary text-glow-secondary">₹{request.amount}</p>
            </div>
          </div>
          
          <div className="bg-background p-3 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground mb-1">Transaction ID</p>
            <p className="font-mono text-sm">{request.transaction_id}</p>
          </div>

          {screenshotUrl ? (
            <div className="border border-border/50 rounded-lg overflow-hidden bg-background flex justify-center p-2 h-48">
              <img src={screenshotUrl} alt="Payment Screenshot" loading="lazy" decoding="async" className="max-h-full object-contain" />
            </div>
          ) : (
            <div className="h-24 bg-background rounded-lg border border-border flex items-center justify-center text-muted-foreground text-sm">
              No screenshot provided
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => handleAction('reject')}
              disabled={isApproving || isRejecting}
              className="flex-1 py-2 bg-destructive/10 text-destructive font-bold rounded-lg hover:bg-destructive hover:text-destructive-foreground transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isRejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><X className="w-4 h-4"/> Reject</>}
            </button>
            <button
              onClick={() => handleAction('approve')}
              disabled={isApproving || isRejecting}
              className="flex-1 py-2 bg-secondary/10 text-secondary font-bold rounded-lg hover:bg-secondary hover:text-secondary-foreground transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4"/> Approve</>}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletRequestApprovalModal;
