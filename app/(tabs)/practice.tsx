import React, { useState, useMemo } from "react";
import {
  View, Text, ScrollView, Pressable, StyleSheet, Platform, FlatList,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useUserData } from "@/context/UserDataContext";
import { RadarChart } from "@/components/RadarChart";
import Colors from "@/constants/colors";

const C = Colors.dark;

export const DSA_QUESTIONS = [
  // Arrays
  { id: "q1", title: "Two Sum", company: "Google", difficulty: "beginner" as const, topic: "Arrays", description: "Given an array of integers nums and an integer target, return indices of two numbers that add up to target." },
  { id: "q2", title: "Best Time to Buy and Sell Stock", company: "Amazon", difficulty: "beginner" as const, topic: "Arrays", description: "Find the maximum profit you can achieve from buying and selling one stock." },
  { id: "q3", title: "Maximum Subarray", company: "Microsoft", difficulty: "intermediate" as const, topic: "Arrays", description: "Find the contiguous subarray with the largest sum." },
  { id: "q4", title: "Product of Array Except Self", company: "Amazon", difficulty: "intermediate" as const, topic: "Arrays", description: "Return an array where each element is the product of all other elements." },
  { id: "q5", title: "Trapping Rain Water", company: "Google", difficulty: "advanced" as const, topic: "Arrays", description: "Given elevation map, compute how much water it can trap after raining." },
  // Trees
  { id: "q6", title: "Maximum Depth of Binary Tree", company: "Meta", difficulty: "beginner" as const, topic: "Trees", description: "Find the maximum depth of a binary tree." },
  { id: "q7", title: "Validate Binary Search Tree", company: "Amazon", difficulty: "intermediate" as const, topic: "Trees", description: "Determine if a binary tree is a valid BST." },
  { id: "q8", title: "Binary Tree Level Order Traversal", company: "Microsoft", difficulty: "intermediate" as const, topic: "Trees", description: "Return level-order traversal of binary tree node values." },
  { id: "q9", title: "Serialize and Deserialize Binary Tree", company: "Google", difficulty: "advanced" as const, topic: "Trees", description: "Design an algorithm to serialize and deserialize a binary tree." },
  // Dynamic Programming
  { id: "q10", title: "Climbing Stairs", company: "Google", difficulty: "beginner" as const, topic: "DP", description: "How many distinct ways can you climb to the top of n stairs?" },
  { id: "q11", title: "Coin Change", company: "Amazon", difficulty: "intermediate" as const, topic: "DP", description: "Find the fewest number of coins to make a given amount." },
  { id: "q12", title: "Longest Increasing Subsequence", company: "Microsoft", difficulty: "intermediate" as const, topic: "DP", description: "Find the length of the longest strictly increasing subsequence." },
  { id: "q13", title: "Edit Distance", company: "Google", difficulty: "advanced" as const, topic: "DP", description: "Find minimum operations required to convert word1 to word2." },
  // Graphs
  { id: "q14", title: "Number of Islands", company: "Amazon", difficulty: "intermediate" as const, topic: "Graphs", description: "Count the number of islands in a 2D grid." },
  { id: "q15", title: "Clone Graph", company: "Meta", difficulty: "intermediate" as const, topic: "Graphs", description: "Clone a connected undirected graph." },
  { id: "q16", title: "Course Schedule", company: "Google", difficulty: "advanced" as const, topic: "BFS/DFS", description: "Determine if you can finish all courses given prerequisites." },
  // Strings
  { id: "q17", title: "Valid Anagram", company: "Amazon", difficulty: "beginner" as const, topic: "Strings", description: "Determine if two strings are anagrams of each other." },
  { id: "q18", title: "Longest Substring Without Repeating", company: "Microsoft", difficulty: "intermediate" as const, topic: "Strings", description: "Find length of longest substring without repeating characters." },
  { id: "q19", title: "Minimum Window Substring", company: "Google", difficulty: "advanced" as const, topic: "Strings", description: "Find the minimum window in s which contains all characters of t." },
];

const COMPANIES = ["All", "Google", "Amazon", "Meta", "Microsoft"];
const TOPICS = ["All", "Arrays", "Trees", "DP", "Graphs", "Strings", "BFS/DFS"];
const DIFFICULTIES = ["All", "beginner", "intermediate", "advanced"];
const DIFF_COLORS: Record<string, string> = {
  beginner: C.accentGreen,
  intermediate: C.accentOrange,
  advanced: C.accentRed,
};

