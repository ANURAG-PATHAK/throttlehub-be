import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import { authRoutes } from '@/modules/auth/routes.js';
import { healthRoutes } from '@/modules/health/routes.js';
import { userRoutes } from '@/modules/users/routes.js';

export const apiRoutes: FastifyPluginAsyncTypebox = async (app) => {
  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(userRoutes);
};
