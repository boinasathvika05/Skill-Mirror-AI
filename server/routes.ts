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
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(409).json({ error: "Username already taken" });
      }
      const user = await storage.createUser({
        username,
        password: hashPassword(password),
        displayName: displayName || username,
      });
      res.json({ id: user.id, username: user.username, displayName: user.displayName });
    } catch (e) {
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== hashPassword(password)) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      res.json({ id: user.id, username: user.username, displayName: user.displayName });
    } catch (e) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  // ─── AI Code Analyzer ─────────────────────────────────────────────────────

  app.post("/api/ai/analyze-code", async (req: Request, res: Response) => {
    try {
      const { code, language } = req.body;
      if (!code) return res.status(400).json({ error: "Code is required" });

      const prompt = `You are an expert code reviewer. Analyze the following ${language || "code"} and provide a structured review.

Code:
\`\`\`${language || ""}
${code}
\`\`\`

Respond with a JSON object with these exact fields:
{
  "bugs": [{ "line": number_or_null, "description": "string", "severity": "critical|warning|info" }],
  "optimizations": [{ "description": "string", "impact": "high|medium|low" }],
  "timeComplexity": "O(...) - explanation",
  "spaceComplexity": "O(...) - explanation",
  "refinedCode": "improved version of the code as a string",
  "overallScore": number_between_0_and_100,
  "summary": "2-3 sentence summary"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_completion_tokens: 8192,
      });

      const result = JSON.parse(response.choices[0]?.message?.content || "{}");
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: "Analysis failed" });
    }
  });

  // ─── DSA Question Hint ────────────────────────────────────────────────────

  app.post("/api/ai/dsa-hint", async (req: Request, res: Response) => {
    try {
      const { questionTitle, questionDescription, userCode, language } = req.body;

      const prompt = `You are a DSA mentor. Give a helpful hint (not the full solution) for this problem.

Problem: ${questionTitle}
Description: ${questionDescription}
${userCode ? `User's current attempt:\n\`\`\`${language || ""}\n${userCode}\n\`\`\`` : ""}

Respond with JSON:
{
  "hint": "clear helpful hint that guides without giving away the answer",
  "approach": "the recommended algorithmic approach name",
  "keyInsight": "the key insight needed to solve this"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_completion_tokens: 8192,
      });

      res.json(JSON.parse(response.choices[0]?.message?.content || "{}"));
    } catch (e) {
      res.status(500).json({ error: "Hint generation failed" });
    }
  });

  // ─── Coding Interview Feedback ─────────────────────────────────────────────

  app.post("/api/ai/coding-feedback", async (req: Request, res: Response) => {
    try {
      const { code, language, problem, problemDescription } = req.body;

      const prompt = `You are a coding interview evaluator at a top tech company. Evaluate this solution.

Problem: ${problem}
${problemDescription ? `Description: ${problemDescription}` : ""}
Language: ${language || "Unknown"}

Submitted Code:
\`\`\`${language || ""}
${code}
\`\`\`

Respond with JSON:
{
  "correctness": { "score": 0-100, "details": "explanation of correctness" },
  "timeComplexity": { "value": "O(...)", "explanation": "string", "optimal": boolean },
  "spaceComplexity": { "value": "O(...)", "explanation": "string" },
  "edgeCases": [{ "case": "description", "handled": boolean }],
  "betterApproach": "description of a better approach if exists, or null",
  "betterCode": "cleaner/optimized code if applicable, or null",
  "interviewTips": ["tip1", "tip2"],
  "finalScore": 0-100,
  "grade": "A+|A|B+|B|C|D|F",
  "verdict": "Accepted|Needs Work|Rejected"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_completion_tokens: 8192,
      });

      res.json(JSON.parse(response.choices[0]?.message?.content || "{}"));
    } catch (e) {
      res.status(500).json({ error: "Feedback generation failed" });
    }
  });

  // ─── Interview Simulator ──────────────────────────────────────────────────

  app.post("/api/ai/interview", async (req: Request, res: Response) => {
    try {
      const { messages, role, company, interviewType } = req.body;

      const systemPrompt = `You are a professional interviewer at ${company || "a top tech company"} conducting a ${interviewType || "behavioral"} interview for a ${role || "Software Engineer"} position.

Ask focused interview questions one at a time. After each answer, give brief constructive feedback (1-2 sentences), then ask the next question.

Keep responses concise and professional. Be encouraging but honest.

Format your response as JSON:
{
  "message": "your message to the candidate",
  "feedback": "brief feedback on their last answer (null for first message)",
  "questionType": "behavioral|technical|situational|general",
  "interviewComplete": false
}

After 5-6 exchanges, complete the interview with a summary.`;

      const chatMessages = [
        { role: "system" as const, content: systemPrompt },
        ...(messages || []).map((m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: chatMessages,
        response_format: { type: "json_object" },
        max_completion_tokens: 8192,
      });

      res.json(JSON.parse(response.choices[0]?.message?.content || "{}"));
    } catch (e) {
      res.status(500).json({ error: "Interview failed" });
    }
  });

  // ─── Resume Analyzer ──────────────────────────────────────────────────────

  app.post("/api/ai/analyze-resume", async (req: Request, res: Response) => {
    try {
      const { resume, targetRole, targetCompany } = req.body;
      if (!resume) return res.status(400).json({ error: "Resume is required" });

      const prompt = `You are an expert technical recruiter${targetCompany ? ` at ${targetCompany}` : ""}.

Analyze this resume for the role of ${targetRole || "Software Engineer"}:

${resume}

Respond with JSON:
{
  "overallScore": 0-100,
  "fitScore": 0-100,
  "strengths": ["strength1", "strength2", "strength3"],
  "gaps": ["gap1", "gap2"],
  "skillsFound": ["skill1", "skill2"],
  "missingSkills": ["skill1", "skill2"],
  "recommendations": [
    { "category": "string", "action": "specific actionable recommendation" }
  ],
  "rewrittenSummary": "improved professional summary for the role",
  "atsKeywords": ["keyword1", "keyword2"],
  "verdict": "Strong Fit|Good Fit|Partial Fit|Not a Fit",
  "summary": "2-3 sentence overall assessment"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_completion_tokens: 8192,
      });

      res.json(JSON.parse(response.choices[0]?.message?.content || "{}"));
    } catch (e) {
      res.status(500).json({ error: "Resume analysis failed" });
    }
  });

  // ─── Career Advisor ────────────────────────────────────────────────────────

  app.post("/api/ai/career-advice", async (req: Request, res: Response) => {
    try {
      const { resume } = req.body;
      if (!resume) return res.status(400).json({ error: "Resume is required" });

      const prompt = `You are an expert career counselor. Based on this resume, provide career guidance.

Resume:
${resume}

Respond with JSON:
{
  "topRoles": [
    {
      "title": "role title",
      "matchScore": 0-100,
      "reasoning": "why this role fits",
      "companies": ["company1", "company2", "company3"],
      "salaryRange": "$X - $Y",
      "growthPath": "career progression description"
    }
  ],
  "skillGaps": [
    { "skill": "skill name", "importance": "critical|high|medium", "learningPath": "how to learn it" }
  ],
  "immediateActions": ["action1", "action2", "action3"],
  "timelineToNextRole": "estimated time",
  "marketInsight": "current market observation relevant to their profile"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_completion_tokens: 8192,
      });

      res.json(JSON.parse(response.choices[0]?.message?.content || "{}"));
    } catch (e) {
      res.status(500).json({ error: "Career advice failed" });
    }
  });

  // ─── GitHub Repo Analyzer ─────────────────────────────────────────────────

  app.post("/api/ai/analyze-github", async (req: Request, res: Response) => {
    try {
      const { repoUrl, targetRole, targetCompany } = req.body;
      if (!repoUrl) return res.status(400).json({ error: "Repo URL is required" });

      // Extract repo info from URL
      const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!match) return res.status(400).json({ error: "Invalid GitHub URL" });

      const [, owner, repo] = match;

      // Fetch repo data from GitHub public API
      let repoData: Record<string, unknown> = {};
      let readmeContent = "";
      let languages: Record<string, number> = {};

      try {
        const [repoRes, readmeRes, langRes] = await Promise.all([
          fetch(`https://api.github.com/repos/${owner}/${repo}`),
          fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
            headers: { Accept: "application/vnd.github.raw" },
          }),
          fetch(`https://api.github.com/repos/${owner}/${repo}/languages`),
        ]);

        if (repoRes.ok) repoData = await repoRes.json();
        if (readmeRes.ok) readmeContent = (await readmeRes.text()).slice(0, 2000);
        if (langRes.ok) languages = await langRes.json();
      } catch {
        // Continue with partial data
      }

      const prompt = `You are a technical recruiter evaluating a GitHub repository for a ${targetRole || "Software Engineer"} role${targetCompany ? ` at ${targetCompany}` : ""}.

Repository: ${repoUrl}
Name: ${(repoData as any).name || repo}
Description: ${(repoData as any).description || "No description"}
Stars: ${(repoData as any).stargazers_count || 0}
Forks: ${(repoData as any).forks_count || 0}
Language: ${(repoData as any).language || "Unknown"}
Languages: ${JSON.stringify(languages)}
Topics: ${JSON.stringify((repoData as any).topics || [])}
README preview: ${readmeContent || "Not available"}

Respond with JSON:
{
  "overallScore": 0-100,
  "roleRelevance": 0-100,
  "codeQualityIndicators": [
    { "indicator": "name", "assessment": "description", "positive": boolean }
  ],
  "techStack": ["tech1", "tech2"],
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"],
  "interviewTopics": ["topic this repo could be discussed around"],
  "verdict": "Impressive|Good|Average|Needs Work",
  "summary": "2-3 sentence overall assessment for the target role"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_completion_tokens: 8192,
      });

      res.json(JSON.parse(response.choices[0]?.message?.content || "{}"));
    } catch (e) {
      res.status(500).json({ error: "GitHub analysis failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
