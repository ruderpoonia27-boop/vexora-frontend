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
  const lastPayloadRef = useRef('');
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
        if (document.visibilityState === 'hidden' && hasLoadedRef.current) {
          return;
        }

        const result = await apiClient.get(`/${collectionName}?${params}`, { cacheTtl: 10000 });
        
        if (isMounted) {
          const nextData = result.items || result;
          const nextPagination = {
            page: result.page || 1,
            perPage: result.perPage || perPage,
            totalItems: result.totalItems || nextData.length,
            totalPages: result.totalPages || 1
          };
          const payload = JSON.stringify({ nextData, nextPagination });
          if (payload !== lastPayloadRef.current) {
            lastPayloadRef.current = payload;
            setData(nextData);
            setPagination(nextPagination);
          }
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

    intervalRef.current = setInterval(fetchData, 45000);

    return () => {
      isMounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [collectionName, optionsStr]);

  return { data, loading, error, pagination };
};
