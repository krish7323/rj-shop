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
  Easing,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCart } from "../context/CartContext";
import { inr, discountPct } from "../lib/format";
import AnimatedButton from "../components/AnimatedButton";

const { width } = Dimensions.get("window");

const STORAGES = ["128GB", "256GB", "512GB"];
const COLORS = [
  { name: "Space Black", color: "#1C1C1E" },
  { name: "Gold / Amber", color: "#F5A623" },
  { name: "Deep Purple", color: "#7B2FF7" },
  { name: "Silver", color: "#E5E5EA" },
];

export default function ProductDetailsScreen({ route, navigation }) {
  const { product } = route.params || {};
  const { addToCart, count } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedStorage, setSelectedStorage] = useState("256GB");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  const scaleAnim   = useRef(new Animated.Value(1)).current;
  const pulseAnim   = useRef(new Animated.Value(1)).current;
  const floatAnim   = useRef(new Animated.Value(0)).current;

  // Entrance animations
  const imgSlide    = useRef(new Animated.Value(-60)).current;
  const imgOpacity  = useRef(new Animated.Value(0)).current;
  const bodySlide   = useRef(new Animated.Value(80)).current;
  const bodyOpacity = useRef(new Animated.Value(0)).current;
  const barSlide    = useRef(new Animated.Value(60)).current;
  const scrollY     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered entrance sequence
    Animated.stagger(80, [
      Animated.parallel([
        Animated.timing(imgSlide,   { toValue: 0, duration: 500, easing: Easing.out(Easing.back(1.2)), useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(imgOpacity, { toValue: 1, duration: 400, useNativeDriver: Platform.OS !== "web" }),
      ]),
      Animated.parallel([
        Animated.spring(bodySlide, { toValue: 0, friction: 6, tension: 60, useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(bodyOpacity, { toValue: 1, duration: 400, useNativeDriver: Platform.OS !== "web" }),
      ]),
      Animated.spring(barSlide, { toValue: 0, friction: 5, useNativeDriver: Platform.OS !== "web" }),
    ]).start();

    // 3D idle floating animation loop (Y bobbing)
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: Platform.OS !== "web" }),
      ])
    ).start();
  }, []);

  if (!product) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#9A9AA5" }}>Product not available.</Text>
      </View>
    );
  }

  const pct = discountPct(product.price, product.mrp);
  const out = product.stock !== undefined && product.stock <= 0;
  const cap = product.stock !== undefined ? product.stock : 99;
  const img = product.images && product.images.length ? product.images[0] : null;

  const dec = () => setQty((q) => Math.max(1, q - 1));
  const inc = () => setQty((q) => Math.min(cap, q + 1));

  const handleAdd = () => {
    if (out) return;
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.94, duration: 90, useNativeDriver: Platform.OS !== "web" }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: Platform.OS !== "web" }),
    ]).start();
    addToCart({ ...product, selectedStorage, selectedColor: selectedColor.name }, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  const headerScale = scrollY.interpolate({
    inputRange: [-200, 0],
    outputRange: [1.6, 1],
    extrapolateLeft: "extend",
    extrapolateRight: "clamp",
  });

  return (
    <View style={styles.screen}>
      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: Platform.OS !== "web" }
        )}
      >
        {/* Stage Hero Image with Radial Purple/Pink Glow & 3D Hover Float */}
        <Animated.View style={[styles.imageWrap, { opacity: imgOpacity, transform: [{ translateY: imgSlide }] }]}>
          <View style={styles.radialGlow} />
          
          {img ? (
            <Animated.Image
              source={{ uri: img }}
              style={[
                styles.image,
                { transform: [{ scale: headerScale }, { translateY: floatAnim }] },
              ]}
              resizeMode="contain"
            />
          ) : (
            <Animated.View style={[styles.image, styles.imageFallback, { transform: [{ translateY: floatAnim }] }]}>
              <Ionicons name="hardware-chip-outline" size={64} color="#F5A623" />
            </Animated.View>
          )}

          <TouchableOpacity style={[styles.circleBtn, styles.backBtn]} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.circleBtn, styles.cartBtn]}
            onPress={() => navigation.navigate("CartTab")}
          >
            <Ionicons name="cart-outline" size={20} color="#FFFFFF" />
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
        </Animated.View>

        {/* Body content */}
        <Animated.View style={[styles.body, { opacity: bodyOpacity, transform: [{ translateY: bodySlide }] }]}>
          <Text style={styles.brand}>{product.brand || product.category || "RJ MOBILE STORE"}</Text>
          <Text style={styles.name}>{product.name}</Text>

          {product.rating > 0 && (
            <View style={styles.ratingRow}>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={11} color="#F5A623" />
                <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
              </View>
              <Text style={styles.reviews}>{product.numReviews || 128} reviews</Text>
            </View>
          )}

          <View style={styles.priceRow}>
            <Text style={styles.price}>{inr(product.price)}</Text>
            {pct > 0 && <Text style={styles.mrp}>{inr(product.mrp)}</Text>}
            {pct > 0 && <Text style={styles.save}>Save {pct}%</Text>}
          </View>

          {/* Storage Variant Selector */}
          <Text style={styles.sectionHeading}>Storage Option</Text>
          <View style={styles.storageRow}>
            {STORAGES.map((storage) => {
              const active = selectedStorage === storage;
              return (
                <TouchableOpacity
                  key={storage}
                  onPress={() => setSelectedStorage(storage)}
                  style={[styles.storageChip, active && styles.storageChipActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.storageText, active && styles.storageTextActive]}>{storage}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Color Variant Selector */}
          <Text style={styles.sectionHeading}>Color Variant ({selectedColor.name})</Text>
          <View style={styles.colorRow}>
            {COLORS.map((c) => {
              const active = selectedColor.name === c.name;
              return (
                <TouchableOpacity
                  key={c.name}
                  onPress={() => setSelectedColor(c)}
                  style={[styles.colorDotWrap, active && styles.colorDotWrapActive]}
                  activeOpacity={0.8}
                >
                  <View style={[styles.colorDot, { backgroundColor: c.color }]} />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Stock safeguards */}
          <View style={styles.stockRow}>
            <Ionicons
              name={out ? "close-circle" : "checkmark-circle"}
              size={16}
              color={out ? "#FF4D4D" : "#2ECC71"}
            />
            <Text style={[styles.stockText, { color: out ? "#FF4D4D" : "#2ECC71" }]}>
              {out
                ? "Currently out of stock"
                : product.stock !== undefined && product.stock <= 5
                ? `Hurry! Only ${product.stock} left in stock`
                : "In stock — Express 24h Shipping"}
            </Text>
          </View>

          <Text style={styles.sectionHeading}>Product Overview</Text>
          <Text style={styles.desc}>{product.description || "Premium smartphone featuring high performance, OLED display, and tested battery health."}</Text>

          <Text style={styles.sectionHeading}>Key Specifications</Text>
          <View style={styles.specsContainer}>
            <View style={styles.specRow}>
              <View style={styles.specCol}>
                <Text style={styles.specLabel}>Brand</Text>
                <Text style={styles.specValText}>{product.brand || "RJ"}</Text>
              </View>
              <View style={styles.specCol}>
                <Text style={styles.specLabel}>SKU Model</Text>
                <Text style={styles.specValText}>{product.sku || "RJ-GEN-01"}</Text>
              </View>
            </View>
            <View style={styles.specRow}>
              <View style={styles.specCol}>
                <Text style={styles.specLabel}>Category</Text>
                <Text style={styles.specValText}>{product.category || "Smartphones"}</Text>
              </View>
              <View style={styles.specCol}>
                <Text style={styles.specLabel}>Condition</Text>
                <Text style={styles.specValText}>Tested (Grade A+)</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </Animated.ScrollView>

      {/* Floating Add to Cart bar */}
      <Animated.View style={[styles.bottomBar, { transform: [{ translateY: barSlide }, { scale: scaleAnim }] }]}>
        {out ? (
          <View style={[styles.addBtn, { backgroundColor: "#3A3A40" }]}>
            <Text style={{ color: "#9A9AA5", fontWeight: "800" }}>Out of Stock</Text>
          </View>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
            <View style={styles.qtyBox}>
              <TouchableOpacity style={styles.qtyBtn} onPress={dec}>
                <Ionicons name="remove" size={18} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{qty}</Text>
              <TouchableOpacity style={[styles.qtyBtn, qty >= cap && styles.qtyBtnDisabled]} onPress={inc} disabled={qty >= cap}>
                <Ionicons name="add" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <AnimatedButton
              disabled={out}
              onPress={handleAdd}
              style={{ flex: 1 }}
            >
              <View style={[styles.addBtn, added && { backgroundColor: "#2ECC71" }]}>
                <Ionicons name={added ? "checkmark" : "cart"} size={18} color={added ? "#FFFFFF" : "#0B0B0F"} />
                <Text style={[styles.addBtnText, added && { color: "#FFFFFF" }]}>
                  {added ? "Added to Cart" : `Add · ${inr(product.price * qty)}`}
                </Text>
              </View>
            </AnimatedButton>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0B0B0F" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0B0B0F" },

  imageWrap: { width, height: width * 0.95, backgroundColor: "#17171C", position: "relative", alignItems: "center", justifyContent: "center" },
  radialGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(123, 47, 247, 0.25)",
  },
  image: { width: "80%", height: "80%" },
  imageFallback: { alignItems: "center", justifyContent: "center" },
  circleBtn: {
    position: "absolute",
    top: 44,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(23, 23, 28, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  backBtn: { left: 16 },
  cartBtn: { right: 16 },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FF4D4D",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "800" },
  discountTag: {
    position: "absolute",
    bottom: 16,
    left: 16,
    backgroundColor: "#FF4D4D",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  discountText: { color: "#FFFFFF", fontWeight: "900", fontSize: 11 },

  body: {
    backgroundColor: "#0B0B0F",
    padding: 16,
  },
  brand: { color: "#F5A623", fontWeight: "800", fontSize: 10, textTransform: "uppercase", letterSpacing: 1 },
  name: { color: "#FFFFFF", fontSize: 22, fontWeight: "900", marginTop: 4 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(245, 166, 35, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ratingText: { color: "#F5A623", fontSize: 12, fontWeight: "800" },
  reviews: { color: "#9A9AA5", fontSize: 12 },
  priceRow: { flexDirection: "row", alignItems: "flex-end", gap: 10, marginTop: 14 },
  price: { fontSize: 26, fontWeight: "900", color: "#FFFFFF" },
  mrp: { fontSize: 15, color: "#9A9AA5", textDecorationLine: "line-through", marginBottom: 3 },
  save: { fontSize: 12, color: "#2ECC71", fontWeight: "800", marginBottom: 4 },

  sectionHeading: { fontSize: 14, fontWeight: "800", color: "#FFFFFF", marginTop: 20, marginBottom: 8 },
  storageRow: { flexDirection: "row", gap: 10 },
  storageChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "#17171C",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  storageChipActive: {
    borderColor: "#F5A623",
    backgroundColor: "#1E1E24",
  },
  storageText: { color: "#9A9AA5", fontSize: 12, fontWeight: "700" },
  storageTextActive: { color: "#F5A623", fontWeight: "900" },

  colorRow: { flexDirection: "row", gap: 12 },
  colorDotWrap: {
    padding: 3,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  colorDotWrapActive: {
    borderColor: "#F5A623",
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },

  stockRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 16 },
  stockText: { fontWeight: "700", fontSize: 12 },

  desc: { color: "#9A9AA5", fontSize: 13, lineHeight: 20 },

  specsContainer: {
    backgroundColor: "#17171C",
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  specRow: { flexDirection: "row", justifyContent: "space-between" },
  specCol: { flex: 1 },
  specLabel: { color: "#9A9AA5", fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  specValText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800", marginTop: 2 },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#17171C",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  qtyBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0B0B0F",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  qtyBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  qtyBtnDisabled: { opacity: 0.4 },
  qtyValue: { minWidth: 24, textAlign: "center", fontWeight: "800", fontSize: 14, color: "#FFFFFF" },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F5A623",
    borderRadius: 20,
    height: 44,
  },
  addBtnText: { color: "#0B0B0F", fontWeight: "900", fontSize: 14 },
});
