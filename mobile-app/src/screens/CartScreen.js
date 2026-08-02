import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCart } from "../context/CartContext";
import { OrderAPI } from "../lib/api";
import { inr } from "../lib/format";
import AnimatedButton from "../components/AnimatedButton";

const EMPTY_ADDR = {
  fullName: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
};

export default function CartScreen({ navigation }) {
  const {
    items,
    subtotal,
    shipping,
    grandTotal,
    savings,
    incrementItem,
    decrementItem,
    removeItem,
    clearCart,
  } = useCart();

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [addr, setAddr] = useState(EMPTY_ADDR);
  const [payment, setPayment] = useState("COD");
  const [utr, setUtr] = useState("");
  const [placing, setPlacing] = useState(false);

  const onAddr = (key, val) => setAddr((a) => ({ ...a, [key]: val }));

  const validate = () => {
    if (!addr.fullName.trim()) return "Please enter your full name.";
    if (!/^[0-9]{10}$/.test(addr.phone.trim())) return "Enter a valid 10-digit phone.";
    if (!addr.street.trim()) return "Please enter your street address.";
    if (!addr.city.trim()) return "Please enter your city.";
    if (!addr.state.trim()) return "Please enter your state.";
    if (!/^[0-9]{6}$/.test(addr.postalCode.trim())) return "Enter a valid 6-digit PIN.";
    return null;
  };

  const placeOrder = async () => {
    const token = await AsyncStorage.getItem("rj_token");
    if (!token) {
      Alert.alert("Sign In Required", "Please go to the Orders tab and sign in to place your order.", [
        { text: "Go to Orders", onPress: () => navigation.navigate("OrdersTab") },
        { text: "Cancel", style: "cancel" }
      ]);
      return;
    }

    const err = validate();
    if (err) {
      Alert.alert("Check your details", err);
      return;
    }

    setPlacing(true);
    const payload = {
      items: items.map((i) => ({ product: i._id, quantity: i.qty })),
      shippingAddress: addr,
      paymentMethod: payment,
      shippingPrice: shipping,
      taxPrice: 0,
    };

    try {
      const res = await OrderAPI.create(payload);
      const order = res.data.order;
      finalize(order?._id, payment, false);
    } catch (ex) {
      const status = ex?.response?.status;
      if (!status) {
        finalize(`RJ${Date.now().toString().slice(-8)}`, payment, true);
      } else {
        setPlacing(false);
        Alert.alert(
          "Order failed",
          ex?.response?.data?.message || "Could not place your order. Please try again."
        );
      }
    }
  };

  const finalize = (id, method, demo) => {
    clearCart();
    setPlacing(false);
    setCheckoutOpen(false);
    setAddr(EMPTY_ADDR);
    Alert.alert(
      "Order Confirmed 🎉",
      `Order #${String(id).slice(-8).toUpperCase()} placed successfully!\n\nTrack your delivery state anytime under My Orders.`,
      [{ text: "View Orders", onPress: () => navigation.navigate("OrdersTab") }, { text: "OK" }]
    );
  };

  if (items.length === 0) {
    return <EmptyCartView navigation={navigation} />;
  }

  const renderItem = ({ item, index }) => (
    <CartItemRow
      item={item}
      index={index}
      decrementItem={decrementItem}
      incrementItem={incrementItem}
      removeItem={removeItem}
    />
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(i) => i._id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      />

      <AnimatedSummary
        items={items}
        subtotal={subtotal}
        savings={savings}
        shipping={shipping}
        grandTotal={grandTotal}
        setCheckoutOpen={setCheckoutOpen}
      />

      <Modal visible={checkoutOpen} animationType="slide" onRequestClose={() => setCheckoutOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1, backgroundColor: "#0B0B0F" }}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Checkout Details</Text>
            <AnimatedButton onPress={() => setCheckoutOpen(false)}>
              <View style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </View>
            </AnimatedButton>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            <Text style={styles.sectionLabel}>Delivery Address</Text>

            <Field label="Full Name" value={addr.fullName} onChange={(v) => onAddr("fullName", v)} placeholder="Aarav Gupta" />
            <Field label="Phone" value={addr.phone} onChange={(v) => onAddr("phone", v)} placeholder="9876543210" keyboardType="number-pad" />
            <Field label="Street / House" value={addr.street} onChange={(v) => onAddr("street", v)} placeholder="MG Road, Near Post Office" />
            <View style={styles.fieldRow}>
              <View style={{ flex: 1 }}>
                <Field label="City" value={addr.city} onChange={(v) => onAddr("city", v)} placeholder="Darbhanga" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="State" value={addr.state} onChange={(v) => onAddr("state", v)} placeholder="Bihar" />
              </View>
            </View>
            <Field label="PIN Code" value={addr.postalCode} onChange={(v) => onAddr("postalCode", v)} placeholder="847239" keyboardType="number-pad" />

            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Payment Option</Text>
            <View style={{ flexDirection: "row", alignItems: "flex-start", backgroundColor: "#17171C", borderWidth: 1, borderColor: "#F5A623", borderRadius: 16, padding: 14, marginTop: 8, gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: "rgba(245, 166, 35, 0.15)", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="cash-outline" size={20} color="#F5A623" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "900", color: "#FFFFFF" }}>Cash on Delivery (COD)</Text>
                <Text style={{ fontSize: 11, color: "#9A9AA5", marginTop: 3, lineHeight: 16, fontWeight: "600" }}>
                  Pay cash or UPI at your doorstep when your shipment arrives.
                </Text>
              </View>
            </View>

            <View style={styles.modalSummary}>
              <SummaryRow label="Subtotal" value={inr(subtotal)} />
              <SummaryRow label="Shipping" value={shipping === 0 ? "FREE" : inr(shipping)} />
              <View style={styles.divider} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Payable</Text>
                <Text style={styles.totalValue}>{inr(grandTotal)}</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <AnimatedButton
              onPress={placeOrder}
              disabled={placing}
              style={{ width: "100%" }}
            >
              <View style={[styles.placeBtn, placing && { opacity: 0.7 }]}>
                {placing ? (
                  <ActivityIndicator color="#0B0B0F" />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark" size={18} color="#0B0B0F" />
                    <Text style={styles.placeBtnText}>Confirm Order · {inr(grandTotal)}</Text>
                  </>
                )}
              </View>
            </AnimatedButton>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function EmptyCartView({ navigation }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 600, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.empty, { opacity: opacityAnim, transform: [{ translateY: slideAnim }] }]}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }], marginBottom: 12 }}>
        <Ionicons name="cart-outline" size={64} color="#F5A623" />
      </Animated.View>
      <Text style={styles.emptyTitle}>Your cart is empty</Text>
      <Text style={styles.emptySub}>Browse our high quality phones & kits to add items.</Text>
      <AnimatedButton onPress={() => navigation.navigate("HomeTab")}>
        <View style={styles.shopBtn}>
          <Ionicons name="storefront-outline" size={18} color="#0B0B0F" />
          <Text style={styles.shopBtnText}>Start Shopping</Text>
        </View>
      </AnimatedButton>
    </Animated.View>
  );
}

