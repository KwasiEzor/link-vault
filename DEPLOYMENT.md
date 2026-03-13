# LinkVault: Deployment Guide 🚀

## 1. Database Setup (Supabase)
The project is configured to use **Supabase (PostgreSQL)** for production.

1.  Create a new project on [Supabase](https://supabase.com/).
2.  Go to **Project Settings > Database**.
3.  Under **Connection string**, select **Prisma** and copy the URL.
    - **Transaction Mode (Recommended):** Use port `6543` with `?pgbouncer=true`.
    - **Session Mode:** Use port `5432`.
4.  Ensure your password is correct. If it contains special characters, you must percent-encode them.

## 2. Frontend & API (Vercel)
1. Push your code to a GitHub repository.
2. Connect the repository to [Vercel](https://vercel.com/).
3. In **Project Settings > Environment Variables**, add:
   - `DATABASE_URL`: Your Supabase connection string.
   - `AUTH_SECRET`: Generate with `npx auth secret`.
   - `AUTH_URL`: Your canonical deployment URL.

## 3. Database Migration
To initialize your Supabase schema:
```bash
npx prisma migrate dev --name init-supabase
```

## 4. Why Supabase?
- **Global Availability:** High-performance infrastructure on AWS.
- **Connection Pooling:** Integrated Supavisor/PgBouncer for serverless scalability.
- **WASM Engine:** Using Prisma 6.x ensures compatibility with modern edge and serverless runtimes.
