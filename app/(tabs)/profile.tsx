import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Platform, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/context/AuthContext";
import { useUserData } from "@/context/UserDataContext";
import Colors from "@/constants/colors";

const C = Colors.dark;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { stats } = useUserData();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: logout },
    ]);
  };

  const statsRows = [
    { label: "Problems Solved", value: stats.totalSolved, icon: "checkmark-circle-outline", color: C.accentGreen },
    { label: "Code Analyses", value: stats.analyzerCount, icon: "flash-outline", color: C.accent },
    { label: "Mock Interviews", value: stats.interviewCount, icon: "mic-outline", color: C.accentViolet },
    { label: "Resume Reviews", value: stats.resumeCount, icon: "document-text-outline", color: C.accentOrange },
    { label: "Beginner DSA", value: stats.dsaByDifficulty.beginner, icon: "leaf-outline", color: C.accentGreen },
    { label: "Intermediate DSA", value: stats.dsaByDifficulty.intermediate, icon: "flame-outline", color: C.accentOrange },
    { label: "Advanced DSA", value: stats.dsaByDifficulty.advanced, icon: "nuclear-outline", color: C.accentRed },
  ];

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomInset + 120 }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: topInset + 12 }]}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* Avatar + Info */}
        <View style={styles.profileCard}>
          <LinearGradient colors={["#00E5FF25", "#7C3AED15"]} style={styles.avatarBg}>
            <Text style={styles.avatarText}>{(user?.displayName || "D")[0].toUpperCase()}</Text>
          </LinearGradient>
          <Text style={styles.displayName}>{user?.displayName}</Text>
          <Text style={styles.username}>@{user?.username}</Text>
          <View style={styles.levelBadge}>
            <Ionicons name="diamond" size={14} color={C.accent} />
            <Text style={styles.levelText}>
              {stats.totalSolved >= 15 ? "Advanced" : stats.totalSolved >= 7 ? "Intermediate" : "Beginner"} Developer
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {statsRows.map((s) => (
            <View key={s.label} style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: s.color + "20" }]}>
                <Ionicons name={s.icon as any} size={18} color={s.color} />
              </View>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Progress Bars */}
        <View style={styles.progressSection}>
          <Text style={styles.sectionTitle}>Progress</Text>
          {[
            { label: "Arrays", topic: "Arrays", color: C.accent },
            { label: "Trees", topic: "Trees", color: C.accentViolet },
            { label: "Dynamic Programming", topic: "DP", color: C.accentGreen },
            { label: "Graphs", topic: "Graphs", color: C.accentOrange },
            { label: "Strings", topic: "Strings", color: "#EC4899" },
          ].map((p) => {
            const total = 4;
            const solved = stats.dsaByTopic[p.topic] || 0;
            const pct = Math.min(solved / total, 1);
            return (
              <View key={p.label} style={styles.progressRow}>
                <Text style={styles.progressLabel}>{p.label}</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${pct * 100}%` as any, backgroundColor: p.color }]} />
                </View>
                <Text style={styles.progressText}>{solved}/{total}</Text>
              </View>
            );
          })}
        </View>

        {/* Sign Out */}
        <View style={styles.actionsSection}>
          <Pressable
            style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.8 }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color={C.accentRed} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", color: C.text },
  profileCard: { alignItems: "center", paddingVertical: 28, marginHorizontal: 20, backgroundColor: C.card, borderRadius: 24, borderWidth: 1, borderColor: C.cardBorder, marginBottom: 20 },
  avatarBg: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText: { fontSize: 32, fontFamily: "Inter_700Bold", color: C.accent },
  displayName: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.text, marginBottom: 2 },
  username: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary, marginBottom: 10 },
  levelBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.accent + "15", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: C.accent + "40" },
  levelText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.accent },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  statItem: { width: "30%", backgroundColor: C.card, borderRadius: 14, padding: 14, alignItems: "center", gap: 6, borderWidth: 1, borderColor: C.cardBorder },
  statIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 20, fontFamily: "Inter_700Bold", color: C.text },
  statLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: C.textSecondary, textAlign: "center" },
  progressSection: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: C.text, marginBottom: 14 },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  progressLabel: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, width: 80 },
  progressBar: { flex: 1, height: 6, backgroundColor: C.card, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  progressText: { fontSize: 12, fontFamily: "Inter_500Medium", color: C.textMuted, width: 30, textAlign: "right" },
  actionsSection: { paddingHorizontal: 20 },
  signOutBtn: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.accentRed + "15", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.accentRed + "30" },
  signOutText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.accentRed },
});
