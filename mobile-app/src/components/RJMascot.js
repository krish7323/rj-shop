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
            toValue: -6,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 6,
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
        Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
      ]).start();
    }
  }, [state]);

  // Scale animation on login success
  useEffect(() => {
    if (state === "login_success") {
      Animated.spring(scaleAnim, {
        toValue: 1.12,
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
      }, 3500);
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
          <View style={[styles.earCap, { left: -10 }]} />
          <View style={[styles.earCap, { right: -10 }]} />

          {/* Digital Visor */}
          <View style={styles.visor}>
            {state === "password_focus" ? (
              // Visor in password focus: hands covering eyes
              <View style={styles.coveredEyesRow}>
                <Ionicons name="hand-stop" size={24} color="#FFB300" />
                <Ionicons name="hand-stop" size={24} color="#FFB300" />
              </View>
            ) : state === "password_visible" ? (
              // Happy winking visor
              <View style={styles.visorContent}>
                <Text style={styles.eyeText}>^  ~</Text>
                <Text style={styles.mouthText}>‿</Text>
              </View>
            ) : state === "email_focus" ? (
              // Looking down towards email field
              <View style={styles.visorContent}>
                <Text style={[styles.eyeText, { transform: [{ translateY: 4 }] }]}>
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
              // Joyful celebrating visor
              <View style={styles.visorContent}>
                <Text style={[styles.eyeText, { color: "#2ECC71" }]}>^  ^</Text>
                <Text style={[styles.mouthText, { color: "#2ECC71" }]}>◡</Text>
              </View>
            ) : state === "login_error" ? (
              // Sad worried visor
              <View style={styles.visorContent}>
                <Text style={[styles.eyeText, { color: "#FF3B30" }]}>u  u</Text>
                <Text style={[styles.mouthText, { color: "#FF3B30" }]}>︵</Text>
              </View>
            ) : (
              // Default IDLE visor
              <View style={styles.visorContent}>
                <Text style={styles.eyeText}>{blink ? "-  -" : "◉  ◉"}</Text>
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
    marginVertical: 8,
    position: "relative",
  },
  glowRing: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255, 179, 0, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 179, 0, 0.3)",
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
    height: 12,
    backgroundColor: "#28282F",
  },
  antennaTip: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FFB300",
    marginBottom: -2,
  },
  antennaTipLoading: {
    backgroundColor: "#FFC107",
    scale: 1.25,
  },
  headShell: {
    width: 90,
    height: 66,
    borderRadius: 24,
    backgroundColor: "#1D1D24",
    borderWidth: 2,
    borderColor: "#FFB300",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  earCap: {
    position: "absolute",
    top: 22,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FFB300",
    borderWidth: 2,
    borderColor: "#15151B",
  },
  visor: {
    width: 74,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#0B0B0F",
    borderWidth: 1,
    borderColor: "#28282F",
    alignItems: "center",
    justifyContent: "center",
  },
  visorContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  coveredEyesRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  eyeText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFC107",
    letterSpacing: 2,
  },
  mouthText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFB300",
    marginTop: -4,
  },
  bodyShell: {
    width: 60,
    height: 32,
    borderRadius: 12,
    backgroundColor: "#15151B",
    borderWidth: 1.5,
    borderColor: "#28282F",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -4,
  },
  rjBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "#0B0B0F",
    borderWidth: 1,
    borderColor: "#FFB300",
  },
  rjBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FFB300",
  },
});
