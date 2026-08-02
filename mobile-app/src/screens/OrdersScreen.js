import React, { useCallback, useEffect, useState, useRef } from "react";
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
  Image,
  Animated,
  Easing,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OrderAPI, AuthAPI, CatalogAPI } from "../lib/api";
import { dateShort, inr } from "../lib/format";
import { useCart } from "../context/CartContext";

const FLOW = ["Confirmed", "Processing", "Shipped", "Delivered"];

const STATUS_COLOR = {
  Pending: "#9A9AA5",
  Confirmed: "#3B82F6",
  Processing: "#8B5CF6",
  Shipped: "#C13CFF",
  Delivered: "#2ECC71",
  Cancelled: "#FF4D4D",
  Returned: "#F5A623",
  Paid: "#2ECC71",
  Failed: "#FF4D4D",
};

function statusColor(s) {
  return STATUS_COLOR[s] || "#9A9AA5";
}

function TrackStep({ step, done, active }) {
  const scaleAnim = useRef(new Animated.Value(done ? 1 : 0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (done) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }).start();
    }
    if (active) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.25, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [done, active]);

  return (
    <View style={styles.trackStep}>
      <Animated.View style={[
        styles.trackDot,
        done && { backgroundColor: "#2ECC71", borderColor: "#2ECC71" },
        { transform: [{ scale: active ? pulseAnim : scaleAnim }] }
      ]}>
        {done && <Ionicons name="checkmark" size={11} color="#0B0B0F" />}
      </Animated.View>
      <Text style={[styles.trackLabel, done && { color: "#FFFFFF", fontWeight: "700" }]}>{step}</Text>
    </View>
  );
}

