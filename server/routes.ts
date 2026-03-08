import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import OpenAI from "openai";
import { storage } from "./storage";
import crypto from "crypto";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function registerRoutes(app: Express): Promise<Server> {

  // ─── Auth ─────────────────────────────────────────────────────────────────

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { username, password, displayName } = req.body;
      if (!username || !password) return res.status(400).json({ error: "Username and password required" });
      if (username.toLowerCase() === "admin") return res.status(403).json({ error: "Username not allowed" });
      const existing = await storage.getUserByUsername(username);
      if (existing) return res.status(409).json({ error: "Username already taken" });
      const user = await storage.createUser({ username, password: hashPassword(password), displayName: displayName || username });
      res.json({ id: user.id, username: user.username, displayName: user.displayName, isAdmin: false });
    } catch { res.status(500).json({ error: "Registration failed" }); }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== hashPassword(password)) return res.status(401).json({ error: "Invalid credentials" });
      res.json({ id: user.id, username: user.username, displayName: user.displayName, isAdmin: user.isAdmin });
    } catch { res.status(500).json({ error: "Login failed" }); }
  });

  // ─── User / Payment ───────────────────────────────────────────────────────

  app.post("/api/user/trial", async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      const count = await storage.incrementUserTrial(userId);
      res.json({ trialUsed: count });
    } catch { res.status(500).json({ error: "Failed" }); }
  });

  app.post("/api/user/premium", async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      await storage.setPremium(userId, true);
      const stats = await storage.getUserStats(userId);
      await storage.updateUserStats(userId, { isPremium: true });
      res.json({ success: true });
    } catch { res.status(500).json({ error: "Failed" }); }
  });

  app.post("/api/user/stats", async (req: Request, res: Response) => {
    try {
      const { userId, type, description } = req.body;
      const stats = await storage.getUserStats(userId);
      const updates: any = { lastActive: Date.now() };
      if (type === "analyzer") updates.analyzerCount = stats.analyzerCount + 1;
      if (type === "interview") updates.interviewCount = stats.interviewCount + 1;
      if (type === "resume") updates.resumeCount = stats.resumeCount + 1;
      if (type === "github") updates.githubCount = stats.githubCount + 1;
      if (type === "career") updates.careerCount = stats.careerCount + 1;
      if (type === "coding") updates.codingFeedbackCount = stats.codingFeedbackCount + 1;
      if (type === "dsa") updates.totalSolved = stats.totalSolved + 1;
      if (description) {
        updates.recentActivity = [
          { type, description, timestamp: Date.now() },
          ...(stats.recentActivity || []).slice(0, 19),
        ];
      }
      await storage.updateUserStats(userId, updates);
      res.json({ success: true });
    } catch { res.status(500).json({ error: "Failed" }); }
  });

  // ─── Admin ────────────────────────────────────────────────────────────────

  app.get("/api/admin/users", async (req: Request, res: Response) => {
    try {
      const adminId = req.headers["x-admin-id"] as string;
      const admin = await storage.getUser(adminId);
      if (!admin?.isAdmin) return res.status(403).json({ error: "Forbidden" });

      const users = await storage.getAllUsers();
      const usersWithStats = await Promise.all(
        users.map(async (u) => {
          const stats = await storage.getUserStats(u.id);
          return {
            id: u.id,
            username: u.username,
            displayName: u.displayName,
            createdAt: u.createdAt,
            stats,
          };
        })
      );
      res.json(usersWithStats);
    } catch { res.status(500).json({ error: "Failed" }); }
  });

  app.get("/api/admin/stats", async (req: Request, res: Response) => {
    try {
      const adminId = req.headers["x-admin-id"] as string;
      const admin = await storage.getUser(adminId);
      if (!admin?.isAdmin) return res.status(403).json({ error: "Forbidden" });

      const users = await storage.getAllUsers();
      const allStats = await Promise.all(users.map((u) => storage.getUserStats(u.id)));

      const totals = allStats.reduce((acc, s) => ({
        totalUsers: acc.totalUsers + 1,
        premiumUsers: acc.premiumUsers + (s.isPremium ? 1 : 0),
        totalSolved: acc.totalSolved + s.totalSolved,
        analyzerCount: acc.analyzerCount + s.analyzerCount,
        interviewCount: acc.interviewCount + s.interviewCount,
        resumeCount: acc.resumeCount + s.resumeCount,
        githubCount: acc.githubCount + s.githubCount,
        careerCount: acc.careerCount + s.careerCount,
      }), { totalUsers: 0, premiumUsers: 0, totalSolved: 0, analyzerCount: 0, interviewCount: 0, resumeCount: 0, githubCount: 0, careerCount: 0 });

      res.json(totals);
    } catch { res.status(500).json({ error: "Failed" }); }
  });

  // ─── AI Code Analyzer ─────────────────────────────────────────────────────

  app.post("/api/ai/analyze-code", async (req: Request, res: Response) => {
    try {
      const { code, language } = req.body;
      if (!code) return res.status(400).json({ error: "Code is required" });
      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{
          role: "user",
          content: `You are an expert code reviewer. Analyze the following ${language || "code"} and provide a structured review.\n\nCode:\n\`\`\`${language || ""}\n${code}\n\`\`\`\n\nRespond with a JSON object:\n{\n  "bugs": [{ "line": number_or_null, "description": "string", "severity": "critical|warning|info" }],\n  "optimizations": [{ "description": "string", "impact": "high|medium|low" }],\n  "timeComplexity": "O(...) - explanation",\n  "spaceComplexity": "O(...) - explanation",\n  "refinedCode": "improved version as a string",\n  "overallScore": number_between_0_and_100,\n  "summary": "2-3 sentence summary"\n}`,
        }],
        response_format: { type: "json_object" },
        max_completion_tokens: 8192,
      });
      res.json(JSON.parse(response.choices[0]?.message?.content || "{}"));
    } catch { res.status(500).json({ error: "Analysis failed" }); }
  });

  // ─── DSA Hint ─────────────────────────────────────────────────────────────

  app.post("/api/ai/dsa-hint", async (req: Request, res: Response) => {
    try {
      const { questionTitle, questionDescription, userCode, language } = req.body;
      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{
          role: "user",
          content: `You are a DSA mentor. Give a helpful hint for:\nProblem: ${questionTitle}\nDescription: ${questionDescription}\n${userCode ? `User's attempt:\n\`\`\`${language || ""}\n${userCode}\n\`\`\`` : ""}\n\nRespond with JSON:\n{"hint":"...","approach":"...","keyInsight":"..."}`,
        }],
        response_format: { type: "json_object" },
        max_completion_tokens: 8192,
      });
      res.json(JSON.parse(response.choices[0]?.message?.content || "{}"));
    } catch { res.status(500).json({ error: "Hint failed" }); }
  });

  // ─── Coding Interview Feedback ─────────────────────────────────────────────

  app.post("/api/ai/coding-feedback", async (req: Request, res: Response) => {
    try {
      const { code, language, problem, problemDescription } = req.body;
      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{
          role: "user",
          content: `You are a coding interview evaluator. Evaluate this solution.\n\nProblem: ${problem}\n${problemDescription ? `Description: ${problemDescription}` : ""}\nLanguage: ${language || "Unknown"}\n\nCode:\n\`\`\`${language || ""}\n${code}\n\`\`\`\n\nRespond with JSON:\n{\n  "correctness": { "score": 0-100, "details": "string" },\n  "timeComplexity": { "value": "O(...)", "explanation": "string", "optimal": boolean },\n  "spaceComplexity": { "value": "O(...)", "explanation": "string" },\n  "edgeCases": [{ "case": "string", "handled": boolean }],\n  "betterApproach": "string or null",\n  "betterCode": "string or null",\n  "interviewTips": ["tip1","tip2"],\n  "finalScore": 0-100,\n  "grade": "A+|A|B+|B|C|D|F",\n  "verdict": "Accepted|Needs Work|Rejected"\n}`,
        }],
        response_format: { type: "json_object" },
        max_completion_tokens: 8192,
      });
      res.json(JSON.parse(response.choices[0]?.message?.content || "{}"));
    } catch { res.status(500).json({ error: "Feedback failed" }); }
  });

  // ─── Interview Simulator ──────────────────────────────────────────────────

  app.post("/api/ai/interview", async (req: Request, res: Response) => {
    try {
      const { messages, role, company, interviewType } = req.body;
      const systemPrompt = `You are a professional interviewer at ${company || "a top tech company"} conducting a ${interviewType || "behavioral"} interview for a ${role || "Software Engineer"} position. Ask focused questions one at a time. After each answer, give brief constructive feedback (1-2 sentences), then ask the next question. Keep responses concise. Format as JSON:\n{"message":"...","feedback":"string or null","questionType":"behavioral|technical|situational|general","interviewComplete":false}\nAfter 5-6 exchanges, complete the interview with a summary.`;
      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          { role: "system", content: systemPrompt },
          ...(messages || []).map((m: any) => ({ role: m.role as "user" | "assistant", content: m.content })),
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 8192,
      });
      res.json(JSON.parse(response.choices[0]?.message?.content || "{}"));
    } catch { res.status(500).json({ error: "Interview failed" }); }
  });

  // ─── Resume Analyzer ──────────────────────────────────────────────────────

  app.post("/api/ai/analyze-resume", async (req: Request, res: Response) => {
    try {
      const { resume, targetRole, targetCompany } = req.body;
      if (!resume) return res.status(400).json({ error: "Resume required" });
      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{
          role: "user",
          content: `You are an expert technical recruiter${targetCompany ? ` at ${targetCompany}` : ""}. Analyze this resume for ${targetRole || "Software Engineer"}:\n\n${resume}\n\nRespond with JSON:\n{\n  "overallScore":0-100,"fitScore":0-100,"strengths":["..."],"gaps":["..."],"skillsFound":["..."],"missingSkills":["..."],"recommendations":[{"category":"...","action":"..."}],"rewrittenSummary":"...","atsKeywords":["..."],"verdict":"Strong Fit|Good Fit|Partial Fit|Not a Fit","summary":"..."\n}`,
        }],
        response_format: { type: "json_object" },
        max_completion_tokens: 8192,
      });
      res.json(JSON.parse(response.choices[0]?.message?.content || "{}"));
    } catch { res.status(500).json({ error: "Analysis failed" }); }
  });

  // ─── Career Advisor ────────────────────────────────────────────────────────

  app.post("/api/ai/career-advice", async (req: Request, res: Response) => {
    try {
      const { resume } = req.body;
      if (!resume) return res.status(400).json({ error: "Resume required" });
      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{
          role: "user",
          content: `You are an expert career counselor. Based on this resume, provide career guidance.\n\n${resume}\n\nRespond with JSON:\n{\n  "topRoles":[{"title":"...","matchScore":0-100,"reasoning":"...","companies":["..."],"salaryRange":"$X-$Y","growthPath":"..."}],"skillGaps":[{"skill":"...","importance":"critical|high|medium","learningPath":"..."}],"immediateActions":["..."],"timelineToNextRole":"...","marketInsight":"..."\n}`,
        }],
        response_format: { type: "json_object" },
        max_completion_tokens: 8192,
      });
      res.json(JSON.parse(response.choices[0]?.message?.content || "{}"));
    } catch { res.status(500).json({ error: "Career advice failed" }); }
  });

  // ─── GitHub Repo Analyzer ─────────────────────────────────────────────────

  app.post("/api/ai/analyze-github", async (req: Request, res: Response) => {
    try {
      const { repoUrl, targetRole, targetCompany } = req.body;
      if (!repoUrl) return res.status(400).json({ error: "Repo URL required" });
      const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!match) return res.status(400).json({ error: "Invalid GitHub URL" });
      const [, owner, repo] = match;

      let repoData: any = {};
      let readmeContent = "";
      let languages: any = {};
      try {
        const [repoRes, readmeRes, langRes] = await Promise.all([
          fetch(`https://api.github.com/repos/${owner}/${repo}`),
          fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, { headers: { Accept: "application/vnd.github.raw" } }),
          fetch(`https://api.github.com/repos/${owner}/${repo}/languages`),
        ]);
        if (repoRes.ok) repoData = await repoRes.json();
        if (readmeRes.ok) readmeContent = (await readmeRes.text()).slice(0, 2000);
        if (langRes.ok) languages = await langRes.json();
      } catch {}

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{
          role: "user",
          content: `You are a technical recruiter evaluating a GitHub repo for ${targetRole || "Software Engineer"}${targetCompany ? ` at ${targetCompany}` : ""}.\n\nRepo: ${repoUrl}\nName: ${repoData.name || repo}\nDesc: ${repoData.description || "N/A"}\nStars: ${repoData.stargazers_count || 0}\nLanguages: ${JSON.stringify(languages)}\nREADME: ${readmeContent || "N/A"}\n\nJSON:\n{\n  "overallScore":0-100,"roleRelevance":0-100,"codeQualityIndicators":[{"indicator":"...","assessment":"...","positive":boolean}],"techStack":["..."],"strengths":["..."],"improvements":["..."],"interviewTopics":["..."],"verdict":"Impressive|Good|Average|Needs Work","summary":"..."\n}`,
        }],
        response_format: { type: "json_object" },
        max_completion_tokens: 8192,
      });
      res.json(JSON.parse(response.choices[0]?.message?.content || "{}"));
    } catch { res.status(500).json({ error: "GitHub analysis failed" }); }
  });

  const httpServer = createServer(app);
  return httpServer;
}
