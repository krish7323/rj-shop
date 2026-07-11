// src/components/AuthModal.jsx
import { useState } from "react";
import { X, Lock, Mail, User, Loader2 } from "lucide-react";
import { AuthAPI } from "../lib/api";

export default function AuthModal({ onClose, onSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let res;
      if (isRegister) {
        if (!name.trim()) throw new Error("Name is required");
        res = await AuthAPI.register(name, email, password);
      } else {
        res = await AuthAPI.login(email, password);
      }

      if (res.data.token) {
        localStorage.setItem("rj_token", res.data.token);
        onSuccess();
        onClose();
      } else {
        throw new Error("Authentication failed");
      }
    } catch (ex) {
      setError(ex?.response?.data?.message || ex.message || "Failed to authenticate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md animate-fade-up overflow-hidden rounded-3xl bg-white p-6 shadow-hover border border-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-lg font-extrabold text-slate-900">
            {isRegister ? "Create Account" : "Welcome Back"}
          </h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {isRegister && (
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input w-full pl-10"
                required
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input w-full pl-10"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input w-full pl-10"
              required
            />
          </div>

          <button type="submit" className="btn-accent w-full py-3" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : isRegister ? (
              "Sign Up"
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-xs font-semibold text-slate-500">
          {isRegister ? "Already have an account? " : "New to RJ Mobile Store? "}
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-accent-600 hover:text-accent-500 transition"
          >
            {isRegister ? "Sign In" : "Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
