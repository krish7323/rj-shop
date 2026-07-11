// src/components/OrdersModal.jsx
import { useEffect, useState } from "react";
import { X, ShoppingBag, Loader2, Calendar, MapPin, Truck } from "lucide-react";
import { OrderAPI } from "../lib/api";
import { inr } from "../lib/format";

export default function OrdersModal({ onClose }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await OrderAPI.mine();
        setOrders(res.data.orders || []);
      } catch (ex) {
        setError("Failed to load your orders. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "DELIVERED":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "SHIPPED":
        return "bg-sky-50 text-sky-700 border-sky-100";
      case "CANCELLED":
        return "bg-rose-50 text-rose-700 border-rose-100";
      default:
        return "bg-amber-50 text-amber-700 border-amber-100";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy-900/60 p-4 backdrop-blur-sm sm:p-6">
      <div className="my-auto w-full max-w-2xl animate-fade-up overflow-hidden rounded-3xl bg-white shadow-hover border border-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
            <ShoppingBag className="h-5 w-5 text-accent-600" /> My Order History
          </h2>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!loading && !error && orders.length > 0 && (
          <div className="grid grid-cols-2 gap-4 bg-slate-50 border-b border-slate-200 px-6 py-3.5">
            <div className="text-center border-r border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Total Orders</span>
              <p className="text-xl font-extrabold text-slate-800">{orders.length}</p>
            </div>
            <div className="text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Pending Delivery</span>
              <p className="text-xl font-extrabold text-accent-600">
                {orders.filter((o) => o.status?.toUpperCase() !== "DELIVERED" && o.status?.toUpperCase() !== "CANCELLED").length}
              </p>
            </div>
          </div>
        )}

        <div className="max-h-[70vh] overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-accent-600" />
              <p className="mt-2 text-sm font-semibold">Loading orders...</p>
            </div>
          ) : error ? (
            <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 text-center">
              {error}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-slate-100">
                <ShoppingBag className="h-8 w-8 text-slate-450" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-800">No orders placed yet</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-xs">
                Items you order will appear here so you can track shipment status.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => (
                <div key={ord._id} className="rounded-2xl border border-slate-200 p-5 space-y-4 hover:border-slate-300 transition">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-xs font-bold text-slate-450">ORDER ID</span>
                      <p className="text-sm font-extrabold text-slate-800">
                        #{ord._id.slice(-8).toUpperCase()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`chip border text-[11px] font-extrabold uppercase px-2.5 py-0.5 ${getStatusColor(ord.status)}`}>
                        {ord.status}
                      </span>
                      <span className="text-base font-extrabold text-slate-900">
                        {inr(ord.totalPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Products */}
                  <div className="space-y-3">
                    {ord.orderItems?.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-4 text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{item.product?.name || "Product Item"}</p>
                          <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
                        </div>
                        <span className="font-bold text-slate-700">{inr(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-500">
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
                      <div>
                        <span className="block text-[10px] text-slate-400 uppercase">Placed On</span>
                        <span>{new Date(ord.createdAt).toLocaleDateString([], { dateStyle: "medium" })}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                      <div>
                        <span className="block text-[10px] text-slate-400 uppercase">Shipping To</span>
                        <span className="truncate max-w-[200px] block">
                          {ord.shippingAddress?.fullName} - {ord.shippingAddress?.street}, {ord.shippingAddress?.city}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
