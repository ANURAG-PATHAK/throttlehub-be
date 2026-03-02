import fp from 'fastify-plugin';

import { loadAppConfig } from '@/config/env.js';

export const envPlugin = fp(async (app) => {
  const config = loadAppConfig(process.env);
  app.decorate('config', config);
});