function Tracker({ status }) {
  if (status === "Cancelled" || status === "Returned") {
    return (
      <View style={styles.flatState}>
        <Ionicons name="close-circle" size={16} color="#FF4D4D" />
        <Text style={[styles.flatStateText, { color: "#FF4D4D" }]}>{status}</Text>
      </View>
    );
  }

  const activeIndex = Math.max(0, FLOW.indexOf(status));
  return (
    <View style={styles.tracker}>
      {FLOW.map((step, i) => {
        const done = i <= activeIndex;
        const active = i === activeIndex;
        return (
          <React.Fragment key={step}>
            <TrackStep step={step} done={done} active={active} />
            {i < FLOW.length - 1 && (
              <View style={[styles.trackLine, i < activeIndex && { backgroundColor: "#2ECC71" }]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const FadeInView = (props) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        delay: props.index * 60,
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 450,
        delay: props.index * 60,
        useNativeDriver: Platform.OS !== "web",
      })
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        ...props.style,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      {props.children}
    </Animated.View>
  );
};

function OrderCard({ order, navigation }) {
  const handleProductPress = async (productId, fallbackItem) => {
    if (!productId) return;
    try {
      const res = await CatalogAPI.get(productId);
      if (res.data && res.data.product) {
        navigation.navigate("HomeTab", {
          screen: "ProductDetails",
          params: { product: res.data.product }
        });
      }
    } catch {
      const mockProduct = {
        _id: productId,
        name: fallbackItem.name,
        price: fallbackItem.price,
        mrp: fallbackItem.price,
        images: fallbackItem.image ? [fallbackItem.image] : [],
        description: "Past purchased product details.",
        stock: 0,
      };
      navigation.navigate("HomeTab", {
        screen: "ProductDetails",
        params: { product: mockProduct }
      });
    }
  };

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

      <View style={{ backgroundColor: "#1E1E24", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, marginTop: 10, borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.08)" }}>
        {(order.items || []).map((item, idx) => (
          <TouchableOpacity
            key={idx}
            activeOpacity={0.7}
            onPress={() => handleProductPress(item.product, item)}
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: idx < order.items.length - 1 ? 1 : 0, borderBottomColor: "rgba(255, 255, 255, 0.08)" }}
          >
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={{ width: 28, height: 28, borderRadius: 6 }} />
              ) : (
                <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: "#2A2A30", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="hardware-chip-outline" size={14} color="#F5A623" />
                </View>
              )}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#FFFFFF" }} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={{ fontSize: 10, color: "#9A9AA5", marginTop: 1 }}>
                  Qty: {item.quantity} · {inr(item.price)} each
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 12, fontWeight: "800", color: "#FFFFFF", marginLeft: 8 }}>
              {inr(item.price * item.quantity)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.divider} />
      <Tracker status={order.status} />

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons
            name={order.paymentMethod === "COD" ? "cash-outline" : "card-outline"}
            size={15}
            color="#9A9AA5"
          />
          <Text style={styles.metaText}>{order.paymentMethod}</Text>
          <View style={[styles.dot, { backgroundColor: statusColor(order.paymentStatus) }]} />
          <Text style={[styles.metaText, { color: statusColor(order.paymentStatus) }]}>
            {order.paymentStatus}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function OrdersScreen({ navigation }) {
  const { setToken } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    const token = await AsyncStorage.getItem("rj_token");
    if (!token) {
      setOrders([]);
      setIsLoggedIn(false);
      return;
    }
    setIsLoggedIn(true);
    try {
      const res = await OrderAPI.mine();
      setOrders(res.data.orders || []);
    } catch {
      setOrders([]);
    }
  }, []);

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
    setAuthLoading(true);
    try {
      if (isRegister) {
        await AuthAPI.register(name.trim(), email.trim(), password, phone.trim(), "");
        Alert.alert("Verification Sent", "OTP code sent to your email!");
        setIsVerifying(true);
      } else {
        const res = await AuthAPI.login(email, password);
        if (res.data.token) {
          await AsyncStorage.setItem("rj_token", res.data.token);
          setIsLoggedIn(true);
          setLoading(true);
          await fetchOrders();
          setLoading(false);
        }
      }
    } catch (err) {
      Alert.alert("Authentication failed", err?.response?.data?.message || "Invalid credentials.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!otp.trim()) return;
    setAuthLoading(true);
    try {
      const res = await AuthAPI.verifyOTP(email, otp);
      if (res.data.token) {
        await AsyncStorage.setItem("rj_token", res.data.token);
        setIsLoggedIn(true);
        setLoading(true);
        await fetchOrders();
        setLoading(false);
      }
    } catch (err) {
      Alert.alert("Verification failed", err?.response?.data?.message || "Invalid OTP code.");
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F5A623" />
        <Text style={styles.loadingText}>Loading your orders…</Text>
      </View>
    );
  }

  if (!isLoggedIn) {
    return (
      <View style={styles.authContainer}>
        {isVerifying ? (
          <View style={styles.authCard}>
            <Text style={styles.authTitle}>Verify Email</Text>
            <Text style={styles.authSub}>Enter OTP sent to {email}</Text>
            <TextInput
              style={styles.input}
              placeholder="6-Digit OTP"
              placeholderTextColor="#9A9AA5"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
            />
            <TouchableOpacity style={styles.authBtn} onPress={handleVerify} disabled={authLoading}>
              <Text style={styles.authBtnText}>Verify & Continue</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.authCard}>
            <Text style={styles.authTitle}>{isRegister ? "Create Account" : "Sign In"}</Text>
            <Text style={styles.authSub}>Sign in to view your orders and track delivery status.</Text>
            {isRegister && (
              <>
                <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#9A9AA5" value={name} onChangeText={setName} />
                <TextInput style={styles.input} placeholder="WhatsApp Phone" placeholderTextColor="#9A9AA5" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              </>
            )}
            <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#9A9AA5" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#9A9AA5" value={password} onChangeText={setPassword} secureTextEntry />
            <TouchableOpacity style={styles.authBtn} onPress={handleAuth} disabled={authLoading}>
              <Text style={styles.authBtnText}>{isRegister ? "Register & Send OTP" : "Sign In"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toggleBtn} onPress={() => setIsRegister(!isRegister)}>
              <Text style={styles.toggleText}>{isRegister ? "Already registered? Sign In" : "New user? Create Account"}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: "#0B0B0F" }}
      data={orders}
      keyExtractor={(o) => o._id}
      contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
      ListHeaderComponent={
        <View style={{ marginBottom: 12 }}>
          <View style={styles.header}>
            <Text style={styles.title}>My Orders</Text>
          </View>
          {orders.length > 0 && (
            <View style={styles.statsCard}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>TOTAL ORDERS</Text>
                <Text style={styles.statVal}>{orders.length}</Text>
              </View>
              <View style={[styles.statBox, { borderLeftWidth: 1, borderLeftColor: "rgba(255, 255, 255, 0.08)" }]}>
                <Text style={styles.statLabel}>PENDING DELIVERY</Text>
                <Text style={[styles.statVal, { color: "#F5A623" }]}>
                  {orders.filter((o) => o.status !== "Delivered" && o.status !== "Cancelled").length}
                </Text>
              </View>
            </View>
          )}
        </View>
      }
      renderItem={({ item, index }) => (
        <FadeInView index={index}>
          <OrderCard order={item} navigation={navigation} />
        </FadeInView>
      )}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F5A623" />}
      ListEmptyComponent={
        <View style={styles.center}>
          <Ionicons name="receipt-outline" size={56} color="#9A9AA5" />
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
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 80, gap: 8, backgroundColor: "#0B0B0F" },
  loadingText: { color: "#9A9AA5" },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: "#FFFFFF", marginTop: 6 },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  title: { fontSize: 22, fontWeight: "900", color: "#FFFFFF" },

  card: {
    backgroundColor: "#17171C",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  orderId: { fontSize: 15, fontWeight: "900", color: "#FFFFFF" },
  orderDate: { fontSize: 11, color: "#9A9AA5", marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusPillText: { fontSize: 11, fontWeight: "800" },

  divider: { height: 1, backgroundColor: "rgba(255, 255, 255, 0.08)", marginVertical: 14 },

  tracker: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  trackStep: { alignItems: "center", width: 62 },
  trackDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.15)",
    backgroundColor: "#17171C",
    alignItems: "center",
    justifyContent: "center",
  },
  trackLabel: { fontSize: 10, color: "#9A9AA5", marginTop: 5, textAlign: "center" },
  trackLine: { flex: 1, height: 2, backgroundColor: "rgba(255, 255, 255, 0.15)", marginTop: 10 },

  flatState: { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center", paddingVertical: 4 },
  flatStateText: { fontWeight: "800", fontSize: 14 },

  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 14 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 12, color: "#9A9AA5", fontWeight: "600" },
  dot: { width: 6, height: 6, borderRadius: 3, marginLeft: 4 },

  shopBtn: { backgroundColor: "#F5A623", paddingHorizontal: 20, paddingVertical: 11, borderRadius: 20, marginTop: 12 },
  shopBtnText: { color: "#0B0B0F", fontWeight: "900" },

  authContainer: { flex: 1, backgroundColor: "#0B0B0F", alignItems: "center", justifyContent: "center", padding: 16 },
  authCard: { width: "100%", backgroundColor: "#17171C", padding: 24, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.08)" },
  authTitle: { fontSize: 20, fontWeight: "900", color: "#FFFFFF", textAlign: "center" },
  authSub: { fontSize: 13, color: "#9A9AA5", textAlign: "center", marginTop: 4, marginBottom: 20 },
  input: { width: "100%", height: 46, borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.1)", borderRadius: 14, paddingHorizontal: 14, fontSize: 13, color: "#FFFFFF", marginBottom: 12, backgroundColor: "#0B0B0F" },
  authBtn: { width: "100%", height: 46, backgroundColor: "#F5A623", borderRadius: 20, alignItems: "center", justifyContent: "center", marginTop: 8 },
  authBtnText: { color: "#0B0B0F", fontSize: 14, fontWeight: "900" },
  toggleBtn: { marginTop: 14, alignItems: "center" },
  toggleText: { color: "#F5A623", fontSize: 12, fontWeight: "800" },

  statsCard: { flexDirection: "row", backgroundColor: "#17171C", borderRadius: 16, borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.08)", paddingVertical: 12, marginTop: 8 },
  statBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  statLabel: { fontSize: 9, color: "#9A9AA5", fontWeight: "700" },
  statVal: { fontSize: 16, fontWeight: "900", color: "#FFFFFF", marginTop: 2 },
});
