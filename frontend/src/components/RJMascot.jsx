import React, { useEffect, useState } from "react";

/**
 * RJMascot — Pixel-Accurate RJ Bot Mascot matching reference screenshot
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
      }, 3200);
      return () => clearInterval(interval);
    }
  }, [state]);

  // Calculate eye X offset during email typing
  const eyeOffset = Math.min(8, Math.max(-8, (emailLength - 8) * 0.7));

  return (
    <div className="relative flex flex-col items-center justify-center select-none my-1">
      {/* Golden Radial Glow Background Ring */}
      <div
        className={`absolute w-36 h-36 rounded-full bg-[#FFB000]/15 blur-lg pointer-events-none transition-all duration-500 ${
          state === "login_success"
            ? "bg-[#22C55E]/25 shadow-[0_0_50px_rgba(34,197,94,0.4)]"
            : state === "login_error"
            ? "bg-[#FF3B30]/20 shadow-[0_0_40px_rgba(255,59,48,0.3)]"
            : "shadow-[0_0_35px_rgba(255,176,0,0.25)]"
        }`}
      />

      {/* Outer Golden Aura Circle Frame */}
      <div
        className={`relative grid place-items-center w-28 h-28 rounded-full border border-[#FFB000]/40 bg-[#18181E]/90 backdrop-blur-md shadow-[0_0_25px_rgba(255,176,0,0.18)] transition-all duration-300 ${
          state === "login_success"
            ? "border-[#22C55E] shadow-[0_0_35px_rgba(34,197,94,0.35)]"
            : state === "login_error"
            ? "border-[#FF3B30] shadow-[0_0_30px_rgba(255,59,48,0.3)] animate-shake"
            : ""
        }`}
      >
        {/* Subtle Background Particles */}
        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
          <span className="absolute top-2 left-4 w-1 h-1 rounded-full bg-[#FFB000]/70 animate-ping" />
          <span className="absolute bottom-3 right-4 w-1 h-1 rounded-full bg-[#FF9900]/80 animate-pulse" />
        </div>

        {/* Mascot Robot SVG */}
        <div
          className={`relative w-22 h-22 transition-transform duration-300 ${
            state === "idle"
              ? "animate-float"
              : state === "login_error"
              ? "animate-shake"
              : state === "login_success"
              ? "scale-105"
              : ""
          }`}
        >
          <svg viewBox="0 0 160 160" className="w-full h-full drop-shadow-lg">
            <defs>
              <linearGradient id="rjHeadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2A2A33" />
                <stop offset="100%" stopColor="#141419" />
              </linearGradient>

              <linearGradient id="rjGoldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFB000" />
                <stop offset="100%" stopColor="#FFA000" />
              </linearGradient>

              <linearGradient id="rjVisorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0D0D12" />
                <stop offset="100%" stopColor="#18181E" />
              </linearGradient>

              <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Antenna */}
            <g className="transition-all duration-300">
              <rect x="78" y="10" width="4" height="18" rx="2" fill="#2A2A31" />
              <circle
                cx="80"
                cy="8"
                r="5"
                fill={state === "login_loading" ? "#FFA000" : "#FFB000"}
                filter="url(#goldGlow)"
                className={state === "login_loading" ? "animate-pulse" : ""}
              />
            </g>

            {/* Ear Caps */}
            <circle cx="28" cy="54" r="9" fill="url(#rjGoldGrad)" />
            <circle cx="28" cy="54" r="4" fill="#141419" />
            <circle cx="132" cy="54" r="9" fill="url(#rjGoldGrad)" />
            <circle cx="132" cy="54" r="4" fill="#141419" />

            {/* Helmet / Head Shell */}
            <rect
              x="34"
              y="26"
              width="92"
              height="64"
              rx="26"
              fill="url(#rjHeadGrad)"
              stroke="url(#rjGoldGrad)"
              strokeWidth="2.5"
            />

            {/* Digital Screen Visor */}
            <rect
              x="42"
              y="34"
              width="76"
              height="46"
              rx="16"
              fill="url(#rjVisorGrad)"
              stroke="#2A2A31"
              strokeWidth="1.5"
            />

            {/* Visor Facial Expressions */}
            {state === "password_focus" ? (
              // Visor when password focused (eyes covered by hands)
              <g opacity="0.2">
                <circle cx="62" cy="56" r="3" fill="#FFB000" />
                <circle cx="98" cy="56" r="3" fill="#FFB000" />
              </g>
            ) : state === "password_visible" ? (
              // Winking happy expression (matching reference "PASSWORD VISIBLE")
              <g>
                <circle cx="60" cy="54" r="6" fill="#FFB000" filter="url(#goldGlow)" />
                <circle cx="62" cy="52" r="2" fill="#FFFFFF" />
                <path
                  d="M 92 56 Q 98 48 104 56"
                  fill="none"
                  stroke="#FFB000"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  filter="url(#goldGlow)"
                />
                <path d="M 72 65 Q 80 73 88 65 Z" fill="#FFB000" />
              </g>
            ) : state === "email_focus" ? (
              // Looking down towards email field (matching reference "FOCUS EMAIL")
              <g transform="translate(0, 4)">
                {blink ? (
                  <>
                    <line x1="54" y1="56" x2="68" y2="56" stroke="#FFB000" strokeWidth="3" strokeLinecap="round" />
                    <line x1="92" y1="56" x2="106" y2="56" stroke="#FFB000" strokeWidth="3" strokeLinecap="round" />
                  </>
                ) : (
                  <>
                    <ellipse cx="61" cy="56" rx="6" ry="7" fill="#FFB000" filter="url(#goldGlow)" />
                    <circle cx="61" cy="58" r="2.5" fill="#141419" />
                    <ellipse cx="99" cy="56" rx="6" ry="7" fill="#FFB000" filter="url(#goldGlow)" />
                    <circle cx="99" cy="58" r="2.5" fill="#141419" />
                  </>
                )}
                <circle cx="80" cy="67" r="3" fill="#FFB000" />
              </g>
            ) : state === "typing_email" ? (
              // Eyes tracking typing left-right
              <g transform={`translate(${eyeOffset}, 2)`}>
                <ellipse cx="61" cy="55" rx="5.5" ry="6.5" fill="#FFB000" filter="url(#goldGlow)" />
                <circle cx="62" cy="55" r="2" fill="#141419" />
                <ellipse cx="99" cy="55" rx="5.5" ry="6.5" fill="#FFB000" filter="url(#goldGlow)" />
                <circle cx="100" cy="55" r="2" fill="#141419" />
                <path d="M 74 66 L 86 66" stroke="#FFB000" strokeWidth="2.5" strokeLinecap="round" />
              </g>
            ) : state === "login_loading" ? (
              // Attentive loading visor
              <g>
                <circle cx="61" cy="55" r="6.5" fill="#FFB000" filter="url(#goldGlow)" className="animate-pulse" />
                <circle cx="99" cy="55" r="6.5" fill="#FFB000" filter="url(#goldGlow)" className="animate-pulse" />
                <path d="M 72 66 Q 80 62 88 66" fill="none" stroke="#FFB000" strokeWidth="2.5" strokeLinecap="round" />
              </g>
            ) : state === "login_success" ? (
              // Celebrating joyful expression (matching reference "LOGIN SUCCESS")
              <g>
                <path d="M 52 57 Q 60 47 68 57" fill="none" stroke="#22C55E" strokeWidth="4" strokeLinecap="round" />
                <path d="M 92 57 Q 100 47 108 57" fill="none" stroke="#22C55E" strokeWidth="4" strokeLinecap="round" />
                <path d="M 70 64 Q 80 74 90 64" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" />
              </g>
            ) : state === "login_error" ? (
              // Sad / worried expression (matching reference "LOGIN ERROR")
              <g>
                <path d="M 53 50 Q 60 56 67 50" fill="none" stroke="#FF3B30" strokeWidth="3" strokeLinecap="round" />
                <path d="M 93 50 Q 100 56 107 50" fill="none" stroke="#FF3B30" strokeWidth="3" strokeLinecap="round" />
                <circle cx="60" cy="57" r="4" fill="#FF3B30" />
                <circle cx="100" cy="57" r="4" fill="#FF3B30" />
                <path d="M 72 69 Q 80 63 88 69" fill="none" stroke="#FF3B30" strokeWidth="3" strokeLinecap="round" />
              </g>
            ) : (
              // Default IDLE Visor (matching main reference image)
              <g>
                {blink ? (
                  <>
                    <line x1="53" y1="55" x2="69" y2="55" stroke="#FFB000" strokeWidth="3.5" strokeLinecap="round" />
                    <line x1="91" y1="55" x2="107" y2="55" stroke="#FFB000" strokeWidth="3.5" strokeLinecap="round" />
                  </>
                ) : (
                  <>
                    {/* Left eye winking ^ */}
                    <path
                      d="M 53 56 Q 60 48 67 56"
                      fill="none"
                      stroke="#FFB000"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      filter="url(#goldGlow)"
                    />
                    {/* Right eye open with sparkle */}
                    <circle cx="99" cy="54" r="6.5" fill="#FFB000" filter="url(#goldGlow)" />
                    <circle cx="101" cy="52" r="2" fill="#FFFFFF" />
                  </>
                )}
                {/* Cute smile */}
                <path d="M 72 64 Q 80 71 88 64" fill="none" stroke="#FFB000" strokeWidth="2.5" strokeLinecap="round" />
              </g>
            )}

            {/* Robot Body / Torso */}
            <path d="M 52 92 L 108 92 L 118 132 L 42 132 Z" fill="url(#rjHeadGrad)" stroke="#2A2A31" strokeWidth="2" />

            {/* RJ Chest Badge */}
            <rect x="66" y="98" width="28" height="20" rx="6" fill="#141419" stroke="url(#rjGoldGrad)" strokeWidth="1.5" />
            <text x="80" y="112" fill="#FFB000" fontSize="11" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
              RJ
            </text>

            {/* Robot Arms & Hands */}
            {state === "password_focus" ? (
              // Hands covering eyes (matching reference "FOCUS PASSWORD")
              <g className="transition-all duration-300">
                <path d="M 44 110 Q 30 75 52 56" fill="none" stroke="#2A2A33" strokeWidth="10" strokeLinecap="round" />
                <circle cx="56" cy="56" r="14" fill="url(#rjGoldGrad)" stroke="#141419" strokeWidth="2" />
                <path d="M 116 110 Q 130 75 108 56" fill="none" stroke="#2A2A33" strokeWidth="10" strokeLinecap="round" />
                <circle cx="104" cy="56" r="14" fill="url(#rjGoldGrad)" stroke="#141419" strokeWidth="2" />
              </g>
            ) : state === "login_success" ? (
              // Arms raised in celebration (matching reference "LOGIN SUCCESS")
              <g className="transition-all duration-300">
                <path d="M 44 110 Q 20 80 26 60" fill="none" stroke="#2A2A33" strokeWidth="8" strokeLinecap="round" />
                <circle cx="26" cy="58" r="8" fill="#22C55E" />
                <path d="M 116 110 Q 140 80 134 60" fill="none" stroke="#2A2A33" strokeWidth="8" strokeLinecap="round" />
                <circle cx="134" cy="58" r="8" fill="#22C55E" />
              </g>
            ) : (
              // Hands resting at sides
              <g className="transition-all duration-300">
                <path d="M 44 104 Q 30 115 32 128" fill="none" stroke="#2A2A33" strokeWidth="7" strokeLinecap="round" />
                <circle cx="33" cy="130" r="6" fill="url(#rjGoldGrad)" />
                <path d="M 116 104 Q 130 115 128 128" fill="none" stroke="#2A2A33" strokeWidth="7" strokeLinecap="round" />
                <circle cx="127" cy="130" r="6" fill="url(#rjGoldGrad)" />
              </g>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}
