import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function RJMascot({ state = "idle", emailLength = 0 }) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [blink, setBlink] = useState(false);

  // Floating Y animation during idle
  useEffect(() => {
    if (state === "idle") {
      Animated.loop(
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
      ).start();
    } else {
      floatAnim.setValue(0);
    }
  }, [state]);

  // Shake animation on login error
  useEffect(() => {
    if (state === "login_error") {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 8, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
      ]).start();
    }
  }, [state]);

  // Scale animation on login success
  useEffect(() => {
    if (state === "login_success") {
      Animated.spring(scaleAnim, {
        toValue: 1.1,
        friction: 4,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(1);
    }
  }, [state]);

  // Periodic blinking
  useEffect(() => {
    if (state === "idle" || state === "email_focus") {
      const timer = setInterval(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 200);
      }, 3200);
      return () => clearInterval(timer);
    }
  }, [state]);

  return (
    <View style={styles.container}>
      {/* Background Aura Glow Ring */}
      <View
        style={[
          styles.glowRing,
          state === "login_success" && styles.glowRingSuccess,
          state === "login_error" && styles.glowRingError,
        ]}
      />

      {/* Robot Mascot Frame */}
      <Animated.View
        style={[
          styles.mascotBox,
          {
            transform: [
              { translateY: floatAnim },
              { translateX: shakeAnim },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        {/* Antenna */}
        <View style={styles.antennaStem} />
        <View
          style={[
            styles.antennaTip,
            state === "login_loading" && styles.antennaTipLoading,
          ]}
        />

        {/* Robot Head */}
        <View style={styles.headShell}>
          {/* Ear Caps */}
          <View style={[styles.earCap, { left: -9 }]} />
          <View style={[styles.earCap, { right: -9 }]} />

          {/* Digital Screen Visor */}
          <View style={styles.visor}>
            {state === "password_focus" ? (
              // Visor when password focused: hands covering eyes
              <View style={styles.coveredEyesRow}>
                <Ionicons name="hand-stop" size={22} color="#FFB000" />
                <Ionicons name="hand-stop" size={22} color="#FFB000" />
              </View>
            ) : state === "password_visible" ? (
              // Happy winking visor (matching reference "PASSWORD VISIBLE")
              <View style={styles.visorContent}>
                <Text style={styles.eyeText}>^  ~</Text>
                <Text style={styles.mouthText}>‿</Text>
              </View>
            ) : state === "email_focus" ? (
              // Looking down towards email field (matching reference "FOCUS EMAIL")
              <View style={styles.visorContent}>
                <Text style={[styles.eyeText, { transform: [{ translateY: 3 }] }]}>
                  {blink ? "-  -" : "•  •"}
                </Text>
                <Text style={styles.mouthText}>o</Text>
              </View>
            ) : state === "typing_email" ? (
              // Eyes tracking typing length
              <View style={styles.visorContent}>
                <Text style={styles.eyeText}>▸  ▸</Text>
                <Text style={styles.mouthText}>〰</Text>
              </View>
            ) : state === "login_loading" ? (
              // Attentive loading visor
              <View style={styles.visorContent}>
                <Text style={styles.eyeText}>◎  ◎</Text>
                <Text style={styles.mouthText}>⎼</Text>
              </View>
            ) : state === "login_success" ? (
              // Joyful celebrating visor (matching reference "LOGIN SUCCESS")
              <View style={styles.visorContent}>
                <Text style={[styles.eyeText, { color: "#2ECC71" }]}>^  ^</Text>
                <Text style={[styles.mouthText, { color: "#2ECC71" }]}>◡</Text>
              </View>
            ) : state === "login_error" ? (
              // Sad worried visor (matching reference "LOGIN ERROR")
              <View style={styles.visorContent}>
                <Text style={[styles.eyeText, { color: "#FF3B30" }]}>u  u</Text>
                <Text style={[styles.mouthText, { color: "#FF3B30" }]}>︵</Text>
              </View>
            ) : (
              // Default IDLE Visor (matching main reference image)
              <View style={styles.visorContent}>
                <Text style={styles.eyeText}>{blink ? "-  -" : "^  ◉"}</Text>
                <Text style={styles.mouthText}>◡</Text>
              </View>
            )}
          </View>
        </View>

        {/* Robot Body / Chest */}
        <View style={styles.bodyShell}>
          <View style={styles.rjBadge}>
            <Text style={styles.rjBadgeText}>RJ</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
    position: "relative",
  },
  glowRing: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 176, 0, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 176, 0, 0.35)",
  },
  glowRingSuccess: {
    backgroundColor: "rgba(46, 204, 113, 0.2)",
    borderColor: "rgba(46, 204, 113, 0.5)",
  },
  glowRingError: {
    backgroundColor: "rgba(255, 59, 48, 0.2)",
    borderColor: "rgba(255, 59, 48, 0.5)",
  },
  mascotBox: {
    alignItems: "center",
    justifyContent: "center",
  },
  antennaStem: {
    width: 4,
    height: 10,
    backgroundColor: "#2A2A31",
  },
  antennaTip: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFB000",
    marginBottom: -2,
  },
  antennaTipLoading: {
    backgroundColor: "#FFA000",
    scale: 1.2,
  },
  headShell: {
    width: 82,
    height: 60,
    borderRadius: 22,
    backgroundColor: "#1C1C24",
    borderWidth: 2,
    borderColor: "#FFB000",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  earCap: {
    position: "absolute",
    top: 20,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FFB000",
    borderWidth: 1.5,
    borderColor: "#141419",
  },
  visor: {
    width: 68,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#0D0D12",
    borderWidth: 1,
    borderColor: "#2A2A31",
    alignItems: "center",
    justifyContent: "center",
  },
  visorContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  coveredEyesRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  eyeText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFB000",
    letterSpacing: 2,
  },
  mouthText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#FFB000",
    marginTop: -4,
  },
  bodyShell: {
    width: 54,
    height: 28,
    borderRadius: 10,
    backgroundColor: "#141419",
    borderWidth: 1.5,
    borderColor: "#2A2A31",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -4,
  },
  rjBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 5,
    backgroundColor: "#0D0D12",
    borderWidth: 1,
    borderColor: "#FFB000",
  },
  rjBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FFB000",
  },
});
