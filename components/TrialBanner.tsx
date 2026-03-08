import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";
import { usePayment } from "@/context/PaymentContext";

const C = Colors.dark;

export function TrialBanner() {
  const router = useRouter();
  const payment = usePayment() as any;
  const { isPremium, trialRemaining } = payment;

  if (isPremium) return null;

  const isLastTrial = trialRemaining === 1;
  const isExhausted = trialRemaining === 0;

  if (isExhausted) {
    return (
      <TouchableOpacity style={[styles.banner, styles.exhaustedBanner]} onPress={() => router.push("/paywall" as any)}>
        <Ionicons name="lock-closed" size={14} color="#EF4444" />
        <Text style={[styles.bannerText, { color: "#EF4444" }]}>Free trial used up — tap to upgrade</Text>
        <Ionicons name="chevron-forward" size={14} color="#EF4444" />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.banner, isLastTrial ? styles.warningBanner : styles.infoBanner]}
      onPress={() => router.push("/paywall" as any)}
    >
      <Ionicons name="diamond-outline" size={14} color={isLastTrial ? "#F59E0B" : C.accent} />
      <Text style={[styles.bannerText, { color: isLastTrial ? "#F59E0B" : C.accent }]}>
        {isLastTrial ? "Last free trial remaining — upgrade for unlimited" : `${trialRemaining} free trial${trialRemaining !== 1 ? "s" : ""} remaining`}
      </Text>
      <Ionicons name="chevron-forward" size={14} color={isLastTrial ? "#F59E0B" : C.accent} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
  },
  infoBanner: { backgroundColor: "#00E5FF10", borderColor: "#00E5FF30" },
  warningBanner: { backgroundColor: "#F59E0B10", borderColor: "#F59E0B30" },
  exhaustedBanner: { backgroundColor: "#EF444410", borderColor: "#EF444430" },
  bannerText: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium" },
});
