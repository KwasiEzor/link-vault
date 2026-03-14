# 🏦 LinkVault | Elite Visual Curation Platform

LinkVault is a premium, high-performance visual web bookmarking and curation platform built for power users. It transforms messy URLs into a beautiful, organized knowledge vault using background automation and AI intelligence.

## ✨ High-Level Features

### 🤖 Autonomous AI Curation
*   **Intelligent Enrichment**: Automatically generates professional summaries and categorizes assets using LLMs (OpenAI/Groq).
*   **Curator's Lab**: A dedicated "Human-in-the-loop" interface to review, compare, and approve AI-powered refinements.
*   **Background Workflows**: Powered by **Inngest** for resilient, event-driven metadata scraping and processing.

### 📊 Professional Analytics
*   **Real-time Tracking**: Monitor visitor engagement with precise click tracking.
*   **Deep Insights**: Interactive charts showing 7-day progression, device distribution (Mobile/Desktop), and top traffic sources.
*   **Geographic Intelligence**: Capture visitor locations via Edge headers for global reach visualization.

### ⌨️ Power User UX
*   **Spotlight Command Palette (⌘+K)**: Instant global search, navigation, and quick actions from anywhere in the app.
*   **Premium Glassmorphic UI**: High-end aesthetic with smooth Framer Motion transitions and Radix UI primitives.
*   **Near-Instant Creation**: Asynchronous processing ensures adding a link is instantaneous for the user.

### 🛡️ Production Resilience
*   **Link Health Monitor**: Automatic background pings to flag broken or dead links in your vault.
*   **Hydration-Proof SSR**: Optimized for Next.js 15 with zero hydration mismatches.
*   **Strict Security**: Zod-validated server actions, session-scoped data access, and rate-limiting.

## 🛠 Tech Stack

*   **Framework**: Next.js 15 (App Router)
*   **Language**: TypeScript (100% Coverage)
*   **Database**: Prisma ORM (PostgreSQL)
*   **Styling**: Tailwind CSS 4 + Framer Motion
*   **Automation**: Inngest (Background Jobs)
*   **AI**: OpenAI SDK (Compatible with Groq/Mistral)
*   **Analytics**: Recharts

## 🚀 Getting Started

1.  **Clone & Install**:
    ```bash
    git clone https://github.com/KwasiEzor/link-vault.git
    npm install
    ```

2.  **Environment Setup**:
    Create a `.env` file with:
    ```env
    # PostgreSQL connection (pooled / normal)
    DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?schema=public"

    # Direct (non-pooled) connection used by migrations
    DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/DB?schema=public"

    # Auth.js / NextAuth v5
    AUTH_SECRET="your-secret"

    # Optional (can also be set in Admin UI)
    AI_API_KEY="your-api-key"
    ```

3.  **Database Sync**:
    ```bash
    npx prisma migrate dev
    ```

4.  **Run Development**:
    ```bash
    npm run dev           # Main App
    npm run dev:inngest    # Background Worker UI
    ```

## 🏁 Progress Tracker
Detailed implementation milestones can be found in [PROGRESS.md](./PROGRESS.md).

---
Built with 💎 for curated excellence.
