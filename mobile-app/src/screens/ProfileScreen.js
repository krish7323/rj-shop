import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthAPI } from "../lib/api";
import { useCart } from "../context/CartContext";

export default function ProfileScreen() {
  const { setToken } = useCart();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const headerScale = useRef(new Animated.Value(0.92)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      try {
        const res = await AuthAPI.me();
        setUser(res.data.user);
      } catch (err) {
        // Token might be missing/invalid
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.spring(headerScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
        Animated.timing(headerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  }, [loading]);

  const handleSignOut = () => {
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

  const openUrl = (url) => {
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Could not open link on your device.");
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F5A623" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const firstLetter = user?.name ? user.name.charAt(0).toUpperCase() : "R";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Profile Header Card */}
      <Animated.View style={[styles.profileHeader, { opacity: headerOpacity, transform: [{ scale: headerScale }] }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{firstLetter}</Text>
        </View>
        <Text style={styles.name}>{user?.name || "RJ Store Customer"}</Text>
        <Text style={styles.email}>{user?.email || "customer@rjstore.com"}</Text>
      </Animated.View>

      {/* Account Info Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Details</Text>
        
        <View style={styles.infoRow}>
          <View style={styles.iconWrap}>
            <Ionicons name="logo-whatsapp" size={18} color="#2ECC71" />
          </View>
          <View style={styles.infoText}>
            <Text style={styles.infoLabel}>WhatsApp Number</Text>
            <Text style={styles.infoValue}>+91 {user?.phone || "9097377388"}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.iconWrap}>
            <Ionicons name="phone-portrait-outline" size={18} color="#3B82F6" />
          </View>
          <View style={styles.infoText}>
            <Text style={styles.infoLabel}>Current Phone Model</Text>
            <Text style={styles.infoValue}>{user?.currentDevice || "iPhone / Android"}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.iconWrap}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#2ECC71" />
          </View>
          <View style={styles.infoText}>
            <Text style={styles.infoLabel}>Verification Status</Text>
            <Text style={[styles.infoValue, { color: "#2ECC71", fontWeight: "bold" }]}>
              Verified Customer
            </Text>
          </View>
        </View>
      </View>

      {/* Store Connections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connect With Us</Text>

        <TouchableOpacity 
          style={styles.socialBtn}
          onPress={() => openUrl("https://maps.google.com/?q=MG+Road+Mobile+Store")}
        >
          <Ionicons name="map-outline" size={18} color="#F5A623" />
          <Text style={styles.socialText}>Visit Physical Store</Text>
          <Ionicons name="chevron-forward-outline" size={16} color="#9A9AA5" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.socialBtn}
          onPress={() => openUrl("https://instagram.com/rjmobilerepairing")}
        >
          <Ionicons name="logo-instagram" size={18} color="#FF3CAC" />
          <Text style={styles.socialText}>Instagram Profile</Text>
          <Ionicons name="chevron-forward-outline" size={16} color="#9A9AA5" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.socialBtn}
          onPress={() => openUrl("https://facebook.com/rjmobilerepairing")}
        >
          <Ionicons name="logo-facebook" size={18} color="#3B82F6" />
          <Text style={styles.socialText}>Facebook Page</Text>
          <Ionicons name="chevron-forward-outline" size={16} color="#9A9AA5" />
        </TouchableOpacity>
      </View>

      {/* Logout Action */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={18} color="#FF4D4D" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0B0F" },
  scroll: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: "#0B0B0F", alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 10, fontSize: 13, color: "#9A9AA5", fontWeight: "700" },
  
  profileHeader: { alignItems: "center", backgroundColor: "#17171C", borderRadius: 20, borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.08)", paddingVertical: 24, paddingHorizontal: 16, marginBottom: 16 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#F5A623", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText: { color: "#0B0B0F", fontSize: 24, fontWeight: "900" },
  name: { fontSize: 18, fontWeight: "900", color: "#FFFFFF" },
  email: { fontSize: 12, color: "#9A9AA5", marginTop: 2 },

  section: { backgroundColor: "#17171C", borderRadius: 20, borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.08)", padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: "900", color: "#F5A623", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 14 },
  
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  iconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#0B0B0F", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.08)", alignItems: "center", justifyContent: "center" },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 10, color: "#9A9AA5", fontWeight: "800" },
  infoValue: { fontSize: 13, color: "#FFFFFF", fontWeight: "700", marginTop: 1 },

  socialBtn: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "rgba(255, 255, 255, 0.08)" },
  socialText: { flex: 1, fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  
  signOutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 46, backgroundColor: "rgba(255, 77, 77, 0.15)", borderRadius: 20, marginTop: 8, borderWidth: 1, borderColor: "rgba(255, 77, 77, 0.3)" },
  signOutText: { color: "#FF4D4D", fontSize: 14, fontWeight: "900" },
});
