import { useState, useEffect } from "react";
import { FolderOpen, Plus, Trash2, ShieldAlert } from "lucide-react";
import { CategoryAPI } from "../lib/api";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({ name: "", icon: "📁" });

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await CategoryAPI.list();
      setCategories(res.data.categories || []);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Category name is required.");
      return;
    }

    try {
      setError("");
      setSuccess("");
      await CategoryAPI.create({
        name: form.name.trim(),
        icon: form.icon.trim() || "📁",
      });
      setForm({ name: "", icon: "📁" });
      setSuccess("Category created successfully!");
      loadCategories();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create category.");
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete category "${name}"?`)) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      await CategoryAPI.remove(id);
      setSuccess(`Category "${name}" deleted successfully!`);
      loadCategories();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete category.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert states */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-100 bg-rose-50/50 p-4 text-sm font-semibold text-rose-600">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-sm font-semibold text-emerald-600">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Create Form */}
        <div className="card p-6 h-fit space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <FolderOpen className="h-5 w-5 text-brand-500" />
            <h2 className="text-base font-bold text-slate-800">Add New Category</h2>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="label">Category Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Smart Watches"
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">Icon Emoji</label>
              <input
                type="text"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="e.g. ⌚"
                maxLength={4}
                className="input text-center text-lg w-20"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Enter a single emoji that represents this category.
              </p>
            </div>

            <button type="submit" className="btn-brand w-full flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" /> Create Category
            </button>
          </form>
        </div>

        {/* Right Column: Categories List */}
        <div className="card p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-800">Active Categories ({categories.length})</h2>
            <button onClick={loadCategories} className="text-xs font-semibold text-brand-600 hover:underline">
              Refresh List
            </button>
          </div>

          {loading ? (
            <div className="flex h-32 items-center justify-center text-slate-400">
              Loading categories...
            </div>
          ) : categories.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-slate-400">
              No categories found. Add one on the left!
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-100">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="px-5 py-3 w-16 text-center">Icon</th>
                    <th className="px-5 py-3">Category Name</th>
                    <th className="px-5 py-3 w-28 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.map((cat) => (
                    <tr key={cat._id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-4 text-center text-2xl">{cat.icon}</td>
                      <td className="px-5 py-4 font-bold text-slate-800">{cat.name}</td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => handleDelete(cat._id, cat.name)}
                          className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition"
                          title="Delete Category"
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
        </div>
      </div>
    </div>
  );
}
