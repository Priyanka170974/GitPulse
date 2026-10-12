import axios from 'axios';
import tokenStorage from './tokenStorage.js';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000,
  headers: { 'Content-Type': 'application/json' },
});

/* Attach the JWT to every protected request. */
api.interceptors.request.use((requestConfig) => {
  const token = tokenStorage.get();
  if (token) requestConfig.headers.Authorization = `Bearer ${token}`;
  return requestConfig;
});

/** Fired when the server rejects our token so AuthContext can sign the user out. */
export const UNAUTHORIZED_EVENT = 'gitpulse:unauthorized';

/* Normalise every failure into { status, message, code, details }. */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        status: 408,
        code: 'timeout',
        message: 'The GitPulse server took too long to respond. Please try again.',
        details: null,
      });
    }

    if (!error.response) {
      return Promise.reject({
        status: 0,
        code: 'network_error',
        message:
          'Could not reach the GitPulse server. Make sure the backend is running on port 5000 and that CORS allows this origin.',
        details: null,
      });
    }

    const { status, data } = error.response;
    const normalized = {
      status,
      code: data?.code || 'server_error',
      message:
        data?.message ||
        'Something went wrong on the GitPulse server. Please try again.',
      details: data?.details || null,
    };

    if (status === 401 && !String(error.config?.url || '').includes('/auth/login')) {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT, { detail: normalized }));
    }

    return Promise.reject(normalized);
  },
);

const unwrap = (promise) => promise.then((res) => res.data.data);

/* ============================ AUTH ================================== */
export const authApi = {
  register: (payload) => unwrap(api.post('/auth/register', payload)),
  login: (payload) => unwrap(api.post('/auth/login', payload)),
  me: () => unwrap(api.get('/auth/me')),
  updateProfile: (payload) => unwrap(api.put('/auth/profile', payload)),
  logout: () => unwrap(api.post('/auth/logout')),
};

/* ======================== REPOSITORIES ============================== */
export const repositoryApi = {
  analyze: (repoUrl) => unwrap(api.post('/repositories/analyze', { repoUrl })),
  list: (params = {}) => unwrap(api.get('/repositories', { params })),
  summary: () => unwrap(api.get('/repositories/summary')),
  get: (id) => unwrap(api.get(`/repositories/${id}`)),
  remove: (id) => unwrap(api.delete(`/repositories/${id}`)),
  reanalyze: (id) => unwrap(api.post(`/repositories/${id}/reanalyze`)),
  history: (id) => unwrap(api.get(`/repositories/${id}/history`)),
  compare: (a, b) => unwrap(api.get('/repositories/compare', { params: { a, b } })),
};

/* ========================== ANALYTICS =============================== */
export const analyticsApi = {
  forRepository: (id) => unwrap(api.get(`/analytics/repositories/${id}/analytics`)),
};

/* ============================ ADMIN ================================= */
export const adminApi = {
  users: (params = {}) => unwrap(api.get('/admin/users', { params })),
  statistics: () => unwrap(api.get('/admin/statistics')),
  updateRole: (id, role) => unwrap(api.patch(`/admin/users/${id}/role`, { role })),
};

/* ============================ META ================================== */
export const metaApi = {
  health: () => unwrap(api.get('/health')),
  indicators: () => unwrap(api.get('/meta')),
};

export default api;