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

  // Blocked users (requires auth)
  listBlockedUsers: async (page = 1, itemsPerPage = 20) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('itemsPerPage', String(itemsPerPage));
    const response = await api.get(`/users/me/blocked-users?${params.toString()}`);
    return response.data;
  },

  blockUser: async (userId, reason) => {
    const response = await api.post('/users/me/blocked-users', { userId, reason });
    return response.data;
  },

  unblockUser: async (userId) => {
    const safeId = String(userId);
    const response = await api.delete(`/users/me/blocked-users/${encodeURIComponent(safeId)}`);
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

  // Get creator public profile by id (for fan creator details page)
  getCreatorById: async (creatorId) => {
    const id = String(creatorId).replace(/^creator_/, '');
    const response = await api.get(`/creators/${encodeURIComponent(id)}`);
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

  // Update creator profile (multipart: userName, avatarUrl file)
  updateCreatorProfile: async (formData) => {
    const response = await api.patch('/creators/me', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update creator bio and category (JSON)
  updateCreatorBioCategory: async ({ bio, category }) => {
    const response = await api.patch('/creators/me/bio-category', { bio, category });
    return response.data;
  },
};

// Video (Stream Video token for in-app calls)
export const videoAPI = {
  getVideoToken: async () => {
    const response = await api.get('/stream/video-token');
    return response.data;
  },
};

// Chat (requires auth)
export const chatAPI = {
  getChatToken: async () => {
    const response = await api.get('/chat/token');
    return response.data;
  },
  getIndividualChannels: async () => {
    const response = await api.get('/chat/individual-channels');
    return response.data;
  },
  createOrGetIndividualChannel: async (otherUserId) => {
    const response = await api.post('/chat/individual', { otherUserId });
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

  // Create a scheduled offer (creator availability time slot)
  createScheduledOffer: async ({ dateIso, startTime, endTime, duration, priceCents }) => {
    const payload = {
      date: dateIso,
      startTime,
      endTime,
      duration,
      priceCents,
    };
    const response = await api.post('/creators/me/offers/scheduled', payload);
    return response.data;
  },

  // Update a scheduled offer (PATCH /api/creators/me/offers/scheduled/:offerId)
  updateScheduledOffer: async (offerId, { dateIso, startTime, endTime, duration, priceCents }) => {
    const rawId = String(offerId).replace(/^offer_/, '');
    const payload = {
      date: dateIso,
      startTime,
      endTime,
      duration,
      priceCents,
    };
    const response = await api.patch(`/creators/me/offers/scheduled/${encodeURIComponent(rawId)}`, payload);
    return response.data;
  },

  // Delete an offer (DELETE /api/creators/me/offers/:offerId)
  deleteOffer: async (offerId) => {
    const rawId = String(offerId).replace(/^offer_/, '');
    const response = await api.delete(`/creators/me/offers/${encodeURIComponent(rawId)}`);
    return response.data;
  },
};

// Reviews (get reviews for a user; create review for completed booking)
export const reviewAPI = {
  getUserReviews: async (userId, { page = 1, itemsPerPage = 20, role } = {}) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('itemsPerPage', String(itemsPerPage));
    if (role) params.set('role', role);
    const id = String(userId).replace(/^creator_/, '').replace(/^fan_/, '');
    const response = await api.get(`/users/${encodeURIComponent(id)}/reviews?${params.toString()}`);
    return response.data;
  },
  createReview: async (bookingId, { rating, comment } = {}) => {
    const response = await api.post('/reviews', { bookingId, rating, comment });
    return response.data;
  },
};

// Bookings (requires auth; fan vs creator endpoints)
export const bookingAPI = {
  createBooking: async ({ creatorId, offerId, startTime, meetingProvider } = {}) => {
    const payload = { creatorId, offerId, startTime };
    if (meetingProvider) payload.meetingProvider = meetingProvider;
    const response = await api.post('/bookings', payload);
    return response.data;
  },
  getFanBookings: async ({ status, page = 1, itemsPerPage = 20 } = {}) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('itemsPerPage', String(itemsPerPage));
    if (status) params.set('status', status);
    const response = await api.get(`/fans/me/bookings?${params.toString()}`);
    return response.data;
  },
  getCreatorBookings: async ({ status, page = 1, itemsPerPage = 20 } = {}) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('itemsPerPage', String(itemsPerPage));
    if (status) params.set('status', status);
    const response = await api.get(`/creators/me/bookings?${params.toString()}`);
    return response.data;
  },
  getBookingById: async (bookingId) => {
    const id = String(bookingId).replace(/^booking_/, '');
    const response = await api.get(`/bookings/${encodeURIComponent(id)}`);
    return response.data;
  },
  confirmBooking: async (bookingId, { paymentProvider = 'stripe', paymentIntentId } = {}) => {
    const id = String(bookingId).replace(/^booking_/, '');
    const response = await api.post(`/bookings/${encodeURIComponent(id)}/confirm`, {
      paymentProvider,
      paymentIntentId: paymentIntentId || 'test_skip_payment',
    });
    return response.data;
  },
  startSession: async (bookingId) => {
    const id = String(bookingId).replace(/^booking_/, '');
    const response = await api.post(`/bookings/${encodeURIComponent(id)}/start`);
    return response.data;
  },
  endSession: async (bookingId) => {
    const id = String(bookingId).replace(/^booking_/, '');
    const response = await api.post(`/bookings/${encodeURIComponent(id)}/end`);
    return response.data;
  },
  cancelBooking: async (bookingId, reason) => {
    const id = String(bookingId).replace(/^booking_/, '');
    const response = await api.post(`/bookings/${encodeURIComponent(id)}/cancel`, { reason });
    return response.data;
  },
};

// Payments – Stripe (requires auth; fan creates payment for booking)
export const paymentAPI = {
  getStripePublishableKey: async () => {
    const response = await api.get('/payments/stripe-key');
    return response.data;
  },
  createPayment: async (bookingId) => {
    const id = String(bookingId).replace(/^booking_/, '');
    const response = await api.post(`/payments/bookings/${encodeURIComponent(id)}`);
    return response.data;
  },
  getPaymentStatus: async (bookingId) => {
    const id = String(bookingId).replace(/^booking_/, '');
    const response = await api.get(`/payments/bookings/${encodeURIComponent(id)}/status`);
    return response.data;
  },
};

export default api;


