import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";

export interface DSAProgress {
  questionId: string;
  solved: boolean;
  attempts: number;
  lastAttempt: number;
  company: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  topic: string;
}

export interface UserStats {
  totalSolved: number;
  analyzerCount: number;
  interviewCount: number;
  resumeCount: number;
  dsaByTopic: Record<string, number>;
  dsaByDifficulty: { beginner: number; intermediate: number; advanced: number };
  recentActivity: { type: string; description: string; timestamp: number }[];
}

interface UserDataContextValue {
  stats: UserStats;
  dsaProgress: Record<string, DSAProgress>;
  markDSASolved: (questionId: string, meta: Omit<DSAProgress, "questionId" | "solved" | "attempts" | "lastAttempt">) => void;
  incrementAnalyzer: () => void;
  incrementInterview: () => void;
  incrementResume: () => void;
  addActivity: (type: string, description: string) => void;
}

const UserDataContext = createContext<UserDataContextValue | null>(null);

const DEFAULT_STATS: UserStats = {
  totalSolved: 0,
  analyzerCount: 0,
  interviewCount: 0,
  resumeCount: 0,
  dsaByTopic: {},
  dsaByDifficulty: { beginner: 0, intermediate: 0, advanced: 0 },
  recentActivity: [],
};

export function UserDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);
  const [dsaProgress, setDsaProgress] = useState<Record<string, DSAProgress>>({});

  const statsKey = user ? `stats_${user.id}` : null;
  const dsaKey = user ? `dsa_${user.id}` : null;

  useEffect(() => {
    if (!statsKey || !dsaKey) {
      setStats(DEFAULT_STATS);
      setDsaProgress({});
      return;
    }
    Promise.all([AsyncStorage.getItem(statsKey), AsyncStorage.getItem(dsaKey)]).then(([s, d]) => {
      if (s) try { setStats(JSON.parse(s)); } catch {}
      if (d) try { setDsaProgress(JSON.parse(d)); } catch {}
    });
  }, [statsKey, dsaKey]);

  const saveStats = useCallback(async (newStats: UserStats) => {
    if (statsKey) await AsyncStorage.setItem(statsKey, JSON.stringify(newStats));
  }, [statsKey]);

  const saveDsa = useCallback(async (newDsa: Record<string, DSAProgress>) => {
    if (dsaKey) await AsyncStorage.setItem(dsaKey, JSON.stringify(newDsa));
  }, [dsaKey]);

  const addActivity = useCallback((type: string, description: string) => {
    setStats((prev) => {
      const updated = {
        ...prev,
        recentActivity: [
          { type, description, timestamp: Date.now() },
          ...prev.recentActivity.slice(0, 19),
        ],
      };
      saveStats(updated);
      return updated;
    });
  }, [saveStats]);

  const markDSASolved = useCallback((questionId: string, meta: Omit<DSAProgress, "questionId" | "solved" | "attempts" | "lastAttempt">) => {
    const existing = dsaProgress[questionId];
    if (existing?.solved) return;

    const newEntry: DSAProgress = {
      questionId,
      solved: true,
      attempts: (existing?.attempts || 0) + 1,
      lastAttempt: Date.now(),
      ...meta,
    };

    const newDsa = { ...dsaProgress, [questionId]: newEntry };
    setDsaProgress(newDsa);
    saveDsa(newDsa);

    setStats((prev) => {
      const updated = {
        ...prev,
        totalSolved: prev.totalSolved + 1,
        dsaByTopic: {
          ...prev.dsaByTopic,
          [meta.topic]: (prev.dsaByTopic[meta.topic] || 0) + 1,
        },
        dsaByDifficulty: {
          ...prev.dsaByDifficulty,
          [meta.difficulty]: prev.dsaByDifficulty[meta.difficulty] + 1,
        },
        recentActivity: [
          { type: "dsa", description: `Solved ${questionId}`, timestamp: Date.now() },
          ...prev.recentActivity.slice(0, 19),
        ],
      };
      saveStats(updated);
      return updated;
    });
  }, [dsaProgress, saveDsa, saveStats]);

  const incrementAnalyzer = useCallback(() => {
    setStats((prev) => {
      const updated = { ...prev, analyzerCount: prev.analyzerCount + 1 };
      saveStats(updated);
      return updated;
    });
  }, [saveStats]);

  const incrementInterview = useCallback(() => {
    setStats((prev) => {
      const updated = { ...prev, interviewCount: prev.interviewCount + 1 };
      saveStats(updated);
      return updated;
    });
  }, [saveStats]);

  const incrementResume = useCallback(() => {
    setStats((prev) => {
      const updated = { ...prev, resumeCount: prev.resumeCount + 1 };
      saveStats(updated);
      return updated;
    });
  }, [saveStats]);

  const value = useMemo(() => ({
    stats, dsaProgress, markDSASolved, incrementAnalyzer, incrementInterview, incrementResume, addActivity,
  }), [stats, dsaProgress, markDSASolved, incrementAnalyzer, incrementInterview, incrementResume, addActivity]);

  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>;
}

export function useUserData() {
  const ctx = useContext(UserDataContext);
  if (!ctx) throw new Error("useUserData must be used within UserDataProvider");
  return ctx;
}
