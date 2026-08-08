import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Animated,
  Easing,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

/**
 * RJMascot — Pixel-accurate React Native robot matching the reference screenshot.
 * Uses View-based shapes (no SVG) for proper visual eye rendering.
 */
export default function RJMascot({ state = "idle" }) {
  const floatY = useRef(new Animated.Value(0)).current;
  const shakeX = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(1)).current;
  const [blink, setBlink] = useState(false);

  // ── Float idle ─────────────────────────────────────────────
  useEffect(() => {
    let anim;
    if (state === "idle") {
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(floatY, { toValue: -6, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(floatY, { toValue:  6, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      anim.start();
    } else {
      Animated.timing(floatY, { toValue: 0, duration: 250, useNativeDriver: true }).start();
    }
    return () => anim && anim.stop();
  }, [state]);

  // ── Glow pulse ─────────────────────────────────────────────
  useEffect(() => {
    const p = Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale, { toValue: 1.06, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glowScale, { toValue: 0.96, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    p.start();
    return () => p.stop();
  }, []);

  // ── Shake on error ─────────────────────────────────────────
  useEffect(() => {
    if (state === "login_error") {
      Animated.sequence([
        Animated.timing(shakeX, { toValue:  9, duration: 65, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -9, duration: 65, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue:  7, duration: 65, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -7, duration: 65, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue:  4, duration: 65, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue:  0, duration: 65, useNativeDriver: true }),
      ]).start();
    }
  }, [state]);

  // ── Blink ──────────────────────────────────────────────────
  useEffect(() => {
    let t;
    if (state === "idle" || state === "email_focus") {
      t = setInterval(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 170);
      }, 3200);
    }
    return () => clearInterval(t);
  }, [state]);

  const isSuccess = state === "login_success";
  const isError = state === "login_error";
  const isPassFocus = state === "password_focus";
  const isPassVisible = state === "password_visible";

  const glowColor = isSuccess ? "rgba(34,197,94,0.3)" : isError ? "rgba(255,59,48,0.25)" : "rgba(255,176,0,0.22)";
  const ringBorderColor = isSuccess ? "rgba(34,197,94,0.6)" : isError ? "rgba(255,59,48,0.55)" : "rgba(255,176,0,0.55)";
  const headBorderColor = isSuccess ? "#22C55E" : isError ? "#FF3B30" : "#FFB000";
  const eyeColor = isSuccess ? "#22C55E" : isError ? "#FF3B30" : "#FFB000";

  return (
    <View style={s.wrapper}>

      {/* ── Outer ambient glow ring (pulsing) ── */}
      <Animated.View
        style={[
          s.glowRingOuter,
          {
            backgroundColor: glowColor,
            borderColor: ringBorderColor,
            transform: [{ scale: glowScale }],
          },
        ]}
      />
      {/* Inner ring frame */}
      <View style={[s.glowRingInner, { borderColor: ringBorderColor }]} />

      {/* ── Animated robot body ── */}
      <Animated.View
        style={[
          s.mascot,
          {
            transform: [
              { translateY: floatY },
              { translateX: shakeX },
            ],
          },
        ]}
      >
        {/* Antenna */}
        <View style={s.antennaStem} />
        <View style={[s.antennaBall, state === "login_loading" && { backgroundColor: "#FFA000" }, { shadowColor: eyeColor }]} />

        {/* Head shell */}
        <View style={[s.head, { borderColor: headBorderColor, shadowColor: headBorderColor }]}>
          {/* Ear caps */}
          <View style={[s.ear, s.earL, { backgroundColor: headBorderColor }]} />
          <View style={[s.ear, s.earR, { backgroundColor: headBorderColor }]} />

          {/* Visor / face screen */}
          <View style={[s.visor, isSuccess && { borderColor: "#22C55E" }, isError && { borderColor: "#FF3B30" }]}>
            {renderFace(state, blink, eyeColor)}
          </View>
        </View>

        {/* Neck */}
        <View style={s.neck} />

        {/* Body / chest */}
        <View style={[s.body, { borderColor: isSuccess ? "rgba(34,197,94,0.5)" : isError ? "rgba(255,59,48,0.4)" : "#2A2A31" }]}>
          <View style={[s.rjBadge, { borderColor: headBorderColor }]}>
            <Text style={[s.rjText, { color: headBorderColor }]}>RJ</Text>
          </View>
        </View>

        {/* Arms */}
        {isPassFocus ? (
          // Hands raised covering eyes
          <View style={s.armsUp}>
            <View style={s.handL}>
              <Ionicons name="hand-left" size={20} color="#FFB000" />
            </View>
            <View style={s.handR}>
              <Ionicons name="hand-right" size={20} color="#FFB000" />
            </View>
          </View>
        ) : isSuccess ? (
          // Arms raised celebrating
          <View style={s.armsCelebrate}>
            <Text style={[s.celebEmoji, { transform: [{ rotate: "-25deg" }] }]}>🎉</Text>
            <Text style={[s.celebEmoji, { transform: [{ rotate: "25deg" }] }]}>✨</Text>
          </View>
        ) : (
          // Arms resting down
          <View style={s.armsDown}>
            <View style={s.armDownL} />
            <View style={s.armDownR} />
          </View>
        )}
      </Animated.View>
    </View>
  );
}

/* ────────────────────────────────────────────────────────────
   FACE RENDERER — returns the correct eye/mouth shapes
   Uses View-based shapes instead of text characters for
   pixel-accurate match with the reference screenshot
──────────────────────────────────────────────────────────── */
function renderFace(state, blink, eyeColor) {
  if (blink) {
    return (
      <View style={f.faceRow}>
        <BlinkEye color={eyeColor} />
        <BlinkEye color={eyeColor} />
      </View>
    );
  }

  switch (state) {
    case "idle":
      return (
        <View style={f.faceCol}>
          <View style={f.eyeRow}>
            <WinkEye color={eyeColor} />
            <OpenEye color={eyeColor} />
          </View>
          <SmileMouth color={eyeColor} />
        </View>
      );

    case "email_focus":
    case "typing_email":
      return (
        <View style={f.faceCol}>
          <View style={f.eyeRow}>
            <OpenEye color={eyeColor} />
            <OpenEye color={eyeColor} />
          </View>
          <NeutralMouth color={eyeColor} />
        </View>
      );

    case "password_focus":
      // Eyes dimmed (hands covering above)
      return (
        <View style={f.faceCol}>
          <View style={f.eyeRow}>
            <DimEye />
            <DimEye />
          </View>
          <NeutralMouth color="#555" />
        </View>
      );

    case "password_visible":
      return (
        <View style={f.faceCol}>
          <View style={f.eyeRow}>
            <WinkEye color={eyeColor} />
            <WinkEye color={eyeColor} />
          </View>
          <SmileMouth color={eyeColor} />
        </View>
      );

    case "login_loading":
      return (
        <View style={f.faceCol}>
          <View style={f.eyeRow}>
            <CircleEye color={eyeColor} size={10} />
            <CircleEye color={eyeColor} size={10} />
          </View>
          <NeutralMouth color={eyeColor} />
        </View>
      );

    case "login_success":
      return (
        <View style={f.faceCol}>
          <View style={f.eyeRow}>
            <WinkEye color="#22C55E" />
            <WinkEye color="#22C55E" />
          </View>
          <SmileMouth color="#22C55E" />
        </View>
      );

    case "login_error":
      return (
        <View style={f.faceCol}>
          <View style={f.eyeRow}>
            <SadEye color="#FF3B30" />
            <SadEye color="#FF3B30" />
          </View>
          <SadMouth color="#FF3B30" />
        </View>
      );

    default:
      return (
        <View style={f.faceCol}>
          <View style={f.eyeRow}>
            <WinkEye color="#FFB000" />
            <OpenEye color="#FFB000" />
          </View>
          <SmileMouth color="#FFB000" />
        </View>
      );
  }
}

/* ── Eye shape components (View-based, no SVG) ── */

// ^ Winking eye: a semicircle arc using overflow:hidden trick
function WinkEye({ color }) {
  return (
    <View style={[f.eyeBase, { width: 22, height: 22, borderRadius: 11, overflow: "hidden" }]}>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 3,
          borderColor: color,
          backgroundColor: "transparent",
          // Move view up to only show the top arc
        }}
      />
      {/* Cover the bottom half to create ^ shape */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 11,
          backgroundColor: "#0A0A0F",
        }}
      />
    </View>
  );
}

