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
import { CatalogAPI, AuthAPI, CategoryAPI } from "../lib/api";
import { DEMO_CATALOG, inr, discountPct } from "../lib/format";
import { useCart } from "../context/CartContext";
import { colors, radius, spacing } from "../lib/theme";
import logo from "../assets/logo.png";

const CATEGORIES = ["All", "Repair Kits", "Old Phones", "Cool Gadgets"];

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

  // ── Cart-fly animation refs ──
  const cardScaleAnim = useRef(new Animated.Value(1)).current;
  const flyBallY = useRef(new Animated.Value(0)).current;
  const flyBallOpacity = useRef(new Animated.Value(0)).current;
  const flyBallScale = useRef(new Animated.Value(1)).current;
  const checkScaleAnim = useRef(new Animated.Value(0)).current;
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    if (out) return;

    // Press shrink on card
    Animated.sequence([
      Animated.timing(cardScaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: Platform.OS !== "web" }),
      Animated.spring(cardScaleAnim, { toValue: 1, friction: 4, tension: 180, useNativeDriver: Platform.OS !== "web" }),
    ]).start();

    // Flying ball: appear, fly up, fade out
    flyBallY.setValue(0);
    flyBallOpacity.setValue(1);
    flyBallScale.setValue(1);
    Animated.parallel([
      Animated.timing(flyBallY, { toValue: -80, duration: 550, useNativeDriver: Platform.OS !== "web" }),
      Animated.timing(flyBallOpacity, { toValue: 0, duration: 500, delay: 150, useNativeDriver: Platform.OS !== "web" }),
      Animated.sequence([
        Animated.timing(flyBallScale, { toValue: 1.4, duration: 180, useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(flyBallScale, { toValue: 0.5, duration: 370, useNativeDriver: Platform.OS !== "web" }),
      ]),
    ]).start();

    // Check pop animation
    checkScaleAnim.setValue(0);
    Animated.spring(checkScaleAnim, { toValue: 1, friction: 4, delay: 300, useNativeDriver: Platform.OS !== "web" }).start();

    setAdded(true);
    onAdd(item);
    setTimeout(() => {
      setAdded(false);
      checkScaleAnim.setValue(0);
    }, 1600);
  };

  return (
    <Animated.View style={[styles.tile, { transform: [{ scale: cardScaleAnim }] }]}>
      <TouchableOpacity activeOpacity={0.9} onPress={() => onOpen(item)} style={{ flex: 1 }}>
        {/* Product image */}
        <View style={styles.imageWrap}>
          {img ? (
            <Image source={{ uri: img }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.image, styles.imageFallback]}>
              <Ionicons name="hardware-chip-outline" size={34} color={colors.accentLight} />
            </View>
          )}

          {/* Discount badge */}
          {pct > 0 && (
            <View style={styles.discountTag}>
              <Text style={styles.discountText}>-{pct}%</Text>
            </View>
          )}

          {/* Stock label */}
          {out ? (
            <View style={[styles.stockTag, { backgroundColor: "#f43f5e22", borderColor: colors.danger }]}>
              <Text style={[styles.stockTagText, { color: colors.danger }]}>Sold out</Text>
            </View>
          ) : low ? (
            <View style={[styles.stockTag, { backgroundColor: "#f59e0b22", borderColor: "#f59e0b" }]}>
              <Text style={[styles.stockTagText, { color: "#f59e0b" }]}>Only {item.stock} left</Text>
            </View>
          ) : null}

          {/* Fly-ball particle */}
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              bottom: 12,
              alignSelf: "center",
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: colors.accentLight,
              shadowColor: colors.accent,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.9,
              shadowRadius: 6,
              elevation: 8,
              opacity: flyBallOpacity,
              transform: [{ translateY: flyBallY }, { scale: flyBallScale }],
            }}
          />
        </View>

        {/* Content body */}
        <View style={styles.tileBody}>
          <Text style={styles.brand}>{item.brand || item.category}</Text>
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>

          {item.rating > 0 && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={10} color={colors.star} />
              <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
              <Text style={styles.reviews}> ({item.numReviews || 0})</Text>
            </View>
          )}

          <View style={styles.priceRow}>
            <Text style={styles.price}>{inr(item.price)}</Text>
            {pct > 0 && <Text style={styles.mrp}>{inr(item.mrp)}</Text>}
          </View>
        </View>
      </TouchableOpacity>

      {/* Action row outside press area */}
      <View style={styles.tileActionsRow}>
        <TouchableOpacity
          style={[styles.addBtn, { flex: 1 }, out && styles.addBtnDisabled, added && styles.addBtnAdded]}
          disabled={out}
          onPress={handleAddToCart}
          activeOpacity={0.85}
        >
          {added ? (
            <Animated.View style={{ transform: [{ scale: checkScaleAnim }] }}>
              <Ionicons name="checkmark-circle" size={15} color="#fff" />
            </Animated.View>
          ) : (
            <Ionicons name={out ? "close-circle-outline" : "cart-outline"} size={14} color={out ? colors.muted : "#fff"} />
          )}
          <Text style={[styles.addBtnText, added && { color: "#fff" }, out && { color: colors.muted }]}>
            {added ? "Added!" : out ? "Sold out" : "Add to Cart"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.inquireTileBtn}
          onPress={() => {
            const message = `Hi RJ Mobile Store! I want to know more about "${item.name}" (Price: ${inr(item.price)}). Please share availability.`;
            const encoded = encodeURIComponent(message);
            Linking.openURL(`https://wa.me/919097377388?text=${encoded}`);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="logo-whatsapp" size={16} color="#22c55e" />
        </TouchableOpacity>
      </View>
    </Animated.View>
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
            {categorizedProducts.map((group) => {
              if (group.products.length === 0) return null;
              return (
                <View key={group._id || group.name} style={styles.sectionWrap}>
                  <Text style={styles.sectionHeader}>{group.icon || "📁"} {group.name}</Text>
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
              );
            })}
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
  container: { flex: 1, backgroundColor: "#080d16" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 10 },
  loadingText: { color: "#94a3b8", fontWeight: "600" },
  listContent: { paddingBottom: 32 },

  hero: {
    backgroundColor: "#080d16",
    paddingHorizontal: spacing.lg,
    paddingTop: 54,
    paddingBottom: spacing.xl,
  },
  heroRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  heroLogo: { width: 56, height: 56, borderRadius: radius.md, borderWidth: 2, borderColor: "#7c3aed" },
  heroTextCol: { flex: 1 },
  heroSmall: { color: "#94a3b8", fontSize: 12 },
  heroTitle: { color: "#f1f5f9", fontSize: 22, fontWeight: "950", marginTop: 1 },
  heroSub: { color: "#7c3aed", fontSize: 11, marginTop: 2, fontWeight: "700" },
  directionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#7c3aed",
    borderRadius: radius.pill,
    paddingVertical: 8,
    marginTop: spacing.md,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
  },
  directionsText: { color: "#fff", fontWeight: "800", fontSize: 11 },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#0f1724",
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    height: 46,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "#1e293b",
    elevation: 4,
    shadowColor: "#7c3aed",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  searchInput: { flex: 1, fontSize: 14, color: "#f1f5f9" },

  demoBanner: {
    backgroundColor: "#7c3aed22",
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "#7c3aed44",
    alignItems: "center",
  },
  demoBannerText: { color: "#a855f7", fontSize: 11, fontWeight: "700" },

  sectionsContainer: { marginTop: spacing.lg, gap: spacing.lg },
  sectionWrap: { backgroundColor: "#0f1724", paddingVertical: spacing.md, borderRadius: radius.xl, marginHorizontal: spacing.sm, borderWidth: 1, borderColor: "#1e293b" },
  sectionHeader: { fontSize: 15, fontWeight: "900", color: "#f1f5f9", paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  horizontalList: { paddingHorizontal: spacing.md },

  tile: {
    width: 172,
    backgroundColor: "#0f1724",
    borderRadius: radius.xl,
    marginRight: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: "#1e293b",
    elevation: 8,
    shadowColor: "#7c3aed",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    overflow: "visible",
  },
  imageWrap: { position: "relative", aspectRatio: 1, backgroundColor: "#080d16", borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, overflow: "hidden" },
  image: { width: "100%", height: "100%" },
  imageFallback: { alignItems: "center", justifyContent: "center", backgroundColor: "#0f172a" },
  discountTag: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#f43f5e",
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  discountText: { color: "#fff", fontWeight: "800", fontSize: 10, letterSpacing: 0.3 },
  stockTag: {
    position: "absolute",
    top: 8,
    right: 8,
    borderRadius: radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
  },
  stockTagText: { fontWeight: "700", fontSize: 9 },

  tileBody: { padding: spacing.sm, paddingBottom: 2 },
  brand: { color: "#a855f7", fontSize: 9, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.8 },
  name: { color: "#f1f5f9", fontSize: 12, fontWeight: "700", marginTop: 3, minHeight: 32, lineHeight: 16 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 4 },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#f59e0b22",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  ratingText: { color: "#f59e0b", fontSize: 10, fontWeight: "700" },
  reviews: { color: "#475569", fontSize: 9 },
  priceRow: { flexDirection: "row", alignItems: "flex-end", gap: 5, marginTop: 5, marginBottom: 2 },
  price: { fontSize: 15, fontWeight: "900", color: "#f1f5f9" },
  mrp: { fontSize: 11, color: "#475569", textDecorationLine: "line-through", marginBottom: 1 },

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "#7c3aed",
    borderRadius: radius.pill,
    paddingVertical: 8,
    elevation: 4,
    shadowColor: "#7c3aed",
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  addBtnAdded: {
    backgroundColor: "#10b981",
    shadowColor: "#10b981",
  },
  addBtnDisabled: { backgroundColor: "#1e293b", shadowOpacity: 0 },
  addBtnText: { color: "#fff", fontWeight: "800", fontSize: 12 },

  featuresRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    gap: 8,
  },
  featureCard: {
    flex: 1,
    backgroundColor: "#0f1724",
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1e293b",
    elevation: 4,
    shadowColor: "#7c3aed",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  featureIcon: { fontSize: 18, marginBottom: 2 },
  featureTitle: { fontSize: 9, fontWeight: "800", color: "#94a3b8" },

  nativeSection: {
    marginTop: spacing.lg,
    backgroundColor: "#0f1724",
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    marginHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  nativeSectionHeader: {
    fontSize: 14,
    fontWeight: "900",
    color: "#f1f5f9",
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  testimonialCard: {
    width: 200,
    backgroundColor: "#080d16",
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  testimonialText: { fontSize: 11, color: "#94a3b8", fontStyle: "italic", lineHeight: 15 },

  faqCard: {
    borderBottomWidth: 1,
    borderColor: "#1e293b",
    paddingVertical: spacing.sm,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQuestion: { fontSize: 12, fontWeight: "750", color: "#f1f5f9", flex: 1, marginRight: 8 },
  faqAnswer: { fontSize: 11, color: "#94a3b8", marginTop: 6, lineHeight: 15, paddingHorizontal: 4 },

  tileActionsRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 0,
    marginBottom: 10,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
  },
  inquireTileBtn: {
    height: 34,
    width: 34,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "#16a34a44",
    backgroundColor: "#052e16",
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
