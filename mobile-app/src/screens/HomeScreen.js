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
  {
    id: 1,
    tag: "LIMITED TIME OFFER",
    title: "Summer Sale",
    highlight: "Up to 50% OFF",
    sub: "on Premium Accessories",
    buttonText: "Shop Now",
    emoji: "🎧",
  },
  {
    id: 2,
    tag: "SPECIAL DISCOUNT",
    title: "Refurbished iPhones",
    highlight: "Flat ₹10,000 OFF",
    sub: "6 Months Store Warranty",
    buttonText: "Explore Now",
    emoji: "📱",
  },
];

function AnimatedSlide({ banner }) {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={bs.slideInner}>
      <View style={bs.leftCol}>
        <Text style={bs.tagBadge}>{banner.tag}</Text>
        <Text style={bs.slideTitle}>{banner.title}</Text>
        <Text style={bs.slideHighlight}>{banner.highlight}</Text>
        <Text style={bs.slideSub}>{banner.sub}</Text>
        
        <TouchableOpacity style={bs.ctaBtn} activeOpacity={0.85}>
          <Text style={bs.ctaBtnText}>{banner.buttonText}</Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={[bs.rightCol, { transform: [{ translateY: floatAnim }] }]}>
        <View style={bs.glowSpotlight} />
        <Text style={{ fontSize: 68 }}>{banner.emoji}</Text>
      </Animated.View>
    </View>
  );
}

