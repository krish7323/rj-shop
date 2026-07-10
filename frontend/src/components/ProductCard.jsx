// src/components/ProductCard.jsx
// Amazon-style catalog card: image, rating, distinct pricing tags (price, MRP,
// discount), stock status, and an instant reactive Add-to-Cart button.

import { useState } from "react";
import { Star, ShoppingCart, Check, ImageOff, Zap } from "lucide-react";
import { useCart } from "../context/CartContext";
import { inr, discountPct } from "../lib/format";

export default function ProductCard({ product, onOpen }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const pct = discountPct(product.price, product.mrp);
  const outOfStock = product.stock !== undefined && product.stock <= 0;
  const lowStock = product.stock !== undefined && product.stock > 0 && product.stock <= 5;
  const img = product.images && product.images.length ? product.images[0] : "";

  const handleAdd = (e) => {
    e.stopPropagation();
    if (outOfStock) return;
    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div
      onClick={() => onOpen?.(product)}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card transition hover:-translate-y-1 hover:shadow-hover"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        {img && !imgFailed ? (
          <img
            src={img}
            alt={product.name}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            <ImageOff className="h-10 w-10" />
          </div>
        )}

        {/* Discount tag */}
        {pct > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-rose-500 px-2.5 py-1 text-xs font-extrabold text-white shadow">
            -{pct}%
          </span>
        )}

        {/* Stock ribbon */}
        {outOfStock ? (
          <span className="absolute right-3 top-3 rounded-full bg-slate-800/90 px-2.5 py-1 text-xs font-bold text-white">
            Out of stock
          </span>
        ) : lowStock ? (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-amber-500/95 px-2.5 py-1 text-xs font-bold text-navy-900">
            <Zap className="h-3 w-3" /> Only {product.stock} left
          </span>
        ) : null}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-600">
          {product.brand || product.category}
        </p>
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-slate-800">
          {product.name}
        </h3>

        {/* Rating */}
        {product.rating > 0 && (
          <div className="mt-1.5 flex items-center gap-1">
            <span className="flex items-center gap-0.5 rounded bg-emerald-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
              {product.rating.toFixed(1)} <Star className="h-3 w-3 fill-white" />
            </span>
            <span className="text-xs text-slate-400">({product.numReviews || 0})</span>
          </div>
        )}

        {/* Pricing */}
        <div className="mt-3 flex items-end gap-2">
          <span className="text-lg font-extrabold text-slate-900">{inr(product.price)}</span>
          {pct > 0 && (
            <span className="mb-0.5 text-sm text-slate-400 line-through">{inr(product.mrp)}</span>
          )}
        </div>

        {/* Add to cart */}
        <button
          onClick={handleAdd}
          disabled={outOfStock}
          className={`btn-accent mt-3 w-full ${
            added ? "!bg-emerald-500 !text-white" : ""
          } ${outOfStock ? "opacity-60" : ""}`}
        >
          {outOfStock ? (
            "Sold out"
          ) : added ? (
            <>
              <Check className="h-4 w-4" /> Added
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" /> Add to Cart
            </>
          )}
        </button>
      </div>
    </div>
  );
}
