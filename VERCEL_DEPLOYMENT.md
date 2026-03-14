# 🚀 Vercel Deployment Guide: LinkVault

Follow these steps to deploy LinkVault to Vercel with a PostgreSQL database and Inngest background tasks.

## 1. Database Setup (Neon / Vercel Postgres)
LinkVault now uses **PostgreSQL** for production. We recommend using [Neon](https://neon.tech) or Vercel Postgres.

1.  Create a PostgreSQL database.
2.  Copy the **Connection String** (Pooled for `DATABASE_URL`, Direct for `DIRECT_URL`).

## 2. Environment Variables
Add these variables in the **Vercel Dashboard** (Settings > Environment Variables):

### Required for Core Functionality
| Key | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | Pooled Postgres connection string | `postgres://user:pass@ep-pool...` |
| `DIRECT_URL` | Direct Postgres connection string (for migrations) | `postgres://user:pass@ep-direct...` |
| `AUTH_SECRET` | Generate with `npx auth secret` | `32-character-random-string` |
| `AUTH_URL` | Your deployment URL | `https://your-app.vercel.app` |

### Required for Inngest (Background Tasks)
| Key | Description |
| :--- | :--- |
| `INNGEST_EVENT_KEY` | Obtained from Inngest Cloud Dashboard |
| `INNGEST_SIGNING_KEY` | Obtained from Inngest Cloud Dashboard |

### Optional for AI (Can also be set in Admin UI)
| Key | Description |
| :--- | :--- |
| `AI_API_KEY` | Your OpenAI or Groq API Key |
| `AI_BASE_URL` | API Base (e.g., `https://api.openai.com/v1`) |
| `AI_MODEL` | Default model (e.g., `gpt-4o-mini`) |

## 3. Inngest Cloud Integration
Since Vercel is serverless, you need [Inngest Cloud](https://www.inngest.com/) to manage the event queue:

1.  Create a free account on Inngest.
2.  Sync your Vercel deployment URL (e.g., `https://your-app.vercel.app/api/inngest`).
3.  Inngest will automatically discover your functions (`scrape-metadata`, `check-link-health`).

## 4. Deployment Command
Vercel will run `vercel-build` (if present) which we use to keep the DB schema in sync:
`prisma generate && prisma db push --skip-generate && next build`

This ensures the Prisma client is correctly typed for your Postgres schema at runtime.

**Important:** `prisma db push` requires a non-pooled/direct connection. Make sure `DIRECT_URL` is set in Vercel.

---
**Note:** If this is your first time deploying, ensure you run `npx prisma migrate deploy` locally (pointing to your production DB) or add it to your CI/CD to initialize the schema.
