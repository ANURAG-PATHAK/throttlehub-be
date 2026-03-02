import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import type { FastifyPluginAsync } from 'fastify';

export const securityPlugin: FastifyPluginAsync = async (app) => {
  await app.register(cors, {
    origin: app.config.CORS_ORIGIN === '*' ? true : app.config.CORS_ORIGIN,
    credentials: true
  });

  await app.register(helmet);

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute'
  });
};
