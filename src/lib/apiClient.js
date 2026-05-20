const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:34567/api';

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

class ApiClient {
  constructor() {
    this.baseURL = API_URL;
    this.cache = new Map();
    this.inFlight = new Map();
    this.defaultCacheTtl = 12000;
    this.requestTimeout = 18000;
  }

  get token() {
    return localStorage.getItem('token');
  }

  set token(value) {
    if (value) {
      localStorage.setItem('token', value);
    } else {
      localStorage.removeItem('token');
    }
  }

  getCacheKey(endpoint) {
    return `${this.token || 'guest'}:${endpoint}`;
  }

  clearCache() {
    this.cache.clear();
  }

  async request(endpoint, options = {}) {
    const method = options.method || 'GET';
    const isGet = method === 'GET';
    const cacheKey = isGet ? this.getCacheKey(endpoint) : null;
    const cacheTtl = options.cacheTtl ?? this.defaultCacheTtl;

    if (isGet && cacheTtl > 0) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheTtl) {
        return cached.data;
      }

      if (this.inFlight.has(cacheKey)) {
        return this.inFlight.get(cacheKey);
      }
    }

    const headers = {
      ...options.headers
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), this.requestTimeout);
    const requestOptions = {
      ...options,
      headers,
      signal: options.signal || controller.signal
    };

    const runRequest = async () => {
      try {
        const response = await fetch(`${this.baseURL}${endpoint}`, requestOptions);

        const contentType = response.headers.get('content-type') || '';
        const rawText = await response.text();
        let data = {};

        if (rawText) {
          if (contentType.includes('application/json')) {
            try {
              data = JSON.parse(rawText);
            } catch (error) {
              throw new Error('Server returned invalid JSON');
            }
          } else {
            data = { error: rawText };
          }
        }

        if (!response.ok) {
          const message = typeof data.error === 'string'
            ? data.error.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
            : response.statusText || 'Request failed';
          throw new ApiError(message || 'Request failed', response.status, data);
        }

        if (isGet && cacheTtl > 0) {
          this.cache.set(cacheKey, { data, timestamp: Date.now() });
        } else if (!isGet) {
          this.clearCache();
        }

        return data;
      } finally {
        window.clearTimeout(timeoutId);
        if (isGet) {
          this.inFlight.delete(cacheKey);
        }
      }
    };

    const requestPromise = runRequest();
    if (isGet && cacheTtl > 0) {
      this.inFlight.set(cacheKey, requestPromise);
    }
    return requestPromise;
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, options);
  }

  post(endpoint, data, isFormData = false) {
    const options = {
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data)
    };
    if (!isFormData) {
      options.headers = { 'Content-Type': 'application/json' };
    }
    return this.request(endpoint, options);
  }

  postForm(endpoint, formData) {
    return this.post(endpoint, formData, true);
  }

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }
}

export default new ApiClient();
