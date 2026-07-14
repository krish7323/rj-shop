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
  RefreshControl,
  ScrollView,
  Linking,
  Platform,
  Dimensions,
  Animated,
  Easing,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CatalogAPI, AuthAPI, CategoryAPI } from "../lib/api";
import { DEMO_CATALOG, inr, discountPct } from "../lib/format";
import { useCart } from "../context/CartContext";
import { colors, radius, spacing } from "../lib/theme";
import logo from "../assets/logo.png";
import AnimatedButton from "../components/AnimatedButton";

const WINDOW = Dimensions.get("window");

// ─── Auto-playing Banner Slider ─────────────────────────────────────────────
const BANNERS = [
  { id: 1, emoji: "📱", title: "Pre-owned Phones", sub: "6-month warranty guaranteed", color: ["#1e3a5f", "#0f172a"] },
  { id: 2, emoji: "🛠️", title: "Repair Kits", sub: "Professional S2 steel tools", color: ["#2d1b00", "#1a0f00"] },
  { id: 3, emoji: "⚡", title: "Cool Gadgets", sub: "Latest smart accessories", color: ["#0d2d1a", "#051a0d"] },
  { id: 4, emoji: "🚚", title: "Free Shipping", sub: "On orders above ₹999", color: ["#1a0d2e", "#0d0517"] },
];

function BannerSlider() {
  const scrollRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim  = useRef(new Animated.Value(0)).current;

  // Glow pulse on each banner
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1200, useNativeDriver: Platform.OS !== "web" }),
      ])
    ).start();
  }, []);

  // Auto-advance every 3s
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx(prev => {
        const next = (prev + 1) % BANNERS.length;
        scrollRef.current?.scrollTo({ x: next * (WINDOW.width - 32), animated: true });
        // Spring scale on transition
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: Platform.OS !== "web" }),
          Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 80, useNativeDriver: Platform.OS !== "web" }),
        ]).start();
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.45] });

  return (
    <View style={bs.wrapper}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / (WINDOW.width - 32));
          setActiveIdx(idx);
        }}
      >
        {BANNERS.map((b, i) => (
          <Animated.View
            key={b.id}
            style={[bs.slide, { width: WINDOW.width - 32, transform: [{ scale: i === activeIdx ? scaleAnim : 1 }] }]}
          >
            {/* Background gradient simulation */}
            <View style={[bs.slideBg, { backgroundColor: b.color[0] }]} />
            {/* Glow orb */}
            <Animated.View style={[bs.glowOrb, { opacity: glowOpacity }]} />
            <Text style={bs.slideEmoji}>{b.emoji}</Text>
            <Text style={bs.slideTitle}>{b.title}</Text>
            <Text style={bs.slideSub}>{b.sub}</Text>
          </Animated.View>
        ))}
      </ScrollView>
      {/* Dot indicators */}
      <View style={bs.dots}>
        {BANNERS.map((_, i) => (
          <Animated.View
            key={i}
            style={[
              bs.dot,
              i === activeIdx && bs.dotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const bs = StyleSheet.create({
  wrapper: { marginHorizontal: spacing.md, marginTop: spacing.md, marginBottom: 4 },
  slide: {
    height: 130, borderRadius: radius.xl, overflow: "hidden",
    alignItems: "center", justifyContent: "center", padding: 20,
    backgroundColor: "#0f172a", marginRight: 0,
  },
  slideBg: { ...StyleSheet.absoluteFillObject, opacity: 0.9 },
  glowOrb: {
    position: "absolute", top: -30, right: -30,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: colors.accent,
  },
  slideEmoji: { fontSize: 34, marginBottom: 6 },
  slideTitle: { color: "#fff", fontSize: 18, fontWeight: "900", textAlign: "center" },
  slideSub:   { color: "#cbd5e1", fontSize: 11, marginTop: 3, textAlign: "center" },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#cbd5e1" },
  dotActive: { width: 18, backgroundColor: colors.accent },
});
// ─────────────────────────────────────────────────────────────────────────────

// Animated floating feature pill
function AnimatedFeatureCard({ icon, label, delay = 0 }) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -7, duration: 1400, delay, easing: Easing.inOut(Easing.ease), useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: Platform.OS !== "web" }),
      ])
    ).start();
  }, []);
  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.85, duration: 80, useNativeDriver: Platform.OS !== "web" }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 200, useNativeDriver: Platform.OS !== "web" }),
    ]).start();
  };
  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
      <Animated.View style={[fcStyles.card, { transform: [{ translateY: floatAnim }, { scale: scaleAnim }] }]}>
        <Text style={fcStyles.icon}>{icon}</Text>
        <Text style={fcStyles.label}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}
