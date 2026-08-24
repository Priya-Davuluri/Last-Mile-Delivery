/**
 * Base API service configuring base URL from .env, automatic JWT attachment, and unified error handling.
 */
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function request(endpoint, { method = 'GET', body = null, headers = {} } = {}) {
  const token = localStorage.getItem('token');

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = data.message || `API request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`API [${method} ${endpoint}] Error:`, error.message);
    throw error;
  }
}

export const api = {
  get: (endpoint, headers) => request(endpoint, { method: 'GET', headers }),
  post: (endpoint, body, headers) => request(endpoint, { method: 'POST', body, headers }),
  put: (endpoint, body, headers) => request(endpoint, { method: 'PUT', body, headers }),
  patch: (endpoint, body, headers) => request(endpoint, { method: 'PATCH', body, headers }),
  delete: (endpoint, headers) => request(endpoint, { method: 'DELETE', headers }),
};

export default api;
