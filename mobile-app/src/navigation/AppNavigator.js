import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  Easing,
  Platform,
  Dimensions,
} from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen        from "../screens/HomeScreen";
import ProductDetailsScreen from "../screens/ProductDetailsScreen";
import CartScreen        from "../screens/CartScreen";
import OrdersScreen      from "../screens/OrdersScreen";
import ProfileScreen     from "../screens/ProfileScreen";
import { useCart }       from "../context/CartContext";
import { colors }        from "../lib/theme";

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();
const { width } = Dimensions.get("window");

// ─── TAB DEFINITIONS ─────────────────────────────────────────────────────────
const TABS = [
  { key: "HomeTab",    label: "Shop",    icon: "storefront",  iconFocused: "storefront" },
  { key: "CartTab",    label: "Cart",    icon: "cart-outline",iconFocused: "cart" },
  { key: "OrdersTab",  label: "Orders",  icon: "receipt-outline", iconFocused: "receipt" },
  { key: "ProfileTab", label: "Profile", icon: "person-outline",  iconFocused: "person" },
];

// ─── PARTICLE BURST (2 small circles fly out on press) ───────────────────────
function ParticleBurst({ trigger }) {
  const particles = [0, 1, 2, 3, 4].map(() => ({
    x: useRef(new Animated.Value(0)).current,
    y: useRef(new Animated.Value(0)).current,
    op: useRef(new Animated.Value(0)).current,
    sc: useRef(new Animated.Value(0)).current,
  }));

  useEffect(() => {
    if (!trigger) return;
    const anims = particles.map((p, i) => {
      const angle = (i / particles.length) * Math.PI * 2;
      const dist  = 18 + Math.random() * 8;
      p.x.setValue(0); p.y.setValue(0);
      p.op.setValue(1); p.sc.setValue(1);
      return Animated.parallel([
        Animated.timing(p.x,  { toValue: Math.cos(angle) * dist, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(p.y,  { toValue: Math.sin(angle) * dist, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(p.op, { toValue: 0, duration: 400, useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(p.sc, { toValue: 0.2, duration: 400, useNativeDriver: Platform.OS !== "web" }),
      ]);
    });
    Animated.parallel(anims).start();
  }, [trigger]);

  return (
    <View style={{ position: "absolute", width: 0, height: 0, alignItems: "center", justifyContent: "center" }} pointerEvents="none">
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            width: 7, height: 7, borderRadius: 3.5,
            backgroundColor: colors.accent,
            opacity: p.op,
            transform: [{ translateX: p.x }, { translateY: p.y }, { scale: p.sc }],
          }}
        />
      ))}
    </View>
  );
}

// ─── RIPPLE RING (expands outward on press) ───────────────────────────────────
function RippleRing({ trigger }) {
  const ringScale = useRef(new Animated.Value(0.5)).current;
  const ringOp    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!trigger) return;
    ringScale.setValue(0.5);
    ringOp.setValue(0.6);
    Animated.parallel([
      Animated.timing(ringScale, { toValue: 2.2, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: Platform.OS !== "web" }),
      Animated.timing(ringOp,    { toValue: 0,   duration: 500, useNativeDriver: Platform.OS !== "web" }),
    ]).start();
  }, [trigger]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        width: 40, height: 40, borderRadius: 20,
        borderWidth: 2, borderColor: colors.accent,
        opacity: ringOp,
        transform: [{ scale: ringScale }],
      }}
    />
  );
}

