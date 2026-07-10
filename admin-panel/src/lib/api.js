// src/lib/api.js
// Centralized axios client for the RJ Shop admin panel.
// Base URL points at the backend; override with VITE_API_URL at build/dev time.
// A token (if present) is attached to every request for protected admin routes.

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Attach the admin JWT from localStorage on every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("rj_admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- Endpoint helpers mapped to our backend routes ---
export const AdminAPI = {
  overview: () => api.get("/admin/metrics/overview"),
  totalSpending: () => api.get("/admin/metrics/total-spending"),
  topCustomers: (limit = 10) => api.get(`/admin/metrics/top-customers?limit=${limit}`),
  lowStock: (threshold = 5) => api.get(`/admin/metrics/low-stock?threshold=${threshold}`),
  revenueBreakdown: () => api.get("/admin/metrics/revenue-breakdown"),
};

export const ProductAPI = {
  list: (params = {}) => api.get("/products", { params }),
  add: (payload) => api.post("/products", payload),
  update: (id, payload) => api.put(`/products/${id}`, payload),
  remove: (id) => api.delete(`/products/${id}`),
};

export const OrderAPI = {
  all: (params = {}) => api.get("/orders/all", { params }),
  updateStatus: (id, payload) => api.put(`/orders/${id}/status`, payload),
};

export const AuthAPI = {
  login: (email, password) => api.post("/auth/login", { email, password }),
};

export default api;
