// REST API Client helper

export async function apiRequest(endpoint, options = {}) {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  };

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {})
    }
  };

  // If body is FormData, don't set Content-Type header (browser sets boundary)
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  try {
    const res = await fetch(endpoint, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data.message || `Request failed with status ${res.status}`;
      const err = new Error(errorMsg);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    console.error(`[API Error: ${endpoint}]`, err);
    throw err;
  }
}

export const api = {
  // Auth
  login: (username, password) => apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  }),
  logout: () => apiRequest('/api/auth/logout', { method: 'POST' }),
  getMe: () => apiRequest('/api/auth/me'),
  changePassword: (currentPassword, newPassword) => apiRequest('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword })
  }),

  // Users (Admin)
  getUsers: () => apiRequest('/api/users'),
  createUser: (userData) => apiRequest('/api/users', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),
  updateUser: (id, userData) => apiRequest(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData)
  }),
  deleteUser: (id) => apiRequest(`/api/users/${id}`, { method: 'DELETE' }),

  // Health
  getHealth: () => apiRequest('/api/health')
};
