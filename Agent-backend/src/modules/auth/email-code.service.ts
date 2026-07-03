import { BadRequestException, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { randomInt } from 'crypto';
import { CACHE_PORT } from '../../common/tokens';
import { CachePort } from '../../infrastructure/cache/cache.port';

type EmailCodeRecord = {
  code: string;
  attempts: number;
  createdAt: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Injectable()
export class EmailCodeService {
  private readonly ttlSeconds = Number(process.env.AUTH_EMAIL_CODE_TTL_SECONDS ?? 300);
  private readonly cooldownSeconds = Number(process.env.AUTH_EMAIL_CODE_RESEND_COOLDOWN_SECONDS ?? 60);
  private readonly maxAttempts = Number(process.env.AUTH_EMAIL_CODE_MAX_ATTEMPTS ?? 5);

  constructor(@Inject(CACHE_PORT) private readonly cache: CachePort) {}

  async sendRegisterCode(emailInput: string) {
    const email = this.normalizeEmail(emailInput);
    const cooldownKey = this.cooldownKey(email);

    if (await this.cache.exists(cooldownKey)) {
      throw new HttpException({
        message: '验证码请求过于频繁，请稍后再试。',
        retryAfter: this.cooldownSeconds,
      }, HttpStatus.TOO_MANY_REQUESTS);
    }

    const code = randomInt(100000, 1000000).toString();
    await this.cache.set<EmailCodeRecord>(this.codeKey(email), {
      code,
      attempts: 0,
      createdAt: new Date().toISOString(),
    }, this.ttlSeconds);
    await this.cache.set(cooldownKey, true, this.cooldownSeconds);

    const provider = (process.env.EMAIL_PROVIDER ?? process.env.MAIL_PROVIDER ?? 'mock').toLowerCase();
    if (provider !== 'mock') {
      await this.sendEmail(email, code);
      return {
        email,
        ttlSeconds: this.ttlSeconds,
        message: '验证码已发送，请检查邮箱。',
      };
    }

    return {
      email,
      ttlSeconds: this.ttlSeconds,
      message: '验证码已生成，请在 5 分钟内完成注册。',
      mockCode: code,
    };
  }

  async verifyRegisterCode(emailInput: string, codeInput: string) {
    const email = this.normalizeEmail(emailInput);
    const code = (codeInput ?? '').trim();
    const key = this.codeKey(email);
    const record = await this.cache.get<EmailCodeRecord>(key);

    if (!record) throw new BadRequestException('验证码错误或已过期。');
    if (record.attempts >= this.maxAttempts) {
      await this.cache.del(key);
      throw new HttpException('验证码错误次数过多，请重新获取验证码。', HttpStatus.TOO_MANY_REQUESTS);
    }
    if (record.code !== code) {
      await this.cache.set<EmailCodeRecord>(key, { ...record, attempts: record.attempts + 1 }, this.ttlSeconds);
      throw new BadRequestException('验证码错误或已过期。');
    }

    await this.cache.del(key);
    await this.cache.del(this.cooldownKey(email));
    return true;
  }

  private async sendEmail(to: string, code: string) {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? 465);
    const user = process.env.SMTP_USER ?? process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASS ?? process.env.SMTP_PASSWORD ?? process.env.EMAIL_PASS;
    const from = process.env.SMTP_FROM ?? (user ? `"Agent Partner" <${user}>` : undefined);

    if (!host || !user || !pass || !from) {
      throw new BadRequestException('Email provider is not configured. Please set SMTP_HOST, SMTP_USER and SMTP_PASS, or use EMAIL_PROVIDER=mock.');
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from,
      to,
      subject: 'Verify your Agent Partner account',
      html: `
        <div style="padding:20px;border:1px solid #eee;border-radius:12px;font-family:Arial,sans-serif">
          <h2 style="color:#0D21A5;margin:0 0 12px">Agent Partner verification</h2>
          <p>Your registration verification code is:</p>
          <div style="font-size:32px;font-weight:800;color:#0D21A5;margin:16px 0">${code}</div>
          <p style="font-size:12px;color:#888">The code is valid for 5 minutes. Ignore this email if you did not request it.</p>
        </div>
      `,
    });
  }

  normalizeEmail(emailInput: string) {
    const email = (emailInput ?? '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) throw new BadRequestException('邮箱格式不正确。');
    return email;
  }

  private codeKey(email: string) {
    return `auth:register-code:${email}`;
  }

  private cooldownKey(email: string) {
    return `auth:register-code-cooldown:${email}`;
  }
}
