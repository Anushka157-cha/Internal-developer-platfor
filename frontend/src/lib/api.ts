import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { handleMockRequest } from './mockApi';

const baseURL = import.meta.env.VITE_API_URL || '/api';

// Detect static cloud hosting without a dedicated backend server
const isStaticHosting =
  !import.meta.env.VITE_API_URL &&
  typeof window !== 'undefined' &&
  (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('netlify.app'));

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach access token & route through mock adapter on static hosts
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // If deployed to static host (Vercel) without a live backend URL, execute in-browser
  if (isStaticHosting) {
    config.adapter = async (cfg) => {
      let parsedData = cfg.data;
      if (typeof parsedData === 'string') {
        try {
          parsedData = JSON.parse(parsedData);
        } catch {
          // keep as string
        }
      }
      const result = await handleMockRequest(cfg.method || 'get', cfg.url || '', parsedData);
      return {
        data: result,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: cfg,
        request: {},
      };
    };
  }

  return config;
});

// Response interceptor with automatic token refresh & fallback on 405 / 404 / offline
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Fallback if backend returned 405 (Vercel static reject), 404, or network failure
    if (originalRequest && (error.response?.status === 405 || error.response?.status === 404 || !error.response)) {
      try {
        let parsedData = originalRequest.data;
        if (typeof parsedData === 'string') {
          try {
            parsedData = JSON.parse(parsedData);
          } catch {
            // keep as string
          }
        }
        const fallbackData = await handleMockRequest(
          originalRequest.method || 'get',
          originalRequest.url || '',
          parsedData,
        );
        return {
          data: fallbackData,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: originalRequest,
        };
      } catch (fallbackErr) {
        return Promise.reject(fallbackErr);
      }
    }

    // If 401 and request wasn't already retried or wasn't an auth endpoint
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      const storedUser = localStorage.getItem('user');

      if (!refreshToken || !storedUser) {
        isRefreshing = false;
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const user = JSON.parse(storedUser);
        const { data } = await axios.post(`${baseURL}/auth/refresh`, {
          userId: user.id,
          refreshToken,
        });

        localStorage.setItem('token', data.access_token);
        if (data.refresh_token) {
          localStorage.setItem('refreshToken', data.refresh_token);
        }

        api.defaults.headers.common.Authorization = `Bearer ${data.access_token}`;
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        }

        processQueue(null, data.access_token);
        return api(originalRequest);
      } catch (refreshError: any) {
        processQueue(refreshError, null);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
