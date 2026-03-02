import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';

export const healthRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.get(
    '/health',
    {
      schema: {
        tags: ['System'],
        response: {
          200: Type.Object({
            ok: Type.Boolean(),
            status: Type.Literal('up'),
            timestamp: Type.String({ format: 'date-time' })
          })
        }
      }
    },
    async () => {
      return {
        ok: true,
        status: 'up' as const,
        timestamp: new Date().toISOString()
      };
    }
  );
};
