import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl } from "@/lib/query-client";

const C = Colors.dark;

interface UserStats {
  totalSolved: number;
  analyzerCount: number;
  interviewCount: number;
  resumeCount: number;
  githubCount: number;
  careerCount: number;
  codingFeedbackCount: number;
  isPremium: boolean;
  trialUsed: number;
  lastActive: number;
  recentActivity: { type: string; description: string; timestamp: number }[];
}

interface UserRecord {
  id: string;
  username: string;
  displayName: string;
  createdAt: number;
  stats: UserStats;
}

interface AdminTotals {
  totalUsers: number;
  premiumUsers: number;
  totalSolved: number;
  analyzerCount: number;
  interviewCount: number;
  resumeCount: number;
  githubCount: number;
  careerCount: number;
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function StatBox({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <View style={[styles.statBox, { borderColor: color + "40" }]}>
      <Ionicons name={icon as any} size={20} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function UserCard({ user, isExpanded, onPress }: { user: UserRecord; isExpanded: boolean; onPress: () => void }) {
  const totalActions =
    user.stats.analyzerCount +
    user.stats.interviewCount +
    user.stats.resumeCount +
    user.stats.githubCount +
    user.stats.careerCount +
    user.stats.codingFeedbackCount;

  return (
    <TouchableOpacity style={styles.userCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.userCardHeader}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>{user.displayName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text style={styles.userName}>{user.displayName}</Text>
            {user.stats.isPremium && (
              <View style={styles.premiumBadge}>
                <Ionicons name="diamond" size={10} color="#7C3AED" />
                <Text style={styles.premiumText}>Premium</Text>
              </View>
            )}
          </View>
          <Text style={styles.userUsername}>@{user.username}</Text>
          <Text style={styles.userMeta}>
            Joined {timeAgo(user.createdAt)} · Last active {timeAgo(user.stats.lastActive)}
          </Text>
        </View>
        <View style={styles.userStats}>
          <Text style={styles.userActionsNum}>{totalActions}</Text>
          <Text style={styles.userActionsLabel}>actions</Text>
        </View>
        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={16}
          color={C.textSecondary}
        />
      </View>

      {isExpanded && (
        <View style={styles.userExpanded}>
          <View style={styles.expandedGrid}>
            <View style={styles.expandedStat}>
              <Ionicons name="code-slash" size={14} color={C.accent} />
              <Text style={styles.expandedStatVal}>{user.stats.analyzerCount}</Text>
              <Text style={styles.expandedStatLbl}>Analyzed</Text>
            </View>
            <View style={styles.expandedStat}>
              <Ionicons name="chatbubbles" size={14} color="#7C3AED" />
              <Text style={styles.expandedStatVal}>{user.stats.interviewCount}</Text>
              <Text style={styles.expandedStatLbl}>Interviews</Text>
            </View>
            <View style={styles.expandedStat}>
              <Ionicons name="document-text" size={14} color="#10B981" />
              <Text style={styles.expandedStatVal}>{user.stats.resumeCount}</Text>
              <Text style={styles.expandedStatLbl}>Resumes</Text>
            </View>
            <View style={styles.expandedStat}>
              <Ionicons name="trophy" size={14} color="#F59E0B" />
              <Text style={styles.expandedStatVal}>{user.stats.totalSolved}</Text>
              <Text style={styles.expandedStatLbl}>DSA Solved</Text>
            </View>
            <View style={styles.expandedStat}>
              <Ionicons name="logo-github" size={14} color={C.textSecondary} />
              <Text style={styles.expandedStatVal}>{user.stats.githubCount}</Text>
              <Text style={styles.expandedStatLbl}>GitHub</Text>
            </View>
            <View style={styles.expandedStat}>
              <Ionicons name="trending-up" size={14} color="#F59E0B" />
              <Text style={styles.expandedStatVal}>{user.stats.careerCount}</Text>
              <Text style={styles.expandedStatLbl}>Career</Text>
            </View>
          </View>

          <View style={styles.trialRow}>
            <Text style={styles.trialLabel}>Trial Used:</Text>
            <View style={styles.trialBar}>
              <View style={[styles.trialFill, { width: `${Math.min((user.stats.trialUsed / 3) * 100, 100)}%` }]} />
            </View>
            <Text style={styles.trialCount}>{user.stats.trialUsed}/3</Text>
          </View>

          {user.stats.recentActivity?.length > 0 && (
            <View style={styles.activitySection}>
              <Text style={styles.activityTitle}>Recent Activity</Text>
              {user.stats.recentActivity.slice(0, 3).map((a, i) => (
                <View key={i} style={styles.activityItem}>
                  <View style={styles.activityDot} />
                  <Text style={styles.activityText} numberOfLines={1}>{a.description}</Text>
                  <Text style={styles.activityTime}>{timeAgo(a.timestamp)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const webTop = Platform.OS === "web" ? 67 : 0;
  const webBottom = Platform.OS === "web" ? 34 : 0;

  const headers = { "x-admin-id": user?.id || "" };
  const baseUrl = getApiUrl();

  const usersQuery = useQuery<UserRecord[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await fetch(new URL("/api/admin/users", baseUrl).toString(), { headers });
      if (!res.ok) throw new Error("Forbidden");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const totalsQuery = useQuery<AdminTotals>({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const res = await fetch(new URL("/api/admin/stats", baseUrl).toString(), { headers });
      if (!res.ok) throw new Error("Forbidden");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([usersQuery.refetch(), totalsQuery.refetch()]);
    setRefreshing(false);
  }, []);

  const totals = totalsQuery.data;
  const users = usersQuery.data || [];

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTop, paddingBottom: insets.bottom + webBottom }]}>
      {/* Header */}
      <LinearGradient colors={["#1a0533", "#0A0F1E"]} style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <View style={styles.adminBadge}>
              <Ionicons name="shield" size={12} color="#EF4444" />
              <Text style={styles.adminBadgeText}>ADMIN CONSOLE</Text>
            </View>
            <Text style={styles.headerTitle}>SkillMirror AI</Text>
            <Text style={styles.headerSub}>Platform Administration</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
      >
        {/* Platform Stats */}
        <Text style={styles.sectionTitle}>Platform Overview</Text>

        {totalsQuery.isLoading ? (
          <ActivityIndicator color={C.accent} style={{ marginVertical: 20 }} />
        ) : totals ? (
          <View style={styles.statsGrid}>
            <StatBox label="Total Users" value={totals.totalUsers} icon="people" color={C.accent} />
            <StatBox label="Premium" value={totals.premiumUsers} icon="diamond" color="#7C3AED" />
            <StatBox label="DSA Solved" value={totals.totalSolved} icon="trophy" color="#F59E0B" />
            <StatBox label="Code Reviews" value={totals.analyzerCount} icon="code-slash" color="#10B981" />
            <StatBox label="Interviews" value={totals.interviewCount} icon="chatbubbles" color="#7C3AED" />
            <StatBox label="Resumes" value={totals.resumeCount} icon="document-text" color={C.accent} />
          </View>
        ) : null}

        {/* Tool Usage Breakdown */}
        {totals && (
          <View style={styles.usageCard}>
            <Text style={styles.cardTitle}>Tool Usage Distribution</Text>
            {[
              { label: "Code Analyzer", value: totals.analyzerCount, color: C.accent, icon: "code-slash" },
              { label: "Interviews", value: totals.interviewCount, color: "#7C3AED", icon: "chatbubbles" },
              { label: "Resume Analyzer", value: totals.resumeCount, color: "#10B981", icon: "document-text" },
              { label: "GitHub Analyzer", value: totals.githubCount, color: "#F59E0B", icon: "logo-github" },
              { label: "Career Advisor", value: totals.careerCount, color: "#EF4444", icon: "trending-up" },
            ].map((item, i) => {
              const total = totals.analyzerCount + totals.interviewCount + totals.resumeCount + totals.githubCount + totals.careerCount || 1;
              const pct = Math.round((item.value / total) * 100);
              return (
                <View key={i} style={styles.usageRow}>
                  <Ionicons name={item.icon as any} size={14} color={item.color} style={{ width: 20 }} />
                  <Text style={styles.usageLabel}>{item.label}</Text>
                  <View style={styles.usageBarContainer}>
                    <View style={[styles.usageBar, { width: `${pct}%`, backgroundColor: item.color }]} />
                  </View>
                  <Text style={[styles.usagePct, { color: item.color }]}>{item.value}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* User List */}
        <View style={styles.userListHeader}>
          <Text style={styles.sectionTitle}>Registered Users ({users.length})</Text>
          {usersQuery.isFetching && !usersQuery.isLoading && (
            <ActivityIndicator size="small" color={C.accent} />
          )}
        </View>

        {usersQuery.isLoading ? (
          <ActivityIndicator color={C.accent} style={{ marginVertical: 20 }} />
        ) : users.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={40} color={C.textSecondary} />
            <Text style={styles.emptyText}>No users registered yet</Text>
            <Text style={styles.emptySubText}>New users will appear here after they sign up.</Text>
          </View>
        ) : (
          users.map((u) => (
            <UserCard
              key={u.id}
              user={u}
              isExpanded={expandedUser === u.id}
              onPress={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
            />
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { padding: 20, paddingBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EF444420",
    borderWidth: 1,
    borderColor: "#EF444440",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  adminBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#EF4444", letterSpacing: 1 },
  headerTitle: { fontSize: 26, fontFamily: "Inter_700Bold", color: C.text },
  headerSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 2 },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EF444415",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { flex: 1 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: C.text, marginHorizontal: 20, marginTop: 20, marginBottom: 12 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 10 },
  statBox: {
    width: "30%",
    flex: 1,
    minWidth: 90,
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold", marginTop: 6 },
  statLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: C.textSecondary, marginTop: 2, textAlign: "center" },
  usageCard: { marginHorizontal: 20, marginTop: 20, backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.cardBorder },
  cardTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: C.text, marginBottom: 16 },
  usageRow: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 8 },
  usageLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: C.textSecondary, width: 110 },
  usageBarContainer: { flex: 1, height: 6, backgroundColor: C.background, borderRadius: 3, overflow: "hidden" },
  usageBar: { height: 6, borderRadius: 3, minWidth: 4 },
  usagePct: { fontSize: 12, fontFamily: "Inter_700Bold", width: 28, textAlign: "right" },
  userListHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingRight: 20 },
  userCard: { marginHorizontal: 20, marginBottom: 10, backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.cardBorder, overflow: "hidden" },
  userCardHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  userAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#00E5FF20", alignItems: "center", justifyContent: "center" },
  userAvatarText: { fontSize: 18, fontFamily: "Inter_700Bold", color: C.accent },
  userInfo: { flex: 1 },
  userNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  userName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#7C3AED20",
    borderWidth: 1,
    borderColor: "#7C3AED50",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  premiumText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#7C3AED" },
  userUsername: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 1 },
  userMeta: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textSecondary + "99", marginTop: 2 },
  userStats: { alignItems: "center" },
  userActionsNum: { fontSize: 18, fontFamily: "Inter_700Bold", color: C.accent },
  userActionsLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: C.textSecondary },
  userExpanded: { borderTopWidth: 1, borderTopColor: C.cardBorder, padding: 14 },
  expandedGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  expandedStat: { backgroundColor: C.background, borderRadius: 10, padding: 10, alignItems: "center", minWidth: 70, flex: 1 },
  expandedStatVal: { fontSize: 18, fontFamily: "Inter_700Bold", color: C.text, marginTop: 4 },
  expandedStatLbl: { fontSize: 10, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 2 },
  trialRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  trialLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: C.textSecondary, width: 70 },
  trialBar: { flex: 1, height: 6, backgroundColor: C.background, borderRadius: 3, overflow: "hidden" },
  trialFill: { height: 6, backgroundColor: "#F59E0B", borderRadius: 3 },
  trialCount: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#F59E0B", width: 28, textAlign: "right" },
  activitySection: { borderTopWidth: 1, borderTopColor: C.cardBorder, paddingTop: 12 },
  activityTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: C.textSecondary, marginBottom: 8 },
  activityItem: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  activityDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent },
  activityText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", color: C.text },
  activityTime: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textSecondary },
  emptyState: { alignItems: "center", paddingVertical: 40, paddingHorizontal: 20 },
  emptyText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: C.text, marginTop: 12 },
  emptySubText: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 6, textAlign: "center" },
});
