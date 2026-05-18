
import React, { useState } from 'react';
import { Loader2, Copy, UploadCloud } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ADMIN_UPI_ID = "nexusadmin@ybl"; // Placeholder admin UPI

const WalletRequestModal = ({ isOpen, onOpenChange }) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [amount, setAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const upiString = `upi://pay?pa=${ADMIN_UPI_ID}&pn=Nexus%20Arena&am=${amount || 100}&cu=INR&tn=Wallet%20Topup`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(ADMIN_UPI_ID);
    toast({ title: "Copied!", description: "UPI ID copied to clipboard." });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (amount < 100) {
      return toast({ title: "Error", description: "Minimum amount is ₹100", variant: "destructive" });
    }

    setIsLoading(true);
    try {
      // Get userId from currentUser or token
      let userId = currentUser?._id || currentUser?.id;
      if (!userId) {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const decoded = JSON.parse(atob(token.split('.')[1]));
            userId = decoded.id;
          } catch (e) {
            console.error('Failed to decode token');
          }
        }
      }

      await apiClient.post('/users/wallet-request', {
        userId,
        amount: Number(amount),
        transactionId: transactionId,
        method: 'UPI'
      });
      
      toast({ title: "Success", description: "Wallet request submitted successfully. Waiting for admin approval." });
      onOpenChange(false);
      setAmount('');
      setTransactionId('');
      setFile(null);
    } catch (error) {
      console.error(error);
      toast({ title: "Submission Failed", description: error.message || "An error occurred.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border/50 max-w-md w-full overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary text-glow-primary text-center">Add Money</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="bg-background rounded-xl p-6 border border-border/50 flex flex-col items-center">
            <p className="text-sm text-muted-foreground mb-4">Scan QR to Pay</p>
            <div className="bg-white p-2 rounded-lg mb-4">
              <QRCodeSVG value={upiString} size={160} />
            </div>
            
            <div className="flex items-center gap-2 bg-input px-4 py-2 rounded-lg w-full justify-between">
              <span className="font-mono text-sm">{ADMIN_UPI_ID}</span>
              <button onClick={copyToClipboard} className="text-primary hover:text-primary/80 transition-colors" aria-label="Copy UPI ID">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Amount (₹)</label>
              <input
                type="number"
                min="100"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100"
                className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">UPI Transaction ID (12 digits)</label>
              <input
                type="text"
                required
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="e.g. 312345678901"
                className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Payment Screenshot</label>
              <label className="w-full flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-lg p-6 hover:bg-background/50 transition-colors cursor-pointer group">
                <UploadCloud className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                <span className="text-sm text-muted-foreground font-medium">
                  {file ? file.name : "Click to upload screenshot"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all box-glow-primary flex items-center justify-center mt-4"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Request"}
            </button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletRequestModal;
