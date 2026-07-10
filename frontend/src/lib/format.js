// src/lib/format.js
// Shared formatting helpers + a small demo catalog fallback for offline preview.

export const inr = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

export const discountPct = (price, mrp) => {
  const p = Number(price) || 0;
  const m = Number(mrp) || 0;
  if (m <= 0 || m <= p) return 0;
  return Math.round(((m - p) / m) * 100);
};

// Representative catalog shown when the backend is unreachable so the store
// always renders. Uses picsum seeds for stable placeholder imagery.
export const DEMO_CATALOG = [
  { _id: "d1", name: "Wireless Earbuds Pro (ANC)", sku: "RJ-EAR-01", category: "Electronics", brand: "RJ Audio", price: 2499, mrp: 3999, stock: 24, rating: 4.5, numReviews: 214, images: ["https://picsum.photos/seed/rjear/600/600"], description: "Active noise cancellation, 30h battery, IPX5 water resistance." },
  { _id: "d2", name: "Premium Cotton Kurta", sku: "RJ-KUR-11", category: "Fashion", brand: "RJ Originals", price: 899, mrp: 1499, stock: 12, rating: 4.2, numReviews: 89, images: ["https://picsum.photos/seed/rjkurta/600/600"], description: "Breathable handloom cotton, regular fit, festive-ready." },
  { _id: "d3", name: "Insulated Steel Bottle 1L", sku: "RJ-BOT-07", category: "Home", brand: "RJ Living", price: 449, mrp: 799, stock: 60, rating: 4.7, numReviews: 340, images: ["https://picsum.photos/seed/rjbottle/600/600"], description: "24h cold / 12h hot, leak-proof, food-grade stainless steel." },
  { _id: "d4", name: "LED Smart Desk Lamp", sku: "RJ-LMP-02", category: "Home", brand: "RJ Living", price: 1299, mrp: 1999, stock: 8, rating: 4.4, numReviews: 121, images: ["https://picsum.photos/seed/rjlamp/600/600"], description: "Touch dimming, 3 color temperatures, USB charging port." },
  { _id: "d5", name: "Running Shoes AirFlex", sku: "RJ-SHO-05", category: "Fashion", brand: "RJ Sport", price: 1799, mrp: 2999, stock: 30, rating: 4.3, numReviews: 156, images: ["https://picsum.photos/seed/rjshoe/600/600"], description: "Lightweight mesh, cushioned sole, all-day comfort." },
  { _id: "d6", name: "Mechanical Keyboard RGB", sku: "RJ-KEY-09", category: "Electronics", brand: "RJ Tech", price: 3299, mrp: 4499, stock: 15, rating: 4.6, numReviews: 203, images: ["https://picsum.photos/seed/rjkey/600/600"], description: "Hot-swappable switches, per-key RGB, aluminium frame." },
  { _id: "d7", name: "Ceramic Coffee Mug Set", sku: "RJ-MUG-03", category: "Home", brand: "RJ Living", price: 599, mrp: 999, stock: 45, rating: 4.1, numReviews: 67, images: ["https://picsum.photos/seed/rjmug/600/600"], description: "Set of 2 microwave-safe stoneware mugs, 350ml each." },
  { _id: "d8", name: "Analog Wrist Watch Classic", sku: "RJ-WAT-06", category: "Fashion", brand: "RJ Time", price: 1499, mrp: 2499, stock: 20, rating: 4.5, numReviews: 98, images: ["https://picsum.photos/seed/rjwatch/600/600"], description: "Genuine leather strap, water-resistant, minimalist dial." },
];
