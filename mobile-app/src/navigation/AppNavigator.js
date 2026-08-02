import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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
  { key: "HomeTab",       label: "Home",       icon: "home-outline",     iconFocused: "home" },
  { key: "CategoriesTab", label: "Categories", icon: "grid-outline",     iconFocused: "grid" },
  { key: "CartTab",       label: "",           icon: "cart",             iconFocused: "cart", isFab: true },
  { key: "OrdersTab",     label: "Orders",     icon: "receipt-outline",  iconFocused: "receipt" },
  { key: "ProfileTab",    label: "Profile",    icon: "person-outline",   iconFocused: "person" },
];

function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const tab = TABS[index] || {};

          if (tab.isFab) {
            const count = options.__cartCount || 2;
            return (
              <TouchableOpacity
                key={route.key}
                onPress={() => navigation.navigate("CartTab")}
                activeOpacity={0.9}
                style={styles.fabWrapper}
              >
                <View style={styles.fabCircle}>
                  <Ionicons name="cart" size={26} color="#0B0B0F" />
                  {count > 0 && (
                    <View style={styles.fabBadge}>
                      <Text style={styles.fabBadgeText}>{count}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => {
                const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              style={styles.tabBtn}
              activeOpacity={0.8}
            >
              <Ionicons
                name={focused ? tab.iconFocused : tab.icon}
                size={22}
                color={focused ? "#F5A623" : "#9A9AA5"}
              />
              <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
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
      screenOptions={{ headerShown: false }}
      tabBar={(props) => {
        const enriched = {
          ...props,
          descriptors: Object.fromEntries(
            Object.entries(props.descriptors).map(([key, desc]) => [
              key,
              { ...desc, options: { ...desc.options, __cartCount: count } },
            ])
          ),
        };
        return <CustomTabBar {...enriched} />;
      }}
    >
      <Tab.Screen name="HomeTab"       component={HomeStack} />
      <Tab.Screen name="CategoriesTab" component={HomeScreen} />
      <Tab.Screen name="CartTab"       component={CartScreen} />
      <Tab.Screen name="OrdersTab"     component={OrdersScreen} />
      <Tab.Screen name="ProfileTab"    component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: "transparent",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#17171C",
    borderRadius: 24,
    height: 64,
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 20,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9A9AA5",
  },
  tabLabelFocused: {
    color: "#F5A623",
    fontWeight: "800",
  },
  fabWrapper: {
    top: -18,
    alignItems: "center",
    justifyContent: "center",
  },
  fabCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#F5A623",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#0B0B0F",
    shadowColor: "#F5A623",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
    position: "relative",
  },
  fabBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#FF4D4D",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#0B0B0F",
    paddingHorizontal: 3,
  },
  fabBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },
});
