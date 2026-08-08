import React, { useState } from "react";
import { AuthAPI } from "../lib/api";
import RJMascot from "./RJMascot";
import logo from "../assets/logo.png";

/* ─────────────────────────────────────────────────────────────
   EXACT reference screenshot colors
───────────────────────────────────────────────────────────── */
const C = {
  bg: "#0D0D12",
  surface: "#18181E",
  input: "#141419",
  border: "#2A2A31",
  borderFocus: "#FFB000",
  gold: "#FFB000",
  goldDark: "#FFA000",
  white: "#F5F5F5",
  muted: "#85858D",
  error: "#FF3B30",
  success: "#22C55E",
};

/* ─────────────────────────────────────────────────────────────
   Shared style helpers
───────────────────────────────────────────────────────────── */
const labelSt = {
  display: "block",
  fontSize: "11px",
  fontWeight: 600,
  color: C.muted,
  marginBottom: "6px",
  letterSpacing: "0.02em",
};

function inputWrap(focused, hasErr) {
  return {
    display: "flex",
    alignItems: "center",
    height: "46px",
    background: C.input,
    borderRadius: "12px",
    border: `1px solid ${hasErr ? C.error : focused ? C.borderFocus : C.border}`,
    boxShadow: focused && !hasErr
      ? `0 0 0 3px rgba(255,176,0,0.13)`
      : hasErr
      ? `0 0 0 3px rgba(255,59,48,0.13)`
      : "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    overflow: "hidden",
    gap: 0,
  };
}

function iconBox(hasErr) {
  return {
    width: "40px",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: hasErr ? "rgba(255,59,48,0.12)" : "rgba(255,176,0,0.10)",
    flexShrink: 0,
    marginLeft: "4px",
    borderRadius: "8px",
  };
}

const inputSt = {
  flex: 1,
  height: "100%",
  background: "transparent",
  border: "none",
  outline: "none",
  padding: "0 10px",
  fontSize: "13px",
  fontWeight: 500,
  color: C.white,
  caretColor: C.gold,
  WebkitAppearance: "none",
};