const fcStyles = StyleSheet.create({
  card: {
    backgroundColor: "#fff", borderRadius: radius.lg,
    paddingVertical: 10, paddingHorizontal: 12,
    alignItems: "center", minWidth: 72,
    elevation: 4, shadowColor: colors.accent, shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
    borderWidth: 1, borderColor: "#f1f5f9",
  },
  icon:  { fontSize: 22, marginBottom: 4 },
  label: { color: colors.text, fontSize: 9, fontWeight: "800", textAlign: "center" },
});
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES = ["All", "Repair Kits", "Old Phones", "Cool Gadgets"];

const FadeInView = (props) => {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 420, delay: props.index * 55,
        easing: Easing.out(Easing.ease),
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 420, delay: props.index * 55,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.spring(scaleAnim, {
        toValue: 1, friction: 5, tension: 60, delay: props.index * 55,
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        ...props.style,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
      }}
    >
      {props.children}
    </Animated.View>
  );
};

const SkeletonTile = () => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.75,
          duration: 750,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: Platform.OS !== "web",
        })
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.skeletonTile, { opacity: pulseAnim }]}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonLineShort} />
      <View style={styles.skeletonLineLong} />
      <View style={styles.skeletonLineButton} />
    </Animated.View>
  );
};

function ProductTile({ item, onOpen, onAdd }) {
  const pct = discountPct(item.price, item.mrp);
  const out = item.stock !== undefined && item.stock <= 0;
  const low = item.stock !== undefined && item.stock > 0 && item.stock <= 5;
  const img = item.images && item.images.length ? item.images[0] : null;

  const [added, setAdded] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const flyAnimY = useRef(new Animated.Value(0)).current;
  const flyAnimOpacity = useRef(new Animated.Value(0)).current;

  const handleAddPress = () => {
    if (out) return;

    // Trigger spring bounce
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.88,
        duration: 90,
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 180,
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start();

    // Trigger flying particle
    flyAnimY.setValue(0);
    flyAnimOpacity.setValue(1);
    Animated.parallel([
      Animated.timing(flyAnimY, {
        toValue: -70,
        duration: 450,
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.timing(flyAnimOpacity, {
        toValue: 0,
        duration: 450,
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start();

    setAdded(true);
    onAdd(item);
    setTimeout(() => {
      setAdded(false);
    }, 1200);
  };

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

        {/* Flying Micro-interaction Particle */}
        <Animated.View
          style={{
            position: "absolute",
            bottom: 20,
            right: 25,
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: colors.success,
            opacity: flyAnimOpacity,
            transform: [{ translateY: flyAnimY }],
          }}
          pointerEvents="none"
        />
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
          <AnimatedButton
            disabled={out}
            onPress={handleAddPress}
            style={{ flex: 1 }}
          >
            <View
              style={[
                styles.addBtn,
                { flex: 1, marginTop: 0 },
                out && styles.addBtnDisabled,
                added && { backgroundColor: colors.success },
              ]}
            >
              <Ionicons name={added ? "checkmark" : "cart"} size={14} color={added ? "#fff" : colors.navy} />
              <Text style={[styles.addBtnText, added && { color: "#fff" }]}>
                {out ? "Sold out" : added ? "Added" : "Add"}
              </Text>
            </View>
          </AnimatedButton>

          <AnimatedButton
            onPress={() => {
              const message = `Hi RJ Mobile Store! I am interested in inquiring about the product "${item.name}" (Price: ${inr(item.price)}). Can you please share more details or availability?`;
              const encoded = encodeURIComponent(message);
              const phone = "919097377388";
              Linking.openURL(`https://wa.me/${phone}?text=${encoded}`);
            }}
          >
            <View style={styles.inquireTileBtn}>
              <Ionicons name="logo-whatsapp" size={15} color="#15803d" />
            </View>
          </AnimatedButton>
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
  const [categories, setCategories] = useState([]);

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

  const fetchCategories = useCallback(async () => {
    try {
      const res = await CategoryAPI.list();
      setCategories(res.data.categories || []);
    } catch {
      setCategories([
        { _id: "1", name: "Repair Kits", icon: "🛠️" },
        { _id: "2", name: "Old Phones", icon: "📱" },
        { _id: "3", name: "Cool Gadgets", icon: "⚡" },
      ]);
    }
  }, []);

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
      await Promise.all([fetchProducts(), fetchCategories()]);
      setLoading(false);
    })();
  }, [fetchProducts, fetchCategories]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchProducts(), fetchCategories()]);
    setRefreshing(false);
  }, [fetchProducts, fetchCategories]);

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

  const categorizedProducts = useMemo(() => {
    return categories.map((cat) => ({
      ...cat,
      products: filtered.filter((p) => p.category === cat.name),
    }));
  }, [categories, filtered]);

  const openProduct = (item) => navigation.navigate("ProductDetails", { product: item });

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0d131b" }}>
        <ScrollView style={styles.container} contentContainerStyle={styles.listContent}>
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
          </View>
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color={colors.muted} style={{ opacity: 0.5 }} />
            <TextInput placeholder="Search kits, phones & gadgets…" placeholderTextColor={colors.muted} style={styles.searchInput} editable={false} />
          </View>
          <View style={styles.sectionsContainer}>
            {[1, 2].map((groupIndex) => (
              <View key={groupIndex} style={styles.sectionWrap}>
                <View style={[styles.skeletonHeader, { width: 140, height: 18, marginBottom: 12, backgroundColor: "#1e293b", borderRadius: radius.sm }]} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                  {[1, 2, 3].map((itemIndex) => (
                    <SkeletonTile key={itemIndex} />
                  ))}
                </ScrollView>
              </View>
            ))}
          </View>
        </ScrollView>
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
        <AnimatedHero
          onMenuOpen={() => setDrawerOpen(true)}
        />

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

        {/* Banner Slider */}
        <BannerSlider />

        {/* Animated Floating Feature Cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.md, gap: 10, paddingTop: 10, paddingBottom: 4 }}>
          <AnimatedFeatureCard icon="🛡️" label="100% Tested" delay={0} />
          <AnimatedFeatureCard icon="🛠️" label="Premium Tools" delay={200} />
          <AnimatedFeatureCard icon="💬" label="Live Chat" delay={400} />
          <AnimatedFeatureCard icon="🚗" label="Store Pick" delay={600} />
          <AnimatedFeatureCard icon="⭐" label="5-Star Rated" delay={800} />
          <AnimatedFeatureCard icon="🔒" label="Secure Pay" delay={1000} />
        </ScrollView>

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
            {categorizedProducts.map((group, gi) => {
              if (group.products.length === 0) return null;
              return (
                <AnimatedSectionWrapper key={group._id || group.name} delay={gi * 120}>
                  <View style={styles.sectionWrap}>
                    <AnimatedSectionHeader icon={group.icon} name={group.name} />
                    <FlatList
                      horizontal
                      data={group.products}
                      keyExtractor={(item) => item._id}
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.horizontalList}
                      renderItem={({ item, index }) => (
                        <FadeInView index={index}>
                          <ProductTile item={item} onOpen={openProduct} onAdd={(p) => addToCart(p, 1)} />
                        </FadeInView>
                      )}
                    />
                  </View>
                </AnimatedSectionWrapper>
              );
            })}
          </View>
        )}

        {/* Social Proof & Trust Factors */}
        <MobileTestimonials />
        <MobileFAQ />
      </ScrollView>

      {/* Floating WhatsApp Heartbeat FAB */}
      <WhatsAppFAB />

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

              {categories.map((cat, idx) => (
                <TouchableOpacity key={cat._id || cat.name} style={styles.menuItem} onPress={() => handleScrollToOffset(260 + idx * 350)}>
                  <Text style={{ fontSize: 16 }}>{cat.icon || "📁"}</Text>
                  <Text style={styles.menuItemText}>{cat.name}</Text>
                </TouchableOpacity>
              ))}

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

