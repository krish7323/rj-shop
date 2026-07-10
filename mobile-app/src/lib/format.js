// src/lib/format.js
// Formatting helpers + an offline demo catalog so the app renders without a backend.

export const inr = (n) =>
  "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(n) || 0);

export const discountPct = (price, mrp) => {
  const p = Number(price) || 0;
  const m = Number(mrp) || 0;
  if (m <= 0 || m <= p) return 0;
  return Math.round(((m - p) / m) * 100);
};

export const dateShort = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

export const DEMO_CATALOG = [
  { _id: "d1", name: "Wireless Earbuds Pro (ANC)", sku: "RJ-EAR-01", category: "Electronics", brand: "RJ Audio", price: 2499, mrp: 3999, stock: 24, rating: 4.5, numReviews: 214, images: ["https://picsum.photos/seed/rjear/600/600"], description: "Active noise cancellation, 30h battery, IPX5 water resistance. Crystal-clear calls and immersive sound for everyday listening." },
  { _id: "d2", name: "Premium Cotton Kurta", sku: "RJ-KUR-11", category: "Fashion", brand: "RJ Originals", price: 899, mrp: 1499, stock: 12, rating: 4.2, numReviews: 89, images: ["https://picsum.photos/seed/rjkurta/600/600"], description: "Breathable handloom cotton, regular fit, festive-ready with a refined finish." },
  { _id: "d3", name: "Insulated Steel Bottle 1L", sku: "RJ-BOT-07", category: "Home", brand: "RJ Living", price: 449, mrp: 799, stock: 60, rating: 4.7, numReviews: 340, images: ["https://picsum.photos/seed/rjbottle/600/600"], description: "24h cold / 12h hot, leak-proof, food-grade stainless steel. Perfect for travel and the gym." },
  { _id: "d4", name: "LED Smart Desk Lamp", sku: "RJ-LMP-02", category: "Home", brand: "RJ Living", price: 1299, mrp: 1999, stock: 4, rating: 4.4, numReviews: 121, images: ["https://picsum.photos/seed/rjlamp/600/600"], description: "Touch dimming, 3 color temperatures, USB charging port and eye-care flicker-free light." },
  { _id: "d5", name: "Running Shoes AirFlex", sku: "RJ-SHO-05", category: "Fashion", brand: "RJ Sport", price: 1799, mrp: 2999, stock: 30, rating: 4.3, numReviews: 156, images: ["https://picsum.photos/seed/rjshoe/600/600"], description: "Lightweight mesh upper, cushioned sole, all-day comfort for runs and casual wear." },
  { _id: "d6", name: "Mechanical Keyboard RGB", sku: "RJ-KEY-09", category: "Electronics", brand: "RJ Tech", price: 3299, mrp: 4499, stock: 15, rating: 4.6, numReviews: 203, images: ["https://picsum.photos/seed/rjkey/600/600"], description: "Hot-swappable switches, per-key RGB, durable aluminium frame for work and play." },
  { _id: "d7", name: "Ceramic Coffee Mug Set", sku: "RJ-MUG-03", category: "Home", brand: "RJ Living", price: 599, mrp: 999, stock: 45, rating: 4.1, numReviews: 67, images: ["https://picsum.photos/seed/rjmug/600/600"], description: "Set of 2 microwave-safe stoneware mugs, 350ml each, with a comfortable handle." },
  { _id: "d8", name: "Analog Wrist Watch Classic", sku: "RJ-WAT-06", category: "Fashion", brand: "RJ Time", price: 1499, mrp: 2499, stock: 20, rating: 4.5, numReviews: 98, images: ["https://picsum.photos/seed/rjwatch/600/600"], description: "Genuine leather strap, water-resistant, minimalist dial that pairs with any outfit." },
];

// Demo order history shown when the backend is unreachable / not logged in.
export const DEMO_ORDERS = [
  { _id: "64f0aa11bb22cc33dd44ee01", totalPrice: 2499, paymentMethod: "Razorpay", paymentStatus: "Paid", status: "Shipped", shiprocketTrackingId: "SR123456789", createdAt: "2026-07-05", items: [{ name: "Wireless Earbuds Pro (ANC)", quantity: 1, price: 2499 }] },
  { _id: "64f0aa11bb22cc33dd44ee02", totalPrice: 948, paymentMethod: "COD", paymentStatus: "Pending", status: "Confirmed", shiprocketTrackingId: "", createdAt: "2026-07-08", items: [{ name: "Premium Cotton Kurta", quantity: 1, price: 899 }] },
  { _id: "64f0aa11bb22cc33dd44ee03", totalPrice: 1748, paymentMethod: "Razorpay", paymentStatus: "Paid", status: "Delivered", shiprocketTrackingId: "SR987654321", createdAt: "2026-07-01", items: [{ name: "Insulated Steel Bottle 1L", quantity: 2, price: 449 }, { name: "LED Smart Desk Lamp", quantity: 1, price: 1299 }] },
];
