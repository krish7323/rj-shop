import React, { useState } from "react";
import { X, Lock, Mail, User, Smartphone, Eye, EyeOff, Loader2, Check, ShieldAlert, ArrowRight } from "lucide-react";
import { AuthAPI } from "../lib/api";
import RJMascot from "./RJMascot";
import logo from "../assets/logo.png";

export default function AuthModal({ onClose, onSuccess }) {
  const [mode, setMode] = useState("login"); // "login" | "register" | "verify"

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [currentDevice, setCurrentDevice] = useState("");
  const [otp, setOtp] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [successState, setSuccessState] = useState(false);
  const [error, setError] = useState(null);
  const [focusedInput, setFocusedInput] = useState(null);

  const getMascotState = () => {
    if (successState) return "login_success";
    if (error) return "login_error";
    if (loading) return "login_loading";
    if (focusedInput === "password") return showPassword ? "password_visible" : "password_focus";
    if (focusedInput === "email") return email.length > 0 ? "typing_email" : "email_focus";
    return "idle";
  };

  const mascotState = getMascotState();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "register") {
        if (!name.trim()) throw new Error("Please enter your full name");
        if (!phone.trim() || !/^[0-9]{10}$/.test(phone.trim()))
          throw new Error("Enter a valid 10-digit phone number");

        const res = await AuthAPI.register(name.trim(), email.trim(), password, phone.trim(), currentDevice.trim());
        setSuccessState(true);
        setTimeout(() => {
          setSuccessState(false);
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
    /*
     * login-page class → targets the CSS rule in index.css that kills
     * the browser-default white focus outline on all inputs inside.
     */
    <div
      className="login-page fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto"
      style={{ background: "#0D0D12" }}
    >
      {/* Extremely subtle warm ambient glows — top-right and bottom-left corners */}
      <div
        className="pointer-events-none absolute top-0 right-0 w-80 h-80 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,176,0,0.07) 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 w-64 h-64 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,160,0,0.05) 0%, transparent 70%)" }}
      />

      {/* ─── OUTER SHELL: controls the mobile-width constraint ─── */}
      <div
        className="relative w-full my-auto py-6 px-0"
        style={{ maxWidth: "395px" }}
      >
        {/* Close button (only if used as modal) */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-2 right-3 z-10 grid h-7 w-7 place-items-center rounded-full text-[#85858D] hover:text-[#F5F5F5] transition"
            style={{ background: "#18181E", border: "1px solid #2A2A31" }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {/* ─── HEADER: badge + mascot + headings ─── */}
        <div className="flex flex-col items-center text-center" style={{ marginBottom: "16px" }}>

          {/* Compact brand badge — pill shaped, dark, small */}
          <div
            className="inline-flex items-center gap-2"
            style={{
              background: "#141419",
              border: "1px solid #2A2A31",
              borderRadius: "20px",
              padding: "5px 12px 5px 7px",
              marginBottom: "4px",
            }}
          >
            <div
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "7px",
                background: "rgba(255,176,0,0.12)",
                border: "1px solid #FFB000",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <img src={logo} alt="RJ" style={{ width: "13px", height: "13px", objectFit: "contain" }} />
            </div>
            <span style={{ fontSize: "10px", fontWeight: 900, color: "#FFB000", letterSpacing: "1.5px" }}>
              RJ MOBILE STORE
            </span>
          </div>

          {/* Mascot — fixed 110×110 so it never reflows */}
          <div style={{ width: "110px", height: "110px", flexShrink: 0 }}>
            <RJMascot state={mascotState} emailLength={email.length} />
          </div>

          {/* Welcome heading */}
          <h1 style={{ margin: "2px 0 0", fontSize: "22px", fontWeight: 900, color: "#F5F5F5", lineHeight: 1.2 }}>
            {mode === "login" && "Welcome Back!"}
            {mode === "register" && "Create Account"}
            {mode === "verify" && "Verify Email"}
          </h1>

          {/* Subtitle */}
          <p style={{ margin: "4px 0 0", fontSize: "11px", fontWeight: 500, color: "#85858D" }}>
            {mode === "login" && "Sign in to continue shopping"}
            {mode === "register" && "Join RJ Mobile Store for exclusive deals"}
            {mode === "verify" && `Enter the 6-digit OTP sent to ${email}`}
          </p>
        </div>

        {/* ─── MAIN LOGIN CARD ─── */}
        {/*
          Width: calc(100% - 54px) so on a 395px viewport the card is ~341px.
          Never stretches beyond 342px on desktop.
          Internal padding: 20px left/right, 22px top/bottom.
        */}
        <div
          style={{
            width: "calc(100% - 54px)",
            maxWidth: "342px",
            margin: "0 auto",
            background: "#18181E",
            borderRadius: "20px",
            border: "1px solid rgba(255,176,0,0.45)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.7), 0 0 20px rgba(255,176,0,0.07)",
            padding: "22px 20px",
          }}
        >
          {/* ── Success State ── */}
          {successState ? (
            <div className="animate-fadeIn flex flex-col items-center justify-center text-center py-6 gap-4">
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: "#22C55E",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 0 28px rgba(34,197,94,0.4)",
                }}
                className="animate-bounce"
              >
                <Check style={{ width: "30px", height: "30px", color: "#0D0D12", strokeWidth: 3 }} />
              </div>
              <div>
                <p style={{ fontSize: "17px", fontWeight: 900, color: "#F5F5F5", margin: 0 }}>Login Successful!</p>
                <p style={{ fontSize: "11px", color: "#85858D", margin: "4px 0 0" }}>Redirecting...</p>
              </div>
              <div style={{ width: "100px", height: "3px", background: "#2A2A31", borderRadius: "99px", overflow: "hidden" }}>
                <div style={{ width: "100%", height: "100%", background: "#22C55E" }} className="animate-pulse" />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

              {/* ── Register extra fields ── */}
              {mode === "register" && (
                <>
                  <div>
                    <label style={labelStyle}>Full Name</label>
                    <div style={inputWrapStyle(focusedInput === "name", false)}>
                      <div style={iconBoxStyle(false)}>
                        <User style={{ width: "14px", height: "14px", color: "#FFB000" }} />
                      </div>
                      <input
                        type="text"
                        placeholder="Rahul Sharma"
                        value={name}
                        onFocus={() => setFocusedInput("name")}
                        onBlur={() => setFocusedInput(null)}
                        onChange={(e) => setName(e.target.value)}
                        style={inputStyle}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>WhatsApp Number</label>
                    <div style={inputWrapStyle(focusedInput === "phone", false)}>
                      <span style={{ fontSize: "12px", fontWeight: 900, color: "#FFB000", paddingLeft: "12px", paddingRight: "10px", borderRight: "1px solid #2A2A31", whiteSpace: "nowrap" }}>+91</span>
                      <input
                        type="tel"
                        placeholder="10-digit number"
                        maxLength={10}
                        value={phone}
                        onFocus={() => setFocusedInput("phone")}
                        onBlur={() => setFocusedInput(null)}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                        style={{ ...inputStyle, paddingLeft: "10px" }}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Current Phone Model (Optional)</label>
                    <div style={inputWrapStyle(focusedInput === "device", false)}>
                      <div style={iconBoxStyle(false)}>
                        <Smartphone style={{ width: "14px", height: "14px", color: "#FFB000" }} />
                      </div>
                      <input
                        type="text"
                        placeholder="iPhone 12, OnePlus 9..."
                        value={currentDevice}
                        onFocus={() => setFocusedInput("device")}
                        onBlur={() => setFocusedInput(null)}
                        onChange={(e) => setCurrentDevice(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* ── Email & Password (login + register) ── */}
              {mode !== "verify" && (
                <>
                  {/* Email */}
                  <div>
                    <label style={labelStyle}>Email Address</label>
                    <div style={inputWrapStyle(focusedInput === "email", false)}>
                      <div style={iconBoxStyle(false)}>
                        <Mail style={{ width: "14px", height: "14px", color: "#FFB000" }} />
                      </div>
                      <input
                        type="email"
                        placeholder="customer@rjshop.com"
                        value={email}
                        onFocus={() => setFocusedInput("email")}
                        onBlur={() => setFocusedInput(null)}
                        onChange={(e) => { setEmail(e.target.value); setError(null); }}
                        style={inputStyle}
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label style={labelStyle}>Password</label>
                    <div style={inputWrapStyle(focusedInput === "password", !!error)}>
                      <div style={iconBoxStyle(!!error)}>
                        <Lock style={{ width: "14px", height: "14px", color: error ? "#FF3B30" : "#FFB000" }} />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••••••"
                        value={password}
                        onFocus={() => setFocusedInput("password")}
                        onBlur={() => setFocusedInput(null)}
                        onChange={(e) => { setPassword(e.target.value); setError(null); }}
                        style={inputStyle}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label="Toggle password visibility"
                        style={{ display: "grid", placeItems: "center", width: "38px", height: "100%", color: "#85858D", background: "transparent", border: "none", cursor: "pointer", flexShrink: 0, padding: 0 }}
                      >
                        {showPassword
                          ? <EyeOff style={{ width: "16px", height: "16px" }} />
                          : <Eye style={{ width: "16px", height: "16px" }} />
                        }
                      </button>
                    </div>

                    {error && (
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "5px" }}>
                        <ShieldAlert style={{ width: "13px", height: "13px", color: "#FF3B30", flexShrink: 0 }} />
                        <span style={{ fontSize: "11px", color: "#FF3B30", fontWeight: 600 }}>{error}</span>
                      </div>
                    )}
                  </div>

                  {/* Remember Me + Forgot Password */}
                  {mode === "login" && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "7px", cursor: "pointer", userSelect: "none" }}>
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          style={{ width: "14px", height: "14px", accentColor: "#FFB000", cursor: "pointer" }}
                        />
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#F5F5F5" }}>Remember Me</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => alert("Password reset link sent to your email.")}
                        style={{ fontSize: "12px", fontWeight: 700, color: "#FFB000", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* ── OTP field ── */}
              {mode === "verify" && (
                <div>
                  <label style={labelStyle}>6-Digit OTP Code</label>
                  <div style={inputWrapStyle(focusedInput === "otp", false)}>
                    <input
                      type="text"
                      placeholder="123456"
                      maxLength={6}
                      value={otp}
                      onFocus={() => setFocusedInput("otp")}
                      onBlur={() => setFocusedInput(null)}
                      onChange={(e) => setOtp(e.target.value)}
                      style={{ ...inputStyle, textAlign: "center", fontSize: "20px", fontWeight: 900, letterSpacing: "8px", color: "#FFB000" }}
                      required
                    />
                  </div>
                </div>
              )}

              {/* ── Primary Sign In Button ── */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  height: "46px",
                  borderRadius: "23px",
                  background: loading ? "#FFA000" : "linear-gradient(90deg, #FFB000 0%, #FFA000 100%)",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  color: "#000000",
                  fontSize: "14px",
                  fontWeight: 800,
                  boxShadow: "0 0 18px rgba(255,176,0,0.28)",
                  transition: "filter 0.2s, transform 0.15s",
                  marginTop: "2px",
                }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.filter = "brightness(1.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.filter = "brightness(1)"; }}
                onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.98)"; }}
                onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
              >
                {loading ? (
                  <>
                    <Loader2 style={{ width: "16px", height: "16px", color: "#000" }} className="animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {mode === "login" && "Sign In"}
                      {mode === "register" && "Create Account"}
                      {mode === "verify" && "Verify & Log In"}
                    </span>
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "rgba(0,0,0,0.15)", display: "grid", placeItems: "center" }}>
                      <ArrowRight style={{ width: "13px", height: "13px", color: "#000" }} />
                    </div>
                  </>
                )}
              </button>

              {/* ── OR Divider ── */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "2px 0" }}>
                <div style={{ flex: 1, height: "1px", background: "#2A2A31" }} />
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#85858D" }}>OR</span>
                <div style={{ flex: 1, height: "1px", background: "#2A2A31" }} />
              </div>

              {/* ── Create Account / Sign In toggle ── */}
              <div style={{ textAlign: "center" }}>
                {mode === "login" ? (
                  <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: "#F5F5F5" }}>
                    New Customer?{" "}
                    <button
                      type="button"
                      onClick={() => { setMode("register"); setError(null); }}
                      style={{ color: "#FFB000", fontWeight: 800, background: "transparent", border: "none", cursor: "pointer", padding: 0, fontSize: "12px" }}
                    >
                      Create Account →
                    </button>
                  </p>
                ) : (
                  <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: "#F5F5F5" }}>
                    Already a member?{" "}
                    <button
                      type="button"
                      onClick={() => { setMode("login"); setError(null); }}
                      style={{ color: "#FFB000", fontWeight: 800, background: "transparent", border: "none", cursor: "pointer", padding: 0, fontSize: "12px" }}
                    >
                      Sign In →
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

/* ── Inline style helpers (avoids Tailwind prefix conflicts) ── */

const labelStyle = {
  display: "block",
  fontSize: "10px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.7px",
  color: "#85858D",
  marginBottom: "5px",
};

const inputWrapStyle = (focused, hasError) => ({
  display: "flex",
  alignItems: "center",
  height: "44px",
  background: "#141419",
  borderRadius: "12px",
  border: `1px solid ${hasError ? "#FF3B30" : focused ? "#FFB000" : "#2A2A31"}`,
  boxShadow: focused && !hasError
    ? "0 0 0 3px rgba(255,176,0,0.12)"
    : hasError
    ? "0 0 0 3px rgba(255,59,48,0.12)"
    : "none",
  transition: "border-color 0.2s, box-shadow 0.2s",
  overflow: "hidden",
});

const iconBoxStyle = (hasError) => ({
  width: "38px",
  height: "100%",
  display: "grid",
  placeItems: "center",
  background: hasError ? "rgba(255,59,48,0.12)" : "rgba(255,176,0,0.10)",
  flexShrink: 0,
  marginLeft: "4px",
  borderRadius: "8px",
});

const inputStyle = {
  flex: 1,
  height: "100%",
  background: "transparent",
  border: "none",
  outline: "none",
  padding: "0 10px",
  fontSize: "12px",
  fontWeight: 600,
  color: "#F5F5F5",
  caretColor: "#FFB000",
};
