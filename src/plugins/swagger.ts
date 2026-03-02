import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import fp from 'fastify-plugin';

export const swaggerPlugin = fp(async (app) => {
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'ThrottleHub API',
        description: 'ThrottleHub backend API contract',
        version: '0.1.0'
      },
      servers: [{ url: '/api/v1' }],
      tags: [
        { name: 'System', description: 'Health and system endpoints' },
        { name: 'Auth', description: 'Authentication and session endpoints' }
      ]
    }
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs'
  });
});
