import { Type } from '@sinclair/typebox';

export const RequestOtpBodySchema = Type.Object({
  email: Type.String({ format: 'email' }),
  fullName: Type.Optional(Type.String({ minLength: 2, maxLength: 100 })),
  username: Type.Optional(Type.String({ minLength: 3, maxLength: 30 }))
});

export const VerifyOtpBodySchema = Type.Object({
  email: Type.String({ format: 'email' }),
  otp: Type.String({ minLength: 6, maxLength: 6 }),
  fullName: Type.Optional(Type.String({ minLength: 2, maxLength: 100 })),
  username: Type.Optional(Type.String({ minLength: 3, maxLength: 30 }))
});

export const RefreshBodySchema = Type.Object({
  refreshToken: Type.String({ minLength: 10 })
});

export const LogoutBodySchema = Type.Object({
  refreshToken: Type.String({ minLength: 10 })
});

export const RequestOtpResponseSchema = Type.Object({
  message: Type.String(),
  expiresInMinutes: Type.Integer()
});

export const LogoutResponseSchema = Type.Object({
  message: Type.String()
});

export const AuthTokenResponseSchema = Type.Object({
  accessToken: Type.String(),
  refreshToken: Type.String(),
  user: Type.Object({
    id: Type.Integer(),
    username: Type.String(),
    email: Type.String({ format: 'email' }),
    fullName: Type.String()
  })
});
