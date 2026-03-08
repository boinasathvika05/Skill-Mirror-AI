import React, { useState } from "react";
import {
  View, Text, Pressable, ScrollView, StyleSheet,
  TextInput, ActivityIndicator, Platform,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { apiRequest } from "@/lib/query-client";
import { useUserData } from "@/context/UserDataContext";
import Colors from "@/constants/colors";

const C = Colors.dark;

const LANGUAGES = ["JavaScript", "Python", "TypeScript", "Java", "C++", "Go"];

interface FeedbackResult {
  correctness: { score: number; details: string };
  timeComplexity: { value: string; explanation: string; optimal: boolean };
  spaceComplexity: { value: string; explanation: string };
  edgeCases: { case: string; handled: boolean }[];
  betterApproach: string | null;
  betterCode: string | null;
  interviewTips: string[];
  finalScore: number;
  grade: string;
  verdict: string;
}

const VERDICT_COLORS: Record<string, string> = {
  Accepted: C.accentGreen,
  "Needs Work": C.accentOrange,
  Rejected: C.accentRed,
};

const GRADE_COLORS: Record<string, string> = {
  "A+": "#10B981", A: "#10B981", "B+": "#3B82F6", B: "#3B82F6",
  C: "#F59E0B", D: "#EF4444", F: "#EF4444",
};

export default function CodingFeedbackScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ problem?: string; description?: string }>();
  const { addActivity, markDSASolved } = useUserData();
  const [problem, setProblem] = useState(params.problem || "");
  const [problemDesc, setProblemDesc] = useState(params.description || "");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("Python");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FeedbackResult | null>(null);
  const [error, setError] = useState("");
  const [showBetter, setShowBetter] = useState(false);
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const submit = async () => {
    if (!code.trim() || !problem.trim()) {
      setError("Problem name and code are required");
      return;
    }
    setIsLoading(true);
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await apiRequest("POST", "/api/ai/coding-feedback", {
        code, language, problem, problemDescription: problemDesc,
      });
      const data = await res.json();
      setResult(data);
      addActivity("code", `Submitted solution for "${problem}"`);
      if (data.finalScore >= 70) {
        markDSASolved(problem, { company: "General", difficulty: "intermediate", topic: "Arrays" });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setError("Failed to get feedback. Try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.background }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottomInset + 40 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ height: 16 }} />

      {/* Problem Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Problem Name</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="e.g. Two Sum, Merge Sort"
            placeholderTextColor={C.textMuted}
            value={problem}
            onChangeText={setProblem}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Problem Description (optional)</Text>
        <View style={[styles.inputWrapper, { height: 80 }]}>
          <TextInput
            style={[styles.input, { textAlignVertical: "top" }]}
            placeholder="Brief description of the problem..."
            placeholderTextColor={C.textMuted}
            value={problemDesc}
            onChangeText={setProblemDesc}
            multiline
            scrollEnabled={false}
          />
        </View>
      </View>

      {/* Language */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Language</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {LANGUAGES.map((l) => (
            <Pressable
              key={l}
              style={[styles.langChip, language === l && { backgroundColor: C.accentViolet + "25", borderColor: C.accentViolet }]}
              onPress={() => { setLanguage(l); Haptics.selectionAsync(); }}
            >
              <Text style={[styles.langChipText, language === l && { color: C.accentViolet }]}>{l}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Code */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Your Solution</Text>
        <View style={styles.codeCard}>
          <TextInput
            style={styles.codeInput}
            placeholder="Paste your solution here..."
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
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color={C.accentRed} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <Pressable
        style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
        onPress={submit}
        disabled={isLoading}
      >
        <LinearGradient colors={["#7C3AED", "#4C1D95"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitGradient}>
          {isLoading ? (
            <View style={styles.row}><ActivityIndicator color="#fff" /><Text style={styles.submitText}>Evaluating...</Text></View>
          ) : (
            <View style={styles.row}><Ionicons name="trophy" size={18} color="#fff" /><Text style={styles.submitText}>Get Feedback</Text></View>
          )}
        </LinearGradient>
      </Pressable>

      {/* Results */}
      {result && (
        <View style={{ gap: 14, marginTop: 8 }}>
          {/* Header Score */}
          <View style={styles.scoreCard}>
            <View style={styles.gradeCircle}>
              <Text style={[styles.gradeText, { color: GRADE_COLORS[result.grade] || C.accent }]}>{result.grade}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.verdictText, { color: VERDICT_COLORS[result.verdict] || C.accent }]}>{result.verdict}</Text>
              <Text style={styles.finalScore}>Score: {result.finalScore}/100</Text>
            </View>
          </View>

          {/* Correctness */}
          <View style={styles.resultCard}>
            <Text style={styles.cardTitle}>Correctness</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${result.correctness.score}%` as any, backgroundColor: result.correctness.score >= 80 ? C.accentGreen : result.correctness.score >= 50 ? C.accentOrange : C.accentRed }]} />
            </View>
            <Text style={styles.cardDesc}>{result.correctness.details}</Text>
          </View>

          {/* Complexity */}
          <View style={styles.complexityRow}>
            <View style={[styles.complexityCard, { flex: 1 }]}>
              <View style={styles.row}>
                <Text style={styles.complexityLabel}>Time</Text>
                {result.timeComplexity.optimal && <Ionicons name="checkmark-circle" size={14} color={C.accentGreen} />}
              </View>
              <Text style={styles.complexityValue}>{result.timeComplexity.value}</Text>
              <Text style={styles.complexityDesc}>{result.timeComplexity.explanation}</Text>
            </View>
            <View style={[styles.complexityCard, { flex: 1 }]}>
              <Text style={styles.complexityLabel}>Space</Text>
              <Text style={styles.complexityValue}>{result.spaceComplexity.value}</Text>
              <Text style={styles.complexityDesc}>{result.spaceComplexity.explanation}</Text>
            </View>
          </View>

          {/* Edge Cases */}
          {result.edgeCases?.length > 0 && (
            <View style={styles.resultCard}>
              <Text style={styles.cardTitle}>Edge Cases</Text>
              {result.edgeCases.map((ec, i) => (
                <View key={i} style={styles.edgeCase}>
                  <Ionicons name={ec.handled ? "checkmark-circle" : "close-circle"} size={16} color={ec.handled ? C.accentGreen : C.accentRed} />
                  <Text style={styles.edgeCaseText}>{ec.case}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Better Approach */}
          {result.betterApproach && (
            <View style={styles.resultCard}>
              <Pressable style={styles.row} onPress={() => setShowBetter(!showBetter)}>
                <Text style={styles.cardTitle}>Better Approach</Text>
                <Ionicons name={showBetter ? "chevron-up" : "chevron-down"} size={16} color={C.textMuted} />
              </Pressable>
              {showBetter && (
                <>
                  <Text style={[styles.cardDesc, { marginTop: 8 }]}>{result.betterApproach}</Text>
                  {result.betterCode && (
                    <View style={styles.codeBlock}>
                      <Text style={styles.codeBlockText}>{result.betterCode}</Text>
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          {/* Tips */}
          {result.interviewTips?.length > 0 && (
            <View style={styles.resultCard}>
              <Text style={styles.cardTitle}>Interview Tips</Text>
              {result.interviewTips.map((tip, i) => (
                <View key={i} style={styles.tip}>
                  <Ionicons name="bulb-outline" size={14} color={C.accentOrange} />
                  <Text style={styles.tipText}>{tip}</Text>
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
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.textSecondary, marginBottom: 8 },
  inputWrapper: { backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.cardBorder, paddingHorizontal: 14, height: 50, justifyContent: "center" },
  input: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.text },
  langChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder, marginRight: 8 },
  langChipText: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.textSecondary },
  codeCard: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.cardBorder },
  codeInput: { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 13, color: C.text, padding: 14, minHeight: 200, textAlignVertical: "top" },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#EF444415", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#EF444430", marginBottom: 12 },
  errorText: { fontSize: 13, color: C.accentRed },
  submitBtn: { borderRadius: 14, overflow: "hidden", marginBottom: 20 },
  submitGradient: { height: 52, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "space-between" },
  submitText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  scoreCard: { flexDirection: "row", alignItems: "center", gap: 16, backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.cardBorder },
  gradeCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.accentViolet + "20", borderWidth: 2, borderColor: C.accentViolet, alignItems: "center", justifyContent: "center" },
  gradeText: { fontSize: 26, fontFamily: "Inter_700Bold" },
  verdictText: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 2 },
  finalScore: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary },
  resultCard: { backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.cardBorder },
  cardTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text, marginBottom: 10, flex: 1 },
  cardDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, lineHeight: 18 },
  progressBar: { height: 6, backgroundColor: C.background, borderRadius: 3, overflow: "hidden", marginBottom: 8 },
  progressFill: { height: "100%", borderRadius: 3 },
  complexityRow: { flexDirection: "row", gap: 12 },
  complexityCard: { backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.cardBorder },
  complexityLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, marginBottom: 4 },
  complexityValue: { fontSize: 16, fontFamily: "Inter_700Bold", color: C.accent, marginBottom: 4 },
  complexityDesc: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textMuted, lineHeight: 16 },
  edgeCase: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 6 },
  edgeCaseText: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, flex: 1 },
  codeBlock: { backgroundColor: C.background, borderRadius: 10, padding: 12, marginTop: 10 },
  codeBlockText: { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 12, color: C.text },
  tip: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  tipText: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, flex: 1, lineHeight: 18 },
});
