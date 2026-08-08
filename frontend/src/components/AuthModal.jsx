import React, { useState, useEffect } from "react";
import { X, Lock, Mail, User, Phone, Smartphone, Eye, EyeOff, Loader2, CheckCircle2, ShieldAlert, ArrowRight } from "lucide-react";
import { AuthAPI } from "../lib/api";
import RJMascot from "./RJMascot";
import logo from "../assets/logo.png";

export default function AuthModal({ onClose, onSuccess }) {
  const [mode, setMode] = useState("login"); // "login", "register", "verify"
  
  // Input fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [currentDevice, setCurrentDevice] = useState("");
  const [otp, setOtp] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [successState, setSuccessState] = useState(false);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  const [focusedInput, setFocusedInput] = useState(null);

  // Email validation check
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Determine Mascot State dynamically based on user interaction
  const getMascotState = () => {
    if (successState) return "login_success";
    if (error) return "login_error";
    if (loading) return "login_loading";
    if (focusedInput === "password") {
      return showPassword ? "password_visible" : "password_focus";
    }
    if (focusedInput === "email") {
      return email.length > 0 ? "typing_email" : "email_focus";
    }
    return "idle";
  };

  const mascotState = getMascotState();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfoMessage(null);
    setSuccessState(false);

    try {
      if (mode === "register") {
        if (!name.trim()) throw new Error("Please enter your full name");
        if (!phone.trim()) throw new Error("Please enter your 10-digit phone number");
        if (!/^[0-9]{10}$/.test(phone.trim())) throw new Error("Phone number must be a 10-digit number");
        
        const res = await AuthAPI.register(name.trim(), email.trim(), password, phone.trim(), currentDevice.trim());
        setSuccessState(true);
        setTimeout(() => {
          setSuccessState(false);
          setInfoMessage(res.data.message || "OTP code sent to your email!");
          setMode("verify");
        }, 1000);
      } else if (mode === "login") {
        try {
          const res = await AuthAPI.login(email, password);
          if (res.data.token) {
            localStorage.setItem("rj_token", res.data.token);
            setSuccessState(true);
            setTimeout(() => {
              if (onSuccess) onSuccess();
              if (onClose) onClose();
            }, 1200);
          }
        } catch (ex) {
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
          setSuccessState(true);
          setTimeout(() => {
            if (onSuccess) onSuccess();
            if (onClose) onClose();
          }, 1200);
        } else {
          throw new Error("Verification failed");
        }
      }
    } catch (ex) {
      setError(ex?.response?.data?.message || ex.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0D12]/95 p-4 sm:p-6 backdrop-blur-xl overflow-y-auto min-h-screen">
      <div className="relative w-full max-w-md my-auto animate-fadeIn select-none">
        
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute -top-3 -right-2 sm:-right-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-[#1A1A20] text-[#9A9AA3] border border-[#28282F] hover:border-[#FFB300] hover:text-[#F5F5F5] transition"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Top Header & Brand Branding */}
        <div className="flex flex-col items-center text-center mb-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#15151B] border border-[#28282F] shadow-sm mb-2">
            <img src={logo} alt="RJ Mobile Store Logo" className="h-6 w-6 object-contain" />
            <span className="text-xs font-black tracking-widest text-[#FFB300]">RJ MOBILE STORE</span>
          </div>

          {/* Interactive Mascot */}
          <RJMascot state={mascotState} emailLength={email.length} />

          <h1 className="text-2xl sm:text-3xl font-black text-[#F5F5F5] tracking-tight mt-1">
            {mode === "login" && "Welcome Back!"}
            {mode === "register" && "Create Account"}
            {mode === "verify" && "Verify Email"}
          </h1>
          <p className="text-xs sm:text-sm font-medium text-[#9A9AA3] mt-1">
            {mode === "login" && "Sign in to continue shopping"}
            {mode === "register" && "Join RJ Mobile Store for exclusive tech deals"}
            {mode === "verify" && `Enter 6-digit OTP code sent to ${email}`}
          </p>
        </div>

        {/* Login Card */}
        <div className="relative overflow-hidden rounded-3xl bg-[#1A1A20]/90 p-6 sm:p-8 backdrop-blur-2xl border border-[#FFB300]/30 shadow-[0_12px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(255,179,0,0.08)]">
          
          {/* Subtle Golden Glow Corner Accents */}
          <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

          {error && (
            <div className="mb-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-xs font-semibold text-[#FF3B30] flex items-start gap-2.5 animate-shake">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="mb-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-xs font-semibold text-[#FFB300] flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#9A9AA3] mb-1.5">
                    Full Name
                  </label>
                  <div className="relative flex items-center rounded-2xl bg-[#15151B] border border-[#28282F] focus-within:border-[#FFB300] focus-within:shadow-[0_0_15px_rgba(255,179,0,0.2)] transition">
                    <div className="pl-3.5 pr-2.5 text-[#9A9AA3]">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={name}
                      onFocus={() => setFocusedInput("name")}
                      onBlur={() => setFocusedInput(null)}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-transparent py-3 pr-4 text-sm font-semibold text-[#F5F5F5] placeholder-[#666675] focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#9A9AA3] mb-1.5">
                    WhatsApp Number
                  </label>
                  <div className="relative flex items-center rounded-2xl bg-[#15151B] border border-[#28282F] focus-within:border-[#FFB300] focus-within:shadow-[0_0_15px_rgba(255,179,0,0.2)] transition">
                    <div className="pl-3.5 pr-2.5 text-[#FFB300] text-xs font-black border-r border-[#28282F]">
                      +91
                    </div>
                    <input
                      type="tel"
                      placeholder="10-digit WhatsApp number"
                      maxLength={10}
                      value={phone}
                      onFocus={() => setFocusedInput("phone")}
                      onBlur={() => setFocusedInput(null)}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      className="w-full bg-transparent py-3 px-3 text-sm font-semibold text-[#F5F5F5] placeholder-[#666675] focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#9A9AA3] mb-1.5">
                    Current Phone Model (Optional)
                  </label>
                  <div className="relative flex items-center rounded-2xl bg-[#15151B] border border-[#28282F] focus-within:border-[#FFB300] focus-within:shadow-[0_0_15px_rgba(255,179,0,0.2)] transition">
                    <div className="pl-3.5 pr-2.5 text-[#9A9AA3]">
                      <Smartphone className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. iPhone 12, OnePlus 9"
                      value={currentDevice}
                      onFocus={() => setFocusedInput("device")}
                      onBlur={() => setFocusedInput(null)}
                      onChange={(e) => setCurrentDevice(e.target.value)}
                      className="w-full bg-transparent py-3 pr-4 text-sm font-semibold text-[#F5F5F5] placeholder-[#666675] focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            {mode !== "verify" && (
              <>
                {/* Email Input Field */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#9A9AA3] mb-1.5">
                    Email Address
                  </label>
                  <div
                    className={`relative flex items-center rounded-2xl bg-[#15151B] border transition-all duration-300 ${
                      focusedInput === "email"
                        ? "border-[#FFB300] shadow-[0_0_15px_rgba(255,179,0,0.25)]"
                        : "border-[#28282F]"
                    }`}
                  >
                    <div className="grid h-10 w-10 place-items-center ml-1 text-[#9A9AA3]">
                      <Mail className={`h-4 w-4 transition-colors ${focusedInput === "email" ? "text-[#FFB300]" : ""}`} />
                    </div>
                    <input
                      type="email"
                      placeholder="customer@rjshop.com"
                      value={email}
                      onFocus={() => setFocusedInput("email")}
                      onBlur={() => setFocusedInput(null)}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                      }}
                      className="w-full bg-transparent py-3 pr-3 text-sm font-semibold text-[#F5F5F5] placeholder-[#666675] focus:outline-none"
                      required
                    />
                    {isValidEmail && (
                      <div className="pr-3 text-[#22C55E]">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Password Input Field */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#9A9AA3] mb-1.5">
                    Password
                  </label>
                  <div
                    className={`relative flex items-center rounded-2xl bg-[#15151B] border transition-all duration-300 ${
                      error
                        ? "border-[#FF3B30] shadow-[0_0_15px_rgba(255,59,48,0.2)]"
                        : focusedInput === "password"
                        ? "border-[#FFB300] shadow-[0_0_15px_rgba(255,179,0,0.25)]"
                        : "border-[#28282F]"
                    }`}
                  >
                    <div className="grid h-10 w-10 place-items-center ml-1 text-[#9A9AA3]">
                      <Lock className={`h-4 w-4 transition-colors ${focusedInput === "password" ? "text-[#FFB300]" : ""}`} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      value={password}
                      onFocus={() => setFocusedInput("password")}
                      onBlur={() => setFocusedInput(null)}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null);
                      }}
                      className="w-full bg-transparent py-3 pr-3 text-sm font-semibold text-[#F5F5F5] placeholder-[#666675] focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                      className="grid h-10 w-10 place-items-center pr-2 text-[#9A9AA3] hover:text-[#FFB300] transition"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password Row */}
                {mode === "login" && (
                  <div className="flex items-center justify-between text-xs font-semibold pt-1">
                    <label className="flex items-center gap-2 text-[#9A9AA3] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded-md border-[#28282F] bg-[#15151B] text-[#FFB300] focus:ring-[#FFB300] cursor-pointer"
                      />
                      <span>Remember Me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => alert("Password reset link sent to your registered email address.")}
                      className="text-[#FFB300] hover:underline transition hover:brightness-110"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}
              </>
            )}

            {mode === "verify" && (
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#9A9AA3]">
                  6-Digit OTP Verification Code
                </label>
                <div className="relative flex items-center rounded-2xl bg-[#15151B] border border-[#28282F] focus-within:border-[#FFB300] focus-within:shadow-[0_0_15px_rgba(255,179,0,0.2)] transition">
                  <input
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full bg-transparent py-3.5 px-4 text-center font-mono font-bold text-xl tracking-[8px] text-[#FFB300] placeholder-[#444450] focus:outline-none"
                    required
                  />
                </div>
              </div>
            )}

            {/* Primary Gradient CTA Button */}
            <button
              type="submit"
              disabled={loading || successState}
              className={`group relative w-full h-12 rounded-full font-black text-sm tracking-wide text-[#0B0B0F] shadow-lg transition-all duration-300 overflow-hidden flex items-center justify-center gap-2 mt-4 ${
                successState
                  ? "bg-[#22C55E] text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                  : "bg-gradient-to-r from-[#FFB300] to-[#FF8F00] hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 active:scale-98 shadow-[0_0_25px_rgba(255,179,0,0.3)]"
              }`}
            >
              {/* Subtle Moving Highlight Effect across button */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />

              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-[#0B0B0F]" />
                  <span>AUTHENTICATING...</span>
                </>
              ) : successState ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-white" />
                  <span>SUCCESSFUL!</span>
                </>
              ) : (
                <>
                  <span>
                    {mode === "login" && "SIGN IN"}
                    {mode === "register" && "CREATE ACCOUNT"}
                    {mode === "verify" && "VERIFY & LOG IN"}
                  </span>
                  <div className="grid h-6 w-6 place-items-center rounded-full bg-[#0B0B0F]/15">
                    <ArrowRight className="h-3.5 w-3.5 text-[#0B0B0F] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-6">
            <div className="w-full border-t border-[#28282F]" />
            <span className="absolute bg-[#1A1A20] px-3 text-[10px] font-black tracking-widest text-[#9A9AA3]">
              OR
            </span>
          </div>

          {/* Toggle Register / Login */}
          <div className="text-center text-xs font-bold text-[#9A9AA3]">
            {mode === "login" ? (
              <p>
                New Customer?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setError(null);
                    setInfoMessage(null);
                  }}
                  className="text-[#FFB300] hover:underline transition inline-flex items-center gap-1 ml-1"
                >
                  Create Account <ArrowRight className="h-3 w-3 inline" />
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                    setInfoMessage(null);
                  }}
                  className="text-[#FFB300] hover:underline transition inline-flex items-center gap-1 ml-1"
                >
                  Sign In <ArrowRight className="h-3 w-3 inline" />
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