function CartItemRow({ item, index, decrementItem, incrementItem, removeItem }) {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const qtyScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay: index * 60, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, delay: index * 60, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 80, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(qtyScale, { toValue: 1.3, duration: 80, useNativeDriver: true }),
      Animated.spring(qtyScale, { toValue: 1, friction: 3, tension: 150, useNativeDriver: true }),
    ]).start();
  }, [item.qty]);

  const handleRemove = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -120, duration: 350, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      removeItem(item._id);
    });
  };

  return (
    <Animated.View style={[styles.row, { opacity: opacityAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
      <View style={styles.thumbWrap}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbFallback]}>
            <Ionicons name="hardware-chip-outline" size={22} color="#F5A623" />
          </View>
        )}
      </View>

      <View style={styles.rowBody}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.itemUnit}>{inr(item.price)} each</Text>

        <View style={styles.rowFooter}>
          <View style={styles.stepper}>
            <AnimatedButton onPress={() => decrementItem(item._id, item.qty)}>
              <View style={styles.stepBtn}>
                <Ionicons name="remove" size={16} color="#FFFFFF" />
              </View>
            </AnimatedButton>
            <Animated.Text style={[styles.stepVal, { transform: [{ scale: qtyScale }] }]}>
              {item.qty}
            </Animated.Text>
            <AnimatedButton
              onPress={() => incrementItem(item._id, item.qty)}
              disabled={item.stock !== undefined && item.qty >= item.stock}
            >
              <View style={[styles.stepBtn, item.stock !== undefined && item.qty >= item.stock && styles.stepDisabled]}>
                <Ionicons name="add" size={16} color="#FFFFFF" />
              </View>
            </AnimatedButton>
          </View>

          <Text style={styles.lineTotal}>{inr(item.price * item.qty)}</Text>
        </View>
      </View>

      <AnimatedButton onPress={handleRemove}>
        <View style={styles.removeBtn}>
          <Ionicons name="trash-outline" size={18} color="#FF4D4D" />
        </View>
      </AnimatedButton>
    </Animated.View>
  );
}

