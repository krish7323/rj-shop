// src/screens/AuthScreen.js
import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { AuthAPI } from "../lib/api";
import RJMascot from "../components/RJMascot";
import logo from "../assets/logo.png";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = Math.min(SCREEN_W - 48, 360);

export default function AuthScreen({ onAuthSuccess }) {
  const [mode, setMode] = useState("login"); // "login" | "register" | "verify"

  // Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [currentDevice, setCurrentDevice] = useState("");
  const [otp, setOtp] = useState("");

  // UI states
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  // Auth states
  const [authLoading, setAuthLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [authError, setAuthError] = useState(null);

  // ── Mascot state ─────────────────────────────────────────────
  const getMascotState = () => {
    if (authSuccess) return "login_success";
    if (authError) return "login_error";
    if (authLoading) return "login_loading";
    if (focusedInput === "password")
      return showPassword ? "password_visible" : "password_focus";
    if (focusedInput === "email")
      return email.length > 0 ? "typing_email" : "email_focus";
    return "idle";
  };

  // ── Auth logic ───────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!email.trim()) { setAuthError("Please enter your email."); return; }
    if (mode !== "verify" && !password.trim()) { setAuthError("Please enter your password."); return; }
    if (mode === "register") {
      if (!name.trim()) { setAuthError("Please enter your full name."); return; }
      if (!phone.trim() || !/^[0-9]{10}$/.test(phone.trim())) {
        setAuthError("Enter a valid 10-digit phone number."); return;
      }
    }

    setAuthLoading(true);
    setAuthError(null);

    try {
      if (mode === "register") {
        const res = await AuthAPI.register(
          name.trim(), email.trim(), password, phone.trim(), currentDevice.trim()
        );
        setAuthSuccess(true);
        setTimeout(() => {
          setAuthSuccess(false);
          Alert.alert("OTP Sent", res.data.message || "Check your email for the verification code.");
          setMode("verify");
        }, 1000);
      } else if (mode === "login") {
        try {
          const res = await AuthAPI.login(email.trim(), password);
          if (res.data.token) {
            await AsyncStorage.setItem("rj_token", res.data.token);
            setAuthSuccess(true);
            setTimeout(() => {
              if (onAuthSuccess) onAuthSuccess(res.data.token);
            }, 1300);
          }
        } catch (ex) {
          if (ex?.response?.status === 403 && ex?.response?.data?.email) {
            setEmail(ex.response.data.email);
            Alert.alert("Verify Email", ex.response.data.message || "Please verify your email first.");
            setMode("verify");
          } else {
            throw ex;
          }
        }
      } else if (mode === "verify") {
        if (!otp.trim()) { setAuthError("Enter the 6-digit OTP code."); setAuthLoading(false); return; }
        const res = await AuthAPI.verifyOTP(email, otp);
        if (res.data.token) {
          await AsyncStorage.setItem("rj_token", res.data.token);
          setAuthSuccess(true);
          setTimeout(() => {
            if (onAuthSuccess) onAuthSuccess(res.data.token);
          }, 1300);
        }
      }
    } catch (err) {
      setAuthError(err?.response?.data?.message || "Incorrect password, try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const mascotState = getMascotState();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.root}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Background ambient glows ── */}
        <View style={styles.glowTopRight} />
        <View style={styles.glowBottomLeft} />

        <View style={styles.inner}>

          {/* ══════════════════════════════════════
              HEADER — Brand badge + Mascot + Headings
              ══════════════════════════════════════ */}
          <View style={styles.header}>

            {/* Brand pill badge */}
            <View style={styles.brandBadge}>
              <View style={styles.badgeLogoBox}>
                <Image source={logo} style={styles.badgeLogo} resizeMode="contain" />
              </View>
              <Text style={styles.brandText}>RJ MOBILE STORE</Text>
            </View>

            {/* Mascot — fixed 130×130 */}
            <View style={styles.mascotWrap}>
              <RJMascot state={mascotState} />
            </View>

            {/* Heading */}
            <Text style={styles.heading}>
              {mode === "login" && "Welcome Back!"}
              {mode === "register" && "Create Account"}
              {mode === "verify" && "Verify Email"}
            </Text>

            {/* Subtitle */}
            <Text style={styles.subheading}>
              {mode === "login" && "Sign in to continue shopping"}
              {mode === "register" && "Join RJ Mobile Store for exclusive deals"}
              {mode === "verify" && `Enter the OTP sent to ${email}`}
            </Text>
          </View>

          {/* ══════════════════════════════════════
              LOGIN CARD
              ══════════════════════════════════════ */}
          <View style={styles.card}>

            {/* ── SUCCESS STATE ── */}
            {authSuccess ? (
              <View style={styles.successBox}>
                <View style={styles.successCircle}>
                  <Ionicons name="checkmark" size={30} color="#0D0D12" />
                </View>
                <Text style={styles.successTitle}>Login Successful!</Text>
                <Text style={styles.successSub}>Redirecting...</Text>
              </View>
            ) : (

              <View style={styles.form}>

                {/* ── Register extra fields ── */}
                {mode === "register" && (
                  <>
                    <InputField
                      label="Full Name"
                      icon="person-outline"
                      placeholder="Rahul Sharma"
                      value={name}
                      onChangeText={(v) => { setName(v); setAuthError(null); }}
                      focused={focusedInput === "name"}
                      onFocus={() => setFocusedInput("name")}
                      onBlur={() => setFocusedInput(null)}
                    />
                    <InputField
                      label="WhatsApp Number"
                      prefixText="+91"
                      placeholder="10-digit number"
                      value={phone}
                      onChangeText={(v) => { setPhone(v.replace(/\D/g, "")); setAuthError(null); }}
                      focused={focusedInput === "phone"}
                      onFocus={() => setFocusedInput("phone")}
                      onBlur={() => setFocusedInput(null)}
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                    <InputField
                      label="Current Phone Model (Optional)"
                      icon="phone-portrait-outline"
                      placeholder="iPhone 14, OnePlus 9..."
                      value={currentDevice}
                      onChangeText={setCurrentDevice}
                      focused={focusedInput === "device"}
                      onFocus={() => setFocusedInput("device")}
                      onBlur={() => setFocusedInput(null)}
                    />
                  </>
                )}

                {/* ── OTP field ── */}
                {mode === "verify" && (
                  <InputField
                    label="6-Digit OTP Code"
                    icon="key-outline"
                    placeholder="1  2  3  4  5  6"
                    value={otp}
                    onChangeText={(v) => { setOtp(v); setAuthError(null); }}
                    focused={focusedInput === "otp"}
                    onFocus={() => setFocusedInput("otp")}
                    onBlur={() => setFocusedInput(null)}
                    keyboardType="number-pad"
                    maxLength={6}
                    centered
                  />
                )}

                {/* ── Email ── */}
                {mode !== "verify" && (
                  <>
                    <InputField
                      label="Email Address"
                      icon="mail"
                      placeholder="customer@rjshop.com"
                      value={email}
                      onChangeText={(v) => { setEmail(v); setAuthError(null); }}
                      focused={focusedInput === "email"}
                      onFocus={() => setFocusedInput("email")}
                      onBlur={() => setFocusedInput(null)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />

                    {/* ── Password ── */}
                    <View>
                      <Text style={styles.label}>Password</Text>
                      <View
                        style={[
                          styles.inputWrap,
                          focusedInput === "password" && styles.inputFocused,
                          authError && styles.inputError,
                        ]}
                      >
                        <View style={[styles.iconBox, authError && styles.iconBoxError]}>
                          <Ionicons
                            name="lock-closed"
                            size={15}
                            color={authError ? "#FF3B30" : "#FFB000"}
                          />
                        </View>
                        <TextInput
                          style={styles.inputText}
                          placeholder="••••••••••••"
                          placeholderTextColor="#555560"
                          value={password}
                          onChangeText={(v) => { setPassword(v); setAuthError(null); }}
                          onFocus={() => setFocusedInput("password")}
                          onBlur={() => setFocusedInput(null)}
                          secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity
                          onPress={() => setShowPassword(!showPassword)}
                          style={styles.eyeBtn}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name={showPassword ? "eye-off-outline" : "eye-outline"}
                            size={18}
                            color="#85858D"
                          />
                        </TouchableOpacity>
                      </View>

                      {authError && (
                        <View style={styles.errorRow}>
                          <Ionicons name="alert-circle" size={13} color="#FF3B30" />
                          <Text style={styles.errorText}>{authError}</Text>
                        </View>
                      )}
                    </View>

                    {/* ── Remember Me + Forgot row ── */}
                    {mode === "login" && (
                      <View style={styles.rowBetween}>
                        <TouchableOpacity
                          style={styles.rememberRow}
                          onPress={() => setRememberMe(!rememberMe)}
                          activeOpacity={0.8}
                        >
                          <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                            {rememberMe && (
                              <Ionicons name="checkmark" size={11} color="#000" />
                            )}
                          </View>
                          <Text style={styles.rememberText}>Remember Me</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() =>
                            Alert.alert(
                              "Forgot Password",
                              "Password reset link will be sent to your email."
                            )
                          }
                          activeOpacity={0.7}
                        >
                          <Text style={styles.forgotText}>Forgot Password?</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}

                {/* ── Sign In Button ── */}
                <TouchableOpacity
                  style={[styles.signInBtn, authLoading && { opacity: 0.8 }]}
                  onPress={handleSubmit}
                  disabled={authLoading}
                  activeOpacity={0.85}
                >
                  {authLoading ? (
                    <ActivityIndicator color="#000000" size="small" />
                  ) : (
                    <View style={styles.signInRow}>
                      <Text style={styles.signInText}>
                        {mode === "login" && "Sign In"}
                        {mode === "register" && "Create Account"}
                        {mode === "verify" && "Verify & Log In"}
                      </Text>
                      <View style={styles.arrowCircle}>
                        <Ionicons name="arrow-forward" size={14} color="#000000" />
                      </View>
                    </View>
                  )}
                </TouchableOpacity>

                {/* ── OR Divider ── */}
                <View style={styles.divider}>
                  <View style={styles.divLine} />
                  <Text style={styles.divText}>OR</Text>
                  <View style={styles.divLine} />
                </View>

                {/* ── Toggle mode ── */}
                <TouchableOpacity
                  onPress={() => {
                    if (mode === "login") setMode("register");
                    else setMode("login");
                    setAuthError(null);
                  }}
                  activeOpacity={0.8}
                  style={styles.toggleRow}
                >
                  <Text style={styles.toggleBase}>
                    {mode === "login"
                      ? "New Customer?  "
                      : "Already a member?  "}
                    <Text style={styles.toggleAccent}>
                      {mode === "login" ? "Create Account →" : "Sign In →"}
                    </Text>
                  </Text>
                </TouchableOpacity>

              </View>
            )}
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ─── Reusable InputField ──────────────────────────────────── */
function InputField({
  label,
  icon,
  prefixText,
  placeholder,
  value,
  onChangeText,
  focused,
  onFocus,
  onBlur,
  keyboardType = "default",
  autoCapitalize = "none",
  maxLength,
  centered = false,
  secureTextEntry = false,
}) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, focused && styles.inputFocused]}>
        {icon ? (
          <View style={styles.iconBox}>
            <Ionicons name={icon} size={15} color="#FFB000" />
          </View>
        ) : null}
        {prefixText ? (
          <Text style={styles.prefixText}>{prefixText}</Text>
        ) : null}
        <TextInput
          style={[styles.inputText, centered && { textAlign: "center", letterSpacing: 6, fontSize: 16 }]}
          placeholder={placeholder}
          placeholderTextColor="#555560"
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          secureTextEntry={secureTextEntry}
        />
      </View>
    </View>
  );
}

/* ─── Styles ───────────────────────────────────────────────── */
const GOLD = "#FFB000";
const BG = "#0D0D12";
const CARD_BG = "#18181E";
const INPUT_BG = "#141419";
const BORDER = "#2A2A31";
const TEXT = "#F5F5F5";
const MUTED = "#85858D";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 0,
  },

  // Ambient glow blobs
  glowTopRight: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,176,0,0.05)",
  },
  glowBottomLeft: {
    position: "absolute",
    bottom: -60,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,160,0,0.04)",
  },

  inner: {
    width: CARD_W,
    alignItems: "center",
  },

  // Header
  header: {
    alignItems: "center",
    marginBottom: 14,
    width: "100%",
  },

  // Brand badge
  brandBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#141419",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 4,
  },
  badgeLogoBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: "rgba(255,176,0,0.12)",
    borderWidth: 1,
    borderColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  badgeLogo: { width: 12, height: 12 },
  brandText: {
    fontSize: 10,
    fontWeight: "900",
    color: GOLD,
    letterSpacing: 1.2,
  },

  // Mascot container
  mascotWrap: {
    width: 130,
    height: 130,
    alignItems: "center",
    justifyContent: "center",
  },

  // Headings
  heading: {
    fontSize: 24,
    fontWeight: "900",
    color: TEXT,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 28,
  },
  subheading: {
    fontSize: 12,
    color: MUTED,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 4,
  },

  // Card
  card: {
    width: "100%",
    backgroundColor: CARD_BG,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,176,0,0.4)",
    padding: 20,
    shadowColor: GOLD,
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  form: {
    gap: 12,
  },

  // Success
  successBox: {
    paddingVertical: 24,
    alignItems: "center",
    gap: 10,
  },
  successCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#22C55E",
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 5,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: TEXT,
  },
  successSub: {
    fontSize: 12,
    color: MUTED,
    fontWeight: "500",
  },

  // Input
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 5,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    height: 46,
    backgroundColor: INPUT_BG,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
  },
  inputFocused: {
    borderColor: GOLD,
    shadowColor: GOLD,
    shadowOpacity: 0.22,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  inputError: {
    borderColor: "#FF3B30",
    shadowColor: "#FF3B30",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  iconBox: {
    width: 38,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,176,0,0.10)",
    marginRight: 2,
  },
  iconBoxError: {
    backgroundColor: "rgba(255,59,48,0.12)",
  },
  prefixText: {
    fontSize: 12,
    fontWeight: "900",
    color: GOLD,
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  inputText: {
    flex: 1,
    color: TEXT,
    fontSize: 13,
    fontWeight: "600",
    paddingHorizontal: 8,
    height: "100%",
  },
  eyeBtn: {
    paddingHorizontal: 12,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  // Error
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  errorText: {
    fontSize: 11,
    color: "#FF3B30",
    fontWeight: "600",
    flex: 1,
  },

  // Remember + Forgot
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: INPUT_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  rememberText: {
    fontSize: 12,
    color: TEXT,
    fontWeight: "600",
  },
  forgotText: {
    fontSize: 12,
    color: GOLD,
    fontWeight: "700",
  },

  // Sign In Button
  signInBtn: {
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GOLD,
    shadowColor: GOLD,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
    marginTop: 4,
  },
  signInRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  signInText: {
    color: "#000000",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  arrowCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  // OR Divider
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  divLine: {
    flex: 1,
    height: 1,
    backgroundColor: BORDER,
  },
  divText: {
    marginHorizontal: 10,
    fontSize: 11,
    fontWeight: "700",
    color: MUTED,
  },

  // Toggle
  toggleRow: {
    alignItems: "center",
  },
  toggleBase: {
    fontSize: 12,
    fontWeight: "600",
    color: TEXT,
    textAlign: "center",
  },
  toggleAccent: {
    color: GOLD,
    fontWeight: "900",
  },
});
