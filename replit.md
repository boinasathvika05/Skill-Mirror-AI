# SkillMirror AI

## Overview
A comprehensive AI-powered developer skills platform built with Expo React Native + Express.

## Architecture

### Frontend (Expo / React Native)
- **Auth**: `context/AuthContext.tsx` — login/register/logout with AsyncStorage persistence, `isAdmin` flag
- **User Data**: `context/UserDataContext.tsx` — DSA progress, stats, activity tracking
- **Payment**: `context/PaymentContext.tsx` — 3 free trials, then premium paywall, AsyncStorage persistence
- **Tabs**: Dashboard, Practice, Tools, Profile (regular users only)
- **Tool Screens** (`app/tools/`): code-analyzer, coding-feedback, interview, resume, career, github — all gated by trial/premium
- **Admin** (`app/(admin)/`): Admin-only console with user list and platform stats
- **Paywall** (`app/paywall.tsx`): Pricing modal with payment form

### Backend (Express + TypeScript)
- **`server/routes.ts`**: All AI API endpoints + auth + admin + payment endpoints
- **`server/storage.ts`**: In-memory user storage with stats tracking (MemStorage)
- AI powered by OpenAI via Replit AI Integrations (no API key needed)

## Key Features
1. **Auth** — Register/Login with hashed passwords (SHA-256), per-user data isolation
2. **Dashboard** — Stats overview, DSA radar chart, quick access tools, recent activity
3. **DSA Practice** — 19 company-tagged questions with radar chart progress
4. **AI Code Analyzer** — Paste code → bugs, optimizations, complexity, refined code
5. **Coding Interview Feedback** — Submit solution → correctness, complexity, edge cases
6. **Interview Simulator** — AI-driven mock interviews, text-based chat
7. **Resume Analyzer** — Role/company-specific resume scoring, ATS keywords
8. **Career Advisor** — Resume-based role recommendations
9. **GitHub Analyzer** — Repo URL → role/company fit analysis
10. **Admin Console** — Admin-only view of all users, stats, platform analytics
11. **Payment System** — 3 free trial AI calls, then premium ($9.99/mo or $59.99/yr)

## Admin Account
- Username: `admin`
- Password: `Admin@123`
- Admin redirected to `/(admin)` dashboard, blocked from regular tabs
- Regular users blocked from `/(admin)` routes

## Payment System
- 3 free AI calls per user (trial)
- After trial: paywalled, redirected to `/paywall` modal
- Demo payment form (no real charge)
- Premium status stored in AsyncStorage per user
- `TrialBanner` component shown on all tool screens

## Design System
- **Theme**: Dark-first, navy/cyan palette
- **Colors**: `constants/colors.ts` — background #0A0F1E, accent #00E5FF, surface #111827
- **Font**: Inter (400, 500, 600, 700)
- **Components**: RadarChart (SVG), TrialBanner, all screens use native dark patterns

## AI Models Used
- `gpt-5.1` for all analysis features (via Replit AI Integrations)
- No external API keys required — billed to Replit credits

## Packages
- expo, expo-router, @tanstack/react-query, react-native-svg, expo-linear-gradient
- @react-native-async-storage/async-storage, expo-haptics, expo-blur

## Workflows
- **Start Backend**: `npm run server:dev` — runs on port 5000
- **Start Frontend**: `npm run expo:dev` — runs on port 8081
