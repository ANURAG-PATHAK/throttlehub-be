import type { Static } from '@sinclair/typebox';
import { Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

export const appEnvSchema = Type.Object({
  NODE_ENV: Type.Union(
    [Type.Literal('development'), Type.Literal('test'), Type.Literal('production')],
    {
      default: 'development'
    }
  ),
  HOST: Type.String({ default: '0.0.0.0' }),
  PORT: Type.Integer({ default: 3000 }),
  DATABASE_URL: Type.String({ minLength: 1 }),
  JWT_ACCESS_SECRET: Type.String({ minLength: 16 }),
  JWT_REFRESH_SECRET: Type.String({ minLength: 16 }),
  JWT_ACCESS_EXPIRES_IN: Type.String({ default: '15m' }),
  JWT_REFRESH_EXPIRES_IN: Type.String({ default: '30d' }),
  OTP_EXPIRES_MINUTES: Type.Integer({ default: 10 }),
  SMTP_HOST: Type.String({ default: 'smtp.gmail.com' }),
  SMTP_PORT: Type.Integer({ default: 587 }),
  SMTP_USER: Type.String({ minLength: 1 }),
  SMTP_PASSWORD: Type.String({ minLength: 1 }),
  AUTH_EMAIL_FROM: Type.String({ default: 'ThrottleHub <noreply@throttlehub.local>' }),
  CORS_ORIGIN: Type.String({ default: '*' })
});

export type AppConfig = Static<typeof appEnvSchema>;

export function loadAppConfig(rawEnv: NodeJS.ProcessEnv): AppConfig {
  const withDefaults = {
    NODE_ENV: rawEnv.NODE_ENV ?? 'development',
    HOST: rawEnv.HOST ?? '0.0.0.0',
    PORT: Number(rawEnv.PORT ?? '3000'),
    DATABASE_URL: rawEnv.DATABASE_URL ?? '',
    JWT_ACCESS_SECRET: rawEnv.JWT_ACCESS_SECRET ?? '',
    JWT_REFRESH_SECRET: rawEnv.JWT_REFRESH_SECRET ?? '',
    JWT_ACCESS_EXPIRES_IN: rawEnv.JWT_ACCESS_EXPIRES_IN ?? '15m',
    JWT_REFRESH_EXPIRES_IN: rawEnv.JWT_REFRESH_EXPIRES_IN ?? '30d',
    OTP_EXPIRES_MINUTES: Number(rawEnv.OTP_EXPIRES_MINUTES ?? '10'),
    SMTP_HOST: rawEnv.SMTP_HOST ?? 'smtp.gmail.com',
    SMTP_PORT: Number(rawEnv.SMTP_PORT ?? '587'),
    SMTP_USER: rawEnv.SMTP_USER ?? '',
    SMTP_PASSWORD: rawEnv.SMTP_PASSWORD ?? '',
    AUTH_EMAIL_FROM: rawEnv.AUTH_EMAIL_FROM ?? 'ThrottleHub <noreply@throttlehub.local>',
    CORS_ORIGIN: rawEnv.CORS_ORIGIN ?? '*'
  };

  if (!Value.Check(appEnvSchema, withDefaults)) {
    throw new Error('Invalid environment configuration. Check .env and .env.example values.');
  }

  return Value.Parse(appEnvSchema, withDefaults);
}
