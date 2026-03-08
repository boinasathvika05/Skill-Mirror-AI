import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, Pressable, ScrollView, StyleSheet,
  TextInput, ActivityIndicator, Platform, FlatList, KeyboardAvoidingView,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { apiRequest } from "@/lib/query-client";
import { useUserData } from "@/context/UserDataContext";
import { usePayment } from "@/context/PaymentContext";
import Colors from "@/constants/colors";

const C = Colors.dark;

const ROLES = ["Software Engineer", "Frontend Engineer", "Backend Engineer", "Full Stack", "ML Engineer", "DevOps"];
const COMPANIES = ["Google", "Amazon", "Meta", "Microsoft", "Apple", "Netflix", "Stripe"];
const TYPES = ["Behavioral", "Technical", "System Design", "Mixed"];

interface Message {
  role: "user" | "assistant";
  content: string;
  feedback?: string;
  questionType?: string;
}

interface InterviewResponse {
  message: string;
  feedback: string | null;
  questionType: string;
  interviewComplete: boolean;
}

export default function InterviewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { incrementInterview, addActivity } = useUserData();
  const payment = usePayment() as any;
  const [stage, setStage] = useState<"setup" | "interview" | "complete">("setup");
  const [role, setRole] = useState("Software Engineer");
  const [company, setCompany] = useState("Google");
  const [interviewType, setInterviewType] = useState("Behavioral");
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const listRef = useRef<FlatList>(null);
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const startInterview = async () => {
    const allowed = await payment.checkAndConsumerial();
    if (!allowed) { router.push("/paywall" as any); return; }
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await apiRequest("POST", "/api/ai/interview", {
        messages: [],
        role, company, interviewType,
      });
      const data: InterviewResponse = await res.json();
      setMessages([{ role: "assistant", content: data.message, questionType: data.questionType }]);
      setStage("interview");
      incrementInterview();
      addActivity("interview", `Mock ${interviewType} interview at ${company}`);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!userInput.trim() || isLoading) return;
    const userMsg: Message = { role: "user", content: userInput.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setUserInput("");
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const res = await apiRequest("POST", "/api/ai/interview", {
        messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        role, company, interviewType,
      });
      const data: InterviewResponse = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message, feedback: data.feedback || undefined, questionType: data.questionType },
      ]);
      if (data.interviewComplete) {
        setStage("complete");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, there was a connection error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const Chip = ({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) => (
    <Pressable
      style={[styles.chip, selected && { backgroundColor: C.accentGreen + "20", borderColor: C.accentGreen }]}
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
    >
      <Text style={[styles.chipText, selected && { color: C.accentGreen }]}>{label}</Text>
    </Pressable>
  );

  if (stage === "setup") {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: C.background }}
        contentContainerStyle={{ padding: 20, paddingBottom: bottomInset + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.setupCard}>
          <View style={styles.setupIcon}>
            <Ionicons name="mic" size={32} color={C.accentGreen} />
          </View>
          <Text style={styles.setupTitle}>Configure Your Interview</Text>
          <Text style={styles.setupSubtitle}>AI will simulate a real interview experience</Text>
        </View>

        <View style={styles.setupSection}>
          <Text style={styles.sectionLabel}>Target Role</Text>
          <View style={styles.chipRow}>
            {ROLES.map((r) => <Chip key={r} label={r} selected={role === r} onPress={() => setRole(r)} />)}
          </View>
        </View>

        <View style={styles.setupSection}>
          <Text style={styles.sectionLabel}>Target Company</Text>
          <View style={styles.chipRow}>
            {COMPANIES.map((co) => <Chip key={co} label={co} selected={company === co} onPress={() => setCompany(co)} />)}
          </View>
        </View>

        <View style={styles.setupSection}>
          <Text style={styles.sectionLabel}>Interview Type</Text>
          <View style={styles.chipRow}>
            {TYPES.map((t) => <Chip key={t} label={t} selected={interviewType === t} onPress={() => setInterviewType(t)} />)}
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.startBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
          onPress={startInterview}
          disabled={isLoading}
        >
          <LinearGradient colors={["#10B981", "#065F46"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.startBtnGradient}>
            {isLoading
              ? <View style={styles.row}><ActivityIndicator color="#fff" /><Text style={styles.startBtnText}>Starting...</Text></View>
              : <View style={styles.row}><Ionicons name="play" size={18} color="#fff" /><Text style={styles.startBtnText}>Start Interview</Text></View>
            }
          </LinearGradient>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      {/* Chat header */}
      <View style={styles.chatHeader}>
        <View style={[styles.interviewerAvatar, { backgroundColor: C.accentGreen + "20" }]}>
          <Ionicons name="person" size={20} color={C.accentGreen} />
        </View>
        <View>
          <Text style={styles.chatHeaderTitle}>{company} Interviewer</Text>
          <Text style={styles.chatHeaderSub}>{role} · {interviewType}</Text>
        </View>
        <View style={[styles.liveIndicator, { backgroundColor: stage === "complete" ? C.accentOrange : C.accentGreen }]}>
          <Text style={styles.liveText}>{stage === "complete" ? "Done" : "Live"}</Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={styles.chatList}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View>
            <View style={[styles.bubble, item.role === "user" ? styles.userBubble : styles.aiBubble]}>
              <Text style={[styles.bubbleText, item.role === "user" && { color: "#0A0F1E" }]}>{item.content}</Text>
            </View>
            {item.feedback && (
              <View style={styles.feedbackCard}>
                <Ionicons name="chatbubble-outline" size={13} color={C.accentOrange} />
                <Text style={styles.feedbackText}>{item.feedback}</Text>
              </View>
            )}
          </View>
        )}
        ListFooterComponent={isLoading ? (
          <View style={[styles.bubble, styles.aiBubble, { paddingHorizontal: 16, paddingVertical: 12 }]}>
            <ActivityIndicator size="small" color={C.accent} />
          </View>
        ) : null}
      />

      {/* Input */}
      {stage !== "complete" && (
        <View style={[styles.inputBar, { paddingBottom: bottomInset + 8 }]}>
          <TextInput
            style={styles.chatInput}
            placeholder="Type your answer..."
            placeholderTextColor={C.textMuted}
            value={userInput}
            onChangeText={setUserInput}
            multiline
            maxLength={1000}
          />
          <Pressable
            style={[styles.sendBtn, { backgroundColor: userInput.trim() ? C.accentGreen : C.cardBorder }]}
            onPress={sendMessage}
            disabled={!userInput.trim() || isLoading}
          >
            <Ionicons name="arrow-up" size={20} color={userInput.trim() ? "#fff" : C.textMuted} />
          </Pressable>
        </View>
      )}
      {stage === "complete" && (
        <Pressable
          style={[styles.restartBtn, { paddingBottom: bottomInset + 12 }]}
          onPress={() => { setStage("setup"); setMessages([]); }}
        >
          <Ionicons name="refresh" size={16} color={C.accent} />
          <Text style={styles.restartText}>Start New Interview</Text>
        </Pressable>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  setupCard: { alignItems: "center", paddingVertical: 24, marginBottom: 24 },
  setupIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: C.accentGreen + "20", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  setupTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.text, marginBottom: 4 },
  setupSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary },
  setupSection: { marginBottom: 20 },
  sectionLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text, marginBottom: 10 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.textSecondary },
  startBtn: { borderRadius: 14, overflow: "hidden", marginTop: 8 },
  startBtnGradient: { height: 52, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  startBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  chatHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.cardBorder },
  interviewerAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  chatHeaderTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },
  chatHeaderSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary },
  liveIndicator: { marginLeft: "auto", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  liveText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#fff" },
  chatList: { padding: 16, gap: 10, paddingBottom: 20 },
  bubble: { borderRadius: 18, padding: 14, maxWidth: "85%" },
  aiBubble: { backgroundColor: C.card, alignSelf: "flex-start", borderBottomLeftRadius: 4, borderWidth: 1, borderColor: C.cardBorder },
  userBubble: { backgroundColor: C.accent, alignSelf: "flex-end", borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.text, lineHeight: 20 },
  feedbackCard: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: C.accentOrange + "10", borderRadius: 10, padding: 10, marginTop: 6, marginLeft: 4, borderWidth: 1, borderColor: C.accentOrange + "30", maxWidth: "85%" },
  feedbackText: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.accentOrange, flex: 1, lineHeight: 17 },
  inputBar: { flexDirection: "row", alignItems: "flex-end", gap: 10, paddingHorizontal: 16, paddingTop: 12, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.cardBorder },
  chatInput: { flex: 1, backgroundColor: C.card, borderRadius: 16, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, fontSize: 14, fontFamily: "Inter_400Regular", color: C.text, maxHeight: 120, borderWidth: 1, borderColor: C.cardBorder },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  restartBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 20, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.cardBorder },
  restartText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.accent },
});
