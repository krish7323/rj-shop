// src/screens/AuthScreen.js
import React, { useState } from "react";
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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { AuthAPI } from "../lib/api";
import RJMascot from "../components/RJMascot";
import logo from "../assets/logo.png";

export default function AuthScreen({ onAuthSuccess, onClose }) {
  const [isRegister, setIsRegister] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [currentDevice, setCurrentDevice] = useState("");
  const [otp, setOtp] = useState("");
  
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [authLoading, setAuthLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [focusedInput, setFocusedInput] = useState(null);

  // Dynamic Mascot State
  const getMascotState = () => {
    if (authSuccess) return "login_success";
    if (authError) return "login_error";
    if (authLoading) return "login_loading";
    if (focusedInput === "password") {
      return showPassword ? "password_visible" : "password_focus";
    }
    if (focusedInput === "email") {
      return email.length > 0 ? "typing_email" : "email_focus";
    }
    return "idle";
  };

  const mascotState = getMascotState();

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      setAuthError("Please fill in both email and password.");
      return;
    }
    if (isRegister) {
      if (!name.trim()) {
        setAuthError("Please enter your full name.");
        return;
      }
      if (!phone.trim() || !/^[0-9]{10}$/.test(phone.trim())) {
        setAuthError("Please enter a valid 10-digit WhatsApp phone number.");
        return;
      }
    }

    setAuthLoading(true);
    setAuthError(null);

    try {
      if (isRegister) {
        const res = await AuthAPI.register(name.trim(), email.trim(), password, phone.trim(), currentDevice.trim());
        setAuthSuccess(true);
        setTimeout(() => {
          setAuthSuccess(false);
          Alert.alert("Verification Sent", res.data.message || "OTP code sent to your email!");
          setIsVerifying(true);
        }, 1000);
      } else {
        try {
          const res = await AuthAPI.login(email.trim(), password);
          if (res.data.token) {
            await AsyncStorage.setItem("rj_token", res.data.token);
            setAuthSuccess(true);
            setTimeout(() => {
              if (onAuthSuccess) onAuthSuccess(res.data.token);
            }, 1200);
          }
        } catch (ex) {
          if (ex?.response?.status === 403 && ex?.response?.data?.email) {
            setEmail(ex.response.data.email);
            Alert.alert("Verification Required", ex.response.data.message || "Please verify your email address to log in.");
            setIsVerifying(true);
          } else {
            throw ex;
          }
        }
      }
    } catch (err) {
      const errMsg = err?.response?.data?.message || "Incorrect password, try again.";
      setAuthError(errMsg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!otp.trim()) {
      setAuthError("Please enter the 6-digit OTP code.");
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await AuthAPI.verifyOTP(email, otp);
      if (res.data.token) {
        await AsyncStorage.setItem("rj_token", res.data.token);
        setAuthSuccess(true);
        setTimeout(() => {
          if (onAuthSuccess) onAuthSuccess(res.data.token);
        }, 1200);
      }
    } catch (err) {
      setAuthError(err?.response?.data?.message || "Invalid verification code.");
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        
        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <View style={styles.badgeLogoBox}>
              <Image source={logo} style={styles.logo} resizeMode="contain" />
            </View>
            <Text style={styles.brandTitle}>RJ MOBILE STORE</Text>
          </View>

          {/* Compact Mascot */}
          <RJMascot state={mascotState} emailLength={email.length} />

          <Text style={styles.title}>
            {isVerifying ? "Verify Email" : isRegister ? "Create Account" : "Welcome Back!"}
          </Text>
          <Text style={styles.subtitle}>
            {isVerifying
              ? `Enter OTP sent to ${email}`
              : isRegister
              ? "Join RJ Mobile Store for tech deals"
              : "Sign in to continue shopping"}
          </Text>
        </View>

        {/* Login Card (Pixel-Accurate to Reference Screenshot) */}
        <View style={styles.card}>
          
          {authSuccess ? (
            <View style={styles.successContainer}>
              <View style={styles.successCircle}>
                <Ionicons name="checkmark" size={32} color="#0D0D12" />
              </View>
              <Text style={styles.successTitle}>Login Successful!</Text>
              <Text style={styles.successSub}>Redirecting...</Text>
            </View>
          ) : isVerifying ? (
            <View style={{ gap: 12 }}>
              <Text style={styles.inputLabel}>6-DIGIT OTP VERIFICATION CODE</Text>
              <TextInput
                style={[styles.input, { letterSpacing: 6, textAlign: "center", fontSize: 20, fontWeight: "bold", color: "#FFB000" }]}
                placeholder="123456"
                placeholderTextColor="#666670"
                value={otp}
                onChangeText={(val) => {
                  setOtp(val);
                  setAuthError(null);
                }}
                keyboardType="number-pad"
                maxLength={6}
              />
              <TouchableOpacity style={styles.btn} onPress={handleVerify} disabled={authLoading}>
                {authLoading ? (
                  <ActivityIndicator color="#000000" />
                ) : (
                  <Text style={styles.btnText}>VERIFY & LOG IN →</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 11 }}>
              {isRegister && (
                <>
                  <View>
                    <Text style={styles.inputLabel}>Full Name</Text>
                    <View style={[styles.inputWrap, focusedInput === "name" && styles.inputWrapFocused]}>
                      <Ionicons name="person-outline" size={16} color="#85858D" />
                      <TextInput
                        style={styles.inputText}
                        placeholder="Rahul Sharma"
                        placeholderTextColor="#666670"
                        value={name}
                        onFocus={() => setFocusedInput("name")}
                        onBlur={() => setFocusedInput(null)}
                        onChangeText={setName}
                      />
                    </View>
                  </View>

                  <View>
                    <Text style={styles.inputLabel}>WhatsApp Number</Text>
                    <View style={[styles.inputWrap, focusedInput === "phone" && styles.inputWrapFocused]}>
                      <Text style={styles.prefix}>+91</Text>
                      <TextInput
                        style={styles.inputText}
                        placeholder="10-digit number"
                        placeholderTextColor="#666670"
                        value={phone}
                        onFocus={() => setFocusedInput("phone")}
                        onBlur={() => setFocusedInput(null)}
                        onChangeText={(val) => setPhone(val.replace(/\D/g, ""))}
                        keyboardType="phone-pad"
                        maxLength={10}
                      />
                    </View>
                  </View>
                </>
              )}

              {/* Email Address */}
              <View>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View
                  style={[
                    styles.inputWrap,
                    focusedInput === "email" && styles.inputWrapFocused,
                  ]}
                >
                  <View style={styles.iconBox}>
                    <Ionicons name="mail" size={15} color="#FFB000" />
                  </View>
                  <TextInput
                    style={styles.inputText}
                    placeholder="customer@rjshop.com"
                    placeholderTextColor="#666670"
                    value={email}
                    onFocus={() => setFocusedInput("email")}
                    onBlur={() => setFocusedInput(null)}
                    onChangeText={(val) => {
                      setEmail(val);
                      setAuthError(null);
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Password */}
              <View>
                <Text style={styles.inputLabel}>Password</Text>
                <View
                  style={[
                    styles.inputWrap,
                    authError && { borderColor: "#FF3B30" },
                    focusedInput === "password" && styles.inputWrapFocused,
                  ]}
                >
                  <View style={[styles.iconBox, authError && { backgroundColor: "rgba(255,59,48,0.15)" }]}>
                    <Ionicons name="lock-closed" size={15} color={authError ? "#FF3B30" : "#FFB000"} />
                  </View>
                  <TextInput
                    style={styles.inputText}
                    placeholder="••••••••••••"
                    placeholderTextColor="#666670"
                    value={password}
                    onFocus={() => setFocusedInput("password")}
                    onBlur={() => setFocusedInput(null)}
                    onChangeText={(val) => {
                      setPassword(val);
                      setAuthError(null);
                    }}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    accessibilityLabel="Toggle password visibility"
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
                    <Ionicons name="alert-circle" size={14} color="#FF3B30" />
                    <Text style={styles.errorText}>{authError}</Text>
                  </View>
                )}
              </View>

              {/* Remember Me & Forgot Password Row */}
              {!isRegister && (
                <View style={styles.rowBetween}>
                  <TouchableOpacity
                    style={styles.rememberRow}
                    onPress={() => setRememberMe(!rememberMe)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                      {rememberMe && <Ionicons name="checkmark" size={12} color="#000000" />}
                    </View>
                    <Text style={styles.rememberText}>Remember Me</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => Alert.alert("Reset Password", "Password reset link sent to your registered email.")}>
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Primary CTA Button */}
              <TouchableOpacity
                style={styles.btn}
                onPress={handleAuth}
                disabled={authLoading}
                activeOpacity={0.85}
              >
                {authLoading ? (
                  <ActivityIndicator color="#000000" />
                ) : (
                  <View style={styles.btnRow}>
                    <Text style={styles.btnText}>
                      {isRegister ? "Create Account" : "Sign In"}
                    </Text>
                    <View style={styles.arrowBadge}>
                      <Ionicons name="arrow-forward" size={14} color="#000000" />
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* OR Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.line} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.line} />
              </View>

              {/* Toggle Register / Login */}
              <TouchableOpacity
                style={styles.toggleBtn}
                onPress={() => {
                  setIsRegister(!isRegister);
                  setAuthError(null);
                }}
              >
                <Text style={styles.toggleSub}>
                  {isRegister ? "Already have an account? " : "New Customer? "}
                  <Text style={styles.toggleHighlight}>
                    {isRegister ? "Sign In →" : "Create Account →"}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D12" },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 16, paddingVertical: 24 },
  
  header: { alignItems: "center", marginBottom: 12 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#141419",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2A2A31",
    marginBottom: 2,
  },
  badgeLogoBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: "rgba(255, 176, 0, 0.15)",
    borderWidth: 1,
    borderColor: "#FFB000",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: 12, height: 12 },
  brandTitle: { fontSize: 10, fontWeight: "900", color: "#FFB000", letterSpacing: 1 },
  
  title: { fontSize: 24, fontWeight: "900", color: "#F5F5F5", marginTop: 2 },
  subtitle: { fontSize: 12, color: "#85858D", fontWeight: "600", marginTop: 2 },
  
  card: {
    backgroundColor: "#18181E",
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 176, 0, 0.35)",
    elevation: 8,
    shadowColor: "#FFB000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },

  successContainer: { paddingVertical: 20, alignItems: "center", justifyContent: "center", gap: 10 },
  successCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#2ECC71", alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 18, fontWeight: "900", color: "#F5F5F5" },
  successSub: { fontSize: 12, color: "#85858D", fontWeight: "600" },
  
  errorRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  errorText: { fontSize: 11, color: "#FF3B30", fontWeight: "700" },

  inputLabel: { fontSize: 11, fontWeight: "700", color: "#85858D", marginBottom: 4 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    height: 46,
    backgroundColor: "#141419",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2A2A31",
    paddingHorizontal: 8,
    gap: 8,
  },
  inputWrapFocused: {
    borderColor: "#FFB000",
    shadowColor: "#FFB000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255, 176, 0, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  inputText: { flex: 1, color: "#F5F5F5", fontSize: 13, fontWeight: "600", paddingHorizontal: 4 },
  prefix: { color: "#FFB000", fontSize: 12, fontWeight: "900", paddingRight: 6, borderRightWidth: 1, borderRightColor: "#2A2A31" },

  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: 2 },
  rememberRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  checkbox: { width: 16, height: 16, borderRadius: 4, borderWidth: 1, borderColor: "#2A2A31", backgroundColor: "#141419", alignItems: "center", justifyContent: "center" },
  checkboxChecked: { backgroundColor: "#FFB000", borderColor: "#FFB000" },
  rememberText: { fontSize: 12, color: "#F5F5F5", fontWeight: "600" },
  forgotText: { fontSize: 12, color: "#FFB000", fontWeight: "700" },

  btn: {
    height: 48,
    backgroundColor: "#FFB000",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    shadowColor: "#FFB000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  btnRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  btnText: { color: "#000000", fontSize: 14, fontWeight: "900" },
  arrowBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(0, 0, 0, 0.15)", alignItems: "center", justifyContent: "center" },

  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 12 },
  line: { flex: 1, height: 1, backgroundColor: "#2A2A31" },
  dividerText: { marginHorizontal: 10, fontSize: 11, fontWeight: "700", color: "#85858D" },

  toggleBtn: { alignItems: "center" },
  toggleSub: { fontSize: 12, color: "#F5F5F5", fontWeight: "600" },
  toggleHighlight: { color: "#FFB000", fontWeight: "900" },
});
