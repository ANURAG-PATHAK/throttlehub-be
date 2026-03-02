import type { PrismaClient, User } from '@prisma/client';
import { createHash, randomInt, randomUUID } from 'node:crypto';
import type { FastifyBaseLogger } from 'fastify';

import type { AppConfig } from '@/config/env.js';
import type { OtpDelivery } from '@/modules/auth/delivery.js';

type RequestOtpInput = {
  email: string;
};

type VerifyOtpInput = {
  email: string;
  otp: string;
  fullName?: string;
  username?: string;
};

type SessionTokens = {
  accessToken: string;
  refreshToken: string;
};

type SignToken = (payload: object, options: { expiresIn: string }) => Promise<string>;
type VerifyToken = <TPayload extends object>(token: string) => Promise<TPayload>;

type RefreshPayload = {
  sub: string;
  tokenType: 'refresh';
  sessionId: string;
};

export class AuthService {
  constructor(
    private readonly db: PrismaClient,
    private readonly signToken: SignToken,
    private readonly verifyToken: VerifyToken,
    private readonly config: AppConfig,
    private readonly otpDelivery: OtpDelivery,
    private readonly log: FastifyBaseLogger
  ) {}

  async requestOtp(input: RequestOtpInput) {
    const normalizedEmail = input.email.toLowerCase();
    const otp = this.generateOtp();
    const codeHash = this.hashOtp(otp);
    const expiresAt = new Date(Date.now() + this.config.OTP_EXPIRES_MINUTES * 60_000);

    await this.db.otpChallenge.create({
      data: {
        email: normalizedEmail,
        codeHash,
        expiresAt
      }
    });

    // Fire-and-forget: respond immediately after DB write; email delivery runs in background
    void this.otpDelivery
      .sendOtp({
        email: normalizedEmail,
        otp,
        expiresInMinutes: this.config.OTP_EXPIRES_MINUTES
      })
      .catch((err) => {
        this.log.error({ email: normalizedEmail, err }, 'OTP email delivery failed');
      });

    return {
      message: 'OTP sent to your email address',
      expiresInMinutes: this.config.OTP_EXPIRES_MINUTES
    };
  }

  async verifyOtp(input: VerifyOtpInput) {
    const normalizedEmail = input.email.toLowerCase();

    const challenge = await this.db.otpChallenge.findFirst({
      where: {
        email: normalizedEmail,
        consumedAt: null,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!challenge) {
      throw new Error('OTP challenge not found or expired');
    }

    const isValidOtp = this.hashOtp(input.otp) === challenge.codeHash;

    if (!isValidOtp) {
      await this.db.otpChallenge.update({
        where: { id: challenge.id },
        data: {
          attempts: {
            increment: 1
          }
        }
      });
      throw new Error('Invalid OTP');
    }

    await this.db.otpChallenge.update({
      where: { id: challenge.id },
      data: {
        consumedAt: new Date()
      }
    });

    let user = await this.db.user.findUnique({
      where: {
        email: normalizedEmail
      }
    });

    if (!user) {
      const fullName = input.fullName?.trim() || 'Moto Rider';
      const requestedUsername = input.username?.trim() || normalizedEmail.split('@')[0] || 'rider';
      const username = await this.reserveUniqueUsername(requestedUsername);

      user = await this.db.user.create({
        data: {
          email: normalizedEmail,
          username,
          fullName
        }
      });
    }

    const tokens = await this.issueSessionTokens(user);

    return {
      ...tokens,
      user: this.serializeUser(user)
    };
  }

  async refresh(refreshToken: string) {
    const payload = await this.verifyToken<RefreshPayload>(refreshToken);

    if (payload.tokenType !== 'refresh' || !payload.sessionId) {
      throw new Error('Invalid refresh token');
    }

    const session = await this.db.refreshSession.findUnique({
      where: {
        tokenId: payload.sessionId
      },
      include: {
        user: true
      }
    });

    if (!session || session.revoked) {
      throw new Error('Refresh session is not valid');
    }

    await this.db.refreshSession.update({
      where: { id: session.id },
      data: {
        revoked: true,
        revokedAt: new Date()
      }
    });

    const tokens = await this.issueSessionTokens(session.user);

    return {
      ...tokens,
      user: this.serializeUser(session.user)
    };
  }

  async logout(refreshToken: string) {
    const payload = await this.verifyToken<RefreshPayload>(refreshToken);

    if (payload.tokenType !== 'refresh' || !payload.sessionId) {
      throw new Error('Invalid refresh token');
    }

    const session = await this.db.refreshSession.findUnique({
      where: {
        tokenId: payload.sessionId
      }
    });

    if (!session || session.revoked) {
      return {
        message: 'Session already revoked'
      };
    }

    await this.db.refreshSession.update({
      where: { id: session.id },
      data: {
        revoked: true,
        revokedAt: new Date()
      }
    });

    return {
      message: 'Logged out successfully'
    };
  }

  private async issueSessionTokens(user: User): Promise<SessionTokens> {
    const sessionId = randomUUID();

    await this.db.refreshSession.create({
      data: {
        userId: user.id,
        tokenId: sessionId
      }
    });

    const accessToken = await this.signToken(
      {
        sub: String(user.id),
        email: user.email,
        tokenType: 'access'
      },
      {
        expiresIn: this.config.JWT_ACCESS_EXPIRES_IN
      }
    );

    const refreshToken = await this.signToken(
      {
        sub: String(user.id),
        email: user.email,
        tokenType: 'refresh',
        sessionId
      },
      {
        expiresIn: this.config.JWT_REFRESH_EXPIRES_IN
      }
    );

    return {
      accessToken,
      refreshToken
    };
  }

  private hashOtp(otp: string): string {
    return createHash('sha256').update(otp).digest('hex');
  }

  private generateOtp(): string {
    return String(randomInt(100000, 1_000_000));
  }

  private async reserveUniqueUsername(candidate: string): Promise<string> {
    const base = candidate
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 24);

    const safeBase = base.length >= 3 ? base : 'rider';

    for (let attempt = 0; attempt < 50; attempt += 1) {
      const suffix = attempt === 0 ? '' : `_${attempt}`;
      const username = `${safeBase}${suffix}`.slice(0, 30);
      const exists = await this.db.user.findUnique({ where: { username } });

      if (!exists) {
        return username;
      }
    }

    return `rider_${randomInt(1000, 9999)}`;
  }

  private serializeUser(user: User) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName
    };
  }
}
