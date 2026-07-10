// src/pages/Inventory.jsx
// Catalog management: a clean data table of all products plus a sleek form that
// adds new products instantly (POST /api/products) and reflects them in the table.

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Package,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Tag,
} from "lucide-react";
import { ProductAPI } from "../lib/api";
import { inr } from "../lib/format";
import { Loading, ErrorNote, Empty } from "../components/ui";

const EMPTY_FORM = {
  name: "",
  sku: "",
  category: "",
  brand: "",
  price: "",
  mrp: "",
  stock: "",
  description: "",
};

// Local demo catalog used only when the backend is unreachable.
const DEMO_PRODUCTS = [
  { _id: "p1", name: "Professional 24-in-1 Screwdriver Set", sku: "RJ-KIT-01", category: "Repair Kits", price: 499, stock: 45, isActive: true },
  { _id: "p2", name: "Pre-Owned iPhone 12 Pro (128GB)", sku: "RJ-PHN-01", category: "Old Phones", price: 34999, stock: 6, isActive: true },
  { _id: "p3", name: "Magnetic 10000mAh Power Bank", sku: "RJ-GDG-01", category: "Cool Gadgets", price: 1499, stock: 32, isActive: true },
];

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [q, setQ] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null); // {type, msg}

  const load = async () => {
    setLoading(true);
    try {
      const res = await ProductAPI.list({ limit: 100, includeInactive: true });
      setProducts(res.data.products || []);
      setLive(true);
    } catch {
      setProducts(DEMO_PRODUCTS);
      setLive(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(term) ||
        p.sku?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term)
    );
  }, [q, products]);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    if (!form.name.trim() || !form.sku.trim() || !form.category.trim() || !form.description.trim())
      return "Name, SKU, Category and Description are required.";
    if (Number(form.price) <= 0) return "Price must be greater than 0.";
    if (form.stock !== "" && (Number(form.stock) < 0 || !Number.isInteger(Number(form.stock))))
      return "Stock must be a non-negative whole number.";
    if (form.mrp !== "" && Number(form.mrp) < Number(form.price))
      return "MRP cannot be lower than price.";
    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);
    const err = validate();
    if (err) return setFeedback({ type: "error", msg: err });

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim().toUpperCase(),
      category: form.category.trim(),
      brand: form.brand.trim() || undefined,
      price: Number(form.price),
      mrp: form.mrp !== "" ? Number(form.mrp) : undefined,
      stock: form.stock !== "" ? Number(form.stock) : 0,
      description: form.description.trim(),
    };

    setSaving(true);
    try {
      const res = await ProductAPI.add(payload);
      // Prepend the newly created product so it shows instantly.
      setProducts((prev) => [res.data.product, ...prev]);
      setForm(EMPTY_FORM);
      setFeedback({ type: "success", msg: `“${payload.name}” is live in the catalog.` });
    } catch (ex) {
      if (!live) {
        // Offline demo mode: simulate an instant insert.
        setProducts((prev) => [
          { _id: `local-${prev.length + 1}`, ...payload, isActive: true },
          ...prev,
        ]);
        setForm(EMPTY_FORM);
        setFeedback({
          type: "success",
          msg: `“${payload.name}” added (demo mode — connect backend to persist).`,
        });
      } else {
        const msg = ex?.response?.data?.message || "Failed to add product.";
        setFeedback({ type: "error", msg });
      }
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    const prev = products;
    setProducts((p) => p.filter((x) => x._id !== id)); // optimistic
    try {
      if (live) await ProductAPI.remove(id);
    } catch {
      setProducts(prev); // revert on failure
      setFeedback({ type: "error", msg: "Could not delete product." });
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      {/* Add product form */}
      <div className="xl:col-span-1">
        <div className="card sticky top-6 p-6">
          <div className="mb-5 flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Add Product</h3>
              <p className="text-xs font-medium text-slate-400">Goes live instantly</p>
            </div>
          </div>

          {feedback && (
            <div
              className={`mb-4 flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium ${
                feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span>{feedback.msg}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-3.5">
            <div>
              <label className="label">Product Name</label>
              <input name="name" value={form.name} onChange={onChange} className="input" placeholder="Wireless Earbuds Pro" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">SKU</label>
                <input name="sku" value={form.sku} onChange={onChange} className="input uppercase" placeholder="RJ-EAR-01" />
              </div>
              <div>
                <label className="label">Category</label>
                <select name="category" value={form.category} onChange={onChange} className="input">
                  <option value="">Select Category</option>
                  <option value="Repair Kits">Repair Kits</option>
                  <option value="Old Phones">Old Phones</option>
                  <option value="Cool Gadgets">Cool Gadgets</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Brand (optional)</label>
              <input name="brand" value={form.brand} onChange={onChange} className="input" placeholder="RJ Originals" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Price ₹</label>
                <input name="price" value={form.price} onChange={onChange} type="number" min="1" className="input" placeholder="2499" />
              </div>
              <div>
                <label className="label">MRP ₹</label>
                <input name="mrp" value={form.mrp} onChange={onChange} type="number" min="1" className="input" placeholder="2999" />
              </div>
              <div>
                <label className="label">Stock</label>
                <input name="stock" value={form.stock} onChange={onChange} type="number" min="0" className="input" placeholder="50" />
              </div>
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={onChange}
                rows={3}
                className="input resize-none"
                placeholder="Premium sound with active noise cancellation…"
              />
            </div>

            <button type="submit" disabled={saving} className="btn-primary w-full">
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Adding…
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" /> Add to Catalog
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Product table */}
      <div className="xl:col-span-2">
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-brand-600" />
              <h3 className="text-base font-bold text-slate-900">
                Products <span className="text-slate-400">({filtered.length})</span>
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search name / SKU…"
                  className="input w-56 pl-9"
                />
              </div>
              <button onClick={load} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50" title="Refresh">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {loading ? (
            <Loading label="Loading catalog…" />
          ) : filtered.length === 0 ? (
            <Empty label="No products match your search." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-5 py-3 font-semibold">Product</th>
                    <th className="px-5 py-3 font-semibold">Category</th>
                    <th className="px-5 py-3 font-semibold">Price</th>
                    <th className="px-5 py-3 font-semibold">Stock</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((p) => (
                    <tr key={p._id} className="transition hover:bg-slate-50/70">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-800">{p.name}</p>
                        <p className="flex items-center gap-1 text-xs font-medium text-slate-400">
                          <Tag className="h-3 w-3" /> {p.sku}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{p.category}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800">{inr(p.price)}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`font-semibold ${
                            p.stock === 0
                              ? "text-rose-600"
                              : p.stock <= 5
                              ? "text-amber-600"
                              : "text-slate-700"
                          }`}
                        >
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {p.stock > 0 && p.isActive ? (
                          <span className="badge bg-emerald-50 text-emerald-600">In stock</span>
                        ) : p.stock === 0 ? (
                          <span className="badge bg-rose-50 text-rose-600">Out of stock</span>
                        ) : (
                          <span className="badge bg-slate-100 text-slate-500">Inactive</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => onDelete(p._id)}
                          className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!live && !loading && (
            <div className="border-t border-slate-100 px-5 py-2.5 text-xs font-medium text-slate-400">
              Demo catalog — connect the backend to manage live products.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
