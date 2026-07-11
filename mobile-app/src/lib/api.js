// src/lib/api.js
// Axios client for the RJ Shop mobile app. Connects to the same backend web API
// used by the storefront and admin panel.
//
// IMPORTANT: on a physical device / emulator "localhost" points at the device,
// not your dev machine. Set API_URL to your machine's LAN IP (e.g. 192.168.x.x)
// or use the Android emulator alias 10.0.2.2. It reads app.json > extra.apiUrl,
// then falls back to the Android emulator host.

import axios from "axios";
import { Platform } from "react-native";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

const configured =
  Constants?.expoConfig?.extra?.apiUrl ||
  Constants?.manifest?.extra?.apiUrl ||
  null;

// Sensible default per platform when nothing is configured.
const fallback =
  Platform.OS === "android" ? "http://10.0.2.2:5000/api" : "http://localhost:5000/api";

export const BASE_URL = configured || fallback;

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Attach the stored JWT to protected requests (checkout / order history).
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem("rj_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    /* storage unavailable — proceed unauthenticated */
  }
  return config;
});

export const CatalogAPI = {
  list: (params = {}) => api.get("/products", { params }),
  get: (id) => api.get(`/products/${id}`),
};

export const OrderAPI = {
  create: (payload) => api.post("/orders", payload),
  mine: () => api.get("/orders/my-orders"),
  verifyPayment: (id, payload) => api.post(`/orders/${id}/verify-payment`, payload),
};

export const AuthAPI = {
  login: (email, password) => api.post("/auth/login", { email, password }),
  register: (name, email, password) => api.post("/auth/register", { name, email, password }),
  me: () => api.get("/auth/me"),
};

export default api;
