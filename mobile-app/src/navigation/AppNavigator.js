import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableWithoutFeedback, Animated } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";
import ProductDetailsScreen from "../screens/ProductDetailsScreen";
import CartScreen from "../screens/CartScreen";
import OrdersScreen from "../screens/OrdersScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { useCart } from "../context/CartContext";
import { colors } from "../lib/theme";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Interactive 3D spring-bounce Tab button with perspective flip
function TabButton(props) {
  const { onPress, accessibilityState } = props;
  const focused = accessibilityState.selected;

  const scaleValue = useRef(new Animated.Value(1)).current;
  const rotateYValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (focused) {
      rotateYValue.setValue(0);
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleValue, { toValue: 0.8, duration: 80, useNativeDriver: true }),
          Animated.spring(scaleValue, { toValue: 1.15, friction: 3, tension: 160, useNativeDriver: true }),
          Animated.spring(scaleValue, { toValue: 1.0, friction: 4, useNativeDriver: true }),
        ]),
        Animated.timing(rotateYValue, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [focused]);

  const rotateY = rotateYValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <Animated.View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          transform: [
            { perspective: 400 },
            { scale: scaleValue },
            { rotateY: rotateY },
          ],
        }}
      >
        {props.children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

// Home stack: catalog + the product detail modal overlay.
function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="ProductDetails"
        component={ProductDetailsScreen}
        options={{
          headerShown: false,
          presentation: "modal", // slide-up modal overlay
          animation: "slide_from_bottom",
        }}
      />
    </Stack.Navigator>
  );
}

// Reusable tab icon with an optional badge (used for the cart count).
function TabIcon({ name, color, size, badge }) {
  return (
    <View style={{ width: size + 6, alignItems: "center" }}>
      <Ionicons name={name} size={size} color={color} />
      {badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
        </View>
      )}
    </View>
  );
}

export default function AppNavigator() {
  const { count } = useCart();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentDark,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: { paddingVertical: 4 },
        tabBarButton: (props) => <TabButton {...props} />,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          tabBarLabel: "Shop",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="storefront" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="CartTab"
        component={CartScreen}
        options={{
          tabBarLabel: "Cart",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="cart" color={color} size={size} badge={count} />
          ),
        }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersScreen}
        options={{
          tabBarLabel: "Orders",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="receipt" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="person" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 62,
    paddingBottom: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: "#fff",
  },
  tabLabel: { fontSize: 11, fontWeight: "700" },
  badge: {
    position: "absolute",
    top: -6,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: colors.navy, fontSize: 9, fontWeight: "900" },
});
