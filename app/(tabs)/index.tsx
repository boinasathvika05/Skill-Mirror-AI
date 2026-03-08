import React from "react";
import {
  View, Text, ScrollView, Pressable, StyleSheet, Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useUserData } from "@/context/UserDataContext";
import { RadarChart } from "@/components/RadarChart";
import Colors from "@/constants/colors";

const C = Colors.dark;

const TOOLS = [
  { id: "code-analyzer", label: "Code\nAnalyzer", icon: "code-slash-outline", color: "#00E5FF", route: "/tools/code-analyzer" },
  { id: "dsa", label: "DSA\nPractice", icon: "bar-chart-outline", color: "#7C3AED", route: "/tools/dsa" },
  { id: "interview", label: "Interview\nSim", icon: "mic-outline", color: "#10B981", route: "/tools/interview" },
  { id: "resume", label: "Resume\nAnalyzer", icon: "document-text-outline", color: "#F59E0B", route: "/tools/resume" },
  { id: "career", label: "Career\nAdvisor", icon: "compass-outline", color: "#EF4444", route: "/tools/career" },
  { id: "github", label: "GitHub\nAnalyzer", icon: "logo-github", color: "#8B5CF6", route: "/tools/github" },
];

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { stats } = useUserData();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const dsaTopics = ["Arrays", "Trees", "DP", "Graphs", "Strings", "BFS/DFS"];
  const radarData = dsaTopics.map((label) => ({
    label,
    value: stats.dsaByTopic[label] || 0,
    maxValue: 5,
  }));

  const activityTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const activityIcon = (type: string) => {
    switch (type) {
      case "dsa": return "bar-chart-outline";
      case "code": return "code-slash-outline";
      case "interview": return "mic-outline";
      case "resume": return "document-text-outline";
      default: return "flash-outline";
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: topInset + 12, paddingBottom: bottomInset + 120 }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good {getTimeOfDay()},</Text>
            <Text style={styles.userName}>{user?.displayName || "Developer"}</Text>
          </View>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{(user?.displayName || "D")[0].toUpperCase()}</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[
            { label: "Solved", value: stats.totalSolved, icon: "checkmark-circle-outline", color: C.accentGreen },
            { label: "Analyzed", value: stats.analyzerCount, icon: "flash-outline", color: C.accent },
            { label: "Interviews", value: stats.interviewCount, icon: "mic-outline", color: C.accentViolet },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Ionicons name={s.icon as any} size={20} color={s.color} />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* DSA Radar */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>DSA Skills Radar</Text>
            <Pressable onPress={() => router.push("/tools/dsa")}>
              <Text style={styles.sectionLink}>Practice</Text>
            </Pressable>
          </View>
          <View style={styles.radarCard}>
            {stats.totalSolved === 0 ? (
              <View style={styles.emptyRadar}>
                <Ionicons name="bar-chart-outline" size={40} color={C.textMuted} />
                <Text style={styles.emptyText}>Solve DSA problems to see your radar</Text>
              </View>
            ) : (
              <RadarChart data={radarData} size={220} />
            )}
            <View style={styles.dsaLevelRow}>
              {[
                { label: "Beginner", val: stats.dsaByDifficulty.beginner, color: C.accentGreen },
                { label: "Inter.", val: stats.dsaByDifficulty.intermediate, color: C.accentOrange },
                { label: "Advanced", val: stats.dsaByDifficulty.advanced, color: C.accentRed },
              ].map((d) => (
                <View key={d.label} style={styles.dsaLevel}>
                  <View style={[styles.dsaDot, { backgroundColor: d.color }]} />
                  <Text style={styles.dsaLevelText}>{d.val} {d.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Quick Access Tools */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.toolsGrid}>
            {TOOLS.map((tool) => (
              <Pressable
                key={tool.id}
                style={({ pressed }) => [styles.toolCard, pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] }]}
                onPress={() => router.push(tool.route as any)}
              >
                <View style={[styles.toolIconBg, { backgroundColor: tool.color + "20" }]}>
                  <Ionicons name={tool.icon as any} size={22} color={tool.color} />
                </View>
                <Text style={styles.toolLabel}>{tool.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        {stats.recentActivity.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <View style={styles.activityCard}>
              {stats.recentActivity.slice(0, 5).map((a, i) => (
                <View key={i} style={[styles.activityItem, i < 4 && styles.activityBorder]}>
                  <View style={styles.activityIcon}>
                    <Ionicons name={activityIcon(a.type) as any} size={16} color={C.accent} />
                  </View>
                  <Text style={styles.activityDesc} numberOfLines={1}>{a.description}</Text>
                  <Text style={styles.activityTime}>{activityTime(a.timestamp)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  greeting: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary },
  userName: { fontSize: 24, fontFamily: "Inter_700Bold", color: C.text },
  avatarContainer: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: C.accent + "25", borderWidth: 2, borderColor: C.accent + "60",
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 18, fontFamily: "Inter_700Bold", color: C.accent },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: C.card, borderRadius: 16,
    padding: 14, alignItems: "center", gap: 4,
    borderWidth: 1, borderColor: C.cardBorder,
  },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.text },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textSecondary },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: C.text, marginBottom: 12 },
  sectionLink: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.accent },
  radarCard: {
    backgroundColor: C.card, borderRadius: 20,
    padding: 20, alignItems: "center",
    borderWidth: 1, borderColor: C.cardBorder,
  },
  emptyRadar: { height: 150, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textMuted, textAlign: "center" },
  dsaLevelRow: { flexDirection: "row", gap: 16, marginTop: 12, justifyContent: "center" },
  dsaLevel: { flexDirection: "row", alignItems: "center", gap: 6 },
  dsaDot: { width: 8, height: 8, borderRadius: 4 },
  dsaLevelText: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary },
  toolsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  toolCard: {
    width: "30%", backgroundColor: C.card, borderRadius: 16,
    padding: 14, alignItems: "center", gap: 8,
    borderWidth: 1, borderColor: C.cardBorder,
  },
  toolIconBg: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  toolLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: C.text, textAlign: "center" },
  activityCard: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.cardBorder, overflow: "hidden" },
  activityItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  activityBorder: { borderBottomWidth: 1, borderBottomColor: C.cardBorder },
  activityIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.accent + "15", alignItems: "center", justifyContent: "center" },
  activityDesc: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: C.text },
  activityTime: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textMuted },
});
