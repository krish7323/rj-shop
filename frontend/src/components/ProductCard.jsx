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
      className="card-3d group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card"
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

        {/* Actions Row */}
        <div className="mt-3 flex gap-2">
          {/* Add to cart */}
          <button
            onClick={handleAdd}
            disabled={outOfStock}
            className={`btn-accent flex-1 text-xs py-2 px-3 ${
              added ? "!bg-emerald-500 !text-white animate-bounce" : ""
            } ${outOfStock ? "opacity-60" : ""}`}
          >
            {outOfStock ? (
              "Sold out"
            ) : added ? (
              <>
                <Check className="h-3.5 w-3.5" /> Added
              </>
            ) : (
              <>
                <ShoppingCart className="h-3.5 w-3.5" /> Add
              </>
            )}
          </button>

          {/* Inquiry button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const message = `Hi RJ Mobile Store! I want to inquire about "${product.name}" (Price: ${inr(product.price)}). Can you please share more details or availability?`;
              const encoded = encodeURIComponent(message);
              const phone = import.meta.env.VITE_WHATSAPP_NUMBER || "919097377388";
              window.open(`https://wa.me/${phone}?text=${encoded}`, "_blank");
            }}
            className="flex items-center justify-center gap-1 rounded-full border border-emerald-600 bg-emerald-50/50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition active:scale-[.97]"
            title="Inquire on WhatsApp"
          >
            <svg className="h-3.5 w-3.5 fill-emerald-600" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.458L0 24zm6.75-4.22c1.62.962 3.41 1.47 5.247 1.472 5.47 0 9.919-4.448 9.922-9.922.002-2.652-1.03-5.144-2.905-7.022a9.785 9.785 0 0 0-7.036-2.906c-5.467 0-9.913 4.45-9.916 9.923-.001 1.93.504 3.816 1.464 5.485l-.961 3.513 3.606-.945zm11.367-7.793c-.3-.15-1.77-.875-2.046-.975-.276-.1-.477-.15-.677.15-.2.3-.775.975-.95 1.175-.175.2-.35.225-.65.075-.3-.15-1.265-.467-2.41-1.485-.89-.794-1.49-1.775-1.665-2.075-.175-.3-.018-.462.13-.61.137-.133.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.677-1.628-.926-2.228-.242-.584-.488-.506-.676-.516-.175-.008-.375-.01-.576-.01-.2 0-.527.075-.802.375-.276.3-1.052 1.025-1.052 2.5s1.077 2.9 1.227 3.1c.15.2 2.118 3.235 5.132 4.537.717.31 1.277.495 1.713.634.72.228 1.375.196 1.892.119.577-.087 1.77-.725 2.02-1.425.25-.7.25-1.3.175-1.425-.075-.125-.275-.2-.575-.35z"/>
            </svg>
            <span className="hidden sm:inline">Inquire</span>
          </button>
        </div>
      </div>
    </div>
  );
}
