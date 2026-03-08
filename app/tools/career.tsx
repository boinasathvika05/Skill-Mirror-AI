import React, { useState } from "react";
import {
  View, Text, Pressable, ScrollView, StyleSheet,
  TextInput, ActivityIndicator, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { apiRequest } from "@/lib/query-client";
import { useUserData } from "@/context/UserDataContext";
import { usePayment } from "@/context/PaymentContext";
import { TrialBanner } from "@/components/TrialBanner";
import Colors from "@/constants/colors";

const C = Colors.dark;

interface CareerResult {
  topRoles: {
    title: string;
    matchScore: number;
    reasoning: string;
    companies: string[];
    salaryRange: string;
    growthPath: string;
  }[];
  skillGaps: { skill: string; importance: "critical" | "high" | "medium"; learningPath: string }[];
  immediateActions: string[];
  timelineToNextRole: string;
  marketInsight: string;
}

const IMP_COLORS: Record<string, string> = { critical: C.accentRed, high: C.accentOrange, medium: "#3B82F6" };

export default function CareerAdvisorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addActivity } = useUserData();
  const payment = usePayment() as any;
  const [resume, setResume] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CareerResult | null>(null);
  const [error, setError] = useState("");
  const [expandedRole, setExpandedRole] = useState<number | null>(0);
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const analyze = async () => {
    if (!resume.trim()) { setError("Paste your resume to get career advice"); return; }
    const allowed = await payment.checkAndConsumerial();
    if (!allowed) { router.push("/paywall" as any); return; }
    setIsLoading(true);
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await apiRequest("POST", "/api/ai/career-advice", { resume });
      const data = await res.json();
      setResult(data);
      addActivity("career", "Career advice generated");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setError("Analysis failed. Try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: bottomInset + 40 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <TrialBanner />
      {/* Intro */}
      <View style={styles.introCard}>
        <View style={styles.introIcon}>
          <Ionicons name="compass" size={28} color={C.accentRed} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.introTitle}>AI Career Advisor</Text>
          <Text style={styles.introDesc}>Discover the perfect roles based on your experience and skills</Text>
        </View>
      </View>

      {/* Resume */}
      <View style={styles.section}>
        <Text style={styles.label}>Your Resume</Text>
        <View style={styles.textAreaCard}>
          <TextInput
            style={styles.textArea}
            placeholder="Paste your resume here..."
            placeholderTextColor={C.textMuted}
            value={resume}
            onChangeText={setResume}
            multiline
            autoCapitalize="sentences"
            scrollEnabled={false}
          />
        </View>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color={C.accentRed} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <Pressable
        style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
        onPress={analyze}
        disabled={isLoading}
      >
        <LinearGradient colors={["#EF4444", "#991B1B"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGradient}>
          {isLoading
            ? <View style={styles.row}><ActivityIndicator color="#fff" /><Text style={styles.btnText}>Analyzing...</Text></View>
            : <View style={styles.row}><Ionicons name="compass" size={18} color="#fff" /><Text style={styles.btnText}>Get Career Advice</Text></View>
          }
        </LinearGradient>
      </Pressable>

      {result && (
        <View style={{ gap: 16 }}>
          {/* Market Insight */}
          <View style={styles.insightCard}>
            <Ionicons name="trending-up" size={18} color={C.accent} />
            <Text style={styles.insightText}>{result.marketInsight}</Text>
          </View>

          {/* Timeline */}
          <View style={styles.timelineCard}>
            <Ionicons name="time-outline" size={16} color={C.accentViolet} />
            <Text style={styles.timelineText}>Next role in approximately <Text style={{ color: C.accentViolet, fontFamily: "Inter_600SemiBold" }}>{result.timelineToNextRole}</Text></Text>
          </View>

          {/* Top Roles */}
          <View>
            <Text style={styles.sectionTitle}>Recommended Roles</Text>
            {result.topRoles?.map((role, i) => (
              <View key={i} style={styles.roleCard}>
                <Pressable style={styles.roleHeader} onPress={() => setExpandedRole(expandedRole === i ? null : i)}>
                  <View style={styles.roleTitleRow}>
                    <View style={[styles.rankBadge, { backgroundColor: i === 0 ? C.accentOrange + "30" : C.card }]}>
                      <Text style={[styles.rankText, { color: i === 0 ? C.accentOrange : C.textMuted }]}>#{i + 1}</Text>
                    </View>
                    <Text style={styles.roleTitle}>{role.title}</Text>
                  </View>
                  <View style={styles.roleRight}>
                    <View style={styles.matchScore}>
                      <Text style={[styles.matchValue, { color: role.matchScore >= 80 ? C.accentGreen : role.matchScore >= 60 ? C.accentOrange : C.accentRed }]}>{role.matchScore}%</Text>
                    </View>
                    <Ionicons name={expandedRole === i ? "chevron-up" : "chevron-down"} size={16} color={C.textMuted} />
                  </View>
                </Pressable>

                {expandedRole === i && (
                  <View style={styles.roleExpanded}>
                    <Text style={styles.roleReasoning}>{role.reasoning}</Text>
                    <View style={styles.salaryRow}>
                      <Ionicons name="cash-outline" size={14} color={C.accentGreen} />
                      <Text style={styles.salaryText}>{role.salaryRange}</Text>
                    </View>
                    <Text style={styles.growthPath}>{role.growthPath}</Text>
                    <View style={styles.companiesRow}>
                      {role.companies?.map((co, j) => (
                        <View key={j} style={styles.companyTag}>
                          <Text style={styles.companyTagText}>{co}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Skill Gaps */}
          {result.skillGaps?.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Skill Gaps</Text>
              {result.skillGaps.map((sg, i) => (
                <View key={i} style={styles.skillGapCard}>
                  <View style={styles.skillGapHeader}>
                    <Text style={styles.skillName}>{sg.skill}</Text>
                    <View style={[styles.impBadge, { backgroundColor: IMP_COLORS[sg.importance] + "20" }]}>
                      <Text style={[styles.impText, { color: IMP_COLORS[sg.importance] }]}>{sg.importance}</Text>
                    </View>
                  </View>
                  <Text style={styles.learningPath}>{sg.learningPath}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Immediate Actions */}
          {result.immediateActions?.length > 0 && (
            <View style={styles.actionsCard}>
              <Text style={styles.sectionTitle}>Take Action Now</Text>
              {result.immediateActions.map((action, i) => (
                <View key={i} style={styles.actionItem}>
                  <View style={styles.actionNumber}>
                    <Text style={styles.actionNumberText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.actionText}>{action}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  introCard: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.cardBorder, marginBottom: 20 },
  introIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: C.accentRed + "20", alignItems: "center", justifyContent: "center" },
  introTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: C.text, marginBottom: 2 },
  introDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, lineHeight: 17 },
  section: { marginBottom: 16 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.textSecondary, marginBottom: 8 },
  textAreaCard: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.cardBorder },
  textArea: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.text, padding: 14, minHeight: 180, textAlignVertical: "top", lineHeight: 20 },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#EF444415", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#EF444430", marginBottom: 12 },
  errorText: { fontSize: 13, color: C.accentRed },
  btn: { borderRadius: 14, overflow: "hidden", marginBottom: 20 },
  btnGradient: { height: 52, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  btnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  insightCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: C.accent + "10", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.accent + "25" },
  insightText: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.text, lineHeight: 19, flex: 1 },
  timelineCard: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.accentViolet + "10", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.accentViolet + "25" },
  timelineText: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text, marginBottom: 12 },
  roleCard: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.cardBorder, marginBottom: 10, overflow: "hidden" },
  roleHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14 },
  roleTitleRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  rankBadge: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  rankText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  roleTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text, flex: 1 },
  roleRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  matchScore: { backgroundColor: C.background, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  matchValue: { fontSize: 14, fontFamily: "Inter_700Bold" },
  roleExpanded: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: C.cardBorder, paddingTop: 12, gap: 8 },
  roleReasoning: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, lineHeight: 18 },
  salaryRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  salaryText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.accentGreen },
  growthPath: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted, fontStyle: "italic" },
  companiesRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  companyTag: { backgroundColor: C.accentViolet + "20", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  companyTagText: { fontSize: 12, fontFamily: "Inter_500Medium", color: C.accentViolet },
  skillGapCard: { backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.cardBorder, marginBottom: 8 },
  skillGapHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  skillName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text },
  impBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  impText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  learningPath: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, lineHeight: 17 },
  actionsCard: {},
  actionItem: { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: C.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.cardBorder, marginBottom: 8 },
  actionNumber: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.accentRed + "20", alignItems: "center", justifyContent: "center" },
  actionNumberText: { fontSize: 12, fontFamily: "Inter_700Bold", color: C.accentRed },
  actionText: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.text, flex: 1, lineHeight: 18 },
});
