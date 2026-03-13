# LinkVault: Core Mandates

## 🚀 Engineering Standards
- **Strict TDD:** Every feature, bug fix, or refactor MUST start with a failing test case (Vitest for logic/actions, Playwright/Cypress for E2E).
- **Zod-First Validation:** No data enters a Server Action or a form without a Zod schema validation.
- **Type Safety:** Maintain 100% TypeScript coverage. Avoid `any` at all costs.
- **Performance:** Use `next/image` for all external image assets. Implement component-level skeleton loaders for data fetching.
- **Security:** Never log or expose secrets. Use `@auth/middleware` for all `/admin` routes.

## 🎨 Design Principles
- **Aesthetic Consistency:** Adhere to the current "premium/glassmorphic" dark theme.
- **Micro-interactions:** Use `framer-motion` for meaningful UI transitions, not just decoration.
- **Accessibility:** Ensure all interactive elements have proper ARIA labels and keyboard navigation.

## 🛠 Tooling
- **Testing:** Vitest, React Testing Library.
- **Forms:** React Hook Form + Zod.
- **Database:** Prisma (SQLite for local, PostgreSQL for production).
- **Deployment:** Vercel (Frontend/API), Railway/Neon (Database).
