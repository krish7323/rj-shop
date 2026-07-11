// src/screens/HomeScreen.js
// Home catalog: a performant FlatList of products fetched live from the backend,
// with search, category chips, pull-to-refresh, images, names and price tags.

import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
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
  Platform,
  Dimensions,
  Animated,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CatalogAPI, AuthAPI } from "../lib/api";
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

        <View style={styles.tileActionsRow}>
          <TouchableOpacity
            style={[styles.addBtn, { flex: 1, marginTop: 0 }, out && styles.addBtnDisabled]}
            disabled={out}
            onPress={() => onAdd(item)}
            activeOpacity={0.8}
          >
            <Ionicons name="cart" size={14} color={colors.navy} />
            <Text style={styles.addBtnText}>{out ? "Sold out" : "Add"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.inquireTileBtn}
            onPress={() => {
              const message = `Hi RJ Mobile Store! I am interested in inquiring about the product "${item.name}" (Price: ${inr(item.price)}). Can you please share more details or availability?`;
              const encoded = encodeURIComponent(message);
              const phone = "919097377388";
              Linking.openURL(`https://wa.me/${phone}?text=${encoded}`);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="logo-whatsapp" size={15} color="#15803d" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }) {
  const { addToCart, setToken } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [live, setLive] = useState(false);
  const [search, setSearch] = useState("");

  // Drawer & Profile states
  const [currentUser, setCurrentUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const scrollRef = useRef(null);
  const windowWidth = Dimensions.get("window").width;
  const drawerWidth = windowWidth * 0.78;
  const drawerAnim = useRef(new Animated.Value(-drawerWidth)).current;

  // Toggle drawer animation
  useEffect(() => {
    Animated.timing(drawerAnim, {
      toValue: drawerOpen ? 0 : -drawerWidth,
      duration: 250,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, [drawerOpen]);

  // Load profile data for header
  useEffect(() => {
    (async () => {
      try {
        const res = await AuthAPI.me();
        setCurrentUser(res.data.user);
      } catch {
        // Ignored
      }
    })();
  }, []);

  const handleSignOut = () => {
    setDrawerOpen(false);
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("rj_token");
          setToken(null);
        },
      },
    ]);
  };

  const handleScrollToOffset = (offset) => {
    setDrawerOpen(false);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: offset, animated: true });
    }
  };

  const openUrl = (url) => {
    setDrawerOpen(false);
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Could not open link on your device.");
    });
  };

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
    <View style={{ flex: 1 }}>
      <ScrollView
        ref={scrollRef}
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
            <TouchableOpacity onPress={() => setDrawerOpen(true)} style={styles.menuBtn}>
              <Ionicons name="menu-outline" size={28} color="#fff" />
            </TouchableOpacity>
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

        {/* Features Row */}
        <View style={styles.featuresRow}>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🛡️</Text>
            <Text style={styles.featureTitle}>100% Tested</Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🛠️</Text>
            <Text style={styles.featureTitle}>Premium Tools</Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>💬</Text>
            <Text style={styles.featureTitle}>Live Chat</Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🚗</Text>
            <Text style={styles.featureTitle}>Store Pick</Text>
          </View>
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

        {/* Social Proof & Trust Factors */}
        <MobileTestimonials />
        <MobileFAQ />
      </ScrollView>

      {/* Slide Out Hamburger Drawer Overlay */}
      {drawerOpen && (
        <View style={StyleSheet.absoluteFill}>
          {/* Backdrop Touch Mask */}
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setDrawerOpen(false)}
          />

          {/* Drawer container */}
          <Animated.View style={[styles.drawerSheet, { width: drawerWidth, transform: [{ translateX: drawerAnim }] }]}>
            {/* Header with Close option */}
            <View style={styles.drawerHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Image source={logo} style={{ width: 26, height: 26, borderRadius: radius.sm }} />
                <Text style={styles.drawerHeaderTitle}>RJ STORE MENU</Text>
              </View>
              <TouchableOpacity onPress={() => setDrawerOpen(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Profile Info Box */}
            <View style={styles.drawerProfile}>
              <Text style={styles.loggedLabel}>LOGGED IN AS</Text>
              <Text style={styles.profileName} numberOfLines={1}>{currentUser?.name || "Customer"}</Text>
              <Text style={styles.profileEmail} numberOfLines={1}>{currentUser?.email || "pending..."}</Text>
              
              <TouchableOpacity 
                style={styles.drawerOrdersBtn} 
                onPress={() => {
                  setDrawerOpen(false);
                  navigation.navigate("OrdersTab");
                }}
              >
                <Text style={styles.drawerOrdersBtnText}>📦 View My Orders</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.drawerSignoutBtn} onPress={handleSignOut}>
                <Text style={styles.drawerSignoutBtnText}>Sign Out</Text>
              </TouchableOpacity>
            </View>

            {/* Navigation options */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 14 }}>
              <Text style={styles.menuLabel}>SHOP CATALOG</Text>
              
              <TouchableOpacity style={styles.menuItem} onPress={() => handleScrollToOffset(0)}>
                <Ionicons name="home-outline" size={16} color={colors.accent} />
                <Text style={styles.menuItemText}>Top / Home</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => handleScrollToOffset(260)}>
                <Ionicons name="build-outline" size={16} color={colors.accent} />
                <Text style={styles.menuItemText}>Repair Kits & Tools</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => handleScrollToOffset(680)}>
                <Ionicons name="phone-portrait-outline" size={16} color={colors.accent} />
                <Text style={styles.menuItemText}>Pre-Owned Devices</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => handleScrollToOffset(1100)}>
                <Ionicons name="flash-outline" size={16} color={colors.accent} />
                <Text style={styles.menuItemText}>Smart Gadgets</Text>
              </TouchableOpacity>

              <View style={styles.drawerDivider} />

              <TouchableOpacity style={styles.menuItem} onPress={() => openUrl("https://maps.google.com/?q=MG+Road+Mobile+Store")}>
                <Ionicons name="location-outline" size={16} color={colors.accent} />
                <Text style={styles.menuItemText}>Visit Physical Store</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => openUrl("https://instagram.com/rjmobilerepairing")}>
                <Ionicons name="logo-instagram" size={16} color={colors.accent} />
                <Text style={styles.menuItemText}>Instagram Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => openUrl("https://facebook.com/rjmobilerepairing")}>
                <Ionicons name="logo-facebook" size={16} color={colors.accent} />
                <Text style={styles.menuItemText}>Facebook Page</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => openUrl("https://youtube.com/@rjmobile-repairing")}>
                <Ionicons name="logo-youtube" size={16} color={colors.accent} />
                <Text style={styles.menuItemText}>YouTube Channel</Text>
              </TouchableOpacity>
            </ScrollView>

            <Text style={styles.drawerCopy}>© 2026 RJ Mobile Store.</Text>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

