# LinkVault: Deployment Guide 🚀

## 1. Database Setup (Neon)
The project is configured to use **Neon (PostgreSQL)** for production stability.
1. Create a free PostgreSQL database on [Neon](https://neon.tech/).
2. Copy the **Connection String** from the Neon dashboard.
3. Use the `?sslmode=require` parameter in your connection string.

## 2. Frontend & API (Vercel)
1. Push your code to a GitHub repository.
2. Connect the repository to [Vercel](https://vercel.com/).
3. In **Project Settings > Environment Variables**, add:
   - `DATABASE_URL`: Your Neon connection string.
   - `AUTH_SECRET`: Generate with `npx auth secret`.
   - `AUTH_URL`: Your canonical deployment URL (e.g., `https://vault.yourdomain.com`).

## 3. Database Migration
Since we switched to PostgreSQL, you need to initialize your production schema:
```bash
npx prisma migrate dev --name init
```
For subsequent updates in production, use:
```bash
npx prisma migrate deploy
```

## 4. Why Neon?
We use the `@neondatabase/serverless` driver with the `PrismaNeon` adapter to ensure:
- **Connection Pooling:** Built-in to Neon, no need for separate poolers like PgBouncer.
- **WebSocket Transport:** Faster and more reliable connections from Vercel's serverless functions.
- **Autoscaling:** Zero-scale when not in use to save on costs.
