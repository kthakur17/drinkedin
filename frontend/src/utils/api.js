/**
 * API utility — Axios instance with JWT auth header injection
 */

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('drinkedin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 — clear token and redirect
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('drinkedin_token');
      localStorage.removeItem('drinkedin_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
