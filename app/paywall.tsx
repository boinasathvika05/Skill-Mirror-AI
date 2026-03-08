import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { usePayment } from "@/context/PaymentContext";

const C = Colors.dark;

const PLANS = [
  {
    id: "monthly" as const,
    label: "Monthly",
    price: "$9.99",
    period: "/ month",
    badge: null,
    color: C.accent,
  },
  {
    id: "yearly" as const,
    label: "Yearly",
    price: "$59.99",
    period: "/ year",
    badge: "Save 50%",
    color: "#7C3AED",
  },
];

const FEATURES = [
  { icon: "code-slash", text: "Unlimited AI Code Analysis" },
  { icon: "chatbubbles", text: "Unlimited Interview Simulations" },
  { icon: "document-text", text: "Unlimited Resume Analysis" },
  { icon: "trending-up", text: "Career Advisor AI" },
  { icon: "logo-github", text: "GitHub Repo Analyzer" },
  { icon: "trophy", text: "Advanced DSA Practice Hints" },
  { icon: "shield-checkmark", text: "Priority AI Processing" },
];

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { upgradeToPremium, isLoading, trialUsed } = usePayment() as any;

  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");
  const [showPayment, setShowPayment] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleSubscribe = () => {
    if (!showPayment) {
      setShowPayment(true);
      return;
    }
    if (!cardNumber || !expiry || !cvv || !cardName) {
      Alert.alert("Missing Info", "Please fill in all card details.");
      return;
    }
    handlePayment();
  };

  const handlePayment = async () => {
    setProcessing(true);
    try {
      await upgradeToPremium(selectedPlan);
      Alert.alert(
        "Welcome to Premium!",
        "Your subscription is active. Enjoy unlimited access to all features.",
        [{ text: "Let's Go!", onPress: () => router.back() }]
      );
    } catch {
      Alert.alert("Payment Failed", "Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const formatCard = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 16);
    return cleaned.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 4);
    if (cleaned.length >= 2) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    return cleaned;
  };

  const webTop = Platform.OS === "web" ? 67 : 0;
  const webBottom = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTop, paddingBottom: insets.bottom + webBottom }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={22} color={C.textSecondary} />
        </TouchableOpacity>

        <LinearGradient
          colors={["#7C3AED22", "#00E5FF11"]}
          style={styles.headerGrad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="diamond" size={40} color="#7C3AED" />
          <Text style={styles.headerTitle}>Unlock SkillMirror AI</Text>
          <Text style={styles.headerSub}>
            {trialUsed >= 3
              ? "You've used all 3 free trials. Upgrade to keep going."
              : `${3 - trialUsed} free trial${3 - trialUsed !== 1 ? "s" : ""} remaining — upgrade for unlimited access.`}
          </Text>
        </LinearGradient>

        {/* Features */}
        <View style={styles.featuresCard}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon as any} size={16} color={C.accent} />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* Plan selector */}
        <View style={styles.plans}>
          {PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[styles.planCard, selectedPlan === plan.id && { borderColor: plan.color, borderWidth: 2 }]}
              onPress={() => setSelectedPlan(plan.id)}
            >
              {plan.badge && (
                <View style={[styles.planBadge, { backgroundColor: plan.color }]}>
                  <Text style={styles.planBadgeText}>{plan.badge}</Text>
                </View>
              )}
              <View style={[styles.planRadio, selectedPlan === plan.id && { borderColor: plan.color }]}>
                {selectedPlan === plan.id && <View style={[styles.planRadioFill, { backgroundColor: plan.color }]} />}
              </View>
              <Text style={styles.planLabel}>{plan.label}</Text>
              <Text style={[styles.planPrice, selectedPlan === plan.id && { color: plan.color }]}>{plan.price}</Text>
              <Text style={styles.planPeriod}>{plan.period}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Payment form */}
        {showPayment && (
          <View style={styles.paymentCard}>
            <Text style={styles.paymentTitle}>Payment Details</Text>
            <View style={styles.paymentNote}>
              <Ionicons name="lock-closed" size={12} color={C.textSecondary} />
              <Text style={styles.paymentNoteText}>Demo mode — no real charge</Text>
            </View>

            <Text style={styles.inputLabel}>Card Number</Text>
            <TextInput
              style={styles.input}
              placeholder="1234 5678 9012 3456"
              placeholderTextColor={C.textSecondary}
              value={cardNumber}
              onChangeText={(t) => setCardNumber(formatCard(t))}
              keyboardType="numeric"
              maxLength={19}
            />

            <Text style={styles.inputLabel}>Cardholder Name</Text>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              placeholderTextColor={C.textSecondary}
              value={cardName}
              onChangeText={setCardName}
            />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Expiry (MM/YY)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="12/26"
                  placeholderTextColor={C.textSecondary}
                  value={expiry}
                  onChangeText={(t) => setExpiry(formatExpiry(t))}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>CVV</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123"
                  placeholderTextColor={C.textSecondary}
                  value={cvv}
                  onChangeText={(t) => setCvv(t.replace(/\D/g, "").slice(0, 3))}
                  keyboardType="numeric"
                  maxLength={3}
                  secureTextEntry
                />
              </View>
            </View>
          </View>
        )}

        {/* CTA Button */}
        <TouchableOpacity
          style={[styles.ctaBtn, (processing || isLoading) && { opacity: 0.7 }]}
          onPress={handleSubscribe}
          disabled={processing || isLoading}
        >
          <LinearGradient
            colors={["#7C3AED", "#00E5FF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGrad}
          >
            {processing || isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="diamond" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.ctaText}>
                  {showPayment ? `Pay ${PLANS.find((p) => p.id === selectedPlan)?.price}` : "Subscribe Now"}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.termsText}>
          Cancel anytime. By subscribing you agree to our Terms of Service.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  scroll: { padding: 20, paddingBottom: 40 },
  closeBtn: {
    alignSelf: "flex-end",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  headerGrad: {
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#7C3AED33",
  },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold", color: C.text, marginTop: 12, textAlign: "center" },
  headerSub: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 8, textAlign: "center", lineHeight: 20 },
  featuresCard: { backgroundColor: C.surface, borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: C.cardBorder },
  featureRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  featureIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: "#00E5FF15", alignItems: "center", justifyContent: "center", marginRight: 12 },
  featureText: { fontSize: 14, fontFamily: "Inter_500Medium", color: C.text },
  plans: { flexDirection: "row", gap: 12, marginBottom: 20 },
  planCard: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.cardBorder,
    position: "relative",
    paddingTop: 24,
  },
  planBadge: {
    position: "absolute",
    top: -10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  planBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#fff" },
  planRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.cardBorder, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  planRadioFill: { width: 10, height: 10, borderRadius: 5 },
  planLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.textSecondary, marginBottom: 4 },
  planPrice: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.text },
  planPeriod: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary },
  paymentCard: { backgroundColor: C.surface, borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: C.cardBorder },
  paymentTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: C.text, marginBottom: 4 },
  paymentNote: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 16 },
  paymentNoteText: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary },
  inputLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: C.textSecondary, marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: C.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 12,
    color: C.text,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    marginBottom: 4,
  },
  row: { flexDirection: "row", gap: 12 },
  halfInput: { flex: 1 },
  ctaBtn: { borderRadius: 16, overflow: "hidden", marginBottom: 16 },
  ctaGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16 },
  ctaText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  termsText: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, textAlign: "center", lineHeight: 18 },
});
