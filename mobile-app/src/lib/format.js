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
  // 1. Mobile Repair Kits
  { _id: "d1", name: "Professional 24-in-1 Screwdriver Set", sku: "RJ-KIT-01", category: "Repair Kits", brand: "RJ Tools", price: 499, mrp: 799, stock: 45, rating: 4.6, numReviews: 120, images: ["https://picsum.photos/seed/rjkit1/600/600"], description: "Magnetic S2 steel precision bits, non-slip aluminum handle, ideal for iPhone and Android repairs." },
  { _id: "d2", name: "LCD Screen Suction Cup & Spudger Kit", sku: "RJ-KIT-02", category: "Repair Kits", brand: "RJ Tools", price: 299, mrp: 499, stock: 60, rating: 4.3, numReviews: 75, images: ["https://picsum.photos/seed/rjkit2/600/600"], description: "Heavy duty suction cups, nylon spudgers, and metal pry tools for safe mobile opening." },
  { _id: "d3", name: "B-7000 Glue Frame Adhesive (50ml)", sku: "RJ-KIT-03", category: "Repair Kits", brand: "RJ Liquid", price: 199, mrp: 299, stock: 120, rating: 4.7, numReviews: 310, images: ["https://picsum.photos/seed/rjkit3/600/600"], description: "Multi-purpose glue adhesive, precision needle design, highly elastic for phone screen bonding." },

  // 2. Old Phones
  { _id: "d4", name: "Pre-Owned iPhone 12 Pro (128GB)", sku: "RJ-PHN-01", category: "Old Phones", brand: "Apple", price: 34999, mrp: 45000, stock: 6, rating: 4.5, numReviews: 18, images: ["https://picsum.photos/seed/rjphn1/600/600"], description: "Pacific Blue, Grade A refurbished, 88% battery health, completely tested and verified." },
  { _id: "d5", name: "Refurbished OnePlus 9 5G (128GB)", sku: "RJ-PHN-02", category: "Old Phones", brand: "OnePlus", price: 18999, mrp: 25000, stock: 8, rating: 4.2, numReviews: 14, images: ["https://picsum.photos/seed/rjphn2/600/600"], description: "Astral Black, minor screen scratches, fully functional with Hasselblad camera system." },
  { _id: "d6", name: "Vintage Nokia 3310 (Classic Grey)", sku: "RJ-PHN-03", category: "Old Phones", brand: "Nokia", price: 1199, mrp: 1999, stock: 15, rating: 4.8, numReviews: 92, images: ["https://picsum.photos/seed/rjphn3/600/600"], description: "Legendary durability, original battery pack, retro gaming classic with Snake game installed." },

  // 3. Cool Gadgets
  { _id: "d7", name: "Magnetic 10000mAh Power Bank", sku: "RJ-GDG-01", category: "Cool Gadgets", brand: "RJ Power", price: 1499, mrp: 2499, stock: 32, rating: 4.6, numReviews: 215, images: ["https://picsum.photos/seed/rjgdg1/600/600"], description: "15W wireless MagSafe compatible fast charging, sleek pocket-sized design." },
  { _id: "d8", name: "RGB LED Smart Bluetooth Speaker", sku: "RJ-GDG-02", category: "Cool Gadgets", brand: "RJ Audio", price: 999, mrp: 1999, stock: 40, rating: 4.4, numReviews: 134, images: ["https://picsum.photos/seed/rjgdg2/600/600"], description: "360-degree surround sound, dynamic reactive lighting modes, 8h playtime." },
  { _id: "d9", name: "3-in-1 Wireless Charging Stand", sku: "RJ-GDG-03", category: "Cool Gadgets", brand: "RJ Power", price: 1299, mrp: 1999, stock: 22, rating: 4.5, numReviews: 89, images: ["https://picsum.photos/seed/rjgdg3/600/600"], description: "Simultaneous charging station for phone, watch, and earbuds. Tidy desk accessory." },
];

// Demo order history shown when the backend is unreachable / not logged in.
export const DEMO_ORDERS = [
  { _id: "64f0aa11bb22cc33dd44ee01", totalPrice: 34999, paymentMethod: "Razorpay", paymentStatus: "Paid", status: "Shipped", shiprocketTrackingId: "SR123456789", createdAt: "2026-07-05", items: [{ name: "Pre-Owned iPhone 12 Pro (128GB)", quantity: 1, price: 34999 }] },
  { _id: "64f0aa11bb22cc33dd44ee02", totalPrice: 499, paymentMethod: "COD", paymentStatus: "Pending", status: "Confirmed", shiprocketTrackingId: "", createdAt: "2026-07-08", items: [{ name: "Professional 24-in-1 Screwdriver Set", quantity: 1, price: 499 }] },
  { _id: "64f0aa11bb22cc33dd44ee03", totalPrice: 3297, paymentMethod: "Razorpay", paymentStatus: "Paid", status: "Delivered", shiprocketTrackingId: "SR987654321", createdAt: "2026-07-01", items: [{ name: "Magnetic 10000mAh Power Bank", quantity: 2, price: 1499 }, { name: "B-7000 Glue Frame Adhesive (50ml)", quantity: 1, price: 199 }] },
];
