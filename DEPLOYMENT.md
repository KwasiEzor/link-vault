# LinkVault: Deployment Guide 🚀

## 1. Database Setup (Railway / Neon)
Since the local project uses SQLite, I recommend switching to **PostgreSQL** for production.
1. Create a new PostgreSQL database on [Railway](https://railway.app/) or [Neon](https://neon.tech/).
2. Copy the `DATABASE_URL` provided by the host.

## 2. Frontend & API (Vercel)
1. Push your code to a GitHub repository.
2. Connect the repository to [Vercel](https://vercel.com/).
3. In **Project Settings > Environment Variables**, add the following:
   - `DATABASE_URL`: Your production database URL.
   - `AUTH_SECRET`: Generate one using `npx auth secret`.
   - `AUTH_URL`: Your canonical deployment URL (e.g., `https://vault.yourdomain.com`).
4. **Build Settings:**
   - Framework Preset: `Next.js`
   - Build Command: `npx prisma generate && next build`
   - Install Command: `npm install`

## 3. Database Migration
Run the following locally (pointing to your production URL in `.env`) or via a GitHub Action:
```bash
npx prisma migrate deploy
```

## 4. Post-Deployment
- Navigate to `/login` to access the admin panel.
- Ensure your `next.config.ts` allows the domains you plan to curate from (currently set to `**` for maximum flexibility).
