// src/lib/api.js
// Axios client for the RJ Shop storefront. Talks to the backend catalog + orders.

import axios from "axios";

let rawUrl = import.meta.env.VITE_API_URL;

if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
  if (!rawUrl || rawUrl.includes("localhost") || rawUrl.includes("127.0.0.1")) {
    rawUrl = "https://rj-mobile-backend.onrender.com/api";
  }
}

if (!rawUrl) {
  rawUrl = "http://localhost:5000/api";
}

if (rawUrl && !rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")) {
  rawUrl = `https://${rawUrl}`;
}
const apiBase = rawUrl.endsWith("/api") ? rawUrl : `${rawUrl}/api`;

const api = axios.create({
  baseURL: apiBase,
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

export const CategoryAPI = {
  list: () => api.get("/categories"),
};

export default api;
