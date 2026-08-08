import React, { useState } from "react";
import { X, Lock, Mail, User, Phone, Smartphone, Eye, EyeOff, Loader2, Check, ShieldAlert, ArrowRight } from "lucide-react";
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

  // Dynamic Mascot State
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
            }, 1400);
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
          }, 1400);
        } else {
          throw new Error("Verification failed");
        }
      }
    } catch (ex) {
      setError(ex?.response?.data?.message || ex.message || "Incorrect password, try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0D12]/98 p-4 backdrop-blur-xl overflow-y-auto min-h-screen">
      
      {/* Background Subtle Gold Light Waves */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#FFB000]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#FFA000]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-[410px] my-auto select-none">
        
        {/* Close Modal Button */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute -top-4 -right-2 sm:-right-4 z-10 grid h-8 w-8 place-items-center rounded-full bg-[#18181E] text-[#85858D] border border-[#2A2A31] hover:border-[#FFB000] hover:text-[#F5F5F5] transition"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Top Header & Brand Branding (Pixel-Accurate to Reference Screenshot) */}
        <div className="flex flex-col items-center text-center mb-4">
          
          {/* Top Compact Brand Badge */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-[#141419] border border-[#2A2A31] shadow-md mb-2">
            <div className="h-6 w-6 rounded-lg bg-[#FFB000]/10 border border-[#FFB000] grid place-items-center">
              <img src={logo} alt="RJ Logo" className="h-4 w-4 object-contain" />
            </div>
            <span className="text-[11px] font-black tracking-widest text-[#FFB000]">RJ MOBILE STORE</span>
          </div>

          {/* Interactive Mascot (Compact Size) */}
          <RJMascot state={mascotState} emailLength={email.length} />

          {/* Headings */}
          <h1 className="text-2xl font-black text-[#F5F5F5] tracking-tight mt-1">
            {mode === "login" && "Welcome Back!"}
            {mode === "register" && "Create Account"}
            {mode === "verify" && "Verify Email"}
          </h1>
          <p className="text-xs font-medium text-[#85858D] mt-1">
            {mode === "login" && "Sign in to continue shopping"}
            {mode === "register" && "Join RJ Mobile Store for exclusive deals"}
            {mode === "verify" && `Enter 6-digit OTP code sent to ${email}`}
          </p>
        </div>

        {/* Main Login Card (Pixel-Accurate to Reference Screenshot) */}
        <div className="relative overflow-hidden rounded-[24px] bg-[#18181E] p-6 sm:p-7 border border-[#FFB000]/35 shadow-[0_12px_45px_rgba(0,0,0,0.85),0_0_25px_rgba(255,176,0,0.08)]">
          
          {/* SUCCESS OVERLAY STATE (Matching Panel 5 in Reference Image) */}
          {successState ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-[#22C55E] grid place-items-center shadow-[0_0_30px_rgba(34,197,94,0.4)] animate-bounce">
                <Check className="h-9 w-9 text-[#0D0D12] stroke-[3]" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[#F5F5F5]">Login Successful!</h2>
                <p className="text-xs font-semibold text-[#85858D] mt-1">Redirecting...</p>
              </div>
              <div className="w-32 h-1 bg-[#2A2A31] rounded-full overflow-hidden">
                <div className="h-full bg-[#22C55E] animate-pulse w-full" />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {mode === "register" && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#85858D] mb-1.5">
                      Full Name
                    </label>
                    <div className="flex items-center rounded-xl bg-[#141419] border border-[#2A2A31] focus-within:border-[#FFB000] transition">
                      <div className="pl-3.5 pr-2 text-[#85858D]">
                        <User className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        placeholder="Rahul Sharma"
                        value={name}
                        onFocus={() => setFocusedInput("name")}
                        onBlur={() => setFocusedInput(null)}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-transparent py-2.5 pr-3 text-xs font-semibold text-[#F5F5F5] placeholder-[#666670] focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#85858D] mb-1.5">
                      WhatsApp Number
                    </label>
                    <div className="flex items-center rounded-xl bg-[#141419] border border-[#2A2A31] focus-within:border-[#FFB000] transition">
                      <span className="pl-3.5 pr-2 text-xs font-bold text-[#FFB000] border-r border-[#2A2A31]">+91</span>
                      <input
                        type="tel"
                        placeholder="10-digit number"
                        maxLength={10}
                        value={phone}
                        onFocus={() => setFocusedInput("phone")}
                        onBlur={() => setFocusedInput(null)}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                        className="w-full bg-transparent py-2.5 px-3 text-xs font-semibold text-[#F5F5F5] placeholder-[#666670] focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#85858D] mb-1.5">
                      Current Phone Model (Optional)
                    </label>
                    <div className="flex items-center rounded-xl bg-[#141419] border border-[#2A2A31] focus-within:border-[#FFB000] transition">
                      <div className="pl-3.5 pr-2 text-[#85858D]">
                        <Smartphone className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        placeholder="iPhone 12, OnePlus 9"
                        value={currentDevice}
                        onFocus={() => setFocusedInput("device")}
                        onBlur={() => setFocusedInput(null)}
                        onChange={(e) => setCurrentDevice(e.target.value)}
                        className="w-full bg-transparent py-2.5 pr-3 text-xs font-semibold text-[#F5F5F5] placeholder-[#666670] focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              {mode !== "verify" && (
                <>
                  {/* Email Address Field */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[#85858D] mb-1.5">
                      Email Address
                    </label>
                    <div
                      className={`relative flex items-center rounded-xl bg-[#141419] border transition-all duration-200 ${
                        focusedInput === "email"
                          ? "border-[#FFB000] shadow-[0_0_12px_rgba(255,176,0,0.2)]"
                          : "border-[#2A2A31]"
                      }`}
                    >
                      {/* Left Yellow Badge Icon Box */}
                      <div className="grid h-9 w-9 place-items-center ml-1 rounded-lg bg-[#FFB000]/15 text-[#FFB000]">
                        <Mail className="h-4 w-4" />
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
                        className="w-full bg-transparent py-2.5 px-3 text-xs font-semibold text-[#F5F5F5] placeholder-[#666670] focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[#85858D] mb-1.5">
                      Password
                    </label>
                    <div
                      className={`relative flex items-center rounded-xl bg-[#141419] border transition-all duration-200 ${
                        error
                          ? "border-[#FF3B30] shadow-[0_0_12px_rgba(255,59,48,0.25)]"
                          : focusedInput === "password"
                          ? "border-[#FFB000] shadow-[0_0_12px_rgba(255,176,0,0.2)]"
                          : "border-[#2A2A31]"
                      }`}
                    >
                      {/* Left Yellow Badge Icon Box */}
                      <div className={`grid h-9 w-9 place-items-center ml-1 rounded-lg ${error ? "bg-[#FF3B30]/15 text-[#FF3B30]" : "bg-[#FFB000]/15 text-[#FFB000]"}`}>
                        <Lock className="h-4 w-4" />
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
                        className="w-full bg-transparent py-2.5 px-3 text-xs font-semibold text-[#F5F5F5] placeholder-[#666670] focus:outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label="Toggle password visibility"
                        className="grid h-9 w-9 place-items-center pr-2 text-[#85858D] hover:text-[#FFB000] transition"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Error message text below password field */}
                    {error && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-[#FF3B30]">
                        <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}
                  </div>

                  {/* Remember Me & Forgot Password Row */}
                  {mode === "login" && (
                    <div className="flex items-center justify-between text-xs font-semibold pt-0.5">
                      <label className="flex items-center gap-2 text-[#F5F5F5] cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="h-4 w-4 rounded border-[#2A2A31] bg-[#141419] accent-[#FFB000] cursor-pointer"
                        />
                        <span>Remember Me</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => alert("Password reset link sent to your email.")}
                        className="text-[#FFB000] hover:underline transition"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}
                </>
              )}

              {mode === "verify" && (
                <div className="space-y-2.5">
                  <label className="block text-[11px] font-semibold text-[#85858D]">
                    6-Digit OTP Verification Code
                  </label>
                  <div className="flex items-center rounded-xl bg-[#141419] border border-[#2A2A31] focus-within:border-[#FFB000] transition">
                    <input
                      type="text"
                      placeholder="123456"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full bg-transparent py-3 px-4 text-center font-mono font-bold text-lg tracking-[8px] text-[#FFB000] focus:outline-none"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Primary Gradient CTA Button ("Sign In") */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full h-12 rounded-full font-extrabold text-sm tracking-wide text-[#000000] bg-gradient-to-r from-[#FFB000] to-[#FFA000] hover:brightness-110 active:scale-[0.98] shadow-[0_0_20px_rgba(255,176,0,0.3)] transition-all duration-200 overflow-hidden flex items-center justify-center gap-2 mt-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-[#000000]" />
                    <span>AUTHENTICATING...</span>
                  </>
                ) : (
                  <>
                    <span className="font-extrabold">
                      {mode === "login" && "Sign In"}
                      {mode === "register" && "Create Account"}
                      {mode === "verify" && "Verify & Log In"}
                    </span>
                    <div className="grid h-6 w-6 place-items-center rounded-full bg-[#000000]/15">
                      <ArrowRight className="h-3.5 w-3.5 text-[#000000] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </>
                )}
              </button>

              {/* OR Divider */}
              <div className="relative flex items-center justify-center my-4">
                <div className="w-full border-t border-[#2A2A31]" />
                <span className="absolute bg-[#18181E] px-3 text-[11px] font-bold text-[#85858D]">
                  OR
                </span>
              </div>

              {/* Bottom Create Account Link */}
              <div className="text-center text-xs font-semibold text-[#F5F5F5]">
                {mode === "login" ? (
                  <p>
                    New Customer?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("register");
                        setError(null);
                      }}
                      className="text-[#FFB000] hover:underline transition font-bold inline-flex items-center gap-1 ml-1"
                    >
                      Create Account <ArrowRight className="h-3 w-3" />
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
                      }}
                      className="text-[#FFB000] hover:underline transition font-bold inline-flex items-center gap-1 ml-1"
                    >
                      Sign In <ArrowRight className="h-3 w-3" />
                    </button>
                  </p>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
