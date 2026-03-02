import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';

type AccessPayload = {
  sub: string;
  tokenType: 'access';
};

export const userRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.get(
    '/users/me',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['Auth'],
        response: {
          200: Type.Object({
            id: Type.Integer(),
            username: Type.String(),
            email: Type.String({ format: 'email' }),
            fullName: Type.String(),
            bio: Type.Optional(Type.String())
          }),
          404: Type.Object({ message: Type.String() })
        }
      }
    },
    async (request, reply) => {
      const tokenPayload = await request.jwtVerify<AccessPayload>();
      const userId = Number(tokenPayload.sub);

      const user = await app.db.user.findUnique({
        where: {
          id: userId
        }
      });

      if (!user) {
        return reply.code(404).send({ message: 'User not found' });
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        ...(user.bio ? { bio: user.bio } : {})
      };
    }
  );
};
