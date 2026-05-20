import { useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';

export const DEFAULT_PLATFORM_NAME = 'Nexus Arena';

export const getPlatformName = (settings) => (
  settings?.platform_name || settings?.platformName || DEFAULT_PLATFORM_NAME
);

export const useSettings = () => {
  const [settings, setSettings] = useState({
    platform_name: DEFAULT_PLATFORM_NAME,
    contact_email: 'support@nexusarena.com',
    min_deposit_amount: 10,
    min_withdraw_amount: 50
  });
  const [recordId, setRecordId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const result = await apiClient.get('/settings', { cacheTtl: 300000 });
        if (result && result.length > 0) {
          setSettings({
            platform_name: result[0].platform_name || result[0].platformName || DEFAULT_PLATFORM_NAME,
            contact_email: result[0].contact_email || result[0].contactEmail || 'support@nexusarena.com',
            min_deposit_amount: result[0].min_deposit_amount || 10,
            min_withdraw_amount: result[0].min_withdraw_amount || 50,
          });
          setRecordId(result[0]._id);
        }
      } catch (err) {
        console.warn('Failed to fetch settings, using defaults.', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  return { settings, recordId, loading };
};
