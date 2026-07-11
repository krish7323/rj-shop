import { useState } from "react";
import { AuthAPI } from "../lib/api";
import { Lock, Mail, Eye, EyeOff, AlertCircle } from "lucide-react";
import logo from "../assets/logo.png";

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await AuthAPI.login(email, password);
      if (res.data.success && res.data.token) {
        localStorage.setItem("rj_admin_token", res.data.token);
        onLoginSuccess();
      } else {
        setError(res.data.message || "Invalid email or password");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Connection failed. Please verify credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12 sm:px-6 lg:px-8 bg-cover bg-center" style={{ backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.95))" }}>
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-800 bg-slate-950/80 p-8 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col items-center">
          <img
            src={logo}
            alt="RJ Mobile Store Logo"
            className="h-16 w-16 rounded-2xl border border-brand-500 object-cover shadow-lg"
          />
          <h2 className="mt-4 text-center text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Admin Console
          </h2>
          <p className="mt-1.5 text-center text-sm font-medium text-slate-400">
            Sign in to manage your local shop
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/25 bg-rose-500/10 p-3.5 text-xs font-semibold text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="email">
              Email Address
            </label>
            <div className="relative mt-1.5">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@rjshop.com"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/50 px-9 py-2.5 text-sm text-white placeholder-slate-500 shadow-inner focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="password">
              Password
            </label>
            <div className="relative mt-1.5">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/50 px-9 py-2.5 text-sm text-white placeholder-slate-500 shadow-inner focus:border-brand-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-xl bg-brand-600 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-brand-500 focus:outline-none active:scale-[.98] disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
