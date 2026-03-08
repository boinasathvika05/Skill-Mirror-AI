import { randomUUID } from "crypto";
import crypto from "crypto";

export interface User {
  id: string;
  username: string;
  password: string;
  displayName: string;
  isAdmin: boolean;
  createdAt: number;
}

export interface InsertUser {
  username: string;
  password: string;
  displayName: string;
  isAdmin?: boolean;
}

export interface UserStats {
  totalSolved: number;
  analyzerCount: number;
  interviewCount: number;
  resumeCount: number;
  githubCount: number;
  careerCount: number;
  codingFeedbackCount: number;
  isPremium: boolean;
  trialUsed: number;
  lastActive: number;
  recentActivity: { type: string; description: string; timestamp: number }[];
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUserStats(userId: string): Promise<UserStats>;
  updateUserStats(userId: string, stats: Partial<UserStats>): Promise<void>;
  incrementUserTrial(userId: string): Promise<number>;
  setPremium(userId: string, isPremium: boolean): Promise<void>;
}

const DEFAULT_STATS = (): UserStats => ({
  totalSolved: 0,
  analyzerCount: 0,
  interviewCount: 0,
  resumeCount: 0,
  githubCount: 0,
  careerCount: 0,
  codingFeedbackCount: 0,
  isPremium: false,
  trialUsed: 0,
  lastActive: Date.now(),
  recentActivity: [],
});

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private stats: Map<string, UserStats> = new Map();

  constructor() {
    // Create hardcoded admin account
    const adminId = "admin-000";
    const adminUser: User = {
      id: adminId,
      username: "admin",
      password: crypto.createHash("sha256").update("Admin@123").digest("hex"),
      displayName: "Admin",
      isAdmin: true,
      createdAt: Date.now(),
    };
    this.users.set(adminId, adminUser);
    this.stats.set(adminId, DEFAULT_STATS());
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((u) => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      isAdmin: insertUser.isAdmin || false,
      createdAt: Date.now(),
    };
    this.users.set(id, user);
    this.stats.set(id, DEFAULT_STATS());
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter((u) => !u.isAdmin);
  }

  async getUserStats(userId: string): Promise<UserStats> {
    return this.stats.get(userId) || DEFAULT_STATS();
  }

  async updateUserStats(userId: string, partial: Partial<UserStats>): Promise<void> {
    const current = this.stats.get(userId) || DEFAULT_STATS();
    this.stats.set(userId, { ...current, ...partial, lastActive: Date.now() });
  }

  async incrementUserTrial(userId: string): Promise<number> {
    const current = this.stats.get(userId) || DEFAULT_STATS();
    const isPremium = current.isPremium;
    if (isPremium) return -1; // unlimited
    const newCount = current.trialUsed + 1;
    this.stats.set(userId, { ...current, trialUsed: newCount, lastActive: Date.now() });
    return newCount;
  }

  async setPremium(userId: string, isPremium: boolean): Promise<void> {
    const current = this.stats.get(userId) || DEFAULT_STATS();
    this.stats.set(userId, { ...current, isPremium });
  }
}

export const storage = new MemStorage();
