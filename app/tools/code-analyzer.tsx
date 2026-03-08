import React, { useState } from "react";
import {
  View, Text, Pressable, ScrollView, StyleSheet,
  TextInput, ActivityIndicator, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { apiRequest } from "@/lib/query-client";
import { useUserData } from "@/context/UserDataContext";
import Colors from "@/constants/colors";

const C = Colors.dark;

const LANGUAGES = ["JavaScript", "Python", "TypeScript", "Java", "C++", "Go", "Rust", "Swift"];

interface AnalysisResult {
  bugs: { line: number | null; description: string; severity: "critical" | "warning" | "info" }[];
  optimizations: { description: string; impact: "high" | "medium" | "low" }[];
  timeComplexity: string;
  spaceComplexity: string;
  refinedCode: string;
  overallScore: number;
  summary: string;
}

const SEV_COLORS = { critical: "#EF4444", warning: "#F59E0B", info: "#00E5FF" };
const IMP_COLORS = { high: "#EF4444", medium: "#F59E0B", low: "#10B981" };

export default function CodeAnalyzerScreen() {
  const insets = useSafeAreaInsets();
  const { incrementAnalyzer, addActivity } = useUserData();
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("JavaScript");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [showRefined, setShowRefined] = useState(false);
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const analyze = async () => {
    if (!code.trim()) { setError("Paste your code to analyze"); return; }
    setIsLoading(true);
    setError("");
    setResult(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await apiRequest("POST", "/api/ai/analyze-code", { code, language });
      const data = await res.json();
      setResult(data);
      incrementAnalyzer();
      addActivity("code", `Analyzed ${language} code`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setError("Analysis failed. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const ScoreRing = ({ score }: { score: number }) => {
    const color = score >= 80 ? C.accentGreen : score >= 60 ? C.accentOrange : C.accentRed;
    return (
      <View style={styles.scoreRing}>
        <View style={[styles.scoreInner, { borderColor: color }]}>
          <Text style={[styles.scoreValue, { color }]}>{score}</Text>
          <Text style={styles.scoreLabel}>/ 100</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.background }}
      contentContainerStyle={{ paddingBottom: bottomInset + 40, paddingHorizontal: 20 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Language Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.langRow}>
        {LANGUAGES.map((l) => (
          <Pressable
            key={l}
            style={[styles.langChip, language === l && { backgroundColor: C.accent + "20", borderColor: C.accent }]}
            onPress={() => { setLanguage(l); Haptics.selectionAsync(); }}
          >
            <Text style={[styles.langChipText, language === l && { color: C.accent }]}>{l}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Code Input */}
      <View style={styles.inputCard}>
        <View style={styles.inputHeader}>
          <Ionicons name="code-slash-outline" size={16} color={C.accent} />
          <Text style={styles.inputHeaderText}>{language}</Text>
          {code.length > 0 && (
            <Pressable onPress={() => setCode("")} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </Pressable>
          )}
        </View>
        <TextInput
          style={styles.codeInput}
          placeholder="Paste your code here..."
          placeholderTextColor={C.textMuted}
          value={code}
          onChangeText={setCode}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          scrollEnabled={false}
        />
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color={C.accentRed} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Analyze Button */}
      <Pressable
        style={({ pressed }) => [styles.analyzeBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
        onPress={analyze}
        disabled={isLoading}
      >
        <LinearGradient colors={["#00E5FF", "#0096FF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.analyzeBtnGradient}>
          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#000" />
              <Text style={styles.analyzeBtnText}>Analyzing...</Text>
            </View>
          ) : (
            <View style={styles.loadingRow}>
              <Ionicons name="flash" size={18} color="#0A0F1E" />
              <Text style={styles.analyzeBtnText}>Analyze Code</Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>

      {/* Results */}
      {result && (
        <View style={styles.results}>
          {/* Score + Summary */}
          <View style={styles.scoreCard}>
            <ScoreRing score={result.overallScore} />
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryTitle}>Analysis Summary</Text>
              <Text style={styles.summaryText}>{result.summary}</Text>
            </View>
          </View>

          {/* Complexity */}
          <View style={styles.complexityRow}>
            <View style={[styles.complexityCard, { flex: 1 }]}>
              <Text style={styles.complexityLabel}>Time</Text>
              <Text style={styles.complexityValue}>{result.timeComplexity?.split(" -")[0] || "N/A"}</Text>
            </View>
            <View style={[styles.complexityCard, { flex: 1 }]}>
              <Text style={styles.complexityLabel}>Space</Text>
              <Text style={styles.complexityValue}>{result.spaceComplexity?.split(" -")[0] || "N/A"}</Text>
            </View>
          </View>

          {/* Bugs */}
          {result.bugs?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="bug-outline" size={15} color={C.accentRed} /> Bugs ({result.bugs.length})
              </Text>
              {result.bugs.map((bug, i) => (
                <View key={i} style={[styles.issueCard, { borderLeftColor: SEV_COLORS[bug.severity] }]}>
                  <View style={styles.issueHeader}>
                    <View style={[styles.sevBadge, { backgroundColor: SEV_COLORS[bug.severity] + "20" }]}>
                      <Text style={[styles.sevText, { color: SEV_COLORS[bug.severity] }]}>{bug.severity}</Text>
                    </View>
                    {bug.line && <Text style={styles.lineNum}>Line {bug.line}</Text>}
                  </View>
                  <Text style={styles.issueDesc}>{bug.description}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Optimizations */}
          {result.optimizations?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="rocket-outline" size={15} color={C.accent} /> Optimizations
              </Text>
              {result.optimizations.map((opt, i) => (
                <View key={i} style={[styles.issueCard, { borderLeftColor: IMP_COLORS[opt.impact] }]}>
                  <View style={[styles.sevBadge, { backgroundColor: IMP_COLORS[opt.impact] + "20" }]}>
                    <Text style={[styles.sevText, { color: IMP_COLORS[opt.impact] }]}>{opt.impact} impact</Text>
                  </View>
                  <Text style={styles.issueDesc}>{opt.description}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Refined Code */}
          {result.refinedCode && (
            <View style={styles.section}>
              <Pressable style={styles.refinedHeader} onPress={() => setShowRefined(!showRefined)}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="sparkles-outline" size={15} color={C.accentViolet} /> Refined Code
                </Text>
                <Ionicons name={showRefined ? "chevron-up" : "chevron-down"} size={18} color={C.textMuted} />
              </Pressable>
              {showRefined && (
                <View style={styles.codeBlock}>
                  <Text style={styles.codeBlockText}>{result.refinedCode}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  langRow: { paddingVertical: 16, marginHorizontal: -4 },
  langChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder, marginRight: 8 },
  langChipText: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.textSecondary },
  inputCard: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.cardBorder, marginBottom: 12, overflow: "hidden" },
  inputHeader: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderBottomWidth: 1, borderBottomColor: C.cardBorder },
  inputHeaderText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium", color: C.textSecondary },
  clearBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: C.cardBorder },
  clearBtnText: { fontSize: 12, fontFamily: "Inter_500Medium", color: C.textSecondary },
  codeInput: { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 13, color: C.text, padding: 14, minHeight: 180, textAlignVertical: "top", lineHeight: 20 },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#EF444415", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#EF444430", marginBottom: 12 },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.accentRed },
  analyzeBtn: { borderRadius: 14, overflow: "hidden", marginBottom: 24 },
  analyzeBtnGradient: { height: 52, alignItems: "center", justifyContent: "center" },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  analyzeBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#0A0F1E" },
  results: { gap: 16 },
  scoreCard: { flexDirection: "row", alignItems: "center", gap: 16, backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.cardBorder },
  scoreRing: {},
  scoreInner: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, alignItems: "center", justifyContent: "center" },
  scoreValue: { fontSize: 24, fontFamily: "Inter_700Bold" },
  scoreLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: C.textMuted },
  summaryTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text, marginBottom: 4 },
  summaryText: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, lineHeight: 18 },
  complexityRow: { flexDirection: "row", gap: 12 },
  complexityCard: { backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.cardBorder },
  complexityLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, marginBottom: 4 },
  complexityValue: { fontSize: 15, fontFamily: "Inter_700Bold", color: C.accent },
  section: { backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.cardBorder },
  sectionTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text, marginBottom: 12 },
  issueCard: { borderLeftWidth: 3, paddingLeft: 12, marginBottom: 10 },
  issueHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  sevBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  sevText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  lineNum: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textMuted },
  issueDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, lineHeight: 18 },
  refinedHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  codeBlock: { backgroundColor: C.background, borderRadius: 10, padding: 12, marginTop: 10 },
  codeBlockText: { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 12, color: C.text, lineHeight: 18 },
});