// Full open eye: circle with pupil + white highlight
function OpenEye({ color }) {
  return (
    <View style={[f.eyeBase, { width: 22, height: 22, borderRadius: 11, backgroundColor: color, alignItems: "center", justifyContent: "center" }]}>
      {/* Dark pupil */}
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#0A0A0F", alignItems: "center", justifyContent: "center" }}>
        {/* White highlight/sparkle */}
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: "#FFFFFF", position: "absolute", top: 0, right: 0 }} />
      </View>
    </View>
  );
}

// Blink — flat line
function BlinkEye({ color }) {
  return (
    <View style={{ width: 22, height: 3, borderRadius: 2, backgroundColor: color, marginHorizontal: 5 }} />
  );
}

// Dim eye (for password focus — hands covering)
function DimEye() {
  return (
    <View style={{ width: 20, height: 3, borderRadius: 2, backgroundColor: "#333340", marginHorizontal: 5 }} />
  );
}

// Circle eye (loading)
function CircleEye({ color, size }) {
  return (
    <View style={{
      width: size + 6,
      height: size + 6,
      borderRadius: (size + 6) / 2,
      borderWidth: 2.5,
      borderColor: color,
      backgroundColor: "transparent",
      marginHorizontal: 5,
    }} />
  );
}

// Sad eye — angled down
function SadEye({ color }) {
  return (
    <View style={[f.eyeBase, { width: 22, height: 22, overflow: "hidden", borderRadius: 11 }]}>
      <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 3, borderColor: color, backgroundColor: "transparent" }} />
      {/* Cover top half → sad drooping eye */}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 11, backgroundColor: "#0A0A0F" }} />
    </View>
  );
}

