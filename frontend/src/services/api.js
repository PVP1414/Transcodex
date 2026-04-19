import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const mediaService = {
  upload: (formData, onUploadProgress) => api.post('/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  }),
  list: (params) => api.get('/media', { params }),
  listPublic: (params) => api.get('/media/public', { params }),
  getById: (id) => api.get(`/media/${id}`),
  getInfo: (id) => api.get(`/media/${id}/info`),
  update: (id, data) => api.put(`/media/${id}`, data),
  delete: (id) => api.delete(`/media/${id}`),
  /**
   * Absolute URL for GET /media/:id/serve (use in img src or anchor; no axios auth).
   * @param {string} id
   * @param {string | { variant?: string, download?: boolean, token?: string }} [options] variant name or options object
   */
  serve: (id, options) => {
    const opts = typeof options === 'string' ? { variant: options } : (options || {});
    const params = new URLSearchParams();
    if (opts.variant) params.set('variant', opts.variant);
    if (opts.download) params.set('download', '1');
    if (opts.token) params.set('token', opts.token);
    const qs = params.toString();
    return `${API_URL}/media/${id}/serve${qs ? `?${qs}` : ''}`;
  },
};

export default api;
