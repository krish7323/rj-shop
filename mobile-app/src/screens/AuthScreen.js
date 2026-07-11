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
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { AuthAPI } from "../lib/api";
import { colors, radius, spacing } from "../lib/theme";
import logo from "../assets/logo.png";

export default function AuthScreen({ onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [phone, setPhone] = useState("");
  const [currentDevice, setCurrentDevice] = useState("");
  
  const [otp, setOtp] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Check your details", "Please fill in all fields.");
      return;
    }
    if (isRegister) {
      if (!name.trim()) {
        Alert.alert("Check your details", "Please enter your name.");
        return;
      }
      if (!phone.trim()) {
        Alert.alert("Check your details", "Please enter your WhatsApp phone number.");
        return;
      }
      if (!/^[0-9]{10}$/.test(phone.trim())) {
        Alert.alert("Check your details", "Phone number must be a 10-digit number.");
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert("Check your details", "Passwords do not match.");
        return;
      }
      if (!agreeTerms) {
        Alert.alert("Check your details", "You must agree to the Terms of Service & Privacy Policy.");
        return;
      }
    }

    setAuthLoading(true);
    try {
      let res;
      if (isRegister) {
        res = await AuthAPI.register(name.trim(), email.trim(), password, phone.trim(), currentDevice.trim());
        Alert.alert("Verification Sent", res.data.message || "OTP code sent to your email!");
        setIsVerifying(true);
      } else {
        try {
          res = await AuthAPI.login(email.trim(), password);
          if (res.data.token) {
            await AsyncStorage.setItem("rj_token", res.data.token);
            if (onAuthSuccess) {
              onAuthSuccess(res.data.token);
            }
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
      Alert.alert(
        "Authentication failed",
        err?.response?.data?.message || "Invalid credentials. Please try again."
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!otp.trim()) {
      Alert.alert("Check OTP", "Please enter the 6-digit OTP code.");
      return;
    }

    setAuthLoading(true);
    try {
      const res = await AuthAPI.verifyOTP(email, otp);
      if (res.data.token) {
        await AsyncStorage.setItem("rj_token", res.data.token);
        if (onAuthSuccess) {
          onAuthSuccess(res.data.token);
        }
      }
    } catch (err) {
      Alert.alert(
        "Verification failed",
        err?.response?.data?.message || "Invalid verification code. Please try again."
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResending(true);
    try {
      const res = await AuthAPI.resendOTP(email);
      Alert.alert("Code Sent", res.data.message || "New verification code sent to your email.");
    } catch (err) {
      Alert.alert("Failed", err?.response?.data?.message || "Could not resend code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>RJ MOBILE STORE</Text>
          <Text style={styles.subtitle}>Verified Customer Sign In</Text>
        </View>

        {isVerifying ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Verify Your Email</Text>
            <Text style={styles.cardSub}>Enter the 6-digit OTP code sent to {email}.</Text>

            <TextInput
              style={[styles.input, { letterSpacing: 4, textAlign: "center", fontSize: 18, fontWeight: "bold" }]}
              placeholder="6-Digit OTP"
              placeholderTextColor="#94a3b8"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />

            <TouchableOpacity style={styles.btn} onPress={handleVerify} disabled={authLoading}>
              {authLoading ? (
                <ActivityIndicator color={colors.navy} />
              ) : (
                <Text style={styles.btnText}>Verify & Log In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.toggle} onPress={handleResendOTP} disabled={resending}>
              <Text style={styles.toggleText}>
                {resending ? "Resending..." : "Resend Verification Code"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggle, { marginTop: 12 }]}
              onPress={() => setIsVerifying(false)}
            >
              <Text style={[styles.toggleText, { color: colors.muted }]}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{isRegister ? "Create Account" : "Sign In"}</Text>
            <Text style={styles.cardSub}>Please login to access catalog & place orders.</Text>

            {isRegister && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#94a3b8"
                  value={name}
                  onChangeText={setName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="WhatsApp Number (10 Digits)"
                  placeholderTextColor="#94a3b8"
                  value={phone}
                  onChangeText={(val) => setPhone(val.replace(/\D/g, ""))}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Current Phone (e.g. iPhone 11)"
                  placeholderTextColor="#94a3b8"
                  value={currentDevice}
                  onChangeText={setCurrentDevice}
                />
              </>
            )}

            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {isRegister && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#94a3b8"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />

                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setAgreeTerms(!agreeTerms)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                    {agreeTerms && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  <Text style={styles.checkboxText}>
                    I agree to the <Text style={styles.checkboxLink}>Terms of Service</Text> & <Text style={styles.checkboxLink}>Privacy Policy</Text>.
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={styles.btn} onPress={handleAuth} disabled={authLoading}>
              {authLoading ? (
                <ActivityIndicator color={colors.navy} />
              ) : (
                <Text style={styles.btnText}>{isRegister ? "Sign Up & Verify" : "Sign In"}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggle}
              onPress={() => {
                setIsRegister(!isRegister);
                setName("");
                setPhone("");
                setCurrentDevice("");
                setEmail("");
                setPassword("");
              }}
            >
              <Text style={styles.toggleText}>
                {isRegister ? "Already have an account? Sign In" : "New Customer? Create Account"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d131b" },
  scroll: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: spacing.lg },
  header: { alignItems: "center", marginBottom: 24 },
  logo: { width: 90, height: 90, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: "900", color: "#fff", letterSpacing: 1 },
  subtitle: { fontSize: 13, color: colors.accent, fontWeight: "800", marginTop: 4 },
  card: { width: "100%", backgroundColor: "#fff", padding: 24, borderRadius: radius.lg, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  cardTitle: { fontSize: 18, fontWeight: "900", color: colors.text, textAlign: "center" },
  cardSub: { fontSize: 12, color: colors.sub, textAlign: "center", marginTop: 4, marginBottom: 20 },
  input: { width: "100%", height: 46, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 16, fontSize: 13, color: colors.text, marginBottom: 12, backgroundColor: "#f8fafc" },
  btn: { width: "100%", height: 46, backgroundColor: colors.accent, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", marginTop: 8 },
  btnText: { color: colors.navy, fontSize: 14, fontWeight: "900" },
  toggle: { marginTop: 16, alignItems: "center" },
  toggleText: { color: colors.accentDark, fontSize: 12, fontWeight: "800" },
  checkboxContainer: { flexDirection: "row", alignItems: "center", width: "100%", marginVertical: 8, paddingHorizontal: 4 },
  checkbox: { width: 18, height: 18, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xs, alignItems: "center", justifyContent: "center", marginRight: 8, backgroundColor: "#f8fafc" },
  checkboxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkboxText: { fontSize: 11, color: colors.sub, flex: 1, fontWeight: "600" },
  checkboxLink: { color: colors.accentDark, textDecorationLine: "underline" },
});
