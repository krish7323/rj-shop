// src/screens/OrdersScreen.js
// Order history + tracking: fetches the customer's orders from the backend, shows
// payment method/status, the order lifecycle stage, and the Shiprocket tracking id.

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OrderAPI, AuthAPI } from "../lib/api";
import { DEMO_ORDERS, inr, dateShort } from "../lib/format";
import { colors, radius, spacing } from "../lib/theme";
import { useCart } from "../context/CartContext";

// Ordered lifecycle for the progress tracker.
const FLOW = ["Confirmed", "Processing", "Shipped", "Delivered"];

const STATUS_COLOR = {
  Pending: colors.muted,
  Confirmed: "#2563eb",
  Processing: "#7c3aed",
  Shipped: "#8b5cf6",
  Delivered: colors.success,
  Cancelled: colors.danger,
  Returned: "#ea580c",
  Paid: colors.success,
  Failed: colors.danger,
  Refunded: "#ea580c",
};

function statusColor(s) {
  return STATUS_COLOR[s] || colors.muted;
}

function Tracker({ status }) {
  // Cancelled / returned orders show a flat state instead of the flow.
  if (status === "Cancelled" || status === "Returned") {
    return (
      <View style={styles.flatState}>
        <Ionicons name="close-circle" size={16} color={colors.danger} />
        <Text style={[styles.flatStateText, { color: colors.danger }]}>{status}</Text>
      </View>
    );
  }

  const activeIndex = Math.max(0, FLOW.indexOf(status));
  return (
    <View style={styles.tracker}>
      {FLOW.map((step, i) => {
        const done = i <= activeIndex;
        return (
          <React.Fragment key={step}>
            <View style={styles.trackStep}>
              <View style={[styles.trackDot, done && { backgroundColor: colors.success, borderColor: colors.success }]}>
                {done && <Ionicons name="checkmark" size={11} color="#fff" />}
              </View>
              <Text style={[styles.trackLabel, done && { color: colors.text, fontWeight: "700" }]}>{step}</Text>
            </View>
            {i < FLOW.length - 1 && (
              <View style={[styles.trackLine, i < activeIndex && { backgroundColor: colors.success }]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function OrderCard({ order }) {
  const itemCount = (order.items || []).reduce((s, i) => s + (i.quantity || 0), 0);
  const firstItems = (order.items || []).slice(0, 2).map((i) => i.name).join(", ");
  const more = (order.items || []).length > 2 ? ` +${order.items.length - 2} more` : "";

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderId}>#{String(order._id).slice(-8).toUpperCase()}</Text>
          <Text style={styles.orderDate}>{dateShort(order.createdAt)}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusColor(order.status) + "22" }]}>
          <Text style={[styles.statusPillText, { color: statusColor(order.status) }]}>{order.status}</Text>
        </View>
      </View>

      {/* Detailed Products List */}
      <View style={{ backgroundColor: "#f8fafc", borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 6, marginTop: 10, borderWidth: 1, borderColor: "#e2e8f0" }}>
        {(order.items || []).map((item, idx) => (
          <View key={idx} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: idx < order.items.length - 1 ? 1 : 0, borderBottomColor: "#e2e8f0" }}>
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={{ width: 28, height: 28, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border }} />
              ) : (
                <View style={{ width: 28, height: 28, borderRadius: radius.sm, backgroundColor: "#e2e8f0", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="cube-outline" size={14} color={colors.sub} />
                </View>
              )}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: colors.text }} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={{ fontSize: 10, color: colors.muted, marginTop: 1 }}>
                  Qty: {item.quantity} · {inr(item.price)} each
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 12, fontWeight: "800", color: colors.text, marginLeft: 8 }}>
              {inr(item.price * item.quantity)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.divider} />
      <Tracker status={order.status} />

      {/* Payment + Shiprocket tracking */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons
            name={order.paymentMethod === "COD" ? "cash-outline" : "card-outline"}
            size={15}
            color={colors.sub}
          />
          <Text style={styles.metaText}>{order.paymentMethod}</Text>
          <View style={[styles.dot, { backgroundColor: statusColor(order.paymentStatus) }]} />
          <Text style={[styles.metaText, { color: statusColor(order.paymentStatus) }]}>
            {order.paymentStatus}
          </Text>
        </View>
      </View>

      <View style={styles.trackingRow}>
        <Ionicons name="cube-outline" size={15} color={colors.accentDark} />
        {order.shiprocketTrackingId ? (
          <Text style={styles.trackingText}>
            Shiprocket: <Text style={styles.trackingId}>{order.shiprocketTrackingId}</Text>
          </Text>
        ) : (
          <Text style={styles.trackingPending}>Awaiting Shiprocket dispatch</Text>
        )}
      </View>
    </View>
  );
}

export default function OrdersScreen({ navigation }) {
  const { setToken } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [live, setLive] = useState(false);

  // Auth states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [currentDevice, setCurrentDevice] = useState("");
  const [otp, setOtp] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await AuthAPI.me();
      setCurrentUser(res.data.user);
    } catch {
      setCurrentUser(null);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    const token = await AsyncStorage.getItem("rj_token");
    if (!token) {
      setOrders([]);
      setIsLoggedIn(false);
      setCurrentUser(null);
      setLive(false);
      return;
    }
    setIsLoggedIn(true);
    fetchProfile();
    try {
      const res = await OrderAPI.mine();
      const list = res.data.orders || [];
      setOrders(list);
      setLive(true);
    } catch {
      setOrders([]);
      setLive(false);
    }
  }, [fetchProfile]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      (async () => {
        setLoading(true);
        await fetchOrders();
        setLoading(false);
      })();
    });
    return unsubscribe;
  }, [navigation, fetchOrders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

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
          res = await AuthAPI.login(email, password);
          if (res.data.token) {
            await AsyncStorage.setItem("rj_token", res.data.token);
            setName("");
            setEmail("");
            setPassword("");
            setIsLoggedIn(true);
            
            // Fetch fresh orders
            setLoading(true);
            await fetchOrders();
            setLoading(false);
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
        setName("");
        setEmail("");
        setPassword("");
        setOtp("");
        setIsVerifying(false);
        setIsLoggedIn(true);

        // Fetch fresh orders
        setLoading(true);
        await fetchOrders();
        setLoading(false);
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

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("rj_token");
          setIsLoggedIn(false);
          setOrders([]);
          setToken(null);
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading your orders…</Text>
      </View>
    );
  }

  if (!isLoggedIn) {
    return (
      <View style={styles.authContainer}>
        {isVerifying ? (
          <View style={styles.authCard}>
            <Text style={styles.authTitle}>Verify Your Email</Text>
            <Text style={styles.authSub}>Enter the 6-digit OTP code sent to {email}.</Text>

            <TextInput
              style={[styles.input, { letterSpacing: 4, textAlign: "center", fontSize: 18, fontWeight: "bold" }]}
              placeholder="6-Digit OTP"
              placeholderTextColor="#94a3b8"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />

            <TouchableOpacity style={styles.authBtn} onPress={handleVerify} disabled={authLoading}>
              {authLoading ? (
                <ActivityIndicator color={colors.navy} />
              ) : (
                <Text style={styles.authBtnText}>Verify & Log In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.toggleBtn} onPress={handleResendOTP} disabled={resending}>
              <Text style={styles.toggleText}>
                {resending ? "Resending..." : "Resend Verification Code"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleBtn, { marginTop: 12 }]}
              onPress={() => {
                setIsVerifying(false);
              }}
            >
              <Text style={[styles.toggleText, { color: colors.muted }]}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.authCard}>
            <Text style={styles.authTitle}>{isRegister ? "Create Account" : "Sign In"}</Text>
            <Text style={styles.authSub}>Access your account to place and track orders.</Text>

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

            <TouchableOpacity style={styles.authBtn} onPress={handleAuth} disabled={authLoading}>
              {authLoading ? (
                <ActivityIndicator color={colors.navy} />
              ) : (
                <Text style={styles.authBtnText}>{isRegister ? "Register & Send OTP" : "Sign In"}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.toggleBtn} onPress={() => setIsRegister(!isRegister)}>
              <Text style={styles.toggleText}>
                {isRegister ? "Already have an account? Sign In" : "New to RJ Shop? Create Account"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      data={orders}
      keyExtractor={(o) => o._id}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: 24 }}
      ListHeaderComponent={
        <View style={{ marginBottom: spacing.md }}>
          <View style={styles.header}>
            <Text style={styles.title}>My Orders</Text>
            <TouchableOpacity onPress={handleSignOut} style={styles.signoutBtn}>
              <Ionicons name="log-out-outline" size={16} color={colors.danger} />
              <Text style={styles.signoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
          
          {currentUser && (
            <View style={styles.profileCard}>
              <View style={styles.profileRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {currentUser.name
                      ? currentUser.name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()
                      : "U"}
                  </Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{currentUser.name}</Text>
                  <Text style={styles.profileEmail}>{currentUser.email}</Text>
                  
                  {(currentUser.phone || currentUser.currentDevice) && (
                    <View style={styles.badgeRow}>
                      {currentUser.phone ? (
                        <View style={styles.profileBadge}>
                          <Text style={styles.profileBadgeText}>💬 +91 {currentUser.phone}</Text>
                        </View>
                      ) : null}
                      {currentUser.currentDevice ? (
                        <View style={[styles.profileBadge, { backgroundColor: "#f1f5f9", borderColor: "#cbd5e1" }]}>
                          <Text style={[styles.profileBadgeText, { color: "#475569" }]}>📱 {currentUser.currentDevice}</Text>
                        </View>
                      ) : null}
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}
          
          {orders.length > 0 && (
            <View style={styles.statsCard}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>TOTAL ORDERS</Text>
                <Text style={styles.statVal}>{orders.length}</Text>
              </View>
              <View style={[styles.statBox, { borderLeftWidth: 1, borderLeftColor: colors.border }]}>
                <Text style={styles.statLabel}>PENDING DELIVERY</Text>
                <Text style={[styles.statVal, { color: colors.accentDark }]}>
                  {orders.filter((o) => o.status !== "Delivered" && o.status !== "Cancelled").length}
                </Text>
              </View>
            </View>
          )}
        </View>
      }
      renderItem={({ item }) => <OrderCard order={item} />}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Ionicons name="receipt-outline" size={56} color={colors.muted} />
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.loadingText}>Your placed orders will appear here.</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate("HomeTab")}>
            <Text style={styles.shopBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 80, gap: 8 },
  loadingText: { color: colors.sub },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: colors.text, marginTop: 6 },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md },
  title: { fontSize: 22, fontWeight: "900", color: colors.text },
  demoTag: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    elevation: 1,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyStyle: "space-between" },
  orderId: { fontSize: 15, fontWeight: "900", color: colors.text },
  orderDate: { fontSize: 12, color: colors.muted, marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  statusPillText: { fontSize: 12, fontWeight: "800" },

  itemsLine: { color: colors.text, fontSize: 14, fontWeight: "600", marginTop: 10 },
  itemsMeta: { color: colors.sub, fontSize: 13, marginTop: 3 },

  divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },

  tracker: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  trackStep: { alignItems: "center", width: 62 },
  trackDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  trackLabel: { fontSize: 10, color: colors.muted, marginTop: 5, textAlign: "center" },
  trackLine: { flex: 1, height: 2, backgroundColor: colors.border, marginTop: 10 },

  flatState: { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center", paddingVertical: 4 },
  flatStateText: { fontWeight: "800", fontSize: 14 },

  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 14 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 13, color: colors.sub, fontWeight: "600" },
  dot: { width: 6, height: 6, borderRadius: 3, marginLeft: 4 },

  trackingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    backgroundColor: "#fff8eb",
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  trackingText: { fontSize: 12, color: colors.sub },
  trackingId: { fontWeight: "800", color: colors.text },
  trackingPending: { fontSize: 12, color: colors.muted, fontStyle: "italic" },

  shopBtn: { backgroundColor: colors.accent, paddingHorizontal: 20, paddingVertical: 11, borderRadius: radius.pill, marginTop: 12 },
  shopBtnText: { color: colors.navy, fontWeight: "800" },

  // Auth Styles
  authContainer: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  authCard: { width: "100%", backgroundColor: "#fff", padding: 24, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  authTitle: { fontSize: 20, fontWeight: "900", color: colors.text, textAlign: "center" },
  authSub: { fontSize: 13, color: colors.sub, textAlign: "center", marginTop: 4, marginBottom: 20 },
  input: { width: "100%", height: 48, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 16, fontSize: 14, color: colors.text, marginBottom: 12, backgroundColor: "#f8fafc" },
  authBtn: { width: "100%", height: 48, backgroundColor: colors.accent, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", marginTop: 8 },
  authBtnText: { color: colors.navy, fontSize: 15, fontWeight: "800" },
  toggleBtn: { marginTop: 16, alignItems: "center" },
  toggleText: { color: colors.accentDark, fontSize: 13, fontWeight: "700" },
  signoutBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: "#fff5f5" },
  signoutText: { color: colors.danger, fontSize: 12, fontWeight: "800" },

  // Stats Card Styles
  statsCard: { flexDirection: "row", backgroundColor: "#fff", borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingVertical: 12, marginTop: 8, elevation: 1 },
  statBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  statLabel: { fontSize: 9, color: colors.muted, fontWeight: "700" },
  statVal: { fontSize: 16, fontWeight: "900", color: colors.text, marginTop: 2 },

  // Profile Card Styles
  profileCard: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 16, marginTop: 12, elevation: 1 },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.navy, fontSize: 16, fontWeight: "900" },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 15, fontWeight: "800", color: colors.text },
  profileEmail: { fontSize: 12, color: colors.sub, marginTop: 1 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  profileBadge: { backgroundColor: "#ecfdf5", borderWidth: 1, borderColor: "#a7f3d0", borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 2 },
  profileBadgeText: { fontSize: 10, fontWeight: "800", color: "#065f46" },
});