// ── Animated Hero ─────────────────────────────────────────────────────────────
function AnimatedHero({ onMenuOpen }) {
  const logoScale  = useRef(new Animated.Value(0.7)).current;
  const logoOpacity= useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(-30)).current;
  const titleOpacity=useRef(new Animated.Value(0)).current;
  const btnScale   = useRef(new Animated.Value(0.8)).current;
  const pulseAnim  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance sequence
    Animated.stagger(120, [
      Animated.parallel([
        Animated.spring(logoScale,   { toValue: 1, friction: 4, tension: 80, useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: Platform.OS !== "web" }),
      ]),
      Animated.parallel([
        Animated.timing(titleSlide,   { toValue: 0, duration: 400, easing: Easing.out(Easing.back(1.5)), useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: Platform.OS !== "web" }),
      ]),
      Animated.spring(btnScale, { toValue: 1, friction: 4, useNativeDriver: Platform.OS !== "web" }),
    ]).start();
    // Logo heartbeat loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 700, useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 700, useNativeDriver: Platform.OS !== "web" }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.hero}>
      {/* background glow orbs */}
      <View style={{ position: "absolute", top: -20, right: -20, width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(245,158,11,0.07)" }} />
      <View style={{ position: "absolute", bottom: 10, left: -30, width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(59,130,246,0.07)" }} />

      <View style={styles.heroRow}>
        <Animated.View style={{ transform: [{ scale: Animated.multiply(logoScale, pulseAnim) }], opacity: logoOpacity }}>
          <Image source={logo} style={styles.heroLogo} />
        </Animated.View>
        <Animated.View style={[styles.heroTextCol, { opacity: titleOpacity, transform: [{ translateX: titleSlide }] }]}>
          <Text style={styles.heroSmall}>Welcome to</Text>
          <Text style={styles.heroTitle}>
            RJ <Text style={{ color: colors.accent }}>Mobile Store</Text>
          </Text>
          <Text style={styles.heroSub}>Smart choice · Better life</Text>
        </Animated.View>
        <TouchableOpacity onPress={onMenuOpen} style={styles.menuBtn}>
          <Ionicons name="menu-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
      <Animated.View style={{ transform: [{ scale: btnScale }] }}>
        <TouchableOpacity
          style={styles.directionsBtn}
          onPress={() => Linking.openURL("https://g.page/r/CfQowZnHRUxZECI")}
          activeOpacity={0.8}
        >
          <Ionicons name="location" size={14} color={colors.navy} />
          <Text style={styles.directionsText}>Visit Our Shop / Get Directions</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

// ── Animated Section Wrapper ──────────────────────────────────────────────────
function AnimatedSectionWrapper({ children, delay = 0 }) {
  const slideAnim   = useRef(new Animated.Value(40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 500, delay, easing: Easing.out(Easing.back(1.2)), useNativeDriver: Platform.OS !== "web" }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 500, delay, useNativeDriver: Platform.OS !== "web" }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ opacity: opacityAnim, transform: [{ translateY: slideAnim }] }}>
      {children}
    </Animated.View>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

// ── Animated Section Header ───────────────────────────────────────────────────
function AnimatedSectionHeader({ icon, name }) {
  const iconBounce = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconBounce, { toValue: -5, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(iconBounce, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: Platform.OS !== "web" }),
      ])
    ).start();
  }, []);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: spacing.md, marginBottom: spacing.sm }}>
      <Animated.Text style={{ fontSize: 18, transform: [{ translateY: iconBounce }] }}>{icon || "📁"}</Animated.Text>
      <Text style={styles.sectionHeader}>{name}</Text>
    </View>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

