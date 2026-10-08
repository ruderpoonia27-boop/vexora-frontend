import apiClient from '@/lib/apiClient';

// The last wallet response is kept in localStorage so the wallet page can render instantly,
// then refresh in the background.
const STORAGE_KEY = 'walletCache';
let inFlight = null;

// Tie the cache to the session token so another account never sees this one's wallet.
const ownerKey = () => (localStorage.getItem('token') || '').slice(-24);

export const readWalletCache = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return parsed?.owner && parsed.owner === ownerKey() ? parsed.data : null;
  } catch {
    return null;
  }
};

const writeWalletCache = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ owner: ownerKey(), data }));
  } catch {
    // Storage full or blocked: the page still works, just without the instant first paint.
  }
};

export const clearWalletCache = () => {
  inFlight = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
};

export const fetchWallet = () => {
  if (!inFlight) {
    inFlight = apiClient.get('/wallet', { cacheTtl: 0 })
      .then((data) => {
        writeWalletCache(data);
        return data;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
};

export const prefetchWallet = () => {
  if (localStorage.getItem('token')) {
    fetchWallet().catch(() => {});
  }
};