// Smiling mouth
function SmileMouth({ color }) {
  return (
    <View style={{ overflow: "hidden", width: 28, height: 14, borderRadius: 14, marginTop: 2 }}>
      <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2.5, borderColor: color, backgroundColor: "transparent" }} />
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 14, backgroundColor: "#0A0A0F" }} />
    </View>
  );
}

// Neutral flat mouth
function NeutralMouth({ color }) {
  return <View style={{ width: 22, height: 2.5, borderRadius: 1.5, backgroundColor: color, marginTop: 4 }} />;
}

// Sad mouth — upside down curve
function SadMouth({ color }) {
  return (
    <View style={{ overflow: "hidden", width: 28, height: 14, borderRadius: 14, marginTop: 2, transform: [{ scaleY: -1 }] }}>
      <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2.5, borderColor: color, backgroundColor: "transparent" }} />
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 14, backgroundColor: "#0A0A0F" }} />
    </View>
  );
}

/* ────────────────────────────────────────────────────────────
   STYLES
──────────────────────────────────────────────────────────── */
const GOLD = "#FFB000";

const s = StyleSheet.create({
  wrapper: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  glowRingOuter: {
    position: "absolute",
    width: 136,
    height: 136,
    borderRadius: 68,
    borderWidth: 1.5,
  },
  glowRingInner: {
    position: "absolute",
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 1,
    borderColor: "rgba(255,176,0,0.25)",
    backgroundColor: "rgba(20,20,25,0.5)",
  },

  mascot: {
    alignItems: "center",
    zIndex: 10,
  },

  antennaStem: {
    width: 3,
    height: 9,
    backgroundColor: "#2A2A31",
    borderRadius: 2,
  },
  antennaBall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GOLD,
    marginTop: 1,
    shadowOpacity: 0.9,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },

  head: {
    width: 84,
    height: 62,
    borderRadius: 22,
    backgroundColor: "#1A1A22",
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
    marginTop: -1,
  },
  ear: {
    position: "absolute",
    top: 20,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#141419",
  },
  earL: { left: -9 },
  earR: { right: -9 },

  visor: {
    width: 66,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#0A0A0F",
    borderWidth: 1,
    borderColor: "#2A2A31",
    alignItems: "center",
    justifyContent: "center",
  },

  neck: {
    width: 18,
    height: 4,
    backgroundColor: "#25252F",
    borderRadius: 2,
    marginTop: -1,
  },

  body: {
    width: 54,
    height: 28,
    borderRadius: 10,
    backgroundColor: "#141419",
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -1,
  },
  rjBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: "#0A0A0F",
    borderWidth: 1,
  },
  rjText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  armsDown: {
    flexDirection: "row",
    width: 72,
    justifyContent: "space-between",
    marginTop: -2,
    paddingHorizontal: 2,
  },
  armDownL: {
    width: 6, height: 16, borderRadius: 3,
    backgroundColor: "#25252F",
    transform: [{ rotate: "-6deg" }],
  },
  armDownR: {
    width: 6, height: 16, borderRadius: 3,
    backgroundColor: "#25252F",
    transform: [{ rotate: "6deg" }],
  },

  armsUp: {
    position: "absolute",
    top: 20,
    width: 110,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  handL: { transform: [{ rotate: "30deg" }] },
  handR: { transform: [{ rotate: "-30deg" }] },

  armsCelebrate: {
    flexDirection: "row",
    width: 110,
    justifyContent: "space-between",
    marginTop: -2,
  },
  celebEmoji: {
    fontSize: 18,
  },
});

const f = StyleSheet.create({
  faceCol: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  faceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  eyeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  eyeBase: {
    alignItems: "center",
    justifyContent: "center",
  },
});
