# throttlehub-be

Fastify + TypeScript backend scaffold for ThrottleHub.

## Stack

- Fastify 5
- TypeBox route schemas
- Prisma ORM (Neon/PostgreSQL)
- JWT auth (access + rotating refresh)
- OpenAPI generation from route schemas

## Commands

- `pnpm dev`
- `pnpm build`
- `pnpm start`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm format`
- `pnpm prisma:generate`
- `pnpm prisma:push`
- `pnpm openapi:generate`
- `pnpm openapi:check`

## Environment

Copy `.env.example` to `.env` and fill values.
