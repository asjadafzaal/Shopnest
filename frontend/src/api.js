/**
 * ShopNest API Client
 * Centralized HTTP service for interacting with the Django REST Framework backend.
 * Handles JWT token storage, authorization headers, and automatic token refresh.
 */

const API_BASE = '/api';

export const tokens = {
  getAccess: () => localStorage.getItem('access_token'),
  getRefresh: () => localStorage.getItem('refresh_token'),
  set: (access, refresh) => {
    if (access) localStorage.setItem('access_token', access);
    if (refresh) localStorage.setItem('refresh_token', refresh);
  },
  clear: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_cache');
  },
};

export async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = { ...options.headers };

  // Don't set Content-Type if sending FormData (browser sets boundary automatically)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const access = tokens.getAccess();
  if (access) {
    headers['Authorization'] = `Bearer ${access}`;
  }

  let response = await fetch(url, { ...options, headers });

  // Handle Token Expiry & Automatic Refresh
  if (response.status === 401 && tokens.getRefresh() && !endpoint.includes('/auth/token/refresh/')) {
    try {
      const refreshRes = await fetch(`${API_BASE}/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: tokens.getRefresh() }),
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        tokens.set(data.access, data.refresh || tokens.getRefresh());
        headers['Authorization'] = `Bearer ${data.access}`;
        response = await fetch(url, { ...options, headers });
      } else {
        tokens.clear();
      }
    } catch {
      tokens.clear();
    }
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      data.detail ||
      data.message ||
      (typeof data === 'object' ? Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`).join(' | ') : 'Request failed');
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ---------------------------------------------------------------------------
// Authentication Endpoints
// ---------------------------------------------------------------------------
export const authApi = {
  login: async (username, password) => {
    const data = await request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    tokens.set(data.access, data.refresh);
    const profile = await authApi.getProfile();
    localStorage.setItem('user_cache', JSON.stringify(profile));
    return { tokens: data, user: profile };
  },

  register: (payload) =>
    request('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getProfile: () => request('/auth/profile/'),

  updateProfile: (payload) =>
    request('/auth/profile/', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  logout: () => {
    tokens.clear();
  },
};

// ---------------------------------------------------------------------------
// Catalog Endpoints
// ---------------------------------------------------------------------------
export const catalogApi = {
  getCategories: (tree = false) =>
    request(`/catalog/categories/${tree ? '?tree=true' : ''}`),

  getProducts: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, v);
      }
    });
    const qs = query.toString();
    return request(`/catalog/products/${qs ? `?${qs}` : ''}`);
  },

  getProductDetail: (slug) => request(`/catalog/products/${slug}/`),

  getProductReviews: (slug) => request(`/catalog/products/${slug}/reviews/`),

  createProductReview: (slug, payload) =>
    request(`/catalog/products/${slug}/reviews/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getAnalytics: () => request('/catalog/analytics/'),

  // Seller Product Management
  getSellerProducts: () => request('/catalog/seller/products/'),

  createSellerProduct: (payload) =>
    request('/catalog/seller/products/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateSellerProduct: (id, payload) =>
    request(`/catalog/seller/products/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteSellerProduct: (id) =>
    request(`/catalog/seller/products/${id}/`, {
      method: 'DELETE',
    }),

  uploadProductImage: (productId, formData) =>
    request(`/catalog/seller/products/${productId}/images/`, {
      method: 'POST',
      body: formData,
    }),

  deleteProductImage: (productId, imageId) =>
    request(`/catalog/seller/products/${productId}/images/${imageId}/`, {
      method: 'DELETE',
    }),
};

// ---------------------------------------------------------------------------
// Sellers & Stores Endpoints
// ---------------------------------------------------------------------------
export const sellersApi = {
  getStores: () => request('/sellers/stores/'),
  getStoreDetail: (slug) => request(`/sellers/stores/${slug}/`),
  getSellerProfile: () => request('/sellers/profile/'),
  saveSellerProfile: (payload, isUpdate = false) =>
    request('/sellers/profile/', {
      method: isUpdate ? 'PATCH' : 'POST',
      body: JSON.stringify(payload),
    }),
  getSellerStore: () => request('/sellers/store/'),
  saveSellerStore: (payload, isUpdate = false) =>
    request('/sellers/store/', {
      method: isUpdate ? 'PATCH' : 'POST',
      body: JSON.stringify(payload),
    }),
  getSellerAnalytics: () => request('/sellers/analytics/'),
  getOnboardingStatus: () => request('/sellers/onboarding-status/'),
};


// ---------------------------------------------------------------------------
// Cart Endpoints
// ---------------------------------------------------------------------------
export const cartApi = {
  getCart: () => request('/cart/'),
  addItem: (productId, quantity = 1) =>
    request('/cart/items/', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity }),
    }),
  updateItem: (itemId, quantity) =>
    request(`/cart/items/${itemId}/`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    }),
  removeItem: (itemId) =>
    request(`/cart/items/${itemId}/`, {
      method: 'DELETE',
    }),
  clearCart: () =>
    request('/cart/clear/', {
      method: 'POST',
    }),
};

// ---------------------------------------------------------------------------
// Orders & Checkout Endpoints
// ---------------------------------------------------------------------------
export const ordersApi = {
  checkout: (shippingData) =>
    request('/orders/checkout/', {
      method: 'POST',
      body: JSON.stringify(shippingData),
    }),
  getOrders: () => request('/orders/'),
  getOrderDetail: (id) => request(`/orders/${id}/`),
  getSellerOrders: (status = '') =>
    request(`/orders/seller/${status ? `?status=${status}` : ''}`),
  getSellerOrderDetail: (id) => request(`/orders/seller/${id}/`),
  updateFulfillmentStatus: (id, payload) =>
    request(`/orders/seller/${id}/status/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
};
