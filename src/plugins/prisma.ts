import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import fp from 'fastify-plugin';
import { Pool } from 'pg';

export const prismaPlugin = fp(async (app) => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is required to initialize Prisma.');
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  app.decorate('db', prisma);

  app.addHook('onClose', async () => {
    await prisma.$disconnect();
    await pool.end();
  });
});
