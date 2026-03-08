import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

const C = Colors.dark;

const TOOLS = [
  {
    id: "code-analyzer",
    title: "AI Code Analyzer",
    description: "Bug detection, optimization, complexity analysis & refined code",
    icon: "code-slash",
    gradient: ["#00E5FF20", "#0096FF10"] as [string, string],
    accentColor: "#00E5FF",
    route: "/tools/code-analyzer",
  },
  {
    id: "coding-feedback",
    title: "Coding Interview",
    description: "Submit solutions for expert feedback, scoring & better approaches",
    icon: "trophy",
    gradient: ["#7C3AED20", "#4C1D9510"] as [string, string],
    accentColor: "#7C3AED",
    route: "/tools/coding-feedback",
  },
  {
    id: "interview",
    title: "Interview Simulator",
    description: "AI-driven mock interviews for behavioral & technical prep",
    icon: "mic",
    gradient: ["#10B98120", "#06403510"] as [string, string],
    accentColor: "#10B981",
    route: "/tools/interview",
  },
  {
    id: "resume",
    title: "Resume Analyzer",
    description: "Get role-specific feedback and ATS optimization tips",
    icon: "document-text",
    gradient: ["#F59E0B20", "#78350F10"] as [string, string],
    accentColor: "#F59E0B",
    route: "/tools/resume",
  },
  {
    id: "career",
    title: "Career Advisor",
    description: "Discover ideal roles and companies based on your profile",
    icon: "compass",
    gradient: ["#EF444420", "#7F1D1D10"] as [string, string],
    accentColor: "#EF4444",
    route: "/tools/career",
  },
  {
    id: "github",
    title: "GitHub Analyzer",
    description: "Evaluate how well your repos suit target roles & companies",
    icon: "logo-github",
    gradient: ["#8B5CF620", "#4C1D9510"] as [string, string],
    accentColor: "#8B5CF6",
    route: "/tools/github",
  },
];

export default function ToolsScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomInset + 120 }}
      >
        <View style={[styles.header, { paddingTop: topInset + 12 }]}>
          <Text style={styles.title}>AI Tools</Text>
          <Text style={styles.subtitle}>Sharpen every aspect of your dev skills</Text>
        </View>

        <View style={styles.toolsList}>
          {TOOLS.map((tool) => (
            <Pressable
              key={tool.id}
              style={({ pressed }) => [styles.toolCard, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(tool.route as any); }}
            >
              <LinearGradient colors={tool.gradient} style={styles.toolGradient}>
                <View style={[styles.iconContainer, { backgroundColor: tool.accentColor + "20" }]}>
                  <Ionicons name={tool.icon as any} size={28} color={tool.accentColor} />
                </View>
                <View style={styles.toolInfo}>
                  <Text style={styles.toolTitle}>{tool.title}</Text>
                  <Text style={styles.toolDescription}>{tool.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={C.textMuted} />
              </LinearGradient>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", color: C.text },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 4 },
  toolsList: { paddingHorizontal: 20, gap: 12 },
  toolCard: { borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: C.cardBorder },
  toolGradient: { flexDirection: "row", alignItems: "center", padding: 18, gap: 16 },
  iconContainer: { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  toolInfo: { flex: 1 },
  toolTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: C.text, marginBottom: 4 },
  toolDescription: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, lineHeight: 17 },
});
