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

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (!displayName.trim() || !username.trim() || !password) {
      setError("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      await register(username.trim().toLowerCase(), password, displayName.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      const msg = e?.message || "";
      setError(msg.includes("409") ? "Username already taken" : "Registration failed. Try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <LinearGradient colors={["#0A0F1E", "#0D1630", "#0A0F1E"]} style={StyleSheet.absoluteFill} />
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={C.textSecondary} />
          </Pressable>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoIcon}>
              <Ionicons name="diamond" size={28} color={C.accent} />
            </View>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Start your AI-powered journey</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color={C.accentRed} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {[
              { label: "Full Name", icon: "person-outline", value: displayName, setter: setDisplayName, placeholder: "Your name", type: "default" },
              { label: "Username", icon: "at-outline", value: username, setter: setUsername, placeholder: "Choose a username", type: "default" },
            ].map((field) => (
              <View key={field.label} style={styles.inputGroup}>
                <Text style={styles.label}>{field.label}</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name={field.icon as any} size={18} color={C.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={field.placeholder}
                    placeholderTextColor={C.textMuted}
                    value={field.value}
                    onChangeText={field.setter}
                    autoCapitalize={field.label === "Username" ? "none" : "words"}
                    autoCorrect={false}
                  />
                </View>
              </View>
            ))}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={C.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Min. 6 characters"
                  placeholderTextColor={C.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={C.textMuted} />
                </Pressable>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={C.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Repeat password"
                  placeholderTextColor={C.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                />
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <LinearGradient colors={["#00E5FF", "#0096FF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGradient}>
                {isLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Create Account</Text>}
              </LinearGradient>
            </Pressable>

            <Pressable style={styles.loginLink} onPress={() => router.back()}>
              <Text style={styles.loginLinkText}>
                Already have an account? <Text style={{ color: C.accent }}>Sign in</Text>
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
  scroll: { flexGrow: 1, paddingHorizontal: 20 },
  blob1: { position: "absolute", width: 300, height: 300, borderRadius: 150, backgroundColor: "#00E5FF08", top: -100, right: -100 },
  blob2: { position: "absolute", width: 250, height: 250, borderRadius: 125, backgroundColor: "#7C3AED08", bottom: 0, left: -80 },
  backBtn: { width: 40, height: 40, justifyContent: "center", marginBottom: 16 },
  header: { marginBottom: 28 },
  logoIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: "#00E5FF15", borderWidth: 1, borderColor: "#00E5FF30", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#F0F4FF", marginBottom: 4 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#8B9BC8" },
  card: { backgroundColor: "#111827", borderRadius: 24, padding: 24, borderWidth: 1, borderColor: "#1E2D45" },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#EF444415", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#EF444430", marginBottom: 16 },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#EF4444", flex: 1 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#8B9BC8", marginBottom: 8 },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#141C2E", borderRadius: 12, borderWidth: 1, borderColor: "#1E2D45", paddingHorizontal: 14, height: 50 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", color: "#F0F4FF" },
  btn: { marginTop: 8, borderRadius: 14, overflow: "hidden" },
  btnGradient: { height: 52, alignItems: "center", justifyContent: "center" },
  btnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#0A0F1E" },
  loginLink: { alignItems: "center", marginTop: 20 },
  loginLinkText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#8B9BC8" },
});