function BannerSlider() {
  const scrollRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx(prev => {
        const next = (prev + 1) % BANNERS.length;
        scrollRef.current?.scrollTo({ x: next * (WINDOW.width - 32), animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

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
        {BANNERS.map((b) => (
          <View key={b.id} style={[bs.slide, { width: WINDOW.width - 32 }]}>
            <AnimatedSlide banner={b} />
          </View>
        ))}
      </ScrollView>
      {/* Dot indicators */}
      <View style={bs.dots}>
        {BANNERS.map((_, i) => (
          <View
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
    height: 165,
    borderRadius: 24,
    backgroundColor: "#17171C",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  slideInner: {
    width: "100%",
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  leftCol: {
    flex: 1,
    justifyContent: "center",
  },
  tagBadge: {
    color: "#F5A623",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  slideTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 24,
  },
  slideHighlight: {
    color: "#F5A623",
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 24,
  },
  slideSub: {
    color: "#9A9AA5",
    fontSize: 11,
    marginTop: 2,
    marginBottom: 10,
  },
  ctaBtn: {
    backgroundColor: "#F5A623",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 7,
    alignSelf: "flex-start",
  },
  ctaBtnText: {
    color: "#0B0B0F",
    fontSize: 11,
    fontWeight: "900",
  },
  rightCol: {
    width: 100,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  glowSpotlight: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(245, 166, 35, 0.2)",
  },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255, 255, 255, 0.2)" },
  dotActive: { width: 18, backgroundColor: "#F5A623" },
});
// ─────────────────────────────────────────────────────────────────────────────

function AnimatedFeatureCard({ icon, title, sub }) {
  return (
    <View style={fcStyles.card}>
      <Ionicons name={icon} size={22} color="#F5A623" style={{ marginBottom: 4 }} />
      <Text style={fcStyles.title}>{title}</Text>
      <Text style={fcStyles.sub}>{sub}</Text>
    </View>
  );
}
const fcStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#17171C",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  title: { color: "#FFFFFF", fontSize: 10, fontWeight: "800", textAlign: "center" },
  sub: { color: "#9A9AA5", fontSize: 8, fontWeight: "500", textAlign: "center", marginTop: 2 },
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

function PulsingBackgroundOrbs() {
  const moveVal1 = useRef(new Animated.Value(0)).current;
  const moveVal2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Loop Orb 1
    Animated.loop(
      Animated.sequence([
        Animated.timing(moveVal1, { toValue: 1, duration: 8000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(moveVal1, { toValue: 0, duration: 8000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Loop Orb 2
    Animated.loop(
      Animated.sequence([
        Animated.timing(moveVal2, { toValue: 1, duration: 10000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(moveVal2, { toValue: 0, duration: 10000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const transX1 = moveVal1.interpolate({ inputRange: [0, 1], outputRange: [-25, 45] });
  const transY1 = moveVal1.interpolate({ inputRange: [0, 1], outputRange: [-35, 25] });

  const transX2 = moveVal2.interpolate({ inputRange: [0, 1], outputRange: [35, -55] });
  const transY2 = moveVal2.interpolate({ inputRange: [0, 1], outputRange: [45, -15] });

  return (
    <View style={{ ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: "hidden" }} pointerEvents="none">
      <Animated.View
        style={{
          position: "absolute",
          top: 100, left: -40,
          width: 250, height: 250,
          borderRadius: 125,
          backgroundColor: "rgba(245, 158, 11, 0.05)",
          transform: [{ translateX: transX1 }, { translateY: transY1 }],
        }}
      />
      <Animated.View
        style={{
          position: "absolute",
          bottom: 200, right: -60,
          width: 300, height: 300,
          borderRadius: 150,
          backgroundColor: "rgba(59, 130, 246, 0.06)",
          transform: [{ translateX: transX2 }, { translateY: transY2 }],
        }}
      />
    </View>
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
  const [activeTab, setActiveTab] = useState("Order again");

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

  const processedProducts = useMemo(() => {
    let result = [...filtered];
    if (activeTab === "Best prices") {
      result.sort((a, b) => a.price - b.price);
    } else if (activeTab === "Offers for you") {
      result = result.filter((p) => p.mrp > p.price);
    }
    return result;
  }, [filtered, activeTab]);

  const categorizedProducts = useMemo(() => {
    return categories.map((cat) => ({
      ...cat,
      products: processedProducts.filter((p) => p.category === cat.name),
    }));
  }, [categories, processedProducts]);

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
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <PulsingBackgroundOrbs />
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

        {/* Typewriter Search Bar */}
        <TypewriterSearchInput value={search} onChangeText={setSearch} />

        {/* Categories Quick Grid */}
        <CategoryQuickGrid onSelectCategory={(catName) => {
          const norm = catName.toLowerCase();
          if (norm.includes("phone")) {
            const idx = categories.findIndex(c => c.name.toLowerCase().includes("phone"));
            if (idx !== -1) handleScrollToOffset(260 + idx * 360);
            else setSearch("Phone");
          } else if (norm.includes("kit") || norm.includes("repair")) {
            const idx = categories.findIndex(c => c.name.toLowerCase().includes("kit"));
            if (idx !== -1) handleScrollToOffset(260 + idx * 360);
            else setSearch("Kit");
          } else if (norm.includes("gadget")) {
            const idx = categories.findIndex(c => c.name.toLowerCase().includes("gadget"));
            if (idx !== -1) handleScrollToOffset(260 + idx * 360);
            else setSearch("Gadget");
          } else if (norm.includes("screwdriver")) {
            setSearch("Screwdriver");
          } else if (norm.includes("display")) {
            setSearch("Glue");
          } else if (norm.includes("opening")) {
            setSearch("Opening");
          } else if (norm.includes("wellness") || norm.includes("safe")) {
            setSearch("Safe");
          } else if (norm.includes("monsoon") || norm.includes("offer") || norm.includes("pick")) {
            setActiveTab("Offers for you");
            setSearch("");
          }
        }} />

        {/* Banner Slider */}
        <BannerSlider />

        {/* Segmented Tabs Control */}
        <SegmentedTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Trust Badges Row */}
        <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: spacing.md, marginTop: 14 }}>
          <AnimatedFeatureCard icon="shield-checkmark-outline" title="100% Original" sub="Genuine Products" />
          <AnimatedFeatureCard icon="bus-outline" title="Same Day" sub="Delivery" />
          <AnimatedFeatureCard icon="ribbon-outline" title="6 Months" sub="Warranty" />
          <AnimatedFeatureCard icon="headset-outline" title="24/7 Support" sub="We're Here" />
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

// ── Typewriter Search Bar placeholder cycling ──────────────────────────────
function TypewriterSearchInput({ value, onChangeText }) {
  return (
    <View style={searchStyles.searchWrap}>
      <Ionicons name="search-outline" size={20} color="#F5A623" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search iPhone, Samsung, Accessories..."
        placeholderTextColor="#9A9AA5"
        style={searchStyles.searchInput}
      />
      <View style={searchStyles.iconsRight}>
        <TouchableOpacity>
          <Ionicons name="mic-outline" size={20} color="#9A9AA5" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="qr-code-outline" size={20} color="#F5A623" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const searchStyles = StyleSheet.create({
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#17171C",
    borderRadius: 22,
    height: 50,
    paddingHorizontal: 16,
    marginHorizontal: spacing.md,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 10,
  },
  iconsRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});

// ── Categories Quick Grid ───────────────────────────────────────────────────
const QUICK_GRID_CATEGORIES = [
  { name: "Mobiles",       icon: "📱", active: true },
  { name: "Repair Kits",   icon: "🛠️" },
  { name: "Accessories",   icon: "🎧" },
  { name: "Chargers",      icon: "🔌" },
  { name: "Smart Watches", icon: "⌚" },
  { name: "Cables",        icon: "⚡" },
  { name: "Power Banks",   icon: "🔋" },
  { name: "Tools",         icon: "🧰" },
];

function CategoryQuickGrid({ onSelectCategory }) {
  return (
    <View style={gridStyles.container}>
      <View style={gridStyles.grid}>
        {QUICK_GRID_CATEGORIES.map((c, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => onSelectCategory(c.name)}
            activeOpacity={0.85}
            style={[
              gridStyles.card,
              c.active && gridStyles.cardActive,
            ]}
          >
            <Text style={gridStyles.cardIcon}>{c.icon}</Text>
            <Text style={[gridStyles.cardText, c.active && gridStyles.cardTextActive]} numberOfLines={1}>{c.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const gridStyles = StyleSheet.create({
  container: { paddingHorizontal: spacing.md, marginTop: 14 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 10 },
  card: {
    width: "22%",
    height: 78,
    borderRadius: 20,
    backgroundColor: "#17171C",
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  cardActive: {
    borderColor: "#F5A623",
    borderWidth: 1.5,
    backgroundColor: "#1E1E24",
  },
  cardIcon: { fontSize: 26, marginBottom: 4 },
  cardText: { fontSize: 10, fontWeight: "600", color: "#9A9AA5", textAlign: "center" },
  cardTextActive: { color: "#FFFFFF", fontWeight: "700" },
});

// ── Segmented Tabs selector ──────────────────────────────────────────────
function SegmentedTabs({ activeTab, onTabChange }) {
  const tabs = ["Order again", "Best prices", "Offers for you"];
  const barX = useRef(new Animated.Value(0)).current;

  const handlePress = (tabName, index) => {
    onTabChange(tabName);
    Animated.spring(barX, {
      toValue: index * (WINDOW.width / 3),
      friction: 5,
      tension: 60,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={segStyles.container}>
      <View style={segStyles.tabsRow}>
        {tabs.map((tab, i) => (
          <TouchableOpacity
            key={tab}
            onPress={() => handlePress(tab, i)}
            style={segStyles.tabBtn}
            activeOpacity={0.8}
          >
            <Text style={[segStyles.tabText, activeTab === tab && segStyles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Animated.View style={[segStyles.indicator, { transform: [{ translateX: barX }] }]} />
    </View>
  );
}

const segStyles = StyleSheet.create({
  container: { marginTop: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)", position: "relative" },
  tabsRow: { flexDirection: "row" },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: "center" },
  tabText: { fontSize: 12, fontWeight: "600", color: "#9A9AA5" },
  tabTextActive: { color: "#F5A623", fontWeight: "800" },
  indicator: { position: "absolute", bottom: 0, left: 0, width: "33.3%", height: 2, backgroundColor: "#F5A623" },
});

// ── Animated Welcome Hero ──────────────────────────────────────────
function AnimatedHero({ onMenuOpen }) {
  return (
    <View style={heroStyles.headerWrap}>
      {/* Top Header Row */}
      <View style={heroStyles.topRow}>
        <TouchableOpacity onPress={onMenuOpen} style={heroStyles.menuBox}>
          <Ionicons name="menu-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={heroStyles.greetingText}>Good Morning! 👋</Text>
          <Text style={heroStyles.brandTitle}>RJ Mobile Store</Text>
          <Text style={heroStyles.taglineText}>Smart Choice. Better Life.</Text>
        </View>

        <TouchableOpacity style={heroStyles.bellBox}>
          <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
          <View style={heroStyles.bellBadge}>
            <Text style={heroStyles.bellBadgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Quick Action Pill Buttons */}
      <View style={heroStyles.pillsRow}>
        <TouchableOpacity style={heroStyles.pillBtn} activeOpacity={0.8}>
          <Ionicons name="storefront-outline" size={15} color="#F5A623" />
          <Text style={heroStyles.pillBtnText}>Visit Our Store</Text>
        </TouchableOpacity>

        <TouchableOpacity style={heroStyles.pillBtn} activeOpacity={0.8}>
          <Ionicons name="heart-outline" size={15} color="#F5A623" />
          <Text style={heroStyles.pillBtnText}>Wishlist</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const heroStyles = StyleSheet.create({
  headerWrap: {
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === "ios" ? 54 : 18,
    paddingBottom: 10,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#17171C",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  greetingText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#9A9AA5",
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: 1,
  },
  taglineText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#9A9AA5",
    marginTop: 1,
  },
  bellBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#17171C",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  bellBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#FF4D4D",
    alignItems: "center",
    justifyContent: "center",
  },
  bellBadgeText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
  },
  pillsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  pillBtn: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#17171C",
    borderWidth: 1.5,
    borderColor: "#F5A623",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  pillBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
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

function AnimatedSectionHeader({ icon, name }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, marginBottom: 12, marginTop: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Text style={{ fontSize: 18 }}>{icon || "🔥"}</Text>
        <Text style={{ fontSize: 16, fontWeight: "900", color: "#FFFFFF" }}>{name}</Text>
      </View>
      <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
        <Text style={{ fontSize: 12, fontWeight: "700", color: "#F5A623" }}>View All</Text>
        <Ionicons name="chevron-forward" size={14} color="#F5A623" />
      </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: "transparent" },
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

  sectionsContainer: { marginTop: spacing.md, gap: spacing.md },
  sectionWrap: { backgroundColor: "transparent", paddingVertical: 4 },
  sectionHeader: { fontSize: 16, fontWeight: "900", color: "#FFFFFF" },
  horizontalList: { paddingHorizontal: spacing.md },

  tile: {
    width: 165,
    backgroundColor: "#17171C",
    borderRadius: 22,
    marginRight: 12,
    marginBottom: spacing.xs,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  imageWrap: { position: "relative", aspectRatio: 1, backgroundColor: "#1E1E24", alignItems: "center", justifyContent: "center" },
  image: { width: "100%", height: "100%" },
  imageFallback: { alignItems: "center", justifyContent: "center" },
  discountTag: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#FF4D4D",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  discountText: { color: "#fff", fontWeight: "900", fontSize: 9 },
  stockTag: {
    position: "absolute",
    top: 8,
    right: 8,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  stockTagText: { color: "#fff", fontWeight: "800", fontSize: 8 },

  tileBody: { padding: 12 },
  brand: { color: "#F5A623", fontSize: 9, fontWeight: "800", textTransform: "uppercase" },
  name: { color: "#FFFFFF", fontSize: 12, fontWeight: "700", marginTop: 2, minHeight: 32 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "transparent",
  },
  ratingText: { color: "#F5A623", fontSize: 10, fontWeight: "800" },
  reviews: { color: "#9A9AA5", fontSize: 10 },
  priceRow: { flexDirection: "row", alignItems: "flex-end", gap: 5, marginTop: 6 },
  price: { fontSize: 15, fontWeight: "900", color: "#FFFFFF" },
  mrp: { fontSize: 11, color: "#9A9AA5", textDecorationLine: "line-through", marginBottom: 1 },

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#F5A623",
    borderRadius: 16,
    paddingVertical: 7,
    marginTop: 8,
  },
  addBtnDisabled: { opacity: 0.5 },
  addBtnText: { color: "#0B0B0F", fontWeight: "900", fontSize: 11 },

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
