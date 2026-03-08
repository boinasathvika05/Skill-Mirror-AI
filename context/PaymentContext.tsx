import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";
import { apiRequest } from "@/lib/query-client";

const FREE_TRIAL_LIMIT = 3;

interface PaymentContextValue {
  isPremium: boolean;
  trialUsed: number;
  trialRemaining: number;
  canUseFeature: boolean;
  checkAndConsumetrial: () => Promise<boolean>;
  upgradeToPremium: (plan: "monthly" | "yearly") => Promise<void>;
  isLoading: boolean;
}

const PaymentContext = createContext<PaymentContextValue | null>(null);

export function PaymentProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [trialUsed, setTrialUsed] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const premiumKey = user ? `premium_${user.id}` : null;
  const trialKey = user ? `trial_${user.id}` : null;

  useEffect(() => {
    if (!premiumKey || !trialKey) {
      setIsPremium(false);
      setTrialUsed(0);
      return;
    }
    Promise.all([
      AsyncStorage.getItem(premiumKey),
      AsyncStorage.getItem(trialKey),
    ]).then(([p, t]) => {
      setIsPremium(p === "true");
      setTrialUsed(t ? parseInt(t, 10) : 0);
    });
  }, [premiumKey, trialKey]);

  // If user is admin, always premium
  const effectivePremium = isPremium || !!user?.isAdmin;
  const trialRemaining = Math.max(0, FREE_TRIAL_LIMIT - trialUsed);
  const canUseFeature = effectivePremium || trialRemaining > 0;

  const checkAndConsumerial = useCallback(async (): Promise<boolean> => {
    if (effectivePremium) return true;
    if (trialRemaining <= 0) return false;

    const newUsed = trialUsed + 1;
    setTrialUsed(newUsed);
    if (trialKey) await AsyncStorage.setItem(trialKey, newUsed.toString());

    // Also update server
    if (user) {
      try {
        await apiRequest("POST", "/api/user/trial", { userId: user.id });
      } catch {}
    }
    return true;
  }, [effectivePremium, trialRemaining, trialUsed, trialKey, user]);

  const upgradeToPremium = useCallback(async (plan: "monthly" | "yearly") => {
    setIsLoading(true);
    try {
      // Demo payment processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setIsPremium(true);
      if (premiumKey) await AsyncStorage.setItem(premiumKey, "true");

      // Notify server
      if (user) {
        await apiRequest("POST", "/api/user/premium", { userId: user.id, plan });
      }
    } finally {
      setIsLoading(false);
    }
  }, [premiumKey, user]);

  const value = useMemo(() => ({
    isPremium: effectivePremium,
    trialUsed,
    trialRemaining,
    canUseFeature,
    checkAndConsumerial: checkAndConsumerial,
    upgradeToPremium,
    isLoading,
  }), [effectivePremium, trialUsed, trialRemaining, canUseFeature, checkAndConsumerial, upgradeToPremium, isLoading]);

  return <PaymentContext.Provider value={value as any}>{children}</PaymentContext.Provider>;
}

export function usePayment() {
  const ctx = useContext(PaymentContext);
  if (!ctx) throw new Error("usePayment must be used within PaymentProvider");
  return ctx as PaymentContextValue & { checkAndConsumerial: () => Promise<boolean> };
}
