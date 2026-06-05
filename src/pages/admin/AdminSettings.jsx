import React, { useState, useEffect, useRef } from 'react';
import { Save, Settings, Shield, HardDrive, Coins, Wallet, Loader2, CreditCard, Upload, X, MessageCircle, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import apiClient from '@/lib/apiClient';
import { DEFAULT_CONTACT_SETTINGS, DEFAULT_PLATFORM_NAME, getPlatformName, useSettings } from '@/hooks/useSettings.js';
import { usePaymentSettings } from '@/hooks/usePaymentSettings';

const PaymentSettingsPanel = () => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const { paymentSettings, recordId, loading, refreshPaymentSettings } = usePaymentSettings({ autoRefresh: false });
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    upi_id: ''
  });
  const [qrCodeValue, setQrCodeValue] = useState('');
  const [qrCodePreview, setQrCodePreview] = useState(null);

  const buildQrImageDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const maxSize = 900;
        const ratio = Math.min(maxSize / image.width, maxSize / image.height, 1);
        const width = Math.max(1, Math.round(image.width * ratio));
        const height = Math.max(1, Math.round(image.height * ratio));
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        canvas.width = width;
        canvas.height = height;
        context.imageSmoothingEnabled = false;
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);

        resolve(canvas.toDataURL('image/png'));
      };

      image.onerror = () => reject(new Error('Unable to read QR image.'));
      image.src = reader.result;
    };

    reader.onerror = () => reject(new Error('Unable to read QR image.'));
    reader.readAsDataURL(file);
  });

  useEffect(() => {
    setFormData({
      upi_id: paymentSettings.upi_id || ''
    });
    setQrCodeValue(paymentSettings.qr_code || '');
    setQrCodePreview(paymentSettings.qr_code || null);
  }, [paymentSettings.qr_code, paymentSettings.upi_id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
        return;
      }
      if (file.size > 10485760) {
        toast({ title: "File too large", description: "QR Code image must be less than 10MB.", variant: "destructive" });
        return;
      }

      try {
        const dataUrl = await buildQrImageDataUrl(file);
        setQrCodeValue(dataUrl);
        setQrCodePreview(dataUrl);
      } catch (error) {
        toast({ title: "Upload failed", description: error.message || "Unable to process QR image.", variant: "destructive" });
      }
    }
  };

  const clearFile = () => {
    setQrCodePreview(null);
    setQrCodeValue('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!recordId) {
      toast({ title: "Error", description: "No payment settings record found to update.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const updated = await apiClient.put(`/payment-settings/${recordId}`, {
        upi_id: formData.upi_id,
        qr_code: qrCodeValue
      });
      setFormData({ upi_id: updated.upi_id || '' });
      setQrCodeValue(updated.qr_code || '');
      setQrCodePreview(updated.qr_code || null);
      await refreshPaymentSettings(false);
      
      toast({ title: "Success", description: "Payment settings updated successfully." });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: error.message || "Failed to update payment settings.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  const activeMethods = [];
  if (formData.upi_id) activeMethods.push('UPI');
  if (qrCodePreview) activeMethods.push('QR Code');

  return (
    <div className="bg-card border border-border/50 p-6 rounded-2xl space-y-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-border/50 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 text-accent rounded-lg"><CreditCard className="w-5 h-5" /></div>
          <h3 className="text-lg font-bold">Payment Methods</h3>
        </div>
        <div className="text-xs text-muted-foreground">
          Active: <span className="font-bold text-foreground">{activeMethods.length > 0 ? activeMethods.join(', ') : 'None'}</span>
        </div>
      </div>
      
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">UPI ID</label>
              <input 
                type="text" 
                name="upi_id"
                value={formData.upi_id}
                onChange={handleChange}
                placeholder="e.g., yourname@upi"
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent text-foreground transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Payment QR Code</label>
            <div className="border-2 border-dashed border-border rounded-xl p-4 text-center relative hover:bg-muted/20 transition-colors">
              {qrCodePreview ? (
                <div className="relative inline-block">
                  <img src={qrCodePreview} alt="QR Preview" loading="lazy" decoding="async" className="max-h-32 rounded-lg mx-auto" />
                  <button 
                    type="button" 
                    onClick={clearFile}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:scale-110 transition-transform"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="py-4">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Click to upload QR Code</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">JPG, PNG, WEBP up to 20MB</p>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="Upload QR Code"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button 
            type="submit" 
            disabled={saving}
            className="flex items-center gap-2 bg-accent text-accent-foreground px-6 py-2.5 rounded-xl font-bold hover:bg-accent/90 transition-all disabled:opacity-50 box-glow-accent"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Payment Methods
          </button>
        </div>
      </form>
    </div>
  );
};

export const AdminSettings = () => {
  const { toast } = useToast();
  const { settings, recordId, loading: initialLoading } = useSettings();
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    platformName: DEFAULT_PLATFORM_NAME,
    contactEmail: 'support@nexusarena.com',
    min_deposit_amount: '10',
    min_withdraw_amount: '50',
    whatsappEnabled: DEFAULT_CONTACT_SETTINGS.whatsappEnabled,
    whatsappNumber: DEFAULT_CONTACT_SETTINGS.whatsappNumber,
    telegramEnabled: DEFAULT_CONTACT_SETTINGS.telegramEnabled,
    telegramLink: DEFAULT_CONTACT_SETTINGS.telegramLink,
    maintenanceMode: false
  });

  useEffect(() => {
    if (!initialLoading && settings) {
      setFormData(prev => ({
        ...prev,
        platformName: getPlatformName(settings),
        contactEmail: settings.contact_email || settings.contactEmail || 'support@nexusarena.com',
        min_deposit_amount: settings.min_deposit_amount?.toString() || '10',
        min_withdraw_amount: settings.min_withdraw_amount?.toString() || '50',
        whatsappEnabled: (settings.contactSettings || DEFAULT_CONTACT_SETTINGS).whatsappEnabled,
        whatsappNumber: (settings.contactSettings || DEFAULT_CONTACT_SETTINGS).whatsappNumber || '',
        telegramEnabled: (settings.contactSettings || DEFAULT_CONTACT_SETTINGS).telegramEnabled,
        telegramLink: (settings.contactSettings || DEFAULT_CONTACT_SETTINGS).telegramLink || ''
      }));
    }
  }, [initialLoading, settings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    const minDep = Number(formData.min_deposit_amount);
    const minWith = Number(formData.min_withdraw_amount);

    if (isNaN(minDep) || minDep < 1) {
      toast({ title: "Validation Error", description: "Minimum deposit amount must be >= 1.", variant: "destructive" });
      return;
    }

    if (isNaN(minWith) || minWith < 1) {
      toast({ title: "Validation Error", description: "Minimum withdraw amount must be >= 1.", variant: "destructive" });
      return;
    }

    if (!recordId) {
      toast({ title: "Missing Record ID", description: "Unable to update settings. Please refresh.", variant: "destructive" });
      return;
    }

    setSaving(true);
    
    try {
      const updated = await apiClient.put(`/settings/${recordId}`, {
        platform_name: formData.platformName.trim(),
        contact_email: formData.contactEmail.trim(),
        min_deposit_amount: minDep,
        min_withdraw_amount: minWith,
        contactSettings: {
          whatsappEnabled: formData.whatsappEnabled,
          whatsappNumber: formData.whatsappNumber.trim(),
          telegramEnabled: formData.telegramEnabled,
          telegramLink: formData.telegramLink.trim()
        }
      });
      setFormData(prev => ({
        ...prev,
        platformName: updated.platform_name || updated.platformName || prev.platformName,
        contactEmail: updated.contact_email || updated.contactEmail || prev.contactEmail,
        min_deposit_amount: updated.min_deposit_amount?.toString() || minDep.toString(),
        min_withdraw_amount: updated.min_withdraw_amount?.toString() || minWith.toString(),
        whatsappEnabled: (updated.contactSettings || prev).whatsappEnabled,
        whatsappNumber: (updated.contactSettings || prev).whatsappNumber || '',
        telegramEnabled: (updated.contactSettings || prev).telegramEnabled,
        telegramLink: (updated.contactSettings || prev).telegramLink || ''
      }));

      toast({ title: "Settings Saved", description: "Platform configurations updated." });
    } catch (err) {
      toast({ title: 'Error saving settings', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="max-w-4xl space-y-8">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Platform Settings</h2>
        <p className="text-muted-foreground text-sm">Configure fees, limits, and system preferences.</p>
      </div>

      <PaymentSettingsPanel />

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-card border border-border/50 p-6 rounded-2xl space-y-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-border/50 pb-4">
            <div className="p-2 bg-primary/10 text-primary rounded-lg"><Settings className="w-5 h-5" /></div>
            <h3 className="text-lg font-bold">General Configuration</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Platform Name</label>
              <input 
                type="text" 
                name="platformName"
                value={formData.platformName}
                onChange={handleChange}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-foreground transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Contact Email</label>
              <input 
                type="email" 
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-foreground transition-all"
              />
            </div>
          </div>
        </div>

        <div className="bg-card/95 border border-primary/20 p-6 rounded-2xl space-y-6 shadow-[0_0_24px_rgba(0,212,255,0.08)]">
          <div className="flex flex-col gap-3 border-b border-border/50 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 text-primary rounded-lg"><MessageCircle className="w-5 h-5" /></div>
              <div>
                <h3 className="text-lg font-bold">Contact & Social Buttons</h3>
                <p className="text-xs text-muted-foreground">Control floating support buttons shown on the website.</p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Active: <span className="font-bold text-foreground">{[formData.whatsappEnabled && 'WhatsApp', formData.telegramEnabled && 'Telegram'].filter(Boolean).join(', ') || 'None'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#25D366]/25 bg-[rgba(37,211,102,0.06)] p-5 transition-all hover:border-[#25D366]/45 hover:shadow-[0_0_18px_rgba(37,211,102,0.12)]">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#25D366]/30 bg-[#25D366]/10 text-[#25D366]"><MessageCircle className="h-5 w-5" /></div>
                  <div>
                    <p className="font-bold text-foreground">WhatsApp Button</p>
                    <p className="text-xs text-muted-foreground">Enter number with country code.</p>
                  </div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" name="whatsappEnabled" checked={formData.whatsappEnabled} onChange={handleChange} className="sr-only peer" />
                  <div className="h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-border after:bg-white after:transition-all peer-checked:bg-[#25D366] peer-checked:after:translate-x-full" />
                </label>
              </div>
              <label className="space-y-2 block">
                <span className="text-sm font-medium text-muted-foreground">WhatsApp Number</span>
                <input
                  type="text"
                  name="whatsappNumber"
                  value={formData.whatsappNumber}
                  onChange={handleChange}
                  placeholder="+91XXXXXXXXXX"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-[#25D366]/60"
                />
              </label>
              <p className="mt-2 text-xs text-muted-foreground">Blank number keeps the existing WhatsApp channel fallback active.</p>
            </div>

            <div className="rounded-2xl border border-primary/25 bg-primary/5 p-5 transition-all hover:border-accent/45 hover:shadow-[0_0_18px_rgba(217,70,239,0.12)]">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary"><Send className="h-5 w-5" /></div>
                  <div>
                    <p className="font-bold text-foreground">Telegram Button</p>
                    <p className="text-xs text-muted-foreground">Use t.me link, @username, or username.</p>
                  </div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" name="telegramEnabled" checked={formData.telegramEnabled} onChange={handleChange} className="sr-only peer" />
                  <div className="h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-border after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full" />
                </label>
              </div>
              <label className="space-y-2 block">
                <span className="text-sm font-medium text-muted-foreground">Telegram Link</span>
                <input
                  type="text"
                  name="telegramLink"
                  value={formData.telegramLink}
                  onChange={handleChange}
                  placeholder="https://t.me/vexora"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
              <p className="mt-2 text-xs text-muted-foreground">Telegram button appears only when enabled and a link is set.</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border/50 p-6 rounded-2xl space-y-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-border/50 pb-4">
            <div className="p-2 bg-secondary/10 text-secondary rounded-lg"><Wallet className="w-5 h-5" /></div>
            <h3 className="text-lg font-bold">Transaction Limits</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Coins className="w-4 h-4 text-primary" /> Minimum Deposit Amount (₹)
              </label>
              <input 
                type="number" 
                name="min_deposit_amount"
                min="1"
                value={formData.min_deposit_amount}
                onChange={handleChange}
                required
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-foreground transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Wallet className="w-4 h-4 text-secondary" /> Minimum Withdraw Amount (₹)
              </label>
              <input 
                type="number" 
                name="min_withdraw_amount"
                min="1"
                value={formData.min_withdraw_amount}
                onChange={handleChange}
                required
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-secondary text-foreground transition-all"
              />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border/50 p-6 rounded-2xl space-y-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-border/50 pb-4">
            <div className="p-2 bg-destructive/10 text-destructive rounded-lg"><Shield className="w-5 h-5" /></div>
            <h3 className="text-lg font-bold">Security & System</h3>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-background/50 border border-border rounded-xl">
            <div>
              <p className="font-medium text-foreground">Maintenance Mode</p>
              <p className="text-xs text-muted-foreground">Disable access to the platform for all non-admin users.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                name="maintenanceMode"
                checked={formData.maintenanceMode}
                onChange={handleChange}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-destructive"></div>
            </label>
          </div>
          
          <div className="pt-4 flex gap-4">
             <button type="button" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
               <HardDrive className="w-4 h-4" /> Export Database Backup
             </button>
          </div>
        </div>

        <div className="flex justify-end pb-8">
          <button 
            type="submit" 
            disabled={saving}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed box-glow-primary active:scale-[0.98]"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save All Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};


