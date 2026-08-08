import React, { useEffect, useRef, useState } from "react";

/**
 * RJMascot — Exact recreation of the reference screenshot robot mascot
 * The mascot is a 3D-style robot with yellow glow ring, matching the reference exactly.
 *
 * States:
 *  "idle"             → winking left eye, open right eye, cute smile, floating animation
 *  "email_focus"      → both eyes looking down toward the email field
 *  "typing_email"     → eyes tracking left-right with typing
 *  "password_focus"   → arms raised, golden gloves covering eyes
 *  "password_visible" → both eyes open, star sparkle left eye, wink right, happy smile
 *  "login_loading"    → pulsing both eyes, neutral mouth
 *  "login_success"    → arms raised in celebration, green happy eyes and smile
 *  "login_error"      → sad red eyes, frowning mouth, shake animation
 */
export default function RJMascot({ state = "idle", emailLength = 0 }) {
  const [blink, setBlink] = useState(false);

  // Periodic eye blinking in idle/email states
  useEffect(() => {
    if (state === "idle" || state === "email_focus" || state === "typing_email") {
      const interval = setInterval(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 160);
      }, 3400);
      return () => clearInterval(interval);
    } else {
      setBlink(false);
    }
  }, [state]);

  // Eye pupil x-offset when typing email (tracks typing direction)
  const eyeOffset = Math.min(6, Math.max(-6, (emailLength - 10) * 0.5));

  const isError = state === "login_error";
  const isSuccess = state === "login_success";
  const isPasswordFocus = state === "password_focus";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
      }}
    >
      {/* === OUTER GLOW RING (matches the yellow halo in reference) === */}
      <div
        style={{
          position: "absolute",
          inset: "-8px",
          borderRadius: "50%",
          background: isSuccess
            ? "radial-gradient(circle, rgba(34,197,94,0.22) 0%, transparent 70%)"
            : isError
            ? "radial-gradient(circle, rgba(255,59,48,0.18) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(255,176,0,0.2) 30%, transparent 70%)",
          filter: "blur(8px)",
          transition: "background 0.4s ease",
          pointerEvents: "none",
        }}
      />

      {/* === CIRCLE FRAME (dark circle with border matching reference) === */}
      <div
        className={isError ? "animate-shake" : ""}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          background: "rgba(20,20,26,0.92)",
          border: isSuccess
            ? "1.5px solid rgba(34,197,94,0.55)"
            : isError
            ? "1.5px solid rgba(255,59,48,0.5)"
            : "1.5px solid rgba(255,176,0,0.4)",
          boxShadow: isSuccess
            ? "0 0 22px rgba(34,197,94,0.25), inset 0 0 12px rgba(34,197,94,0.06)"
            : isError
            ? "0 0 20px rgba(255,59,48,0.2)"
            : "0 0 20px rgba(255,176,0,0.18), inset 0 0 10px rgba(255,176,0,0.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          transition: "border 0.3s, box-shadow 0.3s",
        }}
      >
        {/* === ROBOT SVG === */}
        <div
          className={state === "idle" ? "animate-float" : ""}
          style={{ width: "82%", height: "82%", position: "relative", flexShrink: 0 }}
        >
          <svg
            viewBox="0 0 100 120"
            style={{ width: "100%", height: "100%", overflow: "visible" }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Head gradient: dark charcoal */}
              <linearGradient id="headGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2C2C38" />
                <stop offset="100%" stopColor="#16161E" />
              </linearGradient>

              {/* Gold gradient for accents */}
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFD060" />
                <stop offset="100%" stopColor="#FFB000" />
              </linearGradient>

              {/* Visor gradient: very dark */}
              <linearGradient id="visorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0A0A0F" />
                <stop offset="100%" stopColor="#141419" />
              </linearGradient>

              {/* Gold glow filter */}
              <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Green glow filter */}
              <filter id="greenGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Red glow filter */}
              <filter id="redGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* ── ANTENNA ── */}
            <rect x="48.5" y="3" width="3" height="12" rx="1.5" fill="#2A2A35" />
            <circle
              cx="50"
              cy="2.5"
              r="3.5"
              fill={state === "login_loading" ? "#FF9900" : "#FFB000"}
              filter="url(#glow)"
              style={{
                animation: state === "login_loading" ? "rjGlowPulse 0.8s ease-in-out infinite" : "none",
              }}
            />

            {/* ── EAR CAPS ── */}
            <circle cx="17" cy="38" r="6" fill="url(#goldGrad)" />
            <circle cx="17" cy="38" r="2.8" fill="#141419" />
            <circle cx="83" cy="38" r="6" fill="url(#goldGrad)" />
            <circle cx="83" cy="38" r="2.8" fill="#141419" />

            {/* ── HEAD SHELL ── */}
            <rect
              x="20"
              y="14"
              width="60"
              height="48"
              rx="18"
              fill="url(#headGrad)"
              stroke="url(#goldGrad)"
              strokeWidth="1.8"
            />

            {/* ── VISOR SCREEN ── */}
            <rect
              x="26"
              y="20"
              width="48"
              height="36"
              rx="11"
              fill="url(#visorGrad)"
              stroke="#222230"
              strokeWidth="1"
            />

            {/* ── FACE EXPRESSIONS ── */}
            {state === "password_focus" ? (
              // Password focus: eyes hidden (arms will cover them)
              <g opacity="0.15">
                <circle cx="38" cy="37" r="3" fill="#FFB000" />
                <circle cx="62" cy="37" r="3" fill="#FFB000" />
              </g>
            ) : state === "password_visible" ? (
              // Password visible: both eyes open + star left, wink right, big smile
              <g>
                {/* Left eye: star sparkle */}
                <circle cx="38" cy="36" r="5.5" fill="#FFB000" filter="url(#glow)" />
                <circle cx="39.5" cy="34.5" r="1.8" fill="white" opacity="0.9" />
                {/* Right eye: arch wink */}
                <path d="M 57 39 Q 62 30 67 39" fill="none" stroke="#FFB000" strokeWidth="2.8" strokeLinecap="round" filter="url(#glow)" />
                {/* Big happy smile */}
                <path d="M 42 47 Q 50 54 58 47" fill="none" stroke="#FFB000" strokeWidth="2.2" strokeLinecap="round" />
              </g>
            ) : state === "email_focus" ? (
              // Email focus: eyes looking slightly down
              <g transform="translate(0, 3)">
                {blink ? (
                  <>
                    <line x1="33" y1="37" x2="44" y2="37" stroke="#FFB000" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="56" y1="37" x2="67" y2="37" stroke="#FFB000" strokeWidth="2.5" strokeLinecap="round" />
                  </>
                ) : (
                  <>
                    <ellipse cx="38.5" cy="36" rx="5" ry="5.5" fill="#FFB000" filter="url(#glow)" />
                    <circle cx="38.5" cy="37.5" r="2.2" fill="#0D0D12" />
                    <ellipse cx="61.5" cy="36" rx="5" ry="5.5" fill="#FFB000" filter="url(#glow)" />
                    <circle cx="61.5" cy="37.5" r="2.2" fill="#0D0D12" />
                  </>
                )}
                {/* Curious small mouth */}
                <circle cx="50" cy="47" r="2.5" fill="#FFB000" opacity="0.8" />
              </g>
            ) : state === "typing_email" ? (
              // Typing: pupils tracking
              <g transform={`translate(${eyeOffset}, 1)`}>
                <ellipse cx="38.5" cy="36" rx="5" ry="5.5" fill="#FFB000" filter="url(#glow)" />
                <circle cx="39.5" cy="36" r="2" fill="#0D0D12" />
                <ellipse cx="61.5" cy="36" rx="5" ry="5.5" fill="#FFB000" filter="url(#glow)" />
                <circle cx="62.5" cy="36" r="2" fill="#0D0D12" />
                {/* Straight focused mouth */}
                <line x1="45" y1="47" x2="55" y2="47" stroke="#FFB000" strokeWidth="2" strokeLinecap="round" />
              </g>
            ) : state === "login_loading" ? (
              // Loading: both eyes pulsing
              <g>
                <ellipse cx="38.5" cy="37" rx="5" ry="5.5" fill="#FFB000" filter="url(#glow)" opacity="0.9" />
                <ellipse cx="61.5" cy="37" rx="5" ry="5.5" fill="#FFB000" filter="url(#glow)" opacity="0.9" />
                {/* Neutral mouth */}
                <path d="M 44 47 Q 50 44 56 47" fill="none" stroke="#FFB000" strokeWidth="2" strokeLinecap="round" />
              </g>
            ) : state === "login_success" ? (
              // Success: ^ eyes, big smile
              <g>
                <path d="M 32 38 Q 38 28 44 38" fill="none" stroke="#22C55E" strokeWidth="3.5" strokeLinecap="round" filter="url(#greenGlow)" />
                <path d="M 56 38 Q 62 28 68 38" fill="none" stroke="#22C55E" strokeWidth="3.5" strokeLinecap="round" filter="url(#greenGlow)" />
                <path d="M 40 47 Q 50 55 60 47" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" />
              </g>
            ) : state === "login_error" ? (
              // Error: sad eyes (arches flipped), red color, frown
              <g>
                <path d="M 32 33 Q 38 41 44 33" fill="none" stroke="#FF3B30" strokeWidth="3" strokeLinecap="round" filter="url(#redGlow)" />
                <path d="M 56 33 Q 62 41 68 33" fill="none" stroke="#FF3B30" strokeWidth="3" strokeLinecap="round" filter="url(#redGlow)" />
                <path d="M 40 50 Q 50 44 60 50" fill="none" stroke="#FF3B30" strokeWidth="2.5" strokeLinecap="round" />
              </g>
            ) : (
              // IDLE: left eye wink (arch ^), right eye full circle with sparkle
              <g>
                {blink ? (
                  <>
                    <line x1="33" y1="37" x2="44" y2="37" stroke="#FFB000" strokeWidth="2.8" strokeLinecap="round" />
                    <line x1="56" y1="37" x2="67" y2="37" stroke="#FFB000" strokeWidth="2.8" strokeLinecap="round" />
                  </>
                ) : (
                  <>
                    {/* Left eye: winking arch ^ */}
                    <path
                      d="M 33 39 Q 38.5 30 44 39"
                      fill="none"
                      stroke="#FFB000"
                      strokeWidth="3"
                      strokeLinecap="round"
                      filter="url(#glow)"
                    />
                    {/* Right eye: full glowing circle + white sparkle */}
                    <circle cx="62" cy="37" r="5.8" fill="#FFB000" filter="url(#glow)" />
                    <circle cx="63.8" cy="35.2" r="1.9" fill="white" opacity="0.9" />
                  </>
                )}
                {/* Cute smile */}
                <path d="M 42 47 Q 50 53 58 47" fill="none" stroke="#FFB000" strokeWidth="2.2" strokeLinecap="round" />
              </g>
            )}

            {/* ── NECK ── */}
            <rect x="43" y="62" width="14" height="7" rx="3" fill="#1E1E28" stroke="#2A2A35" strokeWidth="1" />

            {/* ── BODY / TORSO ── */}
            <rect x="26" y="69" width="48" height="32" rx="10" fill="url(#headGrad)" stroke="#222230" strokeWidth="1.5" />

            {/* ── RJ CHEST BADGE ── */}
            <rect x="38" y="77" width="24" height="16" rx="5" fill="#0D0D12" stroke="url(#goldGrad)" strokeWidth="1.2" />
            <text
              x="50"
              y="88.5"
              fill="#FFB000"
              fontSize="8"
              fontWeight="900"
              textAnchor="middle"
              fontFamily="system-ui, sans-serif"
              style={{ letterSpacing: "0.5px" }}
            >
              RJ
            </text>

            {/* ── ARMS ── */}
            {state === "password_focus" ? (
              // Arms/hands raised to cover eyes
              <g style={{ transition: "all 0.3s ease" }}>
                {/* Left arm up */}
                <path d="M 32 76 Q 16 60 22 42" fill="none" stroke="#1E1E28" strokeWidth="7" strokeLinecap="round" />
                {/* Left hand (golden glove) covering left side of visor */}
                <circle cx="22" cy="40" r="9.5" fill="url(#goldGrad)" />
                <circle cx="22" cy="40" r="4" fill="#FFD060" opacity="0.5" />

                {/* Right arm up */}
                <path d="M 68 76 Q 84 60 78 42" fill="none" stroke="#1E1E28" strokeWidth="7" strokeLinecap="round" />
                {/* Right hand (golden glove) covering right side of visor */}
                <circle cx="78" cy="40" r="9.5" fill="url(#goldGrad)" />
                <circle cx="78" cy="40" r="4" fill="#FFD060" opacity="0.5" />
              </g>
            ) : state === "login_success" ? (
              // Arms raised in celebration
              <g style={{ transition: "all 0.3s ease" }}>
                <path d="M 32 76 Q 14 55 10 40" fill="none" stroke="#1E1E28" strokeWidth="7" strokeLinecap="round" />
                <circle cx="10" cy="38" r="6" fill="#22C55E" />

                <path d="M 68 76 Q 86 55 90 40" fill="none" stroke="#1E1E28" strokeWidth="7" strokeLinecap="round" />
                <circle cx="90" cy="38" r="6" fill="#22C55E" />
              </g>
            ) : (
              // Arms resting at sides
              <g style={{ transition: "all 0.3s ease" }}>
                <path d="M 30 76 Q 18 88 20 100" fill="none" stroke="#1E1E28" strokeWidth="7" strokeLinecap="round" />
                <circle cx="20" cy="101" r="5.5" fill="url(#goldGrad)" />

                <path d="M 70 76 Q 82 88 80 100" fill="none" stroke="#1E1E28" strokeWidth="7" strokeLinecap="round" />
                <circle cx="80" cy="101" r="5.5" fill="url(#goldGrad)" />
              </g>
            )}

            {/* ── LEGS / FEET ── */}
            <rect x="36" y="100" width="12" height="16" rx="5" fill="#1A1A22" stroke="#222230" strokeWidth="1" />
            <rect x="52" y="100" width="12" height="16" rx="5" fill="#1A1A22" stroke="#222230" strokeWidth="1" />
            <rect x="33" y="114" width="16" height="6" rx="3" fill="url(#goldGrad)" />
            <rect x="51" y="114" width="16" height="6" rx="3" fill="url(#goldGrad)" />
          </svg>
        </div>
      </div>
    </div>
  );
}
