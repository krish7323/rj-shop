import { useState } from "react";
import { X, Lock, Mail, User, Loader2, ShieldAlert } from "lucide-react";
import { AuthAPI } from "../lib/api";

export default function AuthModal({ onClose, onSuccess }) {
  const [mode, setMode] = useState("login"); // "login", "register", "verify"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [currentDevice, setCurrentDevice] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      if (mode === "register") {
        if (!name.trim()) throw new Error("Name is required");
        if (!phone.trim()) throw new Error("Phone number is required");
        if (!/^[0-9]{10}$/.test(phone.trim())) throw new Error("Phone number must be a 10-digit number");
        if (password !== confirmPassword) throw new Error("Passwords do not match");
        if (!agreeTerms) throw new Error("You must agree to the Terms of Service and Privacy Policy.");
        const res = await AuthAPI.register(name.trim(), email.trim(), password, phone.trim(), currentDevice.trim());
        setInfoMessage(res.data.message || "OTP code sent to your email!");
        setMode("verify");
      } else if (mode === "login") {
        try {
          const res = await AuthAPI.login(email, password);
          if (res.data.token) {
            localStorage.setItem("rj_token", res.data.token);
            onSuccess();
            onClose();
          }
        } catch (ex) {
          // If login fails because customer email is not verified (status 403)
          if (ex?.response?.status === 403 && ex?.response?.data?.email) {
            setEmail(ex.response.data.email);
            setInfoMessage(ex.response.data.message || "Please verify your email address to log in.");
            setMode("verify");
          } else {
            throw ex;
          }
        }
      } else if (mode === "verify") {
        const res = await AuthAPI.verifyOTP(email, otp);
        if (res.data.token) {
          localStorage.setItem("rj_token", res.data.token);
          onSuccess();
          onClose();
        } else {
          throw new Error("Verification failed");
        }
      }
    } catch (ex) {
      setError(ex?.response?.data?.message || ex.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResending(true);
    setError(null);
    setInfoMessage(null);
    try {
      const res = await AuthAPI.resendOTP(email);
      setInfoMessage(res.data.message || "New OTP code sent to your email!");
    } catch (ex) {
      setError(ex?.response?.data?.message || "Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md animate-pop overflow-hidden rounded-3xl bg-white p-6 shadow-hover border border-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-lg font-extrabold text-slate-900">
            {mode === "login" && "Welcome Back"}
            {mode === "register" && "Create Account"}
            {mode === "verify" && "Verify Your Email"}
          </h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600 flex items-start gap-2">
            <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="mt-4 rounded-xl bg-sky-50 px-4 py-3 text-xs font-semibold text-sky-700">
            {infoMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {mode === "register" && (
            <>
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

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pr-2 border-r border-slate-200">+91</span>
                <input
                  type="tel"
                  placeholder="WhatsApp Mobile Number"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="input w-full pl-14"
                  required
                />
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">📱</span>
                <input
                  type="text"
                  placeholder="Current Phone (e.g., iPhone 12, OnePlus 9)"
                  value={currentDevice}
                  onChange={(e) => setCurrentDevice(e.target.value)}
                  className="input w-full pl-10"
                />
              </div>
            </>
          )}

          {mode !== "verify" && (
            <>
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

              {mode === "register" && (
                <>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input w-full pl-10"
                      required
                    />
                  </div>

                  <div className="flex items-start gap-2.5 px-1 py-1">
                    <input
                      id="agree-terms"
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-accent-600 focus:ring-accent-500 mt-0.5 cursor-pointer"
                      required
                    />
                    <label htmlFor="agree-terms" className="text-xs font-semibold text-slate-600 cursor-pointer select-none">
                      I agree to the <span className="text-accent-600 underline">Terms of Service</span> and <span className="text-accent-600 underline">Privacy Policy</span>.
                    </label>
                  </div>
                </>
              )}
            </>
          )}

          {mode === "verify" && (
            <div className="space-y-4">
              <p className="text-xs font-medium text-slate-500">
                Enter the 6-digit OTP code sent to <strong className="text-slate-700">{email}</strong>.
              </p>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="6-Digit OTP Code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="input w-full pl-10 tracking-[4px] text-center font-bold text-lg"
                  required
                />
              </div>
            </div>
          )}

          <button type="submit" className="btn-accent w-full py-3" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {mode === "login" && "Sign In"}
                {mode === "register" && "Register & Send OTP"}
                {mode === "verify" && "Verify & Log In"}
              </>
            )}
          </button>
        </form>

        {mode === "verify" && (
          <div className="mt-4 text-center">
            <button
              onClick={handleResendOTP}
              className="text-xs font-bold text-accent-600 hover:text-accent-500 transition disabled:opacity-50"
              disabled={resending}
            >
              {resending ? "Resending..." : "Resend Verification Code"}
            </button>
          </div>
        )}

        <div className="mt-5 text-center text-xs font-semibold text-slate-500">
          {mode === "verify" ? (
            <button
              onClick={() => {
                setMode("login");
                setError(null);
                setInfoMessage(null);
              }}
              className="text-slate-500 hover:text-slate-700 transition"
            >
              Back to Sign In
            </button>
          ) : (
            <>
              {mode === "register" ? "Already have an account? " : "New to RJ Mobile Store? "}
              <button
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setError(null);
                  setInfoMessage(null);
                }}
                className="text-accent-600 hover:text-accent-500 transition"
              >
                {mode === "login" ? "Sign Up" : "Sign In"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
