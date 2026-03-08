import React, { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/context/AuthContext";
import Colors from "@/constants/colors";

const C = Colors.dark;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      await login(username.trim(), password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      setError(e?.message?.includes("401") ? "Invalid username or password" : "Login failed. Try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <LinearGradient
        colors={["#0A0F1E", "#0D1630", "#0A0F1E"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative blobs */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Ionicons name="diamond" size={32} color={C.accent} />
            </View>
            <Text style={styles.logoText}>SkillMirror</Text>
            <Text style={styles.logoSub}>AI-Powered Developer Growth</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>

            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color={C.accentRed} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color={C.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter username"
                  placeholderTextColor={C.textMuted}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={C.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Enter password"
                  placeholderTextColor={C.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={C.textMuted} />
                </Pressable>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.loginBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <LinearGradient
                colors={["#00E5FF", "#0096FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginBtnGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.loginBtnText}>Sign In</Text>
                )}
              </LinearGradient>
            </Pressable>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              style={({ pressed }) => [styles.registerBtn, pressed && { opacity: 0.7 }]}
              onPress={() => router.push("/(auth)/register")}
            >
              <Text style={styles.registerBtnText}>
                Don't have an account? <Text style={{ color: C.accent }}>Create one</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 20 },
  blob1: {
    position: "absolute", width: 300, height: 300,
    borderRadius: 150, backgroundColor: "#00E5FF08",
    top: -100, right: -100,
  },
  blob2: {
    position: "absolute", width: 250, height: 250,
    borderRadius: 125, backgroundColor: "#7C3AED08",
    bottom: 0, left: -80,
  },
  logoContainer: { alignItems: "center", marginBottom: 40 },
  logoIcon: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: "#00E5FF15", borderWidth: 1, borderColor: "#00E5FF30",
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  logoText: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#F0F4FF", letterSpacing: 0.5 },
  logoSub: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#8B9BC8", marginTop: 4 },
  card: {
    backgroundColor: "#111827",
    borderRadius: 24, padding: 28,
    borderWidth: 1, borderColor: "#1E2D45",
  },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#F0F4FF", marginBottom: 4 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#8B9BC8", marginBottom: 24 },
  errorBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#EF444415", borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: "#EF444430", marginBottom: 16,
  },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#EF4444", flex: 1 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#8B9BC8", marginBottom: 8 },
  inputWrapper: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#141C2E", borderRadius: 12,
    borderWidth: 1, borderColor: "#1E2D45",
    paddingHorizontal: 14, height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", color: "#F0F4FF" },
  eyeBtn: { padding: 4 },
  loginBtn: { marginTop: 8, borderRadius: 14, overflow: "hidden" },
  loginBtnGradient: { height: 52, alignItems: "center", justifyContent: "center" },
  loginBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#0A0F1E" },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 20, gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#1E2D45" },
  dividerText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#4A5680" },
  registerBtn: { alignItems: "center" },
  registerBtnText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#8B9BC8" },
});
