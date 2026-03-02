import fastifyJwt from '@fastify/jwt';
import fp from 'fastify-plugin';

export const authPlugin = fp(async (app) => {
  await app.register(fastifyJwt, {
    secret: app.config.JWT_ACCESS_SECRET
  });

  app.decorate('authenticate', async (request) => {
    await request.jwtVerify();
  });
});