export default function PracticeScreen() {
  const insets = useSafeAreaInsets();
  const { stats, dsaProgress } = useUserData();
  const [selectedCompany, setSelectedCompany] = useState("All");
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [selectedDiff, setSelectedDiff] = useState("All");

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const filtered = useMemo(() => DSA_QUESTIONS.filter((q) => {
    if (selectedCompany !== "All" && q.company !== selectedCompany) return false;
    if (selectedTopic !== "All" && q.topic !== selectedTopic) return false;
    if (selectedDiff !== "All" && q.difficulty !== selectedDiff) return false;
    return true;
  }), [selectedCompany, selectedTopic, selectedDiff]);

  const radarData = ["Arrays", "Trees", "DP", "Graphs", "Strings", "BFS/DFS"].map((label) => ({
    label,
    value: stats.dsaByTopic[label] || 0,
    maxValue: DSA_QUESTIONS.filter((q) => q.topic === label).length,
  }));

  const Chip = ({ label, selected, onPress, color }: { label: string; selected: boolean; onPress: () => void; color?: string }) => (
    <Pressable
      style={[styles.chip, selected && { backgroundColor: (color || C.accent) + "20", borderColor: color || C.accent }]}
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
    >
      <Text style={[styles.chipText, selected && { color: color || C.accent }]}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomInset + 120 }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: topInset + 12 }]}>
          <Text style={styles.title}>DSA Practice</Text>
          <View style={styles.headerStats}>
            <Text style={styles.headerStatText}>
              <Text style={{ color: C.accent }}>{stats.totalSolved}</Text> / {DSA_QUESTIONS.length} solved
            </Text>
          </View>
        </View>

        {/* Radar Chart */}
        <View style={styles.radarSection}>
          <Text style={styles.sectionLabel}>Skills Overview</Text>
          <View style={styles.radarCard}>
            <RadarChart data={radarData} size={200} />
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {COMPANIES.map((c) => <Chip key={c} label={c} selected={selectedCompany === c} onPress={() => setSelectedCompany(c)} />)}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {TOPICS.map((t) => <Chip key={t} label={t} selected={selectedTopic === t} onPress={() => setSelectedTopic(t)} color={C.accentViolet} />)}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {DIFFICULTIES.map((d) => <Chip key={d} label={d} selected={selectedDiff === d} onPress={() => setSelectedDiff(d)} color={DIFF_COLORS[d] || C.accent} />)}
          </ScrollView>
        </View>

        {/* Question List */}
        <View style={styles.questionsSection}>
          <Text style={styles.sectionLabel}>{filtered.length} Problems</Text>
          {filtered.map((q) => {
            const solved = dsaProgress[q.id]?.solved;
            return (
              <Pressable
                key={q.id}
                style={({ pressed }) => [styles.questionCard, pressed && { opacity: 0.85 }]}
                onPress={() => router.push({ pathname: "/tools/coding-feedback", params: { problem: q.title, description: q.description } })}
              >
                <View style={styles.questionLeft}>
                  <View style={[styles.solvedDot, { backgroundColor: solved ? C.accentGreen : C.cardBorder }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.questionTitle}>{q.title}</Text>
                    <View style={styles.questionMeta}>
                      <View style={[styles.diffBadge, { backgroundColor: DIFF_COLORS[q.difficulty] + "20" }]}>
                        <Text style={[styles.diffText, { color: DIFF_COLORS[q.difficulty] }]}>{q.difficulty}</Text>
                      </View>
                      <Text style={styles.questionTopic}>{q.topic}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.questionRight}>
                  <View style={styles.companyBadge}>
                    <Text style={styles.companyText}>{q.company}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", color: C.text },
  headerStats: {},
  headerStatText: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.textSecondary },
  radarSection: { paddingHorizontal: 20, marginBottom: 16 },
  sectionLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.textSecondary, marginBottom: 10, paddingHorizontal: 20 },
  radarCard: { backgroundColor: C.card, borderRadius: 20, padding: 16, alignItems: "center", borderWidth: 1, borderColor: C.cardBorder },
  filtersSection: { marginBottom: 8, gap: 8 },
  filterRow: { paddingHorizontal: 20, paddingVertical: 2 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder, marginRight: 8 },
  chipText: { fontSize: 12, fontFamily: "Inter_500Medium", color: C.textSecondary },
  questionsSection: { paddingHorizontal: 20, marginTop: 8 },
  questionCard: {
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderWidth: 1, borderColor: C.cardBorder, marginBottom: 10,
  },
  questionLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  solvedDot: { width: 10, height: 10, borderRadius: 5 },
  questionTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text, marginBottom: 4 },
  questionMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  diffText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  questionTopic: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textMuted },
  questionRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  companyBadge: { backgroundColor: C.accentViolet + "20", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  companyText: { fontSize: 11, fontFamily: "Inter_500Medium", color: C.accentViolet },
});
