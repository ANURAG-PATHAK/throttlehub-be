# ThrottleHub Backend — Agent Guidelines (`throttlehub-be`)

## Build & Development Commands

```bash
pnpm dev              # Hot-reload dev server (tsx watch --env-file=.env)
pnpm build            # TypeScript compilation (tsc)
pnpm start            # Run compiled dist/server.js
pnpm typecheck        # Type check without emitting
pnpm lint             # ESLint + Prettier check
pnpm format           # ESLint fix + Prettier write
```

**Prisma:**

```bash
pnpm prisma:generate  # Regenerate Prisma client from schema
pnpm prisma:push      # Schema-sync to DB (dev only — no migration file created)
```

**OpenAPI:**

```bash
pnpm openapi:generate # Generate docs/api/openapi.yaml from live route schemas
pnpm openapi:check    # Generate + diff — fails if committed YAML is out of sync
```

**Pre-PR quality gates** (all must pass):

```bash
pnpm typecheck && pnpm lint && pnpm openapi:check
```

Verify API changes with at least one real request — Swagger UI at `http://localhost:3000/documentation`.

---

## Architecture

**Stack:** Fastify 5, ESM TypeScript (strict), Prisma 7 + PostgreSQL (NeonDB), Nodemailer (SMTP OTP delivery).

### Plugin Registration Order (fixed in `src/app.ts`)

1. `envPlugin` — validates env via TypeBox schema (`src/config/env.ts`); decorates `app.config`
2. `sensible` — Fastify error helpers
3. `swaggerPlugin` — OpenAPI spec generation
4. `securityPlugin` — CORS, Helmet, rate limiting
5. `prismaPlugin` — `PrismaClient` via `@prisma/adapter-pg` (raw `pg.Pool`); decorates `app.db`
6. `mailerPlugin` — Nodemailer SMTP transport; decorates `app.mailer`
7. `authPlugin` — `@fastify/jwt`; decorates `app.authenticate`

This order is load-bearing — later plugins depend on earlier ones being registered.

### Layered Flow

```
Route handler (schema validation, auth hook)
  → Service (business logic, no Fastify types)
    → PrismaClient (db.modelName.operation())
```

Handlers are thin — no business logic, no catch blocks that reshape errors. Services are framework-independent.

### Module Structure

Feature code lives in `src/modules/<domain>/`:

- `routes.ts` — Fastify route registration, thin handlers
- `schemas.ts` — TypeBox request/response schemas (source of truth for validation + OpenAPI)
- `service.ts` — Business logic class

### Key Files

- `src/server.ts` — server init and startup
- `src/app.ts` — composition root; plugin + route registration
- `src/config/env.ts` — TypeBox env schema and `loadAppConfig()`
- `src/config/logger.ts` — Pino logger options (pretty in dev, JSON in prod)
- `prisma/schema.prisma` — DB schema (snake_case via `@@map`/`@map`)
- `prisma.config.ts` — Prisma v7 CLI config; provides `DATABASE_URL` via `dotenv` for `prisma db push` / `prisma generate`

---

## Key Patterns

### Logging

Fastify uses **Pino** internally. Logger options live in `src/config/logger.ts`:

- **Development** (`NODE_ENV !== 'production'`): `pino-pretty` transport, `debug` level, colorized, time-only timestamp.
- **Production**: JSON output, `info` level.

Never use `console.log` — always use `request.log` in handlers or `app.log` in plugins.

### Prisma v7 + Driver Adapter

Runtime: `PrismaClient` is initialized with `@prisma/adapter-pg` (raw `pg.Pool`) — **not** the default Prisma connection string. See `src/plugins/prisma.ts`.

CLI (migrate/push): `prisma.config.ts` at the backend root provides the `DATABASE_URL` via `dotenv` for the Prisma CLI (`prisma db push`, `prisma generate`). The schema has **no `url` field** in the datasource block — this is intentional for Prisma v7.

### Auth Flow

Passwordless email OTP only. No passwords stored.

```
POST /api/v1/auth/request-otp  →  generate OTP, hash (SHA-256), store in otp_challenges, email via SMTP
POST /api/v1/auth/verify-otp   →  validate hash, mark consumed, upsert user, issue JWT access + refresh tokens
POST /api/v1/auth/refresh       →  rotate refresh session, issue new token pair
POST /api/v1/auth/logout        →  revoke refresh session
```

JWT: access token (short-lived) + rotating refresh token tracked in `refresh_sessions` table.

### OpenAPI Drift Check

`pnpm openapi:check` boots the app headlessly, extracts the Swagger JSON, writes `docs/api/openapi.yaml`, then runs `git diff --exit-code`. **Always run `pnpm openapi:generate` after any route schema change.**

### Environment Config

All env vars are validated at startup via TypeBox in `src/config/env.ts`. Required vars:
`DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `SMTP_USER`, `SMTP_PASSWORD`

---

## TypeScript Conventions

- ESM — all imports use `.js` extensions (even for `.ts` source files)
- `import type` for type-only imports
- No `any`, no explicit `unknown` in application modules
- Path alias: `@/*` → `src/*` (configured in `tsconfig.json`)

---

## Data Model

`prisma/schema.prisma`. Key conventions:

- Auto-increment integer IDs
- All table/column names are `snake_case` via `@@map` / `@map`
- `createdAt` on every model

---

## Commit Style

Conventional Commits preferred. Keep commits focused on one concern (schema, plugin, service, route).
