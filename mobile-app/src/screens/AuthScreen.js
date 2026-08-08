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

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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
            }, 1000);
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
      const errMsg = err?.response?.data?.message || "Invalid credentials. Please try again.";
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
        }, 1000);
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
            <Image source={logo} style={styles.logo} resizeMode="contain" />
            <Text style={styles.brandTitle}>RJ MOBILE STORE</Text>
          </View>

          {/* Interactive Mascot */}
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

        {/* Login Card */}
        <View style={styles.card}>
          
          {authError && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color="#FF3B30" />
              <Text style={styles.errorText}>{authError}</Text>
            </View>
          )}

          {isVerifying ? (
            <View style={{ gap: 14 }}>
              <Text style={styles.inputLabel}>6-DIGIT OTP VERIFICATION CODE</Text>
              <TextInput
                style={[styles.input, { letterSpacing: 6, textAlign: "center", fontSize: 20, fontWeight: "bold", color: "#FFB300" }]}
                placeholder="123456"
                placeholderTextColor="#666675"
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
                  <ActivityIndicator color="#0B0B0F" />
                ) : (
                  <Text style={styles.btnText}>VERIFY & LOG IN →</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {isRegister && (
                <>
                  <View>
                    <Text style={styles.inputLabel}>FULL NAME</Text>
                    <View style={[styles.inputWrap, focusedInput === "name" && styles.inputWrapFocused]}>
                      <Ionicons name="person-outline" size={16} color="#9A9AA3" />
                      <TextInput
                        style={styles.inputText}
                        placeholder="Rahul Sharma"
                        placeholderTextColor="#666675"
                        value={name}
                        onFocus={() => setFocusedInput("name")}
                        onBlur={() => setFocusedInput(null)}
                        onChangeText={setName}
                      />
                    </View>
                  </View>

                  <View>
                    <Text style={styles.inputLabel}>WHATSAPP PHONE NUMBER</Text>
                    <View style={[styles.inputWrap, focusedInput === "phone" && styles.inputWrapFocused]}>
                      <Text style={styles.prefix}>+91</Text>
                      <TextInput
                        style={styles.inputText}
                        placeholder="10-digit number"
                        placeholderTextColor="#666675"
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
                <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                <View
                  style={[
                    styles.inputWrap,
                    focusedInput === "email" && styles.inputWrapFocused,
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={16}
                    color={focusedInput === "email" ? "#FFB300" : "#9A9AA3"}
                  />
                  <TextInput
                    style={styles.inputText}
                    placeholder="customer@rjshop.com"
                    placeholderTextColor="#666675"
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
                  {isValidEmail && <Ionicons name="checkmark-circle" size={16} color="#2ECC71" />}
                </View>
              </View>

              {/* Password */}
              <View>
                <Text style={styles.inputLabel}>PASSWORD</Text>
                <View
                  style={[
                    styles.inputWrap,
                    authError && { borderColor: "#FF3B30" },
                    focusedInput === "password" && styles.inputWrapFocused,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={16}
                    color={focusedInput === "password" ? "#FFB300" : "#9A9AA3"}
                  />
                  <TextInput
                    style={styles.inputText}
                    placeholder="••••••••••••"
                    placeholderTextColor="#666675"
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
                      color="#9A9AA3"
                    />
                  </TouchableOpacity>
                </View>
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
                      {rememberMe && <Ionicons name="checkmark" size={12} color="#0B0B0F" />}
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
                style={[styles.btn, authSuccess && styles.btnSuccess]}
                onPress={handleAuth}
                disabled={authLoading || authSuccess}
                activeOpacity={0.85}
              >
                {authLoading ? (
                  <ActivityIndicator color="#0B0B0F" />
                ) : authSuccess ? (
                  <View style={styles.btnRow}>
                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                    <Text style={[styles.btnText, { color: "#FFFFFF" }]}>SUCCESSFUL!</Text>
                  </View>
                ) : (
                  <View style={styles.btnRow}>
                    <Text style={styles.btnText}>
                      {isRegister ? "CREATE ACCOUNT" : "SIGN IN"}
                    </Text>
                    <Ionicons name="arrow-forward" size={16} color="#0B0B0F" />
                  </View>
                )}
              </TouchableOpacity>

              {/* Divider */}
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
  scroll: { flexGrow: 1, justifyContent: "center", padding: 18 },
  
  header: { alignItems: "center", marginBottom: 14 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#15151B",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#28282F",
    marginBottom: 4,
  },
  logo: { width: 18, height: 18 },
  brandTitle: { fontSize: 11, fontWeight: "900", color: "#FFB300", letterSpacing: 1 },
  
  title: { fontSize: 24, fontWeight: "900", color: "#F5F5F5", marginTop: 4 },
  subtitle: { fontSize: 12, color: "#9A9AA3", fontWeight: "600", marginTop: 2 },
  
  card: {
    backgroundColor: "#1A1A20",
    padding: 22,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 179, 0, 0.3)",
    elevation: 8,
    shadowColor: "#FFB300",
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 59, 48, 0.15)",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 59, 48, 0.4)",
    marginBottom: 10,
  },
  errorText: { fontSize: 12, color: "#FF3B30", fontWeight: "700", flex: 1 },

  inputLabel: { fontSize: 10, fontWeight: "900", color: "#9A9AA3", letterSpacing: 0.8, marginBottom: 4 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    backgroundColor: "#15151B",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#28282F",
    paddingHorizontal: 14,
    gap: 10,
  },
  inputWrapFocused: {
    borderColor: "#FFB300",
    shadowColor: "#FFB300",
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  inputText: { flex: 1, color: "#F5F5F5", fontSize: 13, fontWeight: "700" },
  prefix: { color: "#FFB300", fontSize: 12, fontWeight: "900", paddingRight: 6, borderRightWidth: 1, borderRightColor: "#28282F" },

  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: 4 },
  rememberRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1, borderColor: "#28282F", backgroundColor: "#15151B", alignItems: "center", justifyContent: "center" },
  checkboxChecked: { backgroundColor: "#FFB300", borderColor: "#FFB300" },
  rememberText: { fontSize: 12, color: "#9A9AA3", fontWeight: "600" },
  forgotText: { fontSize: 12, color: "#FFB300", fontWeight: "800" },

  btn: {
    height: 48,
    backgroundColor: "#FFB300",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#FFB300",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  btnSuccess: { backgroundColor: "#2ECC71" },
  btnRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  btnText: { color: "#0B0B0F", fontSize: 13, fontWeight: "900", letterSpacing: 0.5 },

  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 14 },
  line: { flex: 1, height: 1, backgroundColor: "#28282F" },
  dividerText: { marginHorizontal: 10, fontSize: 10, fontWeight: "900", color: "#9A9AA3" },

  toggleBtn: { alignItems: "center" },
  toggleSub: { fontSize: 12, color: "#9A9AA3", fontWeight: "700" },
  toggleHighlight: { color: "#FFB300", fontWeight: "900" },
});
