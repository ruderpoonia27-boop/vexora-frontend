// Loads Cashfree's checkout SDK on demand, only when a user starts an online payment.
const SDK_URL = 'https://sdk.cashfree.com/js/v3/cashfree.js';
let sdkPromise = null;

const loadScript = () => {
  if (window.Cashfree) return Promise.resolve();
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SDK_URL;
      script.async = true;
      script.onload = resolve;
      script.onerror = () => {
        sdkPromise = null;
        reject(new Error('Could not open the payment page. Check your internet connection.'));
      };
      document.head.appendChild(script);
    });
  }
  return sdkPromise;
};

export const loadCashfree = async (mode) => {
  await loadScript();
  return window.Cashfree({ mode: mode === 'production' ? 'production' : 'sandbox' });
};