/* ─────────────────────────────────────────────────────────────
   SVG Icons (inline — no external dependency)
───────────────────────────────────────────────────────────── */
const IconMail = ({ color = C.gold }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const IconLock = ({ color = C.gold }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconEye = ({ color = C.muted }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconEyeOff = ({ color = C.muted }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconCheck = ({ color = "#fff" }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconSpinner = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "rjSpin 0.8s linear infinite" }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const IconUser = ({ color = C.gold }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconPhone = ({ color = C.gold }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.06 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const IconAlert = ({ color = C.error }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

/* ─────────────────────────────────────────────────────────────
   Main AuthModal
───────────────────────────────────────────────────────────── */
export default function AuthModal({ onClose, onSuccess }) {
  const [mode, setMode] = useState("login"); // "login" | "register" | "verify"

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [device, setDevice] = useState("");
  const [otp, setOtp] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPwd, setShowPwd] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [focused, setFocused] = useState(null);

  /* ── Mascot state ── */
  const mascotState = (() => {
    if (success) return "login_success";
    if (error) return "login_error";
    if (loading) return "login_loading";
    if (focused === "password") return showPwd ? "password_visible" : "password_focus";
    if (focused === "email") return email.length > 0 ? "typing_email" : "email_focus";
    return "idle";
  })();

  /* ── Submit handler (preserves ALL existing auth logic) ── */
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "register") {
        if (!name.trim()) throw new Error("Please enter your full name");
        if (!/^[0-9]{10}$/.test(phone.trim())) throw new Error("Enter a valid 10-digit phone number");
        const res = await AuthAPI.register(name.trim(), email.trim(), password, phone.trim(), device.trim());
        setSuccess(true);
        setTimeout(() => { setSuccess(false); setMode("verify"); }, 1000);

      } else if (mode === "login") {
        try {
          const res = await AuthAPI.login(email, password);
          if (res.data.token) {
            localStorage.setItem("rj_token", res.data.token);
            setSuccess(true);
            setTimeout(() => { if (onSuccess) onSuccess(); if (onClose) onClose(); }, 1400);
          }
        } catch (ex) {
          if (ex?.response?.status === 403 && ex?.response?.data?.email) {
            setEmail(ex.response.data.email);
            setMode("verify");
          } else throw ex;
        }

      } else if (mode === "verify") {
        const res = await AuthAPI.verifyOTP(email, otp);
        if (res.data.token) {
          localStorage.setItem("rj_token", res.data.token);
          setSuccess(true);
          setTimeout(() => { if (onSuccess) onSuccess(); if (onClose) onClose(); }, 1400);
        } else throw new Error("Verification failed");
      }
    } catch (ex) {
      setError(ex?.response?.data?.message || ex.message || "Incorrect password, try again.");
    } finally {
      setLoading(false);
    }
  }

  /* ── focus/blur helpers ── */
  const focus = (name) => () => setFocused(name);
  const blur = () => setFocused(null);

  return (
    <>
      {/* ── Keyframe style tag ── */}
      <style>{`
        @keyframes rjSpin { to { transform: rotate(360deg); } }
        @keyframes rjFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-5px); }
        }
        @keyframes rjShake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-6px); }
          40%       { transform: translateX(6px); }
          60%       { transform: translateX(-4px); }
          80%       { transform: translateX(4px); }
        }
        @keyframes rjFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes rjGlowPulse {
          0%, 100% { opacity: 0.7; }
          50%       { opacity: 1; }
        }
        @keyframes rjBounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-8px); }
        }
        .animate-float { animation: rjFloat 3s ease-in-out infinite; }
        .animate-shake { animation: rjShake 0.5s ease-in-out; }
        .animate-fadeIn { animation: rjFadeIn 0.35s ease-out forwards; }
        .animate-bounce-sm { animation: rjBounce 0.6s ease-in-out 3; }
        .login-page input,
        .login-page input:focus,
        .login-page input:focus-visible {
          outline: none !important;
          box-shadow: none !important;
        }
        .login-btn:hover { filter: brightness(1.08); }
        .login-btn:active { transform: scale(0.98); }
      `}</style>

      {/* ── Full-page backdrop ── */}
      <div
        className="login-page"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          background: C.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflowY: "auto",
          padding: "16px",
        }}
      >
        {/* Ambient corner glow — top-right */}
        <div style={{
          position: "absolute", top: 0, right: 0,
          width: "340px", height: "340px", pointerEvents: "none",
          background: "radial-gradient(circle at top right, rgba(255,176,0,0.07) 0%, transparent 60%)",
        }} />
        {/* Ambient corner glow — bottom-left */}
        <div style={{
          position: "absolute", bottom: 0, left: 0,
          width: "260px", height: "260px", pointerEvents: "none",
          background: "radial-gradient(circle at bottom left, rgba(255,160,0,0.05) 0%, transparent 60%)",
        }} />

        {/* ── OUTER WIDTH CONSTRAINT ── */}
        <div
          style={{
            position: "relative",
            width: "calc(100% - 0px)",
            maxWidth: "390px",
            margin: "0 auto",
            paddingTop: "8px",
            paddingBottom: "8px",
            animation: "rjFadeIn 0.4s ease-out forwards",
          }}
        >
          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                position: "absolute", top: 0, right: 0, zIndex: 10,
                width: "28px", height: "28px", borderRadius: "50%",
                background: "#18181E", border: `1px solid ${C.border}`,
                color: C.muted, cursor: "pointer",
                display: "grid", placeItems: "center",
                transition: "border-color 0.2s, color 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.white; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}

          {/* ══════════════════════════════════════════════════
              HEADER: Brand badge → Mascot → Headings
          ══════════════════════════════════════════════════ */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "0px" }}>

            {/* ── RJ MOBILE STORE badge (compact pill — matches reference) ── */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "7px",
              background: "#141419",
              border: `1px solid ${C.border}`,
              borderRadius: "20px",
              padding: "5px 13px 5px 7px",
              marginBottom: "6px",
            }}>
              {/* Logo square */}
              <div style={{
                width: "24px", height: "24px", borderRadius: "7px",
                background: "rgba(255,176,0,0.12)",
                border: `1px solid ${C.gold}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <img src={logo} alt="RJ" style={{ width: "14px", height: "14px", objectFit: "contain" }} />
              </div>
              <span style={{ fontSize: "10.5px", fontWeight: 900, color: C.gold, letterSpacing: "1.5px" }}>
                RJ MOBILE STORE
              </span>
            </div>

            {/* ── Mascot (fixed 120×120 so it never reflows) ── */}
            <div style={{ width: "120px", height: "120px", flexShrink: 0, marginBottom: "4px" }}>
              <RJMascot state={mascotState} emailLength={email.length} />
            </div>

            {/* ── Heading ── */}
            <h1 style={{
              margin: "0",
              fontSize: "24px", fontWeight: 900, color: C.white,
              lineHeight: 1.15, letterSpacing: "-0.3px",
            }}>
              {mode === "login" ? "Welcome Back!" : mode === "register" ? "Create Account" : "Verify Email"}
            </h1>

            {/* ── Subtitle ── */}
            <p style={{
              margin: "4px 0 14px",
              fontSize: "12px", fontWeight: 500, color: C.muted,
              lineHeight: 1.4,
            }}>
              {mode === "login"
                ? "Sign in to continue shopping"
                : mode === "register"
                ? "Join RJ Mobile Store for exclusive deals"
                : `Enter 6-digit OTP sent to ${email}`}
            </p>
          </div>

          {/* ══════════════════════════════════════════════════
              MAIN CARD
          ══════════════════════════════════════════════════ */}
          <div style={{
            width: "calc(100% - 48px)",
            maxWidth: "342px",
            margin: "0 auto",
            background: C.surface,
            borderRadius: "22px",
            border: `1px solid rgba(255,176,0,0.42)`,
            boxShadow: "0 10px 44px rgba(0,0,0,0.72), 0 0 22px rgba(255,176,0,0.07)",
            padding: "22px 20px 20px",
          }}>

            {/* ── SUCCESS OVERLAY ── */}
            {success ? (
              <div className="animate-fadeIn" style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", textAlign: "center", padding: "20px 0", gap: "14px",
              }}>
                <div
                  className="animate-bounce-sm"
                  style={{
                    width: "62px", height: "62px", borderRadius: "50%",
                    background: C.success,
                    boxShadow: `0 0 28px rgba(34,197,94,0.45)`,
                    display: "grid", placeItems: "center",
                  }}
                >
                  <IconCheck color="#fff" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "18px", fontWeight: 900, color: C.white }}>Login Successful!</p>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: C.muted }}>Redirecting...</p>
                </div>
                <div style={{ width: "96px", height: "3px", background: C.border, borderRadius: "99px", overflow: "hidden" }}>
                  <div style={{ width: "100%", height: "100%", background: C.success, animation: "rjGlowPulse 0.8s ease infinite" }} />
                </div>
              </div>

            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "13px" }}>

                {/* ── REGISTER EXTRA FIELDS ── */}
                {mode === "register" && (<>
                  <div>
                    <label style={labelSt}>Full Name</label>
                    <div style={inputWrap(focused === "name", false)}>
                      <div style={iconBox(false)}><IconUser /></div>
                      <input
                        type="text" placeholder="Rahul Sharma" value={name} required
                        onFocus={focus("name")} onBlur={blur}
                        onChange={e => setName(e.target.value)}
                        style={inputSt}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={labelSt}>WhatsApp Number</label>
                    <div style={inputWrap(focused === "phone", false)}>
                      <span style={{ paddingLeft: "12px", paddingRight: "10px", fontSize: "12px", fontWeight: 800, color: C.gold, borderRight: `1px solid ${C.border}`, whiteSpace: "nowrap", height: "100%", display: "flex", alignItems: "center" }}>+91</span>
                      <input
                        type="tel" placeholder="10-digit number" value={phone} maxLength={10} required
                        onFocus={focus("phone")} onBlur={blur}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
                        style={{ ...inputSt, paddingLeft: "10px" }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={labelSt}>Current Phone Model (Optional)</label>
                    <div style={inputWrap(focused === "device", false)}>
                      <div style={iconBox(false)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
                        </svg>
                      </div>
                      <input
                        type="text" placeholder="iPhone 12, OnePlus 9..." value={device}
                        onFocus={focus("device")} onBlur={blur}
                        onChange={e => setDevice(e.target.value)}
                        style={inputSt}
                      />
                    </div>
                  </div>
                </>)}

                {/* ── EMAIL & PASSWORD ── */}
                {mode !== "verify" && (<>
                  {/* Email */}
                  <div>
                    <label style={labelSt}>Email Address</label>
                    <div style={inputWrap(focused === "email", false)}>
                      <div style={iconBox(false)}><IconMail /></div>
                      <input
                        type="email" placeholder="customer@rjshop.com" value={email} required
                        onFocus={focus("email")} onBlur={blur}
                        onChange={e => { setEmail(e.target.value); setError(null); }}
                        style={inputSt}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label style={labelSt}>Password</label>
                    <div style={inputWrap(focused === "password", !!error)}>
                      <div style={iconBox(!!error)}>
                        <IconLock color={error ? C.error : C.gold} />
                      </div>
                      <input
                        type={showPwd ? "text" : "password"}
                        placeholder="••••••••••••" value={password} required
                        onFocus={focus("password")} onBlur={blur}
                        onChange={e => { setPassword(e.target.value); setError(null); }}
                        style={inputSt}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd(p => !p)}
                        aria-label="Toggle password visibility"
                        style={{
                          width: "40px", height: "100%", flexShrink: 0,
                          background: "transparent", border: "none", cursor: "pointer",
                          display: "grid", placeItems: "center",
                          color: C.muted,
                        }}
                      >
                        {showPwd ? <IconEyeOff /> : <IconEye />}
                      </button>
                    </div>
                    {error && (
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "5px" }}>
                        <IconAlert />
                        <span style={{ fontSize: "11.5px", color: C.error, fontWeight: 600 }}>{error}</span>
                      </div>
                    )}
                  </div>

                  {/* Remember Me + Forgot */}
                  {mode === "login" && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "7px", cursor: "pointer", userSelect: "none" }}>
                        <div
                          onClick={() => setRememberMe(p => !p)}
                          style={{
                            width: "16px", height: "16px", borderRadius: "4px", flexShrink: 0,
                            border: `1.5px solid ${rememberMe ? C.gold : C.border}`,
                            background: rememberMe ? C.gold : C.input,
                            display: "grid", placeItems: "center", cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                        >
                          {rememberMe && (
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                              <polyline points="2,6 5,9 10,3" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <span style={{ fontSize: "12.5px", fontWeight: 600, color: C.white }}>Remember Me</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => alert("Password reset link sent to your email.")}
                        style={{ fontSize: "12.5px", fontWeight: 700, color: C.gold, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}
                </>)}

                {/* ── OTP FIELD ── */}
                {mode === "verify" && (
                  <div>
                    <label style={labelSt}>6-Digit OTP Code</label>
                    <div style={inputWrap(focused === "otp", false)}>
                      <input
                        type="text" placeholder="123456" value={otp} maxLength={6} required
                        onFocus={focus("otp")} onBlur={blur}
                        onChange={e => setOtp(e.target.value)}
                        style={{ ...inputSt, textAlign: "center", fontSize: "22px", fontWeight: 900, letterSpacing: "10px", color: C.gold }}
                      />
                    </div>
                  </div>
                )}

                {/* ── SIGN IN BUTTON ── */}
                <button
                  type="submit"
                  disabled={loading}
                  className="login-btn"
                  style={{
                    width: "100%",
                    height: "48px",
                    borderRadius: "24px",
                    border: "none",
                    background: `linear-gradient(90deg, ${C.gold} 0%, ${C.goldDark} 100%)`,
                    color: "#000",
                    fontSize: "15px",
                    fontWeight: 800,
                    cursor: loading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    boxShadow: "0 0 20px rgba(255,176,0,0.28)",
                    transition: "filter 0.2s, transform 0.15s",
                    letterSpacing: "0.01em",
                    marginTop: "2px",
                  }}
                >
                  {loading ? (
                    <>
                      <IconSpinner />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {mode === "login" ? "Sign In" : mode === "register" ? "Create Account" : "Verify & Log In"}
                      </span>
                      {/* Arrow badge */}
                      <div style={{
                        width: "26px", height: "26px", borderRadius: "50%",
                        background: "rgba(0,0,0,0.15)",
                        display: "grid", placeItems: "center", flexShrink: 0,
                      }}>
                        <IconArrow />
                      </div>
                    </>
                  )}
                </button>

                {/* ── OR DIVIDER ── */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "2px 0" }}>
                  <div style={{ flex: 1, height: "1px", background: C.border }} />
                  <span style={{ fontSize: "11px", fontWeight: 700, color: C.muted, userSelect: "none" }}>OR</span>
                  <div style={{ flex: 1, height: "1px", background: C.border }} />
                </div>

                {/* ── TOGGLE LOGIN / REGISTER ── */}
                <div style={{ textAlign: "center" }}>
                  {mode === "login" ? (
                    <span style={{ fontSize: "12.5px", fontWeight: 600, color: C.white }}>
                      New Customer?{" "}
                      <button
                        type="button"
                        onClick={() => { setMode("register"); setError(null); }}
                        style={{ color: C.gold, fontWeight: 800, background: "none", border: "none", cursor: "pointer", fontSize: "12.5px", padding: 0 }}
                      >
                        Create Account →
                      </button>
                    </span>
                  ) : (
                    <span style={{ fontSize: "12.5px", fontWeight: 600, color: C.white }}>
                      Already a member?{" "}
                      <button
                        type="button"
                        onClick={() => { setMode("login"); setError(null); }}
                        style={{ color: C.gold, fontWeight: 800, background: "none", border: "none", cursor: "pointer", fontSize: "12.5px", padding: 0 }}
                      >
                        Sign In →
                      </button>
                    </span>
                  )}
                </div>

              </form>
            )}
          </div>{/* /card */}
        </div>{/* /outer width constraint */}
      </div>{/* /backdrop */}
    </>
  );
}
