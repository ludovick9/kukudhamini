# KukuDhamini

KukuDhamini is a broiler farm management application built with Next.js, TypeScript, Tailwind CSS, PostgreSQL, and Prisma.

## Phase 2 database setup

1. Copy `.env.example` to `.env`.
2. Replace the placeholder `DATABASE_URL` with a real PostgreSQL connection string.
3. Validate the schema:

```bash
npm run db:validate
npm run db:generate
```

4. Apply the initial migration and seed development data:

```bash
npm run db:migrate
npm run db:seed
```

The seed creates one clearly marked demo farm with batches, expenses, feed ledger entries, health tasks, mortality records, sales, and notifications.

Without a configured database URL, the mock fallback is available only in development. Production database-backed routes fail closed and require authentication. Prisma schema validation and client generation do not require a live database.

## Application commands

```bash
npm run dev
npm run lint
npm run build
npm test
npm run test:e2e
```

Authenticated E2E testing requires a separate PostgreSQL database configured as `TEST_DATABASE_URL`; it must never equal `DATABASE_URL`. The E2E command starts an isolated test server on port 3100 and skips safely when no test database is configured. Keep generated `.next` caches on a drive with sufficient free space; cache exhaustion is an environment issue, not an application data issue.

The application uses Tailwind CSS v4's `@theme` directive. VS Code's CSS validator does not recognize that directive by default, so `.vscode/settings.json` disables only the false-positive unknown-at-rule diagnostic.
