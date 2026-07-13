// src/screens/ProductDetailsScreen.js
// Product detail view (presented as a modal-style stack screen). Parses the full
// description, enforces stock safeguards on the quantity selector, and adds the
// item to the cart with responsive feedback.

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking,
  Animated,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCart } from "../context/CartContext";
import { inr, discountPct } from "../lib/format";
import { colors, radius, spacing } from "../lib/theme";
import AnimatedButton from "../components/AnimatedButton";

const { width } = Dimensions.get("window");

export default function ProductDetailsScreen({ route, navigation }) {
  const { product } = route.params || {};
  const { addToCart, count } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.035,
          duration: 900,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: Platform.OS !== "web",
        }),
      ])
    ).start();
  }, []);

  if (!product) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.sub }}>Product not available.</Text>
      </View>
    );
  }

  const pct = discountPct(product.price, product.mrp);
  const out = product.stock !== undefined && product.stock <= 0;
  const cap = product.stock !== undefined ? product.stock : 99;
  const img = product.images && product.images.length ? product.images[0] : null;

  // Stock safeguards: never exceed available inventory, never below 1.
  const dec = () => setQty((q) => Math.max(1, q - 1));
  const inc = () => setQty((q) => Math.min(cap, q + 1));

  const handleAdd = () => {
    if (out) return;
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.94,
        duration: 90,
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start();
    addToCart(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Image + back / cart */}
        <View style={styles.imageWrap}>
          {img ? (
            <Image source={{ uri: img }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.image, styles.imageFallback]}>
              <Ionicons name="image-outline" size={48} color={colors.muted} />
            </View>
          )}

          <TouchableOpacity style={[styles.circleBtn, styles.backBtn]} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color={colors.navy} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.circleBtn, styles.cartBtn]}
            onPress={() => navigation.navigate("CartTab")}
          >
            <Ionicons name="cart-outline" size={20} color={colors.navy} />
            {count > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{count > 99 ? "99+" : count}</Text>
              </View>
            )}
          </TouchableOpacity>

          {pct > 0 && (
            <View style={styles.discountTag}>
              <Text style={styles.discountText}>-{pct}% OFF</Text>
            </View>
          )}
        </View>

        {/* Details */}
        <View style={styles.body}>
          <Text style={styles.brand}>{product.brand || product.category}</Text>
          <Text style={styles.name}>{product.name}</Text>

          {product.rating > 0 && (
            <View style={styles.ratingRow}>
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
                <Ionicons name="star" size={11} color="#fff" />
              </View>
              <Text style={styles.reviews}>{product.numReviews || 0} ratings</Text>
            </View>
          )}

          <View style={styles.priceRow}>
            <Text style={styles.price}>{inr(product.price)}</Text>
            {pct > 0 && <Text style={styles.mrp}>{inr(product.mrp)}</Text>}
            {pct > 0 && <Text style={styles.save}>Save {pct}%</Text>}
          </View>

          {/* Stock safeguard indicator */}
          <View style={styles.stockRow}>
            <Ionicons
              name={out ? "close-circle" : "checkmark-circle"}
              size={16}
              color={out ? colors.danger : colors.success}
            />
            <Text style={[styles.stockText, { color: out ? colors.danger : colors.success }]}>
              {out
                ? "Currently out of stock"
                : product.stock !== undefined && product.stock <= 5
                ? `Hurry! Only ${product.stock} left in stock`
                : "In stock — ready to ship"}
            </Text>
          </View>

          <Text style={styles.descTitle}>Description</Text>
          <Text style={styles.desc}>{product.description || "No description available."}</Text>

        </View>
      </ScrollView>

      {/* Sticky bottom actions bar */}
      <View style={styles.bottomBar}>
        {out ? (
          <AnimatedButton
            onPress={() => {
              const message = `Hi RJ Mobile Store! I am interested in inquiring about "${product.name}" (Currently out of stock). When will this be available?`;
              const encoded = encodeURIComponent(message);
              const phone = "919097377388";
              Linking.openURL(`https://wa.me/${phone}?text=${encoded}`);
            }}
            style={{ flex: 1 }}
          >
            <View style={[styles.addBtn, { backgroundColor: "#16a34a", width: "100%" }]}>
              <Ionicons name="logo-whatsapp" size={18} color="#fff" />
              <Text style={[styles.addBtnText, { color: "#fff" }]}>Inquire via WhatsApp</Text>
            </View>
          </AnimatedButton>
        ) : (
          <View style={{ flex: 1, flexDirection: "row", gap: spacing.md, alignItems: "center" }}>
            <View style={styles.qtyBox}>
              <AnimatedButton onPress={dec}>
                <View style={styles.qtyBtn}>
                  <Ionicons name="remove" size={18} color={colors.text} />
                </View>
              </AnimatedButton>
              <Text style={styles.qtyValue}>{qty}</Text>
              <AnimatedButton onPress={inc} disabled={qty >= cap}>
                <View style={[styles.qtyBtn, qty >= cap && styles.qtyBtnDisabled]}>
                  <Ionicons name="add" size={18} color={colors.text} />
                </View>
              </AnimatedButton>
            </View>

            <AnimatedButton
              disabled={out}
              onPress={handleAdd}
              style={{ flex: 1 }}
            >
              <View style={[styles.addBtn, { width: "100%" }, added && { backgroundColor: colors.success }]}>
                <Ionicons name={added ? "checkmark" : "cart"} size={18} color={added ? "#fff" : colors.navy} />
                <Text style={[styles.addBtnText, added && { color: "#fff" }]}>
                  {added ? "Added" : `Add · ${inr(product.price * qty)}`}
                </Text>
              </View>
            </AnimatedButton>

            <AnimatedButton
              onPress={() => {
                const message = `Hi RJ Mobile Store! I want to inquire about "${product.name}" (Price: ${inr(product.price * qty)}). Can you please share more details or availability?`;
                const encoded = encodeURIComponent(message);
                const phone = "919097377388";
                Linking.openURL(`https://wa.me/${phone}?text=${encoded}`);
              }}
            >
              <View style={styles.detailsInquireBtn}>
                <Ionicons name="logo-whatsapp" size={20} color="#15803d" />
              </View>
            </AnimatedButton>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  imageWrap: { width, height: width, backgroundColor: "#f1f5f9", position: "relative" },
  image: { width: "100%", height: "100%" },
  imageFallback: { alignItems: "center", justifyContent: "center" },
  circleBtn: {
    position: "absolute",
    top: 44,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  backBtn: { left: spacing.lg },
  cartBtn: { right: spacing.lg },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: { color: colors.navy, fontSize: 10, fontWeight: "800" },
  discountTag: {
    position: "absolute",
    bottom: spacing.lg,
    left: spacing.lg,
    backgroundColor: colors.danger,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  discountText: { color: "#fff", fontWeight: "800", fontSize: 13 },

  body: {
    backgroundColor: colors.bg,
    marginTop: -20,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
  },
  brand: { color: colors.accentDark, fontWeight: "800", fontSize: 12, textTransform: "uppercase" },
  name: { color: colors.text, fontSize: 22, fontWeight: "900", marginTop: 4 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.star,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  ratingText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  reviews: { color: colors.muted, fontSize: 13 },
  priceRow: { flexDirection: "row", alignItems: "flex-end", gap: 10, marginTop: 14 },
  price: { fontSize: 28, fontWeight: "900", color: colors.text },
  mrp: { fontSize: 16, color: colors.muted, textDecorationLine: "line-through", marginBottom: 3 },
  save: { fontSize: 13, color: colors.success, fontWeight: "800", marginBottom: 4 },

  stockRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
  stockText: { fontWeight: "700", fontSize: 13 },

  descTitle: { fontSize: 15, fontWeight: "800", color: colors.text, marginTop: 20, marginBottom: 6 },
  desc: { color: colors.sub, fontSize: 14, lineHeight: 21 },

  trustRow: { flexDirection: "row", gap: spacing.md, marginTop: 20 },
  trustItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: radius.md,
    padding: spacing.md,
  },
  trustText: { color: colors.sub, fontSize: 12, fontWeight: "600" },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: "#fff",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  qtyBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
  },
  qtyBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  qtyBtnDisabled: { opacity: 0.4 },
  qtyValue: { minWidth: 26, textAlign: "center", fontWeight: "800", fontSize: 15, color: colors.text },
  addBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 14,
  },
  addBtnText: { color: colors.navy, fontWeight: "800", fontSize: 15 },
  detailsInquireBtn: {
    height: 48,
    width: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#16a34a",
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
  },
});
