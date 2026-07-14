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
  Platform,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthAPI } from "../lib/api";
import { useCart } from "../context/CartContext";
import { colors, radius, spacing } from "../lib/theme";

export default function ProfileScreen() {
  const { setToken } = useCart();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Animated values
  const headerScale = useRef(new Animated.Value(0.92)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const sec1Slide = useRef(new Animated.Value(30)).current;
  const sec1Opacity = useRef(new Animated.Value(0)).current;
  const sec2Slide = useRef(new Animated.Value(30)).current;
  const sec2Opacity = useRef(new Animated.Value(0)).current;
  const logoutScale = useRef(new Animated.Value(0.85)).current;
  const logoutOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      try {
        const res = await AuthAPI.me();
        setUser(res.data.user);
      } catch (err) {
        // Token might be invalid
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loading) {
      Animated.stagger(80, [
        Animated.parallel([
          Animated.spring(headerScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
          Animated.timing(headerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(sec1Slide, { toValue: 0, duration: 450, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(sec1Opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(sec2Slide, { toValue: 0, duration: 450, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(sec2Opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.spring(logoutScale, { toValue: 1, friction: 5, useNativeDriver: true }),
          Animated.timing(logoutOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        ])
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
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const firstLetter = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Profile Header Card */}
      <Animated.View style={[styles.profileHeader, { opacity: headerOpacity, transform: [{ scale: headerScale }] }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{firstLetter}</Text>
        </View>
        <Text style={styles.name}>{user?.name || "Customer"}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </Animated.View>

      {/* Account Info Details */}
      <Animated.View style={[styles.section, { opacity: sec1Opacity, transform: [{ translateY: sec1Slide }] }]}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        
        <View style={styles.infoRow}>
          <View style={styles.iconWrap}>
            <Ionicons name="logo-whatsapp" size={18} color="#10b981" />
          </View>
          <View style={styles.infoText}>
            <Text style={styles.infoLabel}>WhatsApp Number</Text>
            <Text style={styles.infoValue}>+91 {user?.phone || "N/A"}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.iconWrap}>
            <Ionicons name="phone-portrait-outline" size={18} color="#3b82f6" />
          </View>
          <View style={styles.infoText}>
            <Text style={styles.infoLabel}>Registered Device</Text>
            <Text style={styles.infoValue}>{user?.currentDevice || "N/A"}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.iconWrap}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#059669" />
          </View>
          <View style={styles.infoText}>
            <Text style={styles.infoLabel}>Verification Status</Text>
            <Text style={[styles.infoValue, { color: "#059669", fontWeight: "bold" }]}>
              {user?.isVerified ? "Verified Account" : "Pending Verification"}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Connect With Us */}
      <Animated.View style={[styles.section, { opacity: sec2Opacity, transform: [{ translateY: sec2Slide }] }]}>
        <Text style={styles.sectionTitle}>Connect With Us</Text>

        <TouchableOpacity 
          style={styles.socialBtn}
          onPress={() => openUrl("https://maps.google.com/?q=MG+Road+Mobile+Store")}
        >
          <Ionicons name="map-outline" size={18} color={colors.accentDark} />
          <Text style={styles.socialText}>Visit Physical Store</Text>
          <Ionicons name="chevron-forward-outline" size={16} color={colors.muted} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.socialBtn}
          onPress={() => openUrl("https://instagram.com/rjmobilerepairing")}
        >
          <Ionicons name="logo-instagram" size={18} color="#ec4899" />
          <Text style={styles.socialText}>Instagram Profile</Text>
          <Ionicons name="chevron-forward-outline" size={16} color={colors.muted} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.socialBtn}
          onPress={() => openUrl("https://facebook.com/rjmobilerepairing")}
        >
          <Ionicons name="logo-facebook" size={18} color="#1877f2" />
          <Text style={styles.socialText}>Facebook Page</Text>
          <Ionicons name="chevron-forward-outline" size={16} color={colors.muted} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.socialBtn}
          onPress={() => openUrl("https://youtube.com/@rjmobile-repairing")}
        >
          <Ionicons name="logo-youtube" size={18} color="#ef4444" />
          <Text style={styles.socialText}>YouTube Channel</Text>
          <Ionicons name="chevron-forward-outline" size={16} color={colors.muted} />
        </TouchableOpacity>
      </Animated.View>

      {/* Logout Action */}
      <Animated.View style={{ opacity: logoutOpacity, transform: [{ scale: logoutScale }] }}>
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color="#fff" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 10, fontSize: 13, color: colors.muted, fontWeight: "700" },
  
  profileHeader: { alignItems: "center", backgroundColor: "#fff", borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingVertical: 24, paddingHorizontal: 16, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText: { color: colors.navy, fontSize: 24, fontWeight: "900" },
  name: { fontSize: 18, fontWeight: "900", color: colors.text },
  email: { fontSize: 13, color: colors.sub, marginTop: 2 },

  section: { backgroundColor: "#fff", borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  sectionTitle: { fontSize: 11, fontWeight: "900", color: colors.sub, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 14 },
  
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14, lastChild: { marginBottom: 0 } },
  iconWrap: { width: 32, height: 32, borderRadius: radius.md, backgroundColor: "#f8fafc", borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 10, color: colors.muted, fontWeight: "800" },
  infoValue: { fontSize: 13, color: colors.text, fontWeight: "700", marginTop: 1 },

  socialBtn: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  socialText: { flex: 1, fontSize: 13, fontWeight: "700", color: colors.text },
  
  signOutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 48, backgroundColor: colors.accentDark, borderRadius: radius.pill, marginTop: 8 },
  signOutText: { color: "#fff", fontSize: 14, fontWeight: "900" },
});
