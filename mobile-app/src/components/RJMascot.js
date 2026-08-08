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
 * RJMascot — React Native implementation matching the reference screenshot exactly.
 * Built with pure View + Animated (no react-native-svg needed).
 * States: idle | email_focus | typing_email | password_focus | password_visible | login_loading | login_success | login_error
 */
export default function RJMascot({ state = "idle" }) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0.15)).current;
  const [blink, setBlink] = useState(false);

  // ── Idle float (Y) ──────────────────────────────────────────
  useEffect(() => {
    let loop;
    if (state === "idle") {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -5,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 5,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
    } else {
      Animated.timing(floatAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
    return () => loop && loop.stop();
  }, [state]);

  // ── Glow pulse ───────────────────────────────────────────────
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 0.3,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // ── Shake on error ───────────────────────────────────────────
  useEffect(() => {
    if (state === "login_error") {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 9, duration: 70, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -9, duration: 70, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 7, duration: 70, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -7, duration: 70, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 4, duration: 70, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 70, useNativeDriver: true }),
      ]).start();
    }
  }, [state]);

  // ── Periodic blink ───────────────────────────────────────────
  useEffect(() => {
    let timer;
    if (state === "idle" || state === "email_focus") {
      timer = setInterval(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 180);
      }, 3000);
    }
    return () => clearInterval(timer);
  }, [state]);

  // ── Derived colors ───────────────────────────────────────────
  const isSuccess = state === "login_success";
  const isError = state === "login_error";
  const ringColor = isSuccess
    ? "rgba(34,197,94,0.25)"
    : isError
    ? "rgba(255,59,48,0.22)"
    : "rgba(255,176,0,0.18)";
  const ringBorder = isSuccess
    ? "rgba(34,197,94,0.55)"
    : isError
    ? "rgba(255,59,48,0.5)"
    : "rgba(255,176,0,0.45)";
  const eyeColor = isSuccess ? "#22C55E" : isError ? "#FF3B30" : "#FFB000";

  // ── Visor expression ─────────────────────────────────────────
  const renderVisor = () => {
    if (state === "password_focus") {
      // Hands covering — show covered icon overlay (rendered outside visor in arms section)
      return (
        <View style={s.visorContent}>
          <Text style={[s.eyeText, { color: "#FFB000", letterSpacing: 8 }]}>—  —</Text>
          <Text style={[s.mouthText, { color: "#FFB000" }]}>•</Text>
        </View>
      );
    }
    if (state === "password_visible") {
      return (
        <View style={s.visorContent}>
          <Text style={[s.eyeText, { color: "#FFB000", letterSpacing: 4 }]}>^  ~</Text>
          <Text style={[s.mouthText, { color: "#FFB000" }]}>‿</Text>
        </View>
      );
    }
    if (state === "email_focus") {
      return (
        <View style={s.visorContent}>
          <Text style={[s.eyeText, { color: "#FFB000", letterSpacing: 4 }]}>
            {blink ? "─  ─" : "◉  ◉"}
          </Text>
          <Text style={[s.mouthText, { color: "#FFB000" }]}>◠</Text>
        </View>
      );
    }
    if (state === "typing_email") {
      return (
        <View style={s.visorContent}>
          <Text style={[s.eyeText, { color: "#FFB000", letterSpacing: 4 }]}>◕  ◕</Text>
          <Text style={[s.mouthText, { color: "#FFB000" }]}>─</Text>
        </View>
      );
    }
    if (state === "login_loading") {
      return (
        <View style={s.visorContent}>
          <Text style={[s.eyeText, { color: "#FFB000", letterSpacing: 4 }]}>◎  ◎</Text>
          <Text style={[s.mouthText, { color: "#FFB000" }]}>─</Text>
        </View>
      );
    }
    if (isSuccess) {
      return (
        <View style={s.visorContent}>
          <Text style={[s.eyeText, { color: "#22C55E", letterSpacing: 4 }]}>^  ^</Text>
          <Text style={[s.mouthText, { color: "#22C55E" }]}>◡</Text>
        </View>
      );
    }
    if (isError) {
      return (
        <View style={s.visorContent}>
          <Text style={[s.eyeText, { color: "#FF3B30", letterSpacing: 4 }]}>ᗣ  ᗣ</Text>
          <Text style={[s.mouthText, { color: "#FF3B30" }]}>︵</Text>
        </View>
      );
    }
    // IDLE default — winking (matches reference: left eye ^ right eye ◉)
    return (
      <View style={s.visorContent}>
        <Text style={[s.eyeText, { color: "#FFB000", letterSpacing: 4 }]}>
          {blink ? "─  ─" : "^  ◉"}
        </Text>
        <Text style={[s.mouthText, { color: "#FFB000" }]}>◡</Text>
      </View>
    );
  };

  return (
    <View style={s.wrapper}>
      {/* Outer ambient glow ring */}
      <Animated.View
        style={[
          s.glowOuter,
          {
            backgroundColor: ringColor,
            borderColor: ringBorder,
            opacity: glowOpacity,
          },
        ]}
      />
      <View
        style={[
          s.glowInner,
          { borderColor: ringBorder },
        ]}
      />

      {/* Entire mascot — animated */}
      <Animated.View
        style={[
          s.mascotCol,
          {
            transform: [
              { translateY: floatAnim },
              { translateX: shakeAnim },
            ],
          },
        ]}
      >
        {/* ── Antenna ── */}
        <View style={s.antennaRow}>
          <View style={s.antennaStem} />
          <View style={[s.antennaTip, state === "login_loading" && { backgroundColor: "#FFA000" }]} />
        </View>

        {/* ── Head Shell ── */}
        <View
          style={[
            s.head,
            isSuccess && { borderColor: "#22C55E" },
            isError && { borderColor: "#FF3B30" },
          ]}
        >
          {/* Left ear cap */}
          <View style={[s.ear, s.earLeft]} />
          {/* Right ear cap */}
          <View style={[s.ear, s.earRight]} />

          {/* Visor screen */}
          <View
            style={[
              s.visor,
              isSuccess && { borderColor: "#22C55E" },
              isError && { borderColor: "#FF3B30" },
            ]}
          >
            {renderVisor()}
          </View>
        </View>

        {/* ── Shoulder / Neck connector ── */}
        <View style={s.neck} />

        {/* ── Body / Chest ── */}
        <View
          style={[
            s.body,
            isSuccess && { borderColor: "rgba(34,197,94,0.5)" },
            isError && { borderColor: "rgba(255,59,48,0.4)" },
          ]}
        >
          {/* RJ badge on chest */}
          <View style={s.rjBadge}>
            <Text style={s.rjText}>RJ</Text>
          </View>
        </View>

        {/* ── Arms ── password_focus: raised covering eyes ── */}
        {state === "password_focus" ? (
          <View style={s.armsUp}>
            <View style={[s.arm, s.armLeftUp]}>
              <Ionicons name="hand-left" size={18} color="#FFB000" />
            </View>
            <View style={[s.arm, s.armRightUp]}>
              <Ionicons name="hand-right" size={18} color="#FFB000" />
            </View>
          </View>
        ) : isSuccess ? (
          <View style={s.armsCelebrate}>
            <View style={s.armCelebLeft}>
              <Text style={{ fontSize: 16 }}>🎉</Text>
            </View>
            <View style={s.armCelebRight}>
              <Text style={{ fontSize: 16 }}>✨</Text>
            </View>
          </View>
        ) : (
          <View style={s.armsDown}>
            <View style={[s.armDown, s.armDownLeft]} />
            <View style={[s.armDown, s.armDownRight]} />
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const GOLD = "#FFB000";

const s = StyleSheet.create({
  wrapper: {
    width: 130,
    height: 130,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  // Glow rings
  glowOuter: {
    position: "absolute",
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 1.5,
  },
  glowInner: {
    position: "absolute",
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 1,
    borderColor: "rgba(255,176,0,0.2)",
    backgroundColor: "rgba(24,24,30,0.7)",
  },

  mascotCol: {
    alignItems: "center",
    zIndex: 2,
  },

  // Antenna
  antennaRow: {
    alignItems: "center",
    marginBottom: 0,
  },
  antennaStem: {
    width: 3,
    height: 8,
    backgroundColor: "#2A2A31",
    borderRadius: 1.5,
  },
  antennaTip: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: GOLD,
    marginTop: 1,
    shadowColor: GOLD,
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },

  // Head
  head: {
    width: 76,
    height: 56,
    borderRadius: 20,
    backgroundColor: "#1C1C24",
    borderWidth: 2,
    borderColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: GOLD,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },

  // Ear caps
  ear: {
    position: "absolute",
    top: 18,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: GOLD,
    borderWidth: 1.5,
    borderColor: "#141419",
    shadowColor: GOLD,
    shadowOpacity: 0.4,
    shadowRadius: 3,
  },
  earLeft: { left: -8 },
  earRight: { right: -8 },

  // Visor screen
  visor: {
    width: 62,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#0A0A0F",
    borderWidth: 1,
    borderColor: "#2A2A31",
    alignItems: "center",
    justifyContent: "center",
  },
  visorContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  eyeText: {
    fontSize: 13,
    fontWeight: "900",
    color: GOLD,
    lineHeight: 16,
  },
  mouthText: {
    fontSize: 11,
    fontWeight: "900",
    color: GOLD,
    lineHeight: 13,
    marginTop: -2,
  },

  // Neck
  neck: {
    width: 20,
    height: 5,
    backgroundColor: "#2A2A31",
    borderRadius: 2,
    marginTop: -1,
  },

  // Body
  body: {
    width: 52,
    height: 26,
    borderRadius: 10,
    backgroundColor: "#141419",
    borderWidth: 1.5,
    borderColor: "#2A2A31",
    alignItems: "center",
    justifyContent: "center",
  },
  rjBadge: {
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 5,
    backgroundColor: "#0A0A0F",
    borderWidth: 1,
    borderColor: GOLD,
  },
  rjText: {
    fontSize: 9,
    fontWeight: "900",
    color: GOLD,
    letterSpacing: 0.5,
  },

  // Arms — resting down
  armsDown: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 68,
    marginTop: -4,
  },
  armDown: {
    width: 6,
    height: 14,
    borderRadius: 3,
    backgroundColor: "#2A2A31",
  },
  armDownLeft: { marginLeft: 2 },
  armDownRight: { marginRight: 2 },

  // Arms — raised covering eyes (password_focus)
  armsUp: {
    position: "absolute",
    top: 22,
    flexDirection: "row",
    width: 100,
    justifyContent: "space-between",
    alignItems: "center",
  },
  arm: {
    alignItems: "center",
    justifyContent: "center",
  },
  armLeftUp: {},
  armRightUp: {},

  // Arms — celebrate (success)
  armsCelebrate: {
    position: "absolute",
    top: 15,
    flexDirection: "row",
    width: 110,
    justifyContent: "space-between",
  },
  armCelebLeft: { transform: [{ rotate: "-30deg" }] },
  armCelebRight: { transform: [{ rotate: "30deg" }] },
});