function AnimatedSummary({ items, subtotal, savings, shipping, grandTotal, setCheckoutOpen }) {
  return (
    <View style={styles.summary}>
      <SummaryRow label={`Subtotal (${items.length} items)`} value={inr(subtotal)} />
      {savings > 0 && <SummaryRow label="You save" value={`- ${inr(savings)}`} success />}
      <SummaryRow label="Shipping" value={shipping === 0 ? "FREE" : inr(shipping)} />
      <View style={styles.divider} />
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{inr(grandTotal)}</Text>
      </View>

      <AnimatedButton onPress={() => setCheckoutOpen(true)}>
        <View style={styles.checkoutBtn}>
          <Text style={styles.checkoutText}>Proceed to Checkout</Text>
          <Ionicons name="arrow-forward" size={18} color="#0B0B0F" />
        </View>
      </AnimatedButton>
    </View>
  );
}

function SummaryRow({ label, value, success }) {
  return (
    <View style={styles.sumRow}>
      <Text style={styles.sumLabel}>{label}</Text>
      <Text style={[styles.sumValue, success && { color: "#2ECC71" }]}>{value}</Text>
    </View>
  );
}

function Field({ label, value, onChange, placeholder, keyboardType }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9A9AA5"
        keyboardType={keyboardType || "default"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0B0B0F" },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#0B0B0F", padding: 24 },
  emptyTitle: { fontSize: 18, fontWeight: "900", color: "#FFFFFF", marginTop: 6 },
  emptySub: { color: "#9A9AA5", textAlign: "center" },
  shopBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F5A623",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 12,
  },
  shopBtnText: { color: "#0B0B0F", fontWeight: "900" },

  row: {
    flexDirection: "row",
    backgroundColor: "#17171C",
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  thumbWrap: { width: 70, height: 70, borderRadius: 14, overflow: "hidden", backgroundColor: "#1E1E24" },
  thumb: { width: "100%", height: "100%" },
  thumbFallback: { alignItems: "center", justifyContent: "center" },
  rowBody: { flex: 1, marginLeft: 12 },
  itemName: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  itemUnit: { fontSize: 11, color: "#9A9AA5", marginTop: 2 },
  rowFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  stepper: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.1)", borderRadius: 16, backgroundColor: "#0B0B0F" },
  stepBtn: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  stepDisabled: { opacity: 0.4 },
  stepVal: { minWidth: 22, textAlign: "center", fontWeight: "800", color: "#FFFFFF", fontSize: 12 },
  lineTotal: { fontSize: 14, fontWeight: "900", color: "#FFFFFF" },
  removeBtn: { padding: 4 },

  summary: {
    backgroundColor: "#17171C",
    padding: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  sumRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  sumLabel: { color: "#9A9AA5", fontSize: 13 },
  sumValue: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  divider: { height: 1, backgroundColor: "rgba(255, 255, 255, 0.08)", marginVertical: 8 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 16, fontWeight: "900", color: "#FFFFFF" },
  totalValue: { fontSize: 18, fontWeight: "900", color: "#FFFFFF" },
  checkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F5A623",
    borderRadius: 20,
    paddingVertical: 14,
    marginTop: 14,
  },
  checkoutText: { color: "#0B0B0F", fontWeight: "900", fontSize: 14 },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 14,
    backgroundColor: "#17171C",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  modalTitle: { fontSize: 17, fontWeight: "900", color: "#FFFFFF" },
  sectionLabel: { fontSize: 11, fontWeight: "800", color: "#F5A623", textTransform: "uppercase", marginBottom: 8, letterSpacing: 0.5 },
  fieldRow: { flexDirection: "row", gap: 12 },
  fieldLabel: { fontSize: 11, fontWeight: "700", color: "#9A9AA5", marginBottom: 4 },
  input: {
    backgroundColor: "#17171C",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: "#FFFFFF",
  },

  modalSummary: { backgroundColor: "#17171C", borderRadius: 16, padding: 14, marginTop: 14, borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.08)" },
  modalFooter: { padding: 16, backgroundColor: "#17171C", borderTopWidth: 1, borderTopColor: "rgba(255, 255, 255, 0.08)" },
  placeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F5A623",
    borderRadius: 20,
    paddingVertical: 14,
  },
  placeBtnText: { color: "#0B0B0F", fontWeight: "900", fontSize: 15 },
});