function MobileTestimonials() {
  const reviews = [
    { name: "Rohan Sharma", role: "Local Customer", text: "OnePlus 9 was perfect, battery is great!" },
    { name: "Pooja Hegde", role: "Verified Buyer", text: "WhatsApp checkout was very smooth." },
    { name: "Amit Patel", role: "DIY Hobbyist", text: "Precision screwdriver kit is premium." }
  ];

  return (
    <View style={styles.nativeSection}>
      <Text style={styles.nativeSectionHeader}>⭐ What Our Customers Say</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
        {reviews.map((r, idx) => (
          <View key={idx} style={styles.testimonialCard}>
            <Text style={styles.testimonialText}>"{r.text}"</Text>
            <View style={{ marginTop: 8, borderTopWidth: 1, borderColor: "#f1f5f9", paddingTop: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: "bold", color: colors.navy }}>{r.name}</Text>
              <Text style={{ fontSize: 9, color: colors.sub }}>{r.role}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function MobileFAQ() {
  const faqs = [
    { q: "Do you offer warranty on Old phones?", a: "Yes! 6-month warranty on manufacturing defects, plus 7-day easy replacement." },
    { q: "Can I collect in-store today?", a: "Absolutely! Just place the order and collect it at our Nehra, Darbhanga store." },
    { q: "Are the repair kits beginner-friendly?", a: "Yes! Curated for beginners. We also offer guidance via WhatsApp." }
  ];

  const [openIndex, setOpenIndex] = useState(null);

  return (
    <View style={[styles.nativeSection, { marginBottom: 30 }]}>
      <Text style={styles.nativeSectionHeader}>❓ Frequently Asked Questions</Text>
      <View style={{ paddingHorizontal: 16, gap: 8 }}>
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <View key={idx} style={styles.faqCard}>
              <TouchableOpacity
                onPress={() => setOpenIndex(isOpen ? null : idx)}
                style={styles.faqHeader}
                activeOpacity={0.7}
              >
                <Text style={styles.faqQuestion}>{faq.q}</Text>
                <Ionicons name={isOpen ? "remove" : "add"} size={16} color={colors.sub} />
              </TouchableOpacity>
              {isOpen && (
                <Text style={styles.faqAnswer}>{faq.a}</Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
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

  featuresRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    gap: 8,
  },
  featureCard: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  featureIcon: { fontSize: 18, marginBottom: 2 },
  featureTitle: { fontSize: 9, fontWeight: "800", color: colors.text },

  nativeSection: {
    marginTop: spacing.lg,
    backgroundColor: "#fff",
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    marginHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  nativeSectionHeader: {
    fontSize: 14,
    fontWeight: "900",
    color: colors.text,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  testimonialCard: {
    width: 200,
    backgroundColor: colors.bg,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  testimonialText: { fontSize: 11, color: colors.sub, fontStyle: "italic", lineHeight: 15 },

  faqCard: {
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    paddingVertical: spacing.sm,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQuestion: { fontSize: 12, fontWeight: "750", color: colors.text, flex: 1, marginRight: 8 },
  faqAnswer: { fontSize: 11, color: colors.sub, marginTop: 6, lineHeight: 15, paddingHorizontal: 4 },

  tileActionsRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
    alignItems: "center",
  },
  inquireTileBtn: {
    height: 30,
    width: 32,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "#16a34a",
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
  },

  // Drawer styling
  menuBtn: {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(3, 7, 18, 0.65)",
    zIndex: 9999,
  },
  drawerSheet: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "#0d131b",
    zIndex: 10000,
    borderRightWidth: 1,
    borderRightColor: "#1e293b",
    paddingTop: Platform.OS === "ios" ? 54 : 32,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  drawerHeaderTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.5,
  },
  drawerProfile: {
    backgroundColor: "#030712",
    margin: 16,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  loggedLabel: {
    fontSize: 9,
    fontWeight: "900",
    color: colors.accent,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  profileName: {
    fontSize: 15,
    fontWeight: "900",
    color: "#fff",
  },
  profileEmail: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
    marginBottom: 12,
  },
  drawerOrdersBtn: {
    backgroundColor: "#2563eb",
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  drawerOrdersBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  drawerSignoutBtn: {
    backgroundColor: "#1e293b",
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ef444455",
  },
  drawerSignoutBtnText: {
    color: "#f87171",
    fontSize: 12,
    fontWeight: "800",
  },
  menuLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  menuItemText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#cbd5e1",
  },
  drawerDivider: {
    height: 1,
    backgroundColor: "#1e293b",
    marginVertical: 4,
  },
  drawerCopy: {
    fontSize: 10,
    color: "#475569",
    textAlign: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
  },
});
