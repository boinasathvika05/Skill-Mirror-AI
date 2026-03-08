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

const ROLES = ["Software Engineer", "Frontend Engineer", "Backend Engineer", "Full Stack", "ML Engineer", "DevOps Engineer", "Data Engineer"];
const COMPANIES = ["Google", "Amazon", "Meta", "Microsoft", "Apple", "Netflix", "Stripe", "Uber"];

interface ResumeResult {
  overallScore: number;
  fitScore: number;
  strengths: string[];
  gaps: string[];
  skillsFound: string[];
  missingSkills: string[];
  recommendations: { category: string; action: string }[];
  rewrittenSummary: string;
  atsKeywords: string[];
  verdict: string;
  summary: string;
}

const VERDICT_COLORS: Record<string, string> = {
  "Strong Fit": C.accentGreen,
  "Good Fit": "#3B82F6",
  "Partial Fit": C.accentOrange,
  "Not a Fit": C.accentRed,
};

export default function ResumeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { incrementResume, addActivity } = useUserData();
  const payment = usePayment() as any;
  const [resume, setResume] = useState("");
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [targetCompany, setTargetCompany] = useState("Google");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ResumeResult | null>(null);
  const [error, setError] = useState("");
  const [showRewritten, setShowRewritten] = useState(false);
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const analyze = async () => {
    if (!resume.trim()) { setError("Paste your resume content"); return; }
    const allowed = await payment.checkAndConsumerial();
    if (!allowed) { router.push("/paywall" as any); return; }
    setIsLoading(true);
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await apiRequest("POST", "/api/ai/analyze-resume", { resume, targetRole, targetCompany });
      const data = await res.json();
      setResult(data);
      incrementResume();
      addActivity("resume", `Resume analyzed for ${targetRole} at ${targetCompany}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setError("Analysis failed. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const Chip = ({ label, selected, onPress, color }: { label: string; selected: boolean; onPress: () => void; color?: string }) => (
    <Pressable
      style={[styles.chip, selected && { backgroundColor: (color || C.accentOrange) + "20", borderColor: color || C.accentOrange }]}
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
    >
      <Text style={[styles.chipText, selected && { color: color || C.accentOrange }]}>{label}</Text>
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
      {/* Role */}
      <View style={styles.section}>
        <Text style={styles.label}>Target Role</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {ROLES.map((r) => <Chip key={r} label={r} selected={targetRole === r} onPress={() => setTargetRole(r)} />)}
        </ScrollView>
      </View>

      {/* Company */}
      <View style={styles.section}>
        <Text style={styles.label}>Target Company</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {COMPANIES.map((c) => <Chip key={c} label={c} selected={targetCompany === c} onPress={() => setTargetCompany(c)} color={C.accentViolet} />)}
        </ScrollView>
      </View>

      {/* Resume */}
      <View style={styles.section}>
        <Text style={styles.label}>Resume Content</Text>
        <View style={styles.textAreaCard}>
          <TextInput
            style={styles.textArea}
            placeholder="Paste your resume here (text, not PDF)..."
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
        style={({ pressed }) => [styles.analyzeBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
        onPress={analyze}
        disabled={isLoading}
      >
        <LinearGradient colors={["#F59E0B", "#D97706"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.analyzeBtnGradient}>
          {isLoading
            ? <View style={styles.row}><ActivityIndicator color="#0A0F1E" /><Text style={styles.analyzeBtnText}>Analyzing...</Text></View>
            : <View style={styles.row}><Ionicons name="document-text" size={18} color="#0A0F1E" /><Text style={styles.analyzeBtnText}>Analyze Resume</Text></View>
          }
        </LinearGradient>
      </Pressable>

      {result && (
        <View style={{ gap: 14 }}>
          {/* Scores */}
          <View style={styles.scoreRow}>
            {[
              { label: "Overall", value: result.overallScore, color: result.overallScore >= 75 ? C.accentGreen : result.overallScore >= 55 ? C.accentOrange : C.accentRed },
              { label: "Role Fit", value: result.fitScore, color: result.fitScore >= 75 ? C.accentGreen : result.fitScore >= 55 ? C.accentOrange : C.accentRed },
            ].map((s) => (
              <View key={s.label} style={styles.scoreCard}>
                <Text style={[styles.scoreValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.scoreLabel}>{s.label}</Text>
                <View style={styles.scoreBar}>
                  <View style={[styles.scoreFill, { width: `${s.value}%` as any, backgroundColor: s.color }]} />
                </View>
              </View>
            ))}
            <View style={styles.verdictCard}>
              <Text style={[styles.verdictText, { color: VERDICT_COLORS[result.verdict] || C.accent }]}>{result.verdict}</Text>
              <Text style={styles.verdictSub}>{targetCompany}</Text>
            </View>
          </View>

          {/* Summary */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Assessment</Text>
            <Text style={styles.cardDesc}>{result.summary}</Text>
          </View>

          {/* Strengths & Gaps */}
          <View style={styles.twoCol}>
            <View style={[styles.card, { flex: 1 }]}>
              <Text style={styles.cardTitle}>Strengths</Text>
              {result.strengths?.map((s, i) => (
                <View key={i} style={styles.listItem}>
                  <Ionicons name="checkmark-circle" size={14} color={C.accentGreen} />
                  <Text style={styles.listItemText}>{s}</Text>
                </View>
              ))}
            </View>
            <View style={[styles.card, { flex: 1 }]}>
              <Text style={styles.cardTitle}>Gaps</Text>
              {result.gaps?.map((g, i) => (
                <View key={i} style={styles.listItem}>
                  <Ionicons name="close-circle" size={14} color={C.accentRed} />
                  <Text style={styles.listItemText}>{g}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Missing Skills */}
          {result.missingSkills?.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Missing Skills</Text>
              <View style={styles.tagsRow}>
                {result.missingSkills.map((s, i) => (
                  <View key={i} style={[styles.tag, { backgroundColor: C.accentRed + "20", borderColor: C.accentRed + "40" }]}>
                    <Text style={[styles.tagText, { color: C.accentRed }]}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Recommendations */}
          {result.recommendations?.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Recommendations</Text>
              {result.recommendations.map((r, i) => (
                <View key={i} style={styles.recItem}>
                  <View style={styles.recBadge}>
                    <Text style={styles.recBadgeText}>{r.category}</Text>
                  </View>
                  <Text style={styles.recAction}>{r.action}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ATS Keywords */}
          {result.atsKeywords?.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>ATS Keywords to Add</Text>
              <View style={styles.tagsRow}>
                {result.atsKeywords.map((k, i) => (
                  <View key={i} style={[styles.tag, { backgroundColor: C.accent + "15", borderColor: C.accent + "30" }]}>
                    <Text style={[styles.tagText, { color: C.accent }]}>{k}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Rewritten Summary */}
          {result.rewrittenSummary && (
            <View style={styles.card}>
              <Pressable style={styles.row} onPress={() => setShowRewritten(!showRewritten)}>
                <Text style={styles.cardTitle}>Improved Summary</Text>
                <Ionicons name={showRewritten ? "chevron-up" : "chevron-down"} size={16} color={C.textMuted} />
              </Pressable>
              {showRewritten && <Text style={[styles.cardDesc, { marginTop: 8 }]}>{result.rewrittenSummary}</Text>}
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
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder, marginRight: 8 },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.textSecondary },
  textAreaCard: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.cardBorder },
  textArea: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.text, padding: 14, minHeight: 180, textAlignVertical: "top", lineHeight: 20 },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#EF444415", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#EF444430", marginBottom: 12 },
  errorText: { fontSize: 13, color: C.accentRed },
  analyzeBtn: { borderRadius: 14, overflow: "hidden", marginBottom: 20 },
  analyzeBtnGradient: { height: 52, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "space-between" },
  analyzeBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#0A0F1E" },
  scoreRow: { flexDirection: "row", gap: 10 },
  scoreCard: { flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.cardBorder, alignItems: "center", gap: 4 },
  scoreValue: { fontSize: 28, fontFamily: "Inter_700Bold" },
  scoreLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary },
  scoreBar: { width: "100%", height: 4, backgroundColor: C.background, borderRadius: 2, overflow: "hidden" },
  scoreFill: { height: "100%", borderRadius: 2 },
  verdictCard: { flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.cardBorder, alignItems: "center", justifyContent: "center", gap: 4 },
  verdictText: { fontSize: 15, fontFamily: "Inter_700Bold", textAlign: "center" },
  verdictSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textMuted },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.cardBorder },
  cardTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text, marginBottom: 10, flex: 1 },
  cardDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, lineHeight: 19 },
  twoCol: { flexDirection: "row", gap: 10 },
  listItem: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 6 },
  listItemText: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, flex: 1, lineHeight: 17 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  tagText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  recItem: { marginBottom: 12 },
  recBadge: { backgroundColor: C.accentOrange + "20", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: "flex-start", marginBottom: 4 },
  recBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: C.accentOrange },
  recAction: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, lineHeight: 18 },
});
