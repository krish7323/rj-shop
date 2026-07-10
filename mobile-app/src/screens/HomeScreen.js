// src/screens/HomeScreen.js
// Home catalog: a performant FlatList of products fetched live from the backend,
// with search, category chips, pull-to-refresh, images, names and price tags.

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CatalogAPI } from "../lib/api";
import { DEMO_CATALOG, inr, discountPct } from "../lib/format";
import { useCart } from "../context/CartContext";
import { colors, radius, spacing } from "../lib/theme";
import logo from "../assets/logo.png";

const CATEGORIES = ["All", "Repair Kits", "Old Phones", "Cool Gadgets"];

function ProductTile({ item, onOpen, onAdd }) {
  const pct = discountPct(item.price, item.mrp);
  const out = item.stock !== undefined && item.stock <= 0;
  const low = item.stock !== undefined && item.stock > 0 && item.stock <= 5;
  const img = item.images && item.images.length ? item.images[0] : null;

  return (
    <TouchableOpacity style={styles.tile} activeOpacity={0.85} onPress={() => onOpen(item)}>
      <View style={styles.imageWrap}>
        {img ? (
          <Image source={{ uri: img }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Ionicons name="image-outline" size={28} color={colors.muted} />
          </View>
        )}
        {pct > 0 && (
          <View style={styles.discountTag}>
            <Text style={styles.discountText}>-{pct}%</Text>
          </View>
        )}
        {out ? (
          <View style={[styles.stockTag, { backgroundColor: colors.navy }]}>
            <Text style={styles.stockTagText}>Out of stock</Text>
          </View>
        ) : low ? (
          <View style={[styles.stockTag, { backgroundColor: colors.accent }]}>
            <Text style={[styles.stockTagText, { color: colors.navy }]}>Only {item.stock} left</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.tileBody}>
        <Text style={styles.brand}>{item.brand || item.category}</Text>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>

        {item.rating > 0 && (
          <View style={styles.ratingRow}>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
              <Ionicons name="star" size={10} color="#fff" />
            </View>
            <Text style={styles.reviews}>({item.numReviews || 0})</Text>
          </View>
        )}

        <View style={styles.priceRow}>
          <Text style={styles.price}>{inr(item.price)}</Text>
          {pct > 0 && <Text style={styles.mrp}>{inr(item.mrp)}</Text>}
        </View>

        <TouchableOpacity
          style={[styles.addBtn, out && styles.addBtnDisabled]}
          disabled={out}
          onPress={() => onAdd(item)}
          activeOpacity={0.8}
        >
          <Ionicons name="cart" size={15} color={colors.navy} />
          <Text style={styles.addBtnText}>{out ? "Sold out" : "Add"}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }) {
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [live, setLive] = useState(false);
  const [search, setSearch] = useState("");

  const fetchProducts = useCallback(async () => {
    try {
      const res = await CatalogAPI.list({ limit: 60 });
      const list = res.data.products || [];
      setProducts(list.length ? list : DEMO_CATALOG);
      setLive(list.length > 0);
    } catch {
      setProducts(DEMO_CATALOG);
      setLive(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchProducts();
      setLoading(false);
    })();
  }, [fetchProducts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  }, [fetchProducts]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((p) => {
      const termOk =
        !term ||
        p.name?.toLowerCase().includes(term) ||
        p.brand?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term);
      return termOk;
    });
  }, [products, search]);

  const repairKits = useMemo(() => filtered.filter((p) => p.category === "Repair Kits"), [filtered]);
  const oldPhones = useMemo(() => filtered.filter((p) => p.category === "Old Phones"), [filtered]);
  const coolGadgets = useMemo(() => filtered.filter((p) => p.category === "Cool Gadgets"), [filtered]);

  const openProduct = (item) => navigation.navigate("ProductDetails", { product: item });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading products…</Text>
      </View>
    );
  }

  const hasItems = filtered.length > 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
    >
      <View style={styles.hero}>
        <View style={styles.heroRow}>
          <Image source={logo} style={styles.heroLogo} />
          <View style={styles.heroTextCol}>
            <Text style={styles.heroSmall}>Welcome to</Text>
            <Text style={styles.heroTitle}>
              RJ <Text style={{ color: colors.accent }}>Mobile Store</Text>
            </Text>
            <Text style={styles.heroSub}>Smart choice · Better life</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.directionsBtn}
          onPress={() => Linking.openURL("https://g.page/r/CfQowZnHRUxZECI")}
        >
          <Ionicons name="location" size={14} color={colors.navy} />
          <Text style={styles.directionsText}>Visit Our Shop / Get Directions</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search kits, phones & gadgets…"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </TouchableOpacity>
        )}
      </View>

      {!live && (
        <View style={styles.demoBanner}>
          <Text style={styles.demoBannerText}>Offline Demo Catalog Mode</Text>
        </View>
      )}

      {!hasItems ? (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={40} color={colors.muted} />
          <Text style={styles.loadingText}>No products found.</Text>
        </View>
      ) : (
        <View style={styles.sectionsContainer}>
          {/* Section 1: Mobile Repair Kits */}
          {repairKits.length > 0 && (
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionHeader}>🛠️ Mobile Repair Kits & Tools</Text>
              <FlatList
                horizontal
                data={repairKits}
                keyExtractor={(item) => item._id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
                renderItem={({ item }) => (
                  <ProductTile item={item} onOpen={openProduct} onAdd={(p) => addToCart(p, 1)} />
                )}
              />
            </View>
          )}

          {/* Section 2: Old Phones */}
          {oldPhones.length > 0 && (
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionHeader}>📱 Pre-Owned & Old Phones</Text>
              <FlatList
                horizontal
                data={oldPhones}
                keyExtractor={(item) => item._id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
                renderItem={({ item }) => (
                  <ProductTile item={item} onOpen={openProduct} onAdd={(p) => addToCart(p, 1)} />
                )}
              />
            </View>
          )}

          {/* Section 3: Cool Gadgets */}
          {coolGadgets.length > 0 && (
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionHeader}>⚡ Cool Gadgets & Accessories</Text>
              <FlatList
                horizontal
                data={coolGadgets}
                keyExtractor={(item) => item._id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
                renderItem={({ item }) => (
                  <ProductTile item={item} onOpen={openProduct} onAdd={(p) => addToCart(p, 1)} />
                )}
              />
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 10 },
  loadingText: { color: colors.sub, fontWeight: "600" },
  listContent: { paddingBottom: 32 },

  hero: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.lg,
    paddingTop: 54,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  heroRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  heroLogo: { width: 56, height: 56, borderRadius: radius.md, borderWidth: 1, borderColor: colors.accent },
  heroTextCol: { flex: 1 },
  heroSmall: { color: colors.muted, fontSize: 12 },
  heroTitle: { color: "#fff", fontSize: 22, fontWeight: "950", marginTop: 1 },
  heroSub: { color: "#cbd5e1", fontSize: 11, marginTop: 2 },
  directionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 8,
    marginTop: spacing.md,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
  },
  directionsText: { color: colors.navy, fontWeight: "800", fontSize: 11 },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    marginHorizontal: spacing.lg,
    marginTop: -20,
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: radius.pill,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },

  demoBanner: {
    backgroundColor: "#fffbeb",
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "#fef3c7",
    alignItems: "center",
  },
  demoBannerText: { color: colors.accentDark, fontSize: 11, fontWeight: "700" },

  sectionsContainer: { marginTop: spacing.lg, gap: spacing.lg },
  sectionWrap: { backgroundColor: "#fff", paddingVertical: spacing.md, borderRadius: radius.xl, marginHorizontal: spacing.sm, borderWidth: 1, borderColor: "#f1f5f9" },
  sectionHeader: { fontSize: 15, fontWeight: "900", color: colors.text, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  horizontalList: { paddingHorizontal: spacing.md },

  tile: {
    width: 165,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    elevation: 1.5,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  imageWrap: { position: "relative", aspectRatio: 1, backgroundColor: "#f8fafc" },
  image: { width: "100%", height: "100%" },
  imageFallback: { alignItems: "center", justifyContent: "center" },
  discountTag: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: colors.danger,
    borderRadius: radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  discountText: { color: "#fff", fontWeight: "850", fontSize: 10 },
  stockTag: {
    position: "absolute",
    top: 6,
    right: 6,
    borderRadius: radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  stockTagText: { color: "#fff", fontWeight: "750", fontSize: 9 },

  tileBody: { padding: spacing.sm },
  brand: { color: colors.accentDark, fontSize: 9, fontWeight: "850", textTransform: "uppercase" },
  name: { color: colors.text, fontSize: 12, fontWeight: "700", marginTop: 2, minHeight: 32 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: colors.star,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  ratingText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  reviews: { color: colors.muted, fontSize: 10 },
  priceRow: { flexDirection: "row", alignItems: "flex-end", gap: 5, marginTop: 5 },
  price: { fontSize: 15, fontWeight: "900", color: colors.text },
  mrp: { fontSize: 11, color: colors.muted, textDecorationLine: "line-through", marginBottom: 1 },

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 7,
    marginTop: 8,
  },
  addBtnDisabled: { opacity: 0.5 },
  addBtnText: { color: colors.navy, fontWeight: "850", fontSize: 12 },
});
