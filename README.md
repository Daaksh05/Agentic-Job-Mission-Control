# ⚡️ Agentic-Job-Mission-Control (Orbital v2.4)

> **The first high-frequency, agentic job application engine designed specifically for the French and Global tech markets.**

![Mission Control Dashboard](./dashboard_preview.png)

[![Mission Status: Online](https://img.shields.io/badge/Mission-Online-00A3FF?style=for-the-badge&logo=rocket)](https://github.com/Daaksh05/Agentic-Job-Mission-Control)
[![Target: France 🇫🇷](https://img.shields.io/badge/Target-France%20%F0%9F%87%AB%F0%9F%87%B7-0055A4?style=for-the-badge)](https://github.com/Daaksh05/Agentic-Job-Mission-Control)
[![Stage: Under Construction](https://img.shields.io/badge/Stage-Work%20In%20Progress-FFA500?style=for-the-badge&logo=git-lfs)](https://github.com/Daaksh05/Agentic-Job-Mission-Control)

---

> [!IMPORTANT]
> **SYSTEM STATUS: WORK IN PROGRESS**
> This project is currently in active development. While the core "Orbital" engine and "Command Center" UI are operational, some advanced modules (like LinkedIn Easy Apply automation and depth-scoring) are still being refined. Expected v1.0 stable release: May 2026.

---

## 🚀 The Mission
**Agentic-Job-Mission-Control** is not just a scraper; it's an autonomous "Human-in-the-loop" application pipeline. It handles everything from discovery on niche French job boards (WTTJ, Pôle Emploi) to generating 100% formal French cover letters (Vous/Moi/Nous) and performing automated, browser-based submissions with CAPTCHA-solved overrides.

### 🧠 Core Intelligence
- **High-Frequency Discovery**: Real-time monitoring of LinkedIn, Welcome to the Jungle, Adzuna, and Remotive.
- **AI-Tailored Identity**: Dynamic resume optimization and formal French (Vous) localization for 15%+ score boosts.
- **Autopilot Submissions**: Playwright-powered browser automation for Greenhouse, Lever, and LinkedIn Easy Apply.
- **Intelligence Dashboard**: A premium "Mission Control" UI with real-time analytics, Kanban tracking, and follow-up alerts.
- **Bot Telemetry**: Instant alerts via Telegram for every discovery and submission event.

## 🛠 High-Performance Stack 
- **Frontend**: React 18, Vite, TanStack Query, Framer Motion, Tailwind CSS, Lucide Icons.
- **Backend**: FastAPI (Python 3.9+), SQLAlchemy, SQLite, APScheduler.
- **Automation**: Playwright (Headless/Headful with Override support).
- **AI Engine**: Google Gemini (Document Writing) & Groq (High-Speed Scoring).

## 🛰 Project Architecture
```bash
├── backend/                # FastAPI Core Engine
│   ├── agents/             # Autonomous Agents (Discovery, Writer, Submitter)
│   ├── api/                # High-frequency REST endpoints
│   ├── models/             # SQLite Mission Database
│   └── services/           # WebSocket and Scheduler Hub
├── frontend/               # React Command Center
│   ├── src/pages/          # Dashboard, Kanban, Intelligence Feed, Analytics
│   └── src/components/     # Premium Glassmorphism UI Components
└── .env                    # Mission Variables (API Keys, Bot Tokens)
```

## 🛠 Setup & Launch

1. **Clone the Manifest**:
   ```bash
   git clone https://github.com/Daaksh05/Agentic-Job-Mission-Control.git
   cd Agentic-Job-Mission-Control
   ```

2. **Fuel the Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   python3 main.py
   ```

3. **Ignite the Frontend**:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

## 🌍 Market Strategy
The agent prioritizes the **French Tech Market (98.2% efficiency)** while concurrently monitoring secondary targets in the **UK, US, Germany, and Canada**. It automatically handles language localization and formal tone requirements for European institutions.

### 🚧 Current Roadmap
- [x] Phase 1: High-speed Discovery on FR/Global boards
- [x] Phase 2: AI Document Tailoring (FR/EN)
- [x] Phase 3: Headless browser automation (Lever/Greenhouse)
- [ ] Phase 4: LinkedIn Easy Apply autonomous handler (In Progress)
- [ ] Phase 5: Deep-tier intelligence for interview coaching

---
*Created by [Daakshayani Senthilkumar](https://ai-engineer-portfolio-jj7pvdk9v-daaksh05s-projects.vercel.app)*
