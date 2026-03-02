import type { PrismaClient } from '@prisma/client';
import type { Transporter } from 'nodemailer';

import type { AppConfig } from '@/config/env.js';

declare module 'fastify' {
  interface FastifyInstance {
    config: AppConfig;
    db: PrismaClient;
    mailer: Transporter;
    authenticate: (request: import('fastify').FastifyRequest) => Promise<void>;
  }
}
