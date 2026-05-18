import { useState, useEffect, useRef } from 'react';
import apiClient from '@/lib/apiClient';

export const useRealtimeSubscription = (collectionName, options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 50,
    totalItems: 0,
    totalPages: 1
  });

  const intervalRef = useRef(null);
  const hasLoadedRef = useRef(false);
  const optionsStr = JSON.stringify(options);

  useEffect(() => {
    let isMounted = true;
    const parsedOptions = JSON.parse(optionsStr);
    const { page = 1, perPage = 50, ...restOptions } = parsedOptions;

    const fetchData = async () => {
      try {
        if (!hasLoadedRef.current) {
          setLoading(true);
        }
        const params = new URLSearchParams({ page, perPage });
        Object.entries(restOptions).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.set(key, value);
          }
        });
        const result = await apiClient.get(`/${collectionName}?${params}`);
        
        if (isMounted) {
          setData(result.items || result);
          setPagination({
            page: result.page || 1,
            perPage: result.perPage || perPage,
            totalItems: result.totalItems || (result.items || result).length,
            totalPages: result.totalPages || 1
          });
          setError(null);
          hasLoadedRef.current = true;
        }
      } catch (err) {
        console.error(`Error fetching ${collectionName}:`, err);
        if (isMounted) setError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    // Poll for updates every 30 seconds
    intervalRef.current = setInterval(fetchData, 30000);

    return () => {
      isMounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [collectionName, optionsStr]);

  return { data, loading, error, pagination };
};
