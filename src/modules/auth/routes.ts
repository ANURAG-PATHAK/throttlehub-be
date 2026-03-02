import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import { SmtpOtpDelivery } from '@/modules/auth/delivery.js';
import {
  AuthTokenResponseSchema,
  LogoutBodySchema,
  LogoutResponseSchema,
  RefreshBodySchema,
  RequestOtpBodySchema,
  RequestOtpResponseSchema,
  VerifyOtpBodySchema
} from '@/modules/auth/schemas.js';
import { AuthService } from '@/modules/auth/service.js';
import { ErrorResponseSchema } from '@/modules/shared/schemas.js';

export const authRoutes: FastifyPluginAsyncTypebox = async (app) => {
  const otpDelivery = new SmtpOtpDelivery(app.mailer, app.config.AUTH_EMAIL_FROM);

  const authService = new AuthService(
    app.db,
    async (payload, options) => app.jwt.sign(payload, options),
    async (token) => app.jwt.verify(token),
    app.config,
    otpDelivery,
    app.log
  );

  app.post(
    '/auth/request-otp',
    {
      schema: {
        tags: ['Auth'],
        body: RequestOtpBodySchema,
        response: {
          202: RequestOtpResponseSchema
        }
      }
    },
    async (request, reply) => {
      const result = await authService.requestOtp({
        email: request.body.email
      });
      return reply.code(202).send(result);
    }
  );

  app.post(
    '/auth/verify-otp',
    {
      schema: {
        tags: ['Auth'],
        body: VerifyOtpBodySchema,
        response: {
          200: AuthTokenResponseSchema,
          401: ErrorResponseSchema
        }
      }
    },
    async (request, reply) => {
      try {
        const result = await authService.verifyOtp(request.body);
        return reply.send(result);
      } catch {
        return reply.code(401).send({ message: 'Invalid or expired OTP' });
      }
    }
  );

  app.post(
    '/auth/refresh',
    {
      schema: {
        tags: ['Auth'],
        body: RefreshBodySchema,
        response: {
          200: AuthTokenResponseSchema,
          401: ErrorResponseSchema
        }
      }
    },
    async (request, reply) => {
      try {
        const result = await authService.refresh(request.body.refreshToken);
        return reply.send(result);
      } catch {
        return reply.code(401).send({ message: 'Invalid refresh token' });
      }
    }
  );

  app.post(
    '/auth/logout',
    {
      schema: {
        tags: ['Auth'],
        body: LogoutBodySchema,
        response: {
          200: LogoutResponseSchema,
          401: ErrorResponseSchema
        }
      }
    },
    async (request, reply) => {
      try {
        const result = await authService.logout(request.body.refreshToken);
        return reply.send(result);
      } catch {
        return reply.code(401).send({ message: 'Invalid refresh token' });
      }
    }
  );
};
