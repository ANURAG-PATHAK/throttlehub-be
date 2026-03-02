import sensible from '@fastify/sensible';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import Fastify from 'fastify';
import type { FastifyBaseLogger, FastifyInstance } from 'fastify';

import { loggerOptions } from '@/config/logger.js';
import { authPlugin } from '@/plugins/auth.js';
import { envPlugin } from '@/plugins/env.js';
import { mailerPlugin } from '@/plugins/mailer.js';
import { prismaPlugin } from '@/plugins/prisma.js';
import { securityPlugin } from '@/plugins/security.js';
import { swaggerPlugin } from '@/plugins/swagger.js';
import { apiRoutes } from '@/routes/index.js';

export type BuildAppOptions = {
  logger?: FastifyBaseLogger | boolean;
};

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logger ?? loggerOptions
  }).withTypeProvider<TypeBoxTypeProvider>();

  await app.register(envPlugin);
  await app.register(sensible);
  await app.register(swaggerPlugin);
  await app.register(securityPlugin);
  await app.register(prismaPlugin);
  await app.register(mailerPlugin);
  await app.register(authPlugin);

  app.setSchemaErrorFormatter((errors, dataVar) => {
    const first = errors[0];
    const field = first?.instancePath?.replace(/^\//, '') || dataVar;
    const msg = first?.message ?? 'Validation failed';
    return new Error(`${field}: ${msg}`);
  });

  await app.register(apiRoutes, { prefix: '/api/v1' });

  return app;
}