// ── WhatsApp Floating Heartbeat FAB ──────────────────────────────────────────
function WhatsAppFAB() {
  const heartAnim = useRef(new Animated.Value(1)).current;
  const pingAnim  = useRef(new Animated.Value(1)).current;
  const pingOp    = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(heartAnim, { toValue: 1.18, duration: 200, useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(heartAnim, { toValue: 1, duration: 200, useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(heartAnim, { toValue: 1.1, duration: 180, useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(heartAnim, { toValue: 1, duration: 800, useNativeDriver: Platform.OS !== "web" }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pingAnim, { toValue: 2.2, duration: 1000, useNativeDriver: Platform.OS !== "web" }),
          Animated.timing(pingOp,   { toValue: 0,   duration: 1000, useNativeDriver: Platform.OS !== "web" }),
        ]),
        Animated.parallel([
          Animated.timing(pingAnim, { toValue: 1,   duration: 0, useNativeDriver: Platform.OS !== "web" }),
          Animated.timing(pingOp,   { toValue: 0.6, duration: 0, useNativeDriver: Platform.OS !== "web" }),
        ]),
      ])
    ).start();
  }, []);
  return (
    <View style={fabStyles.wrap} pointerEvents="box-none">
      {/* Ping ring */}
      <Animated.View style={[fabStyles.ping, { transform: [{ scale: pingAnim }], opacity: pingOp }]} />
      <Animated.View style={{ transform: [{ scale: heartAnim }] }}>
        <TouchableOpacity
          style={fabStyles.btn}
          activeOpacity={0.85}
          onPress={() => Linking.openURL("https://wa.me/919097377388?text=Hi%20RJ%20Mobile%20Store!")}
        >
          <Ionicons name="logo-whatsapp" size={28} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
const fabStyles = StyleSheet.create({
  wrap: { position: "absolute", bottom: 24, right: 20, alignItems: "center", justifyContent: "center", zIndex: 999 },
  ping: { position: "absolute", width: 56, height: 56, borderRadius: 28, backgroundColor: "#25D366" },
  btn: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#25D366", alignItems: "center", justifyContent: "center", elevation: 8, shadowColor: "#25D366", shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
});
// ─────────────────────────────────────────────────────────────────────────────

function MobileTestimonials() {
  const reviews = [
    { name: "Rohan Sharma", role: "Local Customer", text: "OnePlus 9 was perfect, battery is great!", stars: 5 },
    { name: "Pooja Hegde",  role: "Verified Buyer",  text: "WhatsApp checkout was very smooth.", stars: 5 },
    { name: "Amit Patel",   role: "DIY Hobbyist",    text: "Precision screwdriver kit is premium.", stars: 5 }
  ];

  return (
    <View style={styles.nativeSection}>
      <Text style={styles.nativeSectionHeader}>⭐ What Our Customers Say</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
        {reviews.map((r, idx) => (
          <FadeInView key={idx} index={idx}>
            <View style={styles.testimonialCard}>
              <Text style={{ fontSize: 11, color: colors.accent, marginBottom: 4 }}>{"★".repeat(r.stars)}</Text>
              <Text style={styles.testimonialText}>"{r.text}"</Text>
              <View style={{ marginTop: 8, borderTopWidth: 1, borderColor: "#f1f5f9", paddingTop: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: "bold", color: colors.navy }}>{r.name}</Text>
                <Text style={{ fontSize: 9, color: colors.sub }}>{r.role}</Text>
              </View>
            </View>
          </FadeInView>
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
  skeletonTile: {
    width: 150,
    backgroundColor: "#1e293b",
    borderRadius: radius.md,
    padding: 10,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  skeletonImage: {
    width: "100%",
    height: 100,
    backgroundColor: "#334155",
    borderRadius: radius.sm,
    marginBottom: 8,
  },
  skeletonLineShort: {
    width: "40%",
    height: 10,
    backgroundColor: "#334155",
    borderRadius: radius.xs,
    marginBottom: 6,
  },
  skeletonLineLong: {
    width: "80%",
    height: 12,
    backgroundColor: "#334155",
    borderRadius: radius.xs,
    marginBottom: 12,
  },
  skeletonLineButton: {
    width: "100%",
    height: 28,
    backgroundColor: "#334155",
    borderRadius: radius.md,
  },
});
