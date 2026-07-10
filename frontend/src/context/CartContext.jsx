// src/context/CartContext.jsx
// Global cart state: add/remove/update items, live quantity recalculation,
// localStorage persistence, and derived totals (count, subtotal, shipping, grand total).

import { createContext, useContext, useEffect, useMemo, useReducer, useCallback } from "react";

const CartContext = createContext(null);

const STORAGE_KEY = "rj_cart";
const FREE_SHIP_THRESHOLD = 999; // ₹ — free shipping above this subtotal
const FLAT_SHIPPING = 49;

// --- Reducer ---------------------------------------------------------------
const initialState = { items: [] };

function reducer(state, action) {
  switch (action.type) {
    case "HYDRATE":
      return { items: Array.isArray(action.items) ? action.items : [] };

    case "ADD": {
      const { product, qty } = action;
      const existing = state.items.find((i) => i._id === product._id);
      const cap = Number.isFinite(product.stock) ? product.stock : Infinity;

      if (existing) {
        const nextQty = Math.min(existing.qty + qty, cap);
        return {
          items: state.items.map((i) =>
            i._id === product._id ? { ...i, qty: nextQty } : i
          ),
        };
      }
      return {
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
      if (qty <= 0) return { items: state.items.filter((i) => i._id !== id) };
      return {
        items: state.items.map((i) => {
          if (i._id !== id) return i;
          const cap = Number.isFinite(i.stock) ? i.stock : Infinity;
          return { ...i, qty: Math.min(qty, cap) };
        }),
      };
    }

    case "REMOVE":
      return { items: state.items.filter((i) => i._id !== action.id) };

    case "CLEAR":
      return { items: [] };

    default:
      return state;
  }
}

// Lazy initializer reads persisted cart before first paint.
function init() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { items: JSON.parse(raw) };
  } catch {
    /* ignore corrupt storage */
  }
  return initialState;
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState, init);

  // Persist on every change.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      /* storage may be full/blocked — non-fatal */
    }
  }, [state.items]);

  // --- Actions (stable references) ---
  const addToCart = useCallback((product, qty = 1) => {
    dispatch({ type: "ADD", product, qty });
  }, []);
  const setQty = useCallback((id, qty) => dispatch({ type: "SET_QTY", id, qty }), []);
  const removeItem = useCallback((id) => dispatch({ type: "REMOVE", id }), []);
  const clearCart = useCallback(() => dispatch({ type: "CLEAR" }), []);

  // --- Derived totals (recomputed instantly on any item change) ---
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
      ...totals,
      addToCart,
      setQty,
      // convenience wrappers
      incrementItem: (id, cur) => setQty(id, cur + 1),
      decrementItem: (id, cur) => setQty(id, cur - 1),
      removeItem,
      clearCart,
    }),
    [state.items, totals, addToCart, setQty, removeItem, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Hook for consuming the cart anywhere in the tree.
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}

export default CartContext;
