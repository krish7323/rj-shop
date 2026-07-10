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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CatalogAPI } from "../lib/api";
import { DEMO_CATALOG, inr, discountPct } from "../lib/format";
import { useCart } from "../context/CartContext";
import { colors, radius, spacing } from "../lib/theme";

const CATEGORIES = ["All", "Electronics", "Fashion", "Home"];

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
  const [category, setCategory] = useState("All");

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
      const catOk = category === "All" || p.category === category;
      const termOk =
        !term ||
        p.name?.toLowerCase().includes(term) ||
        p.brand?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term);
      return catOk && termOk;
    });
  }, [products, category, search]);

  const openProduct = (item) => navigation.navigate("ProductDetails", { product: item });

  const header = (
    <View>
      <View style={styles.hero}>
        <Text style={styles.heroSmall}>Welcome to</Text>
        <Text style={styles.heroTitle}>
          RJ <Text style={{ color: colors.accent }}>Shop</Text>
        </Text>
        <Text style={styles.heroSub}>Premium picks · Razorpay & COD · Fast shipping</Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search products, brands…"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(c) => c}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        renderItem={({ item: c }) => {
          const active = category === c;
          return (
            <TouchableOpacity
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setCategory(c)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          );
        }}
      />

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>
          {category === "All" ? "All Products" : category}{" "}
          <Text style={styles.sectionCount}>({filtered.length})</Text>
        </Text>
        {!live && <Text style={styles.demoTag}>Demo</Text>}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading products…</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filtered}
      keyExtractor={(item) => item._id}
      numColumns={2}
      columnWrapperStyle={styles.column}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={header}
      renderItem={({ item }) => (
        <ProductTile item={item} onOpen={openProduct} onAdd={(p) => addToCart(p, 1)} />
      )}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Ionicons name="search-outline" size={40} color={colors.muted} />
          <Text style={styles.loadingText}>No products found.</Text>
        </View>
      }
      initialNumToRender={6}
      windowSize={7}
      removeClippedSubviews
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 10 },
  loadingText: { color: colors.sub, fontWeight: "600" },
  listContent: { backgroundColor: colors.bg, paddingBottom: 24 },
  column: { paddingHorizontal: spacing.md, gap: spacing.md },

  hero: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  heroSmall: { color: colors.muted, fontSize: 13 },
  heroTitle: { color: "#fff", fontSize: 28, fontWeight: "900", marginTop: 2 },
  heroSub: { color: "#cbd5e1", fontSize: 12, marginTop: 4 },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    marginHorizontal: spacing.lg,
    marginTop: -18,
    paddingHorizontal: spacing.md,
    height: 46,
    borderRadius: radius.pill,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },

  chipsRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.sub, fontWeight: "600", fontSize: 13 },
  chipTextActive: { color: colors.navy },

  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: colors.text },
  sectionCount: { color: colors.muted, fontWeight: "600", fontSize: 14 },
  demoTag: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },

  tile: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  imageWrap: { position: "relative", aspectRatio: 1, backgroundColor: "#f8fafc" },
  image: { width: "100%", height: "100%" },
  imageFallback: { alignItems: "center", justifyContent: "center" },
  discountTag: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: colors.danger,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  discountText: { color: "#fff", fontWeight: "800", fontSize: 11 },
  stockTag: {
    position: "absolute",
    top: 8,
    right: 8,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  stockTagText: { color: "#fff", fontWeight: "700", fontSize: 10 },

  tileBody: { padding: spacing.md },
  brand: { color: colors.accentDark, fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  name: { color: colors.text, fontSize: 13, fontWeight: "600", marginTop: 2, minHeight: 34 },
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
  reviews: { color: colors.muted, fontSize: 11 },
  priceRow: { flexDirection: "row", alignItems: "flex-end", gap: 6, marginTop: 6 },
  price: { fontSize: 16, fontWeight: "900", color: colors.text },
  mrp: { fontSize: 12, color: colors.muted, textDecorationLine: "line-through", marginBottom: 1 },

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 8,
    marginTop: 10,
  },
  addBtnDisabled: { opacity: 0.5 },
  addBtnText: { color: colors.navy, fontWeight: "800", fontSize: 13 },
});
