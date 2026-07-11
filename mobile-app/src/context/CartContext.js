// src/context/CartContext.js
// Global cart state for the mobile app: add/remove/update items, stock-capped
// quantities, AsyncStorage persistence, and derived totals.

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useCallback,
  useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CartContext = createContext(null);

const STORAGE_KEY = "rj_cart";
const FREE_SHIP_THRESHOLD = 999;
const FLAT_SHIPPING = 49;

const initialState = { items: [], hydrated: false };

function reducer(state, action) {
  switch (action.type) {
    case "HYDRATE":
      return { items: Array.isArray(action.items) ? action.items : [], hydrated: true };

    case "ADD": {
      const { product, qty } = action;
      const cap = Number.isFinite(product.stock) ? product.stock : Infinity;
      const existing = state.items.find((i) => i._id === product._id);
      if (existing) {
        const nextQty = Math.min(existing.qty + qty, cap);
        return {
          ...state,
          items: state.items.map((i) =>
            i._id === product._id ? { ...i, qty: nextQty } : i
          ),
        };
      }
      return {
        ...state,
        items: [
          ...state.items,
          {
            _id: product._id,
            name: product.name,
            sku: product.sku,
            price: product.price,
            mrp: product.mrp,
            image: product.images && product.images.length ? product.images[0] : "",
            stock: cap === Infinity ? undefined : cap,
            qty: Math.min(qty, cap),
          },
        ],
      };
    }

    case "SET_QTY": {
      const { id, qty } = action;
      if (qty <= 0) return { ...state, items: state.items.filter((i) => i._id !== id) };
      return {
        ...state,
        items: state.items.map((i) => {
          if (i._id !== id) return i;
          const cap = Number.isFinite(i.stock) ? i.stock : Infinity;
          return { ...i, qty: Math.min(qty, cap) };
        }),
      };
    }

    case "REMOVE":
      return { ...state, items: state.items.filter((i) => i._id !== action.id) };

    case "CLEAR":
      return { ...state, items: [] };

    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const didHydrate = useRef(false);

  const [token, setToken] = React.useState(null);
  const [tokenLoading, setTokenLoading] = React.useState(true);

  // Load persisted cart and token on mount.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        dispatch({ type: "HYDRATE", items: raw ? JSON.parse(raw) : [] });
      } catch {
        dispatch({ type: "HYDRATE", items: [] });
      } finally {
        didHydrate.current = true;
      }

      try {
        const val = await AsyncStorage.getItem("rj_token");
        setToken(val);
      } catch {
        setToken(null);
      } finally {
        setTokenLoading(false);
      }
    })();
  }, []);

  // Persist after hydration whenever items change.
  useEffect(() => {
    if (!state.hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.items)).catch(() => {});
  }, [state.items, state.hydrated]);

  const addToCart = useCallback((product, qty = 1) => dispatch({ type: "ADD", product, qty }), []);
  const setQty = useCallback((id, qty) => dispatch({ type: "SET_QTY", id, qty }), []);
  const removeItem = useCallback((id) => dispatch({ type: "REMOVE", id }), []);
  const clearCart = useCallback(() => dispatch({ type: "CLEAR" }), []);

  const totals = useMemo(() => {
    const count = state.items.reduce((s, i) => s + i.qty, 0);
    const subtotal = state.items.reduce((s, i) => s + i.price * i.qty, 0);
    const mrpTotal = state.items.reduce((s, i) => s + (i.mrp || i.price) * i.qty, 0);
    const savings = Math.max(0, mrpTotal - subtotal);
    const shipping = subtotal === 0 || subtotal >= FREE_SHIP_THRESHOLD ? 0 : FLAT_SHIPPING;
    const grandTotal = subtotal + shipping;
    return { count, subtotal, savings, shipping, grandTotal, freeShipThreshold: FREE_SHIP_THRESHOLD };
  }, [state.items]);

  const value = useMemo(
    () => ({
      items: state.items,
      hydrated: state.hydrated,
      token,
      setToken,
      tokenLoading,
      ...totals,
      addToCart,
      setQty,
      incrementItem: (id, cur) => setQty(id, cur + 1),
      decrementItem: (id, cur) => setQty(id, cur - 1),
      removeItem,
      clearCart,
    }),
    [state.items, state.hydrated, token, tokenLoading, totals, addToCart, setQty, removeItem, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}

export default CartContext;
