# SkillMirror AI

## Overview
A comprehensive AI-powered developer skills platform built with Expo React Native + Express.

## Architecture

### Frontend (Expo / React Native)
- **Auth**: `context/AuthContext.tsx` — login/register/logout with AsyncStorage persistence
- **User Data**: `context/UserDataContext.tsx` — DSA progress, stats, activity tracking
- **Tabs**: Dashboard, Practice, Tools, Profile
- **Tool Screens** (`app/tools/`): code-analyzer, coding-feedback, interview, resume, career, github

### Backend (Express + TypeScript)
- **`server/routes.ts`**: All AI API endpoints + auth endpoints
- **`server/storage.ts`**: In-memory user storage (MemStorage)
- AI powered by OpenAI via Replit AI Integrations (no API key needed)

## Key Features
1. **Auth** — Register/Login with hashed passwords (SHA-256), per-user data isolation
2. **Dashboard** — Stats overview, DSA radar chart, quick access tools, recent activity
3. **DSA Practice** — 19 company-tagged questions (Google, Amazon, Meta, Microsoft) with radar chart progress
4. **AI Code Analyzer** — Paste code → bugs, optimizations, complexity, refined code
5. **Coding Interview Feedback** — Submit solution → correctness, complexity, edge cases, score/grade
6. **Interview Simulator** — AI-driven mock interviews (behavioral/technical), text-based chat
7. **Resume Analyzer** — Role/company-specific resume scoring, ATS keywords, recommendations
8. **Career Advisor** — Resume-based role recommendations with salary, companies, growth paths
9. **GitHub Analyzer** — Enter repo URL → role/company fit score, quality indicators

## Design System
- **Theme**: Dark-first, navy/cyan palette
- **Colors**: `constants/colors.ts` — background #0A0F1E, accent #00E5FF, surface #111827
- **Font**: Inter (400, 500, 600, 700)
- **Components**: RadarChart (SVG), all screens use native dark patterns

## AI Models Used
- `gpt-5.1` for all analysis features (via Replit AI Integrations)
- No external API keys required — billed to Replit credits

## Packages
- expo, expo-router, @tanstack/react-query, react-native-svg, expo-linear-gradient
- @react-native-async-storage/async-storage, expo-haptics, expo-blur

## Workflows
- **Start Backend**: `npm run server:dev` — runs on port 5000
- **Start Frontend**: `npm run expo:dev` — runs on port 8081
