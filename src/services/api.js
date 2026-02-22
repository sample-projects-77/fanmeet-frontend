import axios from 'axios';

// Get API URL from environment variable, default to localhost
let API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Ensure the URL ends with /api if it doesn't already
if (!API_BASE_URL.endsWith('/api')) {
  // Remove trailing slash if present, then add /api
  API_BASE_URL = API_BASE_URL.replace(/\/$/, '') + '/api';
}

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  // Login (role required: 'fan' | 'creator')
  login: async (email, password, role = 'fan') => {
    const response = await api.post('/auth/login', {
      email,
      password,
      role,
    });
    return response.data;
  },

  // Register Fan
  registerFan: async (formData) => {
    const response = await api.post('/auth/fans/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Register Creator
  registerCreator: async (formData) => {
    const response = await api.post('/auth/creators/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get current user profile (requires auth)
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Change password (requires auth)
  changePassword: async (oldPassword, newPassword) => {
    const response = await api.put('/auth/change-password', {
      oldPassword,
      newPassword,
    });
    return response.data;
  },

  // Delete account (requires auth)
  deleteAccount: async () => {
    const response = await api.delete('/auth/delete-account');
    return response.data;
  },
};

// User preferences (requires auth)
export const userAPI = {
  updateLanguage: async (locale) => {
    const response = await api.patch('/user/language', { locale });
    return response.data;
  },
};

// Dashboard API (requires auth)
export const dashboardAPI = {
  getFanDashboard: async () => {
    const response = await api.get('/dashboard/fan');
    return response.data;
  },
  getCreatorDashboard: async () => {
    const response = await api.get('/dashboard/creator');
    return response.data;
  },
};

// Profile / Creators (public or optional auth)
export const profileAPI = {
  getCreators: async ({ q = '', category = '', page = 1, itemsPerPage = 12 } = {}) => {
    const params = new URLSearchParams();
    if (page) params.set('page', String(page));
    if (itemsPerPage) params.set('itemsPerPage', String(itemsPerPage));
    if (q && q.trim()) params.set('q', q.trim());
    if (category) params.set('category', category);
    const response = await api.get(`/creators?${params.toString()}`);
    return response.data;
  },

  // Get my full profile (fan or creator)
  getMyProfile: async () => {
    const response = await api.get('/profile/me');
    return response.data;
  },

  // Update fan profile (multipart: userName, avatarUrl file)
  updateFanProfile: async (formData) => {
    const response = await api.patch('/fans/me', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Chat (requires auth)
export const chatAPI = {
  getIndividualChannels: async () => {
    const response = await api.get('/chat/individual-channels');
    return response.data;
  },
};

// Offers (creator: my offers + scheduled)
export const offerAPI = {
  getMyOffers: async (page = 1, itemsPerPage = 20) => {
    const response = await api.get(`/creators/me/offers?page=${page}&itemsPerPage=${itemsPerPage}`);
    return response.data;
  },
  getCreatorScheduledOffers: async (creatorId, { page = 1, itemsPerPage = 50, status } = {}) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('itemsPerPage', String(itemsPerPage));
    if (status) params.set('status', status);
    const response = await api.get(`/creators/${encodeURIComponent(creatorId)}/offers/scheduled?${params.toString()}`);
    return response.data;
  },
};

export default api;


