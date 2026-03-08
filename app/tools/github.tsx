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

const ROLES = ["Software Engineer", "Frontend", "Backend", "Full Stack", "ML Engineer", "DevOps"];
const COMPANIES = ["Google", "Amazon", "Meta", "Microsoft", "Apple", "Netflix"];

interface GithubResult {
  overallScore: number;
  roleRelevance: number;
  codeQualityIndicators: { indicator: string; assessment: string; positive: boolean }[];
  techStack: string[];
  strengths: string[];
  improvements: string[];
  interviewTopics: string[];
  verdict: string;
  summary: string;
}

const VERDICT_COLORS: Record<string, string> = {
  Impressive: C.accentGreen,
  Good: "#3B82F6",
  Average: C.accentOrange,
  "Needs Work": C.accentRed,
};

export default function GithubAnalyzerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addActivity } = useUserData();
  const payment = usePayment() as any;
  const [repoUrl, setRepoUrl] = useState("");
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [targetCompany, setTargetCompany] = useState("Google");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GithubResult | null>(null);
  const [error, setError] = useState("");
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const analyze = async () => {
    if (!repoUrl.trim()) { setError("Enter a GitHub repo URL"); return; }
    if (!repoUrl.includes("github.com")) { setError("Enter a valid GitHub URL"); return; }
    const allowed = await payment.checkAndConsumerial();
    if (!allowed) { router.push("/paywall" as any); return; }
    setIsLoading(true);
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await apiRequest("POST", "/api/ai/analyze-github", { repoUrl, targetRole, targetCompany });
      const data = await res.json();
      setResult(data);
      addActivity("github", `Analyzed ${repoUrl.split("/").slice(-2).join("/")}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setError("Analysis failed. Check the URL and try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const Chip = ({ label, selected, onPress, color }: { label: string; selected: boolean; onPress: () => void; color?: string }) => (
    <Pressable
      style={[styles.chip, selected && { backgroundColor: (color || C.accentViolet) + "20", borderColor: color || C.accentViolet }]}
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
    >
      <Text style={[styles.chipText, selected && { color: color || C.accentViolet }]}>{label}</Text>
    </Pressable>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: bottomInset + 40 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <TrialBanner />
      {/* URL Input */}
      <View style={styles.section}>
        <Text style={styles.label}>GitHub Repository URL</Text>
        <View style={styles.urlInputWrapper}>
          <Ionicons name="logo-github" size={20} color={C.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            style={styles.urlInput}
            placeholder="https://github.com/username/repo"
            placeholderTextColor={C.textMuted}
            value={repoUrl}
            onChangeText={setRepoUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          {repoUrl.length > 0 && (
            <Pressable onPress={() => setRepoUrl("")}>
              <Ionicons name="close-circle" size={18} color={C.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Role */}
      <View style={styles.section}>
        <Text style={styles.label}>Target Role</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {ROLES.map((r) => <Chip key={r} label={r} selected={targetRole === r} onPress={() => setTargetRole(r)} color="#8B5CF6" />)}
        </ScrollView>
      </View>

      {/* Company */}
      <View style={styles.section}>
        <Text style={styles.label}>Target Company</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {COMPANIES.map((c) => <Chip key={c} label={c} selected={targetCompany === c} onPress={() => setTargetCompany(c)} color={C.accent} />)}
        </ScrollView>
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
        <LinearGradient colors={["#8B5CF6", "#4C1D95"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGradient}>
          {isLoading
            ? <View style={styles.row}><ActivityIndicator color="#fff" /><Text style={styles.btnText}>Fetching & Analyzing...</Text></View>
            : <View style={styles.row}><Ionicons name="logo-github" size={18} color="#fff" /><Text style={styles.btnText}>Analyze Repository</Text></View>
          }
        </LinearGradient>
      </Pressable>

      {result && (
        <View style={{ gap: 14 }}>
          {/* Score Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.scoreSection}>
              <Text style={[styles.scoreValue, { color: result.overallScore >= 75 ? C.accentGreen : result.overallScore >= 55 ? C.accentOrange : C.accentRed }]}>
                {result.overallScore}
              </Text>
              <Text style={styles.scoreLabel}>Overall</Text>
            </View>
            <View style={styles.scoreDivider} />
            <View style={styles.scoreSection}>
              <Text style={[styles.scoreValue, { color: result.roleRelevance >= 75 ? C.accentGreen : result.roleRelevance >= 55 ? C.accentOrange : C.accentRed }]}>
                {result.roleRelevance}
              </Text>
              <Text style={styles.scoreLabel}>Role Fit</Text>
            </View>
            <View style={styles.scoreDivider} />
            <View style={[styles.scoreSection, { flex: 1 }]}>
              <Text style={[styles.verdictText, { color: VERDICT_COLORS[result.verdict] || C.accent }]}>{result.verdict}</Text>
              <Text style={styles.verdictSubtext}>{targetRole} @ {targetCompany}</Text>
            </View>
          </View>

          {/* Summary */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Assessment</Text>
            <Text style={styles.cardDesc}>{result.summary}</Text>
          </View>

          {/* Tech Stack */}
          {result.techStack?.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Tech Stack Detected</Text>
              <View style={styles.tagsRow}>
                {result.techStack.map((t, i) => (
                  <View key={i} style={[styles.tag, { backgroundColor: C.accent + "15", borderColor: C.accent + "30" }]}>
                    <Text style={[styles.tagText, { color: C.accent }]}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Code Quality */}
          {result.codeQualityIndicators?.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Code Quality Indicators</Text>
              {result.codeQualityIndicators.map((qi, i) => (
                <View key={i} style={styles.qualityItem}>
                  <Ionicons name={qi.positive ? "checkmark-circle" : "close-circle"} size={16} color={qi.positive ? C.accentGreen : C.accentRed} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.qualityIndicator}>{qi.indicator}</Text>
                    <Text style={styles.qualityAssessment}>{qi.assessment}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Strengths & Improvements */}
          <View style={styles.twoCol}>
            <View style={[styles.card, { flex: 1 }]}>
              <Text style={styles.cardTitle}>Strengths</Text>
              {result.strengths?.map((s, i) => (
                <View key={i} style={styles.listItem}>
                  <Ionicons name="checkmark-circle" size={13} color={C.accentGreen} />
                  <Text style={styles.listItemText}>{s}</Text>
                </View>
              ))}
            </View>
            <View style={[styles.card, { flex: 1 }]}>
              <Text style={styles.cardTitle}>Improve</Text>
              {result.improvements?.map((im, i) => (
                <View key={i} style={styles.listItem}>
                  <Ionicons name="arrow-up-circle" size={13} color={C.accentOrange} />
                  <Text style={styles.listItemText}>{im}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Interview Topics */}
          {result.interviewTopics?.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Interview Discussion Topics</Text>
              {result.interviewTopics.map((t, i) => (
                <View key={i} style={styles.listItem}>
                  <Ionicons name="mic-outline" size={13} color={C.accentViolet} />
                  <Text style={styles.listItemText}>{t}</Text>
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
  section: { marginBottom: 16 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.textSecondary, marginBottom: 8 },
  urlInputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.cardBorder, paddingHorizontal: 14, height: 52 },
  urlInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: C.text },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder, marginRight: 8 },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.textSecondary },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#EF444415", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#EF444430", marginBottom: 12 },
  errorText: { fontSize: 13, color: C.accentRed },
  btn: { borderRadius: 14, overflow: "hidden", marginBottom: 20 },
  btnGradient: { height: 52, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  btnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  summaryCard: { flexDirection: "row", backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.cardBorder, alignItems: "center" },
  scoreSection: { alignItems: "center", paddingHorizontal: 12 },
  scoreValue: { fontSize: 30, fontFamily: "Inter_700Bold" },
  scoreLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 2 },
  scoreDivider: { width: 1, height: 48, backgroundColor: C.cardBorder },
  verdictText: { fontSize: 16, fontFamily: "Inter_700Bold", textAlign: "center" },
  verdictSubtext: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textMuted, textAlign: "center", marginTop: 3 },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.cardBorder },
  cardTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text, marginBottom: 10 },
  cardDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, lineHeight: 19 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  tagText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  qualityItem: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  qualityIndicator: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.text, marginBottom: 2 },
  qualityAssessment: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, lineHeight: 17 },
  twoCol: { flexDirection: "row", gap: 10 },
  listItem: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 6 },
  listItemText: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, flex: 1, lineHeight: 17 },
});
