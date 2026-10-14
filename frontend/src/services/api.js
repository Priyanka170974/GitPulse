import axios from 'axios';
import tokenStorage from './tokenStorage.js';

/* ------------------------------------------------------------------ *
 * API base URL
 * ------------------------------------------------------------------ *
 * Resolution order:
 *   1. VITE_API_URL               — set in frontend/.env locally, and in the
 *                                   Vercel project settings for production.
 *   2. http://localhost:5000/api  — local development ONLY
 *   3. https://gitpulse-api-s2dw.onrender.com/api — deployed backend
 *
 * The old code fell back to `http://localhost:5000/api` in every environment,
 * so a Vercel build without VITE_API_URL shipped a production bundle pointing
 * at the visitor's own machine. That is what produced
 * "Could not reach the GitPulse server" on the deployed site.
 */
const LOCAL_API_URL = 'http://localhost:5000/api';
const PRODUCTION_API_URL = 'https://gitpulse-api-s2dw.onrender.com/api';

const IS_DEV = Boolean(import.meta.env.DEV);
const IS_PRODUCTION_BUILD = !IS_DEV;

/**
 * Normalises any configured value into a base URL that always ends in `/api`.
 * `https://host`, `https://host/`, `https://host/api` and `https://host/api/`
 * therefore all produce identical request paths — no duplicated `/api` and no
 * missing route prefix. Express mounts everything under `/api`.
 */
function normaliseApiBase(value, fallback) {
  const raw = String(value || '').trim();
  const base = (raw || fallback).replace(/\/+$/, '');
  if (!base) return '';
  return /\/api$/i.test(base) ? base : `${base}/api`;
}

export const API_BASE_URL = normaliseApiBase(
  import.meta.env.VITE_API_URL,
  IS_DEV ? LOCAL_API_URL : PRODUCTION_API_URL,
);

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

/* ---------------------- error classification ----------------------- *
 * A missing response means the browser never produced one. That single
 * symptom covers several very different problems, so the message names them
 * instead of claiming — wrongly — that "the server is down on port 5000".
 * ------------------------------------------------------------------- */
function networkFailureMessage() {
  return IS_PRODUCTION_BUILD
    ? `Could not reach the GitPulse API at ${API_BASE_URL}. The request never reached the server. ` +
      'This usually means the API URL is wrong, the backend is not running, or CORS does not allow this origin.'
    : `Could not reach the GitPulse server at ${API_BASE_URL}. Make sure the backend is running and allows this origin.`;
}

function gatewayUnavailableMessage() {
  return IS_PRODUCTION_BUILD
    ? 'The GitPulse API is temporarily unavailable. Render free instances sleep when idle and take a moment to wake up — please try again.'
    : 'The GitPulse API is temporarily unavailable. Please try again in a moment.';
}

/* Normalise every failure into { status, message, code, details }. */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return Promise.reject({
        status: 408,
        code: 'timeout',
        message: `The GitPulse API did not respond within 45 seconds (${API_BASE_URL}). It may be waking up — please try again.`,
        details: null,
      });
    }

    // No response at all: DNS failure, connection refused, TLS problem, or a
    // CORS rejection (the browser blocks the reply, so axios sees no response).
    if (!error.response) {
      return Promise.reject({
        status: 0,
        code: 'network_error',
        message: networkFailureMessage(),
        details: { apiBase: API_BASE_URL, isProduction: IS_PRODUCTION_BUILD },
      });
    }

    const { status, data } = error.response;

    // Render returns a plain-text/HTML body while an instance is asleep, so
    // there is no JSON message to forward.
    const bodyMessage =
      typeof data === 'string' ? null : data?.message || null;

    const normalized = {
      status,
      code: (typeof data === 'object' && data?.code) || (status >= 500 ? 'server_unavailable' : 'server_error'),
      message:
        bodyMessage ||
        ([502, 503, 504].includes(status) ? gatewayUnavailableMessage() : null) ||
        (status === 401
          ? 'Your session has expired. Please sign in again.'
          : status === 403
            ? 'You do not have permission to perform this action.'
            : `The GitPulse API returned HTTP ${status}. Please try again.`),
      details: (typeof data === 'object' && data?.details) || null,
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