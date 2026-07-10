// src/components/CartDrawer.jsx
// Slide-over cart: line items with live quantity steppers, remove, running totals,
// and a button to open the multi-step Checkout.

import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Truck } from "lucide-react";
import { useCart } from "../context/CartContext";
import { inr } from "../lib/format";

export default function CartDrawer({ open, onClose, onCheckout }) {
  const {
    items,
    subtotal,
    shipping,
    grandTotal,
    savings,
    freeShipThreshold,
    incrementItem,
    decrementItem,
    removeItem,
  } = useCart();

  const remainingForFree = Math.max(0, freeShipThreshold - subtotal);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-navy-900/50 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-hover transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
            <ShoppingBag className="h-5 w-5 text-accent-600" /> Your Cart
            <span className="chip bg-slate-100 text-slate-500">{items.length}</span>
          </h2>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Free-shipping nudge */}
        {items.length > 0 && (
          <div className="border-b border-slate-100 bg-accent-50 px-5 py-2.5 text-xs font-semibold text-accent-700">
            {remainingForFree > 0 ? (
              <span className="flex items-center gap-1.5">
                <Truck className="h-4 w-4" /> Add {inr(remainingForFree)} more for FREE shipping!
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Truck className="h-4 w-4" /> You've unlocked FREE shipping 🎉
              </span>
            )}
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
              <ShoppingBag className="h-12 w-12" />
              <p className="font-semibold">Your cart is empty</p>
              <p className="text-sm">Add some products to get started.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((i) => (
                <li key={i._id} className="flex gap-3 rounded-2xl border border-slate-100 p-3">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-50">
                    {i.image ? (
                      <img src={i.image} alt={i.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-slate-300">
                        <ShoppingBag className="h-6 w-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col">
                    <p className="line-clamp-2 text-sm font-semibold text-slate-800">{i.name}</p>
                    <p className="text-xs text-slate-400">{inr(i.price)} each</p>

                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-1 rounded-full border border-slate-200">
                        <button
                          onClick={() => decrementItem(i._id, i.qty)}
                          className="grid h-8 w-8 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-6 text-center text-sm font-bold text-slate-800">{i.qty}</span>
                        <button
                          onClick={() => incrementItem(i._id, i.qty)}
                          disabled={i.stock !== undefined && i.qty >= i.stock}
                          className="grid h-8 w-8 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 disabled:opacity-40"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-extrabold text-slate-900">{inr(i.price * i.qty)}</span>
                        <button
                          onClick={() => removeItem(i._id)}
                          className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-slate-100 px-5 py-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-800">{inr(subtotal)}</span>
              </div>
              {savings > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>You save</span>
                  <span className="font-semibold">- {inr(savings)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>Shipping</span>
                <span className="font-semibold text-slate-800">
                  {shipping === 0 ? "FREE" : inr(shipping)}
                </span>
              </div>
              <div className="flex justify-between border-t border-dashed border-slate-200 pt-2 text-base">
                <span className="font-extrabold text-slate-900">Total</span>
                <span className="font-extrabold text-slate-900">{inr(grandTotal)}</span>
              </div>
            </div>

            <button onClick={onCheckout} className="btn-accent mt-4 w-full">
              Proceed to Checkout <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => {
                const message = `Hi RJ Mobile Store! I want to buy:\n${items
                  .map((i) => `- ${i.qty}x ${i.name} (${inr(i.price * i.qty)})`)
                  .join("\n")}\n\nTotal: ${inr(grandTotal)}`;
                const encoded = encodeURIComponent(message);
                const phone = import.meta.env.VITE_WHATSAPP_NUMBER || "919999999999";
                window.open(`https://wa.me/${phone}?text=${encoded}`, "_blank");
              }}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-emerald-600 bg-emerald-50 px-5 py-2.5 text-sm font-bold text-emerald-700 shadow-soft transition hover:bg-emerald-100 active:scale-[.97]"
            >
              <svg className="h-4 w-4 fill-emerald-600" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.458L0 24zm6.75-4.22c1.62.962 3.41 1.47 5.247 1.472 5.47 0 9.919-4.448 9.922-9.922.002-2.652-1.03-5.144-2.905-7.022a9.785 9.785 0 0 0-7.036-2.906c-5.467 0-9.913 4.45-9.916 9.923-.001 1.93.504 3.816 1.464 5.485l-.961 3.513 3.606-.945zm11.367-7.793c-.3-.15-1.77-.875-2.046-.975-.276-.1-.477-.15-.677.15-.2.3-.775.975-.95 1.175-.175.2-.35.225-.65.075-.3-.15-1.265-.467-2.41-1.485-.89-.794-1.49-1.775-1.665-2.075-.175-.3-.018-.462.13-.61.137-.133.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.677-1.628-.926-2.228-.242-.584-.488-.506-.676-.516-.175-.008-.375-.01-.576-.01-.2 0-.527.075-.802.375-.276.3-1.052 1.025-1.052 2.5s1.077 2.9 1.227 3.1c.15.2 2.118 3.235 5.132 4.537.717.31 1.277.495 1.713.634.72.228 1.375.196 1.892.119.577-.087 1.77-.725 2.02-1.425.25-.7.25-1.3.175-1.425-.075-.125-.275-.2-.575-.35z"/>
              </svg>
              Order via WhatsApp
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
