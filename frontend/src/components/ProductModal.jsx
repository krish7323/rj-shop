// src/components/ProductModal.jsx
// Product detail overlay: large image, full pricing, stock, rating, description,
// a quantity selector and an Add-to-Cart action.

import { useState } from "react";
import { X, Star, ShoppingCart, Check, Plus, Minus, ImageOff, ShieldCheck, Truck } from "lucide-react";
import { useCart } from "../context/CartContext";
import { inr, discountPct } from "../lib/format";

export default function ProductModal({ product, onClose }) {
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  if (!product) return null;

  const pct = discountPct(product.price, product.mrp);
  const outOfStock = product.stock !== undefined && product.stock <= 0;
  const cap = product.stock !== undefined ? product.stock : 99;
  const img = product.images && product.images.length ? product.images[0] : "";

  const handleAdd = () => {
    if (outOfStock) return;
    addToCart(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-navy-900/60 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        className="my-auto w-full max-w-4xl animate-fade-up overflow-hidden rounded-3xl bg-white shadow-hover"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-end p-3">
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-6 px-6 pb-8 md:grid-cols-2 md:px-8">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-50">
            {img && !imgFailed ? (
              <img src={img} alt={product.name} onError={() => setImgFailed(true)} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-slate-300">
                <ImageOff className="h-12 w-12" />
              </div>
            )}
            {pct > 0 && (
              <span className="absolute left-4 top-4 rounded-full bg-rose-500 px-3 py-1 text-sm font-extrabold text-white shadow">
                -{pct}% OFF
              </span>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <p className="text-xs font-bold uppercase tracking-wide text-accent-600">
              {product.brand || product.category}
            </p>
            <h2 className="mt-1 text-2xl font-extrabold leading-tight text-slate-900">{product.name}</h2>

            {product.rating > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <span className="flex items-center gap-0.5 rounded bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">
                  {product.rating.toFixed(1)} <Star className="h-3 w-3 fill-white" />
                </span>
                <span className="text-sm text-slate-400">{product.numReviews || 0} ratings</span>
              </div>
            )}

            <div className="mt-4 flex items-end gap-3">
              <span className="text-3xl font-extrabold text-slate-900">{inr(product.price)}</span>
              {pct > 0 && <span className="mb-1 text-lg text-slate-400 line-through">{inr(product.mrp)}</span>}
              {pct > 0 && <span className="mb-1 text-sm font-bold text-emerald-600">Save {pct}%</span>}
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-600">{product.description}</p>

            {/* Stock */}
            <p className={`mt-3 text-sm font-semibold ${outOfStock ? "text-rose-600" : "text-emerald-600"}`}>
              {outOfStock ? "Currently out of stock" : "In stock — ready to ship"}
            </p>

            {/* Qty + add */}
            {!outOfStock && (
              <div className="mt-5 flex items-center gap-4">
                <div className="flex items-center gap-1 rounded-full border border-slate-200">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-10 w-10 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center font-bold text-slate-900">{qty}</span>
                  <button onClick={() => setQty((q) => Math.min(cap, q + 1))} disabled={qty >= cap} className="grid h-10 w-10 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 disabled:opacity-40">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <button onClick={handleAdd} className={`btn-accent flex-1 ${added ? "!bg-emerald-500 !text-white" : ""}`}>
                  {added ? (
                    <>
                      <Check className="h-4 w-4" /> Added to Cart
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" /> Add to Cart
                    </>
                  )}
                </button>
              </div>
            )}

            {/* WhatsApp Inquiry Button */}
            <button
              onClick={() => {
                const message = `Hi RJ Mobile Store! I am interested in inquiring about the product "${product.name}" (Price: ${inr(product.price)}). Can you please share more details or availability?`;
                const encoded = encodeURIComponent(message);
                const phone = import.meta.env.VITE_WHATSAPP_NUMBER || "919097377388";
                window.open(`https://wa.me/${phone}?text=${encoded}`, "_blank");
              }}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-emerald-600 bg-emerald-50 px-5 py-2.5 text-sm font-bold text-emerald-700 shadow-soft transition hover:bg-emerald-100 active:scale-[.97]"
            >
              <svg className="h-4 w-4 fill-emerald-600" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.458L0 24zm6.75-4.22c1.62.962 3.41 1.47 5.247 1.472 5.47 0 9.919-4.448 9.922-9.922.002-2.652-1.03-5.144-2.905-7.022a9.785 9.785 0 0 0-7.036-2.906c-5.467 0-9.913 4.45-9.916 9.923-.001 1.93.504 3.816 1.464 5.485l-.961 3.513 3.606-.945zm11.367-7.793c-.3-.15-1.77-.875-2.046-.975-.276-.1-.477-.15-.677.15-.2.3-.775.975-.95 1.175-.175.2-.35.225-.65.075-.3-.15-1.265-.467-2.41-1.485-.89-.794-1.49-1.775-1.665-2.075-.175-.3-.018-.462.13-.61.137-.133.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.677-1.628-.926-2.228-.242-.584-.488-.506-.676-.516-.175-.008-.375-.01-.576-.01-.2 0-.527.075-.802.375-.276.3-1.052 1.025-1.052 2.5s1.077 2.9 1.227 3.1c.15.2 2.118 3.235 5.132 4.537.717.31 1.277.495 1.713.634.72.228 1.375.196 1.892.119.577-.087 1.77-.725 2.02-1.425.25-.7.25-1.3.175-1.425-.075-.125-.275-.2-.575-.35z"/>
              </svg>
              Inquire via WhatsApp
            </button>

            {/* Trust badges */}
            <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                <ShieldCheck className="h-4 w-4 text-accent-600" /> Secure Razorpay & COD
              </span>
              <span className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                <Truck className="h-4 w-4 text-accent-600" /> Shiprocket delivery
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
