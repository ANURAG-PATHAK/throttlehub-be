# API Documentation

## Source of truth

- Route schemas in `src/modules/**/routes.ts` are the source of truth.
- OpenAPI is generated from Fastify schema metadata.

## Commands

- Generate OpenAPI: `pnpm openapi:generate`
- Verify no OpenAPI drift: `pnpm openapi:check`

## Output

- OpenAPI spec: `docs/api/openapi.yaml`
