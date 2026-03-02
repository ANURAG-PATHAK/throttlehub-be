import type { Transporter } from 'nodemailer';

export type OtpDeliveryPayload = {
  email: string;
  otp: string;
  expiresInMinutes: number;
};

export type OtpDelivery = {
  sendOtp(payload: OtpDeliveryPayload): Promise<void>;
};

export class ConsoleOtpDelivery implements OtpDelivery {
  async sendOtp(payload: OtpDeliveryPayload): Promise<void> {
    console.log(
      `[OTP Delivery] email=${payload.email} otp=${payload.otp} expiresInMinutes=${payload.expiresInMinutes}`
    );
  }
}

export class SmtpOtpDelivery implements OtpDelivery {
  constructor(
    private readonly transporter: Transporter,
    private readonly from: string
  ) {}

  async sendOtp(payload: OtpDeliveryPayload): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: payload.email,
      subject: 'Your ThrottleHub verification code',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #111; margin-bottom: 8px;">ThrottleHub</h2>
          <p style="color: #555; font-size: 15px;">
            Your verification code is:
          </p>
          <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #111; margin: 16px 0;">
            ${payload.otp}
          </p>
          <p style="color: #888; font-size: 13px;">
            This code expires in ${String(payload.expiresInMinutes)} minutes. If you did not request this, you can safely ignore this email.
          </p>
        </div>
      `
    });
  }
}
