import React, { useEffect, useState } from "react";

/**
 * RJMascot — Interactive RJ Bot Mascot
 * States: "idle" | "email_focus" | "typing_email" | "password_focus" | "password_visible" | "login_loading" | "login_success" | "login_error"
 */
export default function RJMascot({ state = "idle", emailLength = 0 }) {
  const [blink, setBlink] = useState(false);

  // Periodic eye blinking during idle & email focus
  useEffect(() => {
    if (state === "idle" || state === "email_focus") {
      const interval = setInterval(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 180);
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [state]);

  // Calculate eye X offset during email typing (max 10px shift left-right)
  const eyeOffset = Math.min(10, Math.max(-10, (emailLength - 10) * 0.8));

  return (
    <div className="relative flex flex-col items-center justify-center select-none py-2">
      {/* Background Radial Gold Glow & Particle Ring */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-radial from-amber-500/25 via-amber-500/10 to-transparent blur-xl pointer-events-none" />
      
      {/* Outer Glowing Ring */}
      <div
        className={`relative grid place-items-center w-36 h-36 rounded-full border border-amber-500/30 bg-[#15151B]/80 backdrop-blur-md shadow-[0_0_30px_rgba(255,179,0,0.15)] transition-all duration-500 ${
          state === "login_success"
            ? "border-emerald-500/60 shadow-[0_0_40px_rgba(34,197,94,0.35)]"
            : state === "login_error"
            ? "border-rose-500/60 shadow-[0_0_35px_rgba(255,59,48,0.25)] animate-shake"
            : ""
        }`}
      >
        {/* Particle sparkles in background */}
        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
          <span className="absolute top-3 left-6 w-1.5 h-1.5 rounded-full bg-amber-400/60 animate-ping" />
          <span className="absolute bottom-4 right-5 w-1 h-1 rounded-full bg-amber-300/80 animate-pulse" />
          <span className="absolute top-8 right-4 w-1 h-1 rounded-full bg-amber-400/50" />
        </div>

        {/* Mascot SVG Frame */}
        <div
          className={`relative w-28 h-28 transition-transform duration-500 ${
            state === "idle"
              ? "animate-float"
              : state === "login_error"
              ? "animate-shake"
              : state === "login_success"
              ? "scale-110"
              : ""
          }`}
        >
          <svg viewBox="0 0 160 160" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="rjHeadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#282830" />
                <stop offset="100%" stopColor="#15151B" />
              </linearGradient>

              <linearGradient id="rjGoldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFB300" />
                <stop offset="100%" stopColor="#FF8F00" />
              </linearGradient>

              <linearGradient id="rjVisorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0B0B0F" />
                <stop offset="100%" stopColor="#17171C" />
              </linearGradient>

              <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Antenna */}
            <g className="transition-all duration-300">
              <rect x="77" y="12" width="6" height="18" rx="3" fill="#33333E" />
              <circle
                cx="80"
                cy="10"
                r="6"
                fill={state === "login_loading" ? "#FFC107" : "#FFB300"}
                filter="url(#goldGlow)"
                className={state === "login_loading" ? "animate-pulse" : ""}
              />
            </g>

            {/* Ear Caps */}
            <circle cx="28" cy="54" r="10" fill="url(#rjGoldGrad)" />
            <circle cx="28" cy="54" r="5" fill="#15151B" />
            <circle cx="132" cy="54" r="10" fill="url(#rjGoldGrad)" />
            <circle cx="132" cy="54" r="5" fill="#15151B" />

            {/* Helmet / Head Shell */}
            <rect
              x="34"
              y="26"
              width="92"
              height="64"
              rx="28"
              fill="url(#rjHeadGrad)"
              stroke="url(#rjGoldGrad)"
              strokeWidth="2.5"
            />

            {/* Digital Visor Display */}
            <rect
              x="42"
              y="34"
              width="76"
              height="46"
              rx="18"
              fill="url(#rjVisorGrad)"
              stroke="#28282F"
              strokeWidth="1.5"
            />

            {/* Eyes & Visor Expressions */}
            {state === "password_focus" ? (
              // Visor in password focus mode: eyes are covered by hands, but subtle glowing dots show underneath
              <g opacity="0.2">
                <circle cx="62" cy="56" r="3" fill="#FFB300" />
                <circle cx="98" cy="56" r="3" fill="#FFB300" />
              </g>
            ) : state === "password_visible" ? (
              // Wink + Joyful surprised expression
              <g>
                {/* Left eye open wide */}
                <circle cx="60" cy="54" r="6" fill="#FFC107" filter="url(#goldGlow)" />
                <circle cx="62" cy="52" r="2" fill="#FFFFFF" />
                {/* Right eye winking ^ */}
                <path
                  d="M 92 56 Q 98 48 104 56"
                  fill="none"
                  stroke="#FFC107"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  filter="url(#goldGlow)"
                />
                {/* Open happy mouth */}
                <path d="M 72 65 Q 80 73 88 65 Z" fill="#FFB300" />
              </g>
            ) : state === "email_focus" ? (
              // Looking down towards email input field
              <g transform="translate(0, 4)">
                {blink ? (
                  <>
                    <line x1="54" y1="56" x2="68" y2="56" stroke="#FFC107" strokeWidth="3" strokeLinecap="round" />
                    <line x1="92" y1="56" x2="106" y2="56" stroke="#FFC107" strokeWidth="3" strokeLinecap="round" />
                  </>
                ) : (
                  <>
                    <ellipse cx="61" cy="56" rx="6" ry="7" fill="#FFC107" filter="url(#goldGlow)" />
                    <circle cx="61" cy="58" r="2.5" fill="#15151B" />
                    <ellipse cx="99" cy="56" rx="6" ry="7" fill="#FFC107" filter="url(#goldGlow)" />
                    <circle cx="99" cy="58" r="2.5" fill="#15151B" />
                  </>
                )}
                {/* Curious small mouth */}
                <circle cx="80" cy="67" r="3" fill="#FFB300" />
              </g>
            ) : state === "typing_email" ? (
              // Eyes tracking typing left-right
              <g transform={`translate(${eyeOffset}, 2)`}>
                <ellipse cx="61" cy="55" rx="5.5" ry="6.5" fill="#FFC107" filter="url(#goldGlow)" />
                <circle cx="62" cy="55" r="2" fill="#15151B" />
                <ellipse cx="99" cy="55" rx="5.5" ry="6.5" fill="#FFC107" filter="url(#goldGlow)" />
                <circle cx="100" cy="55" r="2" fill="#15151B" />
                {/* Concentrating mouth line */}
                <path d="M 74 66 L 86 66" stroke="#FFB300" strokeWidth="2.5" strokeLinecap="round" />
              </g>
            ) : state === "login_loading" ? (
              // Attentive/loading state
              <g>
                <circle cx="61" cy="55" r="6.5" fill="#FFC107" filter="url(#goldGlow)" className="animate-pulse" />
                <circle cx="99" cy="55" r="6.5" fill="#FFC107" filter="url(#goldGlow)" className="animate-pulse" />
                <path d="M 72 66 Q 80 62 88 66" fill="none" stroke="#FFB300" strokeWidth="2.5" strokeLinecap="round" />
              </g>
            ) : state === "login_success" ? (
              // Celebrating happy eyes ^ ^
              <g>
                <path d="M 52 57 Q 60 47 68 57" fill="none" stroke="#22C55E" strokeWidth="4" strokeLinecap="round" />
                <path d="M 92 57 Q 100 47 108 57" fill="none" stroke="#22C55E" strokeWidth="4" strokeLinecap="round" />
                {/* Big happy smile */}
                <path d="M 70 64 Q 80 74 90 64" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" />
              </g>
            ) : state === "login_error" ? (
              // Sad / worried expression
              <g>
                <path d="M 53 50 Q 60 56 67 50" fill="none" stroke="#FF3B30" strokeWidth="3" strokeLinecap="round" />
                <path d="M 93 50 Q 100 56 107 50" fill="none" stroke="#FF3B30" strokeWidth="3" strokeLinecap="round" />
                <circle cx="60" cy="57" r="4" fill="#FF3B30" />
                <circle cx="100" cy="57" r="4" fill="#FF3B30" />
                {/* Sad downturned mouth */}
                <path d="M 72 69 Q 80 63 88 69" fill="none" stroke="#FF3B30" strokeWidth="3" strokeLinecap="round" />
              </g>
            ) : (
              // Default IDLE State
              <g>
                {blink ? (
                  <>
                    <line x1="53" y1="55" x2="69" y2="55" stroke="#FFC107" strokeWidth="3.5" strokeLinecap="round" />
                    <line x1="91" y1="55" x2="107" y2="55" stroke="#FFC107" strokeWidth="3.5" strokeLinecap="round" />
                  </>
                ) : (
                  <>
                    <circle cx="61" cy="54" r="6.5" fill="#FFC107" filter="url(#goldGlow)" />
                    <circle cx="63" cy="52" r="2" fill="#FFFFFF" />
                    <circle cx="99" cy="54" r="6.5" fill="#FFC107" filter="url(#goldGlow)" />
                    <circle cx="101" cy="52" r="2" fill="#FFFFFF" />
                  </>
                )}
                {/* Gentle smiling mouth */}
                <path d="M 72 64 Q 80 71 88 64" fill="none" stroke="#FFB300" strokeWidth="2.5" strokeLinecap="round" />
              </g>
            )}

            {/* Robot Body / Chest */}
            <path d="M 52 92 L 108 92 L 118 132 L 42 132 Z" fill="url(#rjHeadGrad)" stroke="#28282F" strokeWidth="2" />
            
            {/* RJ Chest Badge */}
            <rect x="66" y="98" width="28" height="20" rx="6" fill="#15151B" stroke="url(#rjGoldGrad)" strokeWidth="1.5" />
            <text x="80" y="112" fill="#FFB300" fontSize="11" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
              RJ
            </text>

            {/* Hands & Arms */}
            {state === "password_focus" ? (
              // Hands UP covering eyes!
              <g className="transition-all duration-300">
                {/* Left arm raised */}
                <path d="M 44 110 Q 30 75 52 56" fill="none" stroke="#282830" strokeWidth="10" strokeLinecap="round" />
                <circle cx="56" cy="56" r="14" fill="url(#rjGoldGrad)" stroke="#15151B" strokeWidth="2" />
                {/* Right arm raised */}
                <path d="M 116 110 Q 130 75 108 56" fill="none" stroke="#282830" strokeWidth="10" strokeLinecap="round" />
                <circle cx="104" cy="56" r="14" fill="url(#rjGoldGrad)" stroke="#15151B" strokeWidth="2" />
              </g>
            ) : state === "login_success" ? (
              // Hands UP celebrating!
              <g className="transition-all duration-300">
                <path d="M 44 110 Q 20 80 26 60" fill="none" stroke="#282830" strokeWidth="8" strokeLinecap="round" />
                <circle cx="26" cy="58" r="8" fill="#22C55E" />
                <path d="M 116 110 Q 140 80 134 60" fill="none" stroke="#282830" strokeWidth="8" strokeLinecap="round" />
                <circle cx="134" cy="58" r="8" fill="#22C55E" />
              </g>
            ) : (
              // Hands resting at sides
              <g className="transition-all duration-300">
                <path d="M 44 104 Q 30 115 32 128" fill="none" stroke="#282830" strokeWidth="7" strokeLinecap="round" />
                <circle cx="33" cy="130" r="6" fill="url(#rjGoldGrad)" />
                <path d="M 116 104 Q 130 115 128 128" fill="none" stroke="#282830" strokeWidth="7" strokeLinecap="round" />
                <circle cx="127" cy="130" r="6" fill="url(#rjGoldGrad)" />
              </g>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}
