import nodemailer from 'nodemailer';
import fp from 'fastify-plugin';

export const mailerPlugin = fp(async (app) => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = app.config;

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false,
    requireTLS: true,
    pool: true,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD
    },
    tls: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true
    }
  });

  await transporter.verify();
  app.log.info('SMTP transport verified');

  app.decorate('mailer', transporter);

  app.addHook('onClose', async () => {
    transporter.close();
  });
});
