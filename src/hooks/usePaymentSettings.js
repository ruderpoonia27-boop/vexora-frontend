import { useCallback, useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';

const defaultPaymentSettings = {
  upi_id: 'tournament@upi',
  qr_code: ''
};

export const usePaymentSettings = ({ autoRefresh = true } = {}) => {
  const [paymentSettings, setPaymentSettings] = useState(defaultPaymentSettings);
  const [recordId, setRecordId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPaymentSettings = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }

    try {
      const records = await apiClient.get('/payment-settings');
      const record = records?.[0];
      if (record) {
        setRecordId(record._id || record.id || null);
        setPaymentSettings({
          upi_id: record.upi_id || 'tournament@upi',
          qr_code: record.qr_code || ''
        });
      } else {
        setRecordId(null);
        setPaymentSettings(defaultPaymentSettings);
      }
    } catch (error) {
      console.error('Failed to fetch payment settings:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchPaymentSettings(true);

    if (!autoRefresh) {
      return undefined;
    }

    const handleFocus = () => {
      fetchPaymentSettings(false);
    };

    const intervalId = window.setInterval(() => {
      fetchPaymentSettings(false);
    }, 15000);

    window.addEventListener('focus', handleFocus);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [autoRefresh, fetchPaymentSettings]);

  return {
    paymentSettings,
    recordId,
    loading,
    refreshPaymentSettings: fetchPaymentSettings
  };
};
