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

  async request(endpoint, options = {}) {
    const headers = {
      ...options.headers
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers
    });

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

    return data;
  }

  get(endpoint) {
    return this.request(endpoint);
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