// ─── ACTIVE PILL INDICATOR (slides under the active tab) ─────────────────────
function ActivePill({ tabIndex, tabCount }) {
  const pillX = useRef(new Animated.Value(0)).current;
  const pillScale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const tabW = width / tabCount;
    Animated.parallel([
      Animated.spring(pillX, {
        toValue: tabIndex * tabW + tabW / 2 - 24,
        friction: 6, tension: 80,
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.spring(pillScale, {
        toValue: 1, friction: 5,
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start();
  }, [tabIndex]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.activePill,
        { transform: [{ translateX: pillX }, { scaleX: pillScale }] },
      ]}
    />
  );
}

// ─── ANIMATED TAB BUTTON ─────────────────────────────────────────────────────
function AnimatedTabButton({ onPress, focused, icon, label, badge }) {
  const [pressCount, setPressCount] = useState(0);

  // Scale spring on press
  const scaleAnim  = useRef(new Animated.Value(1)).current;
  // Icon translate-Y bounce on focus
  const iconY      = useRef(new Animated.Value(0)).current;
  // Icon rotation flip
  const rotAnim    = useRef(new Animated.Value(0)).current;
  // Label slide up
  const labelY     = useRef(new Animated.Value(4)).current;
  const labelOp    = useRef(new Animated.Value(0.6)).current;
  // Glow ring
  const glowScale  = useRef(new Animated.Value(0.6)).current;
  const glowOp     = useRef(new Animated.Value(0)).current;
  // Badge bounce
  const badgeSc    = useRef(new Animated.Value(badge > 0 ? 1 : 0)).current;

  // When focused changes
  useEffect(() => {
    if (focused) {
      // Bounce icon up
      Animated.sequence([
        Animated.timing(iconY, { toValue: -8, duration: 100, useNativeDriver: Platform.OS !== "web" }),
        Animated.spring(iconY, { toValue: 0, friction: 4, tension: 200, useNativeDriver: Platform.OS !== "web" }),
      ]).start();
      // Flip rotation
      rotAnim.setValue(0);
      Animated.timing(rotAnim, { toValue: 1, duration: 380, easing: Easing.out(Easing.back(1.4)), useNativeDriver: Platform.OS !== "web" }).start();
      // Glow
      glowScale.setValue(0.6); glowOp.setValue(0.5);
      Animated.parallel([
        Animated.spring(glowScale, { toValue: 1.6, friction: 4, useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(glowOp, { toValue: 0, duration: 600, useNativeDriver: Platform.OS !== "web" }),
      ]).start();
      // Label slides up
      Animated.parallel([
        Animated.spring(labelY, { toValue: 0, friction: 5, tension: 120, useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(labelOp, { toValue: 1, duration: 250, useNativeDriver: Platform.OS !== "web" }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(labelY, { toValue: 4, duration: 200, useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(labelOp, { toValue: 0.6, duration: 200, useNativeDriver: Platform.OS !== "web" }),
      ]).start();
    }
  }, [focused]);

  // Badge pop when badge changes
  useEffect(() => {
    if (badge > 0) {
      badgeSc.setValue(0);
      Animated.spring(badgeSc, { toValue: 1, friction: 3, tension: 200, useNativeDriver: Platform.OS !== "web" }).start();
    } else {
      Animated.timing(badgeSc, { toValue: 0, duration: 150, useNativeDriver: Platform.OS !== "web" }).start();
    }
  }, [badge]);

  const handlePress = () => {
    // Press squeeze
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.78, duration: 70, useNativeDriver: Platform.OS !== "web" }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 180, useNativeDriver: Platform.OS !== "web" }),
    ]).start();
    setPressCount(c => c + 1);
    onPress?.();
  };

  const rotY = rotAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const activeColor = focused ? colors.accentDark : colors.muted;

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={styles.tabBtn}>
        {/* Glow ring that expands outward */}
        <Animated.View
          pointerEvents="none"
          style={[styles.glowRing, { transform: [{ scale: glowScale }], opacity: glowOp }]}
        />
        {/* Ripple + particles on press */}
        <RippleRing trigger={pressCount} />
        <ParticleBurst trigger={pressCount} />

        {/* Icon container */}
        <Animated.View style={{ transform: [{ translateY: iconY }, { scale: scaleAnim }, { rotateY: rotY }] }}>
          {focused && (
            <View style={styles.iconPill}>
              <Ionicons name={icon} size={22} color={colors.accentDark} />
            </View>
          )}
          {!focused && (
            <Ionicons name={icon} size={22} color={activeColor} />
          )}
        </Animated.View>

        {/* Badge */}
        {badge > 0 && (
          <Animated.View style={[styles.badge, { transform: [{ scale: badgeSc }] }]}>
            <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
          </Animated.View>
        )}

        {/* Label slides up */}
        <Animated.Text
          style={[
            styles.tabLabel,
            { color: activeColor, opacity: labelOp, transform: [{ translateY: labelY }] },
            focused && styles.tabLabelFocused,
          ]}
        >
          {label}
        </Animated.Text>
      </View>
    </TouchableWithoutFeedback>
  );
}

// ─── CUSTOM TAB BAR ──────────────────────────────────────────────────────────
function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.tabBar}>
      {/* Sliding pill indicator */}
      <ActivePill tabIndex={state.index} tabCount={state.routes.length} />

      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const tab = TABS[index] || {};

        return (
          <AnimatedTabButton
            key={route.key}
            focused={focused}
            icon={focused ? tab.iconFocused : tab.icon}
            label={tab.label}
            badge={tab.key === "CartTab" ? options.__cartCount : 0}
            onPress={() => {
              const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
          />
        );
      })}
    </View>
  );
}

// ─── HOME STACK ──────────────────────────────────────────────────────────────
function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="ProductDetails"
        component={ProductDetailsScreen}
        options={{
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
    </Stack.Navigator>
  );
}

// ─── APP NAVIGATOR ───────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { count } = useCart();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        // Pass cart count via options hack
        tabBarIcon: undefined,
      })}
      tabBar={(props) => {
        // Inject cart count into CartTab options
        const enriched = {
          ...props,
          descriptors: Object.fromEntries(
            Object.entries(props.descriptors).map(([key, desc], i) => [
              key,
              { ...desc, options: { ...desc.options, __cartCount: count } },
            ])
          ),
        };
        return <CustomTabBar {...enriched} />;
      }}
    >
      <Tab.Screen name="HomeTab"    component={HomeStack}    />
      <Tab.Screen name="CartTab"    component={CartScreen}   />
      <Tab.Screen name="OrdersTab"  component={OrdersScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen}/>
    </Tab.Navigator>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    height: 68,
    paddingBottom: Platform.OS === "ios" ? 10 : 8,
    paddingTop: 6,
    position: "relative",
    elevation: 16,
    shadowColor: "#0d131b",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
  },

  // Sliding top-line pill indicator
  activePill: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 48,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: colors.accent,
  },

  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    position: "relative",
  },

  iconPill: {
    backgroundColor: `${colors.accent}22`,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 4,
    alignItems: "center",
    justifyContent: "center",
  },

  glowRing: {
    position: "absolute",
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: `${colors.accent}30`,
  },

  tabLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  tabLabelFocused: {
    color: colors.accentDark,
    fontWeight: "900",
  },

  badge: {
    position: "absolute",
    top: 0,
    right: "25%",
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  badgeText: { color: colors.navy, fontSize: 9, fontWeight: "900" },
});
