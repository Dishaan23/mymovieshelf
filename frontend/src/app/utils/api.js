// utils/api.js
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Generic API call function with authentication
export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('access_token');

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  // Handle token refresh if needed
  if (response.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed) {
      // Retry the original request
      config.headers.Authorization = `Bearer ${localStorage.getItem('access_token')}`;
      const retryResponse = await fetch(`${API_BASE}${endpoint}`, config);

      if (!retryResponse.ok) {
        throw new Error(`API Error: ${retryResponse.status}`);
      }

      return retryResponse.json();
    } else {
      // Redirect to login if refresh fails
      localStorage.clear();
      window.location.href = '/login';
      return;
    }
  }

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
};

// Token refresh function
export const refreshToken = async () => {
  const refreshToken = localStorage.getItem('refresh_token');

  if (!refreshToken) {
    return false;
  }

  try {
    const response = await fetch(`${API_BASE}/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('access_token', data.access);
      return true;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
  }

  return false;
};

// Movie API functions
export const movieAPI = {
  search: async (query) => {
    return apiCall(`/movies/search/?query=${encodeURIComponent(query)}`);
  },

  getDetail: async (imdbId) => {
    return apiCall(`/movies/detail/${imdbId}/`);
  },
};

// Watchlist API functions
export const watchlistAPI = {
  getAll: async () => {
    return apiCall('/watchlist/');
  },

  addFromOMDB: async (imdbId, rating = null, note = '') => {
    return apiCall('/watchlist/add-from-omdb/', {
      method: 'POST',
      body: JSON.stringify({
        imdb_id: imdbId,
        rating,
        note
      }),
    });
  },

  update: async (itemId, updates) => {
    return apiCall(`/watchlist/${itemId}/`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  remove: async (itemId) => {
    return apiCall(`/watchlist/${itemId}/`, {
      method: 'DELETE',
    });
  },

  markWatched: async (itemId) => {
    return apiCall(`/watchlist/${itemId}/mark_watched/`, {
      method: 'PATCH',
    });
  },

  unmarkWatched: async (itemId) => {
    return apiCall(`/watchlist/${itemId}/unmark_watched/`, {
      method: 'PATCH',
    });
  },

  getWatched: async () => {
    return apiCall('/watchlist/watched/');
  },

  getUnwatched: async () => {
    return apiCall('/watchlist/unwatched/');
  },
};

// Auth API functions
export const authAPI = {
  login: async (email, password) => {
    return fetch(`${API_BASE}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
  },

  register: async (userData) => {
    return fetch(`${API_BASE}/auth/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
  },

  getProfile: async () => {
    return apiCall('/auth/profile/');
  },
};

// Authentication helpers
export const auth = {
  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};