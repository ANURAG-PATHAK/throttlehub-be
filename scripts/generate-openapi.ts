import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { format } from 'prettier';
import YAML from 'yaml';

import { buildApp } from '../src/app.js';

const outputPath = resolve(process.cwd(), 'docs/api/openapi.yaml');

function ensureOpenApiEnvDefaults() {
  process.env.DATABASE_URL ??= 'postgresql://user:password@localhost:5432/throttlehub';
  process.env.JWT_ACCESS_SECRET ??= 'openapi_access_secret_123456';
  process.env.JWT_REFRESH_SECRET ??= 'openapi_refresh_secret_123456';
  process.env.JWT_ACCESS_EXPIRES_IN ??= '15m';
  process.env.JWT_REFRESH_EXPIRES_IN ??= '30d';
  process.env.CORS_ORIGIN ??= '*';
  process.env.HOST ??= '0.0.0.0';
  process.env.PORT ??= '3000';
  process.env.NODE_ENV ??= 'development';
}

async function generateOpenApi() {
  ensureOpenApiEnvDefaults();

  const app = await buildApp({ logger: false });
  await app.ready();

  const spec = app.swagger();
  const yaml = YAML.stringify(spec);
  const formattedYaml = await format(yaml, { parser: 'yaml', singleQuote: true });

  await mkdir(resolve(process.cwd(), 'docs/api'), { recursive: true });
  await writeFile(outputPath, formattedYaml, 'utf8');

  await app.close();

  console.log(`OpenAPI written to ${outputPath}`);
}

await generateOpenApi();
