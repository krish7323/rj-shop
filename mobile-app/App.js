// App.js
// Root of the RJ Shop mobile app. Wraps the navigation tree in the SafeArea +
// Cart providers and hosts the NavigationContainer with an animated launch splash.

import React, { useEffect, useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { View, Animated, StyleSheet, Dimensions, Platform } from "react-native";

import { CartProvider } from "./src/context/CartContext";
import AppNavigator from "./src/navigation/AppNavigator";
import logo from "./src/assets/logo.png";

import AuthScreen from "./src/screens/AuthScreen";
import { useCart } from "./src/context/CartContext";
import { colors } from "./src/lib/theme";
import { ActivityIndicator } from "react-native";

const { width } = Dimensions.get("window");

function AppContent() {
  const { token, tokenLoading, setToken } = useCart();

  if (tokenLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0d131b", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      {token ? <AppNavigator /> : <AuthScreen onAuthSuccess={(t) => setToken(t)} />}
    </NavigationContainer>
  );
}

export default function App() {
  const [splashActive, setSplashActive] = useState(true);
  const logoScale = useRef(new Animated.Value(0.4)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const bgOpacity = useRef(new Animated.Value(1)).current;

  const isWeb = Platform.OS === "web";

  useEffect(() => {
    // Zoom and fade in the logo
    Animated.parallel([
      Animated.timing(logoScale, {
        toValue: 1.05,
        duration: 2000,
        useNativeDriver: !isWeb,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: !isWeb,
      }),
    ]).start(() => {
      // Fade out the splash page
      Animated.timing(bgOpacity, {
        toValue: 0,
        duration: 450,
        useNativeDriver: !isWeb,
      }).start(() => {
        setSplashActive(false);
      });
    });
  }, []);

  return (
    <SafeAreaProvider>
      <CartProvider>
        <View style={{ flex: 1, backgroundColor: "#0d131b" }}>
          <AppContent />

          {splashActive && (
            <Animated.View style={[StyleSheet.absoluteFill, styles.splashContainer, { opacity: bgOpacity }]}>
              <Animated.Image
                source={logo}
                style={[
                  styles.logo,
                  {
                    transform: [{ scale: logoScale }],
                    opacity: logoOpacity,
                  },
                ]}
                resizeMode="contain"
              />
            </Animated.View>
          )}
        </View>
      </CartProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    backgroundColor: "#030712",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99999,
  },
  logo: {
    width: width * 0.8,
    height: width * 0.8,
  },
});
