// src/lib/api.js
// Axios client for the RJ Shop storefront. Talks to the backend catalog + orders.

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Attach the customer JWT (set after login) to protected requests like checkout.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("rj_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const CatalogAPI = {
  list: (params = {}) => api.get("/products", { params }),
  get: (id) => api.get(`/products/${id}`),
};

export const OrderAPI = {
  create: (payload) => api.post("/orders", payload),
  mine: () => api.get("/orders/my-orders"),
};

export const AuthAPI = {
  login: (email, password) => api.post("/auth/login", { email, password }),
  register: (name, email, password, phone, currentDevice) => api.post("/auth/register", { name, email, password, phone, currentDevice }),
  verifyOTP: (email, otp) => api.post("/auth/verify-otp", { email, otp }),
  resendOTP: (email) => api.post("/auth/resend-otp", { email }),
  me: () => api.get("/auth/me"),
};

export default api;
