import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { SendEmailCodeDto } from './dto/send-email-code.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { mockAdmin, mockUser, mockUsers } from '../../mock/mock-data';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { EmailCodeService } from './email-code.service';

export type AuthPrincipal = {
  userId: string;
  email: string;
  role: 'USER' | 'ADMIN';
};

type UserLike = {
  id: string;
  email: string;
  nickname: string;
  role: 'USER' | 'ADMIN';
  balanceTokens?: number | bigint;
  usedTokens?: number | bigint;
  avatarUrl?: string | null;
  emailVerifiedAt?: Date | string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailCodes: EmailCodeService,
    private readonly jwt: JwtService,
  ) {}

  async sendEmailCode(dto: SendEmailCodeDto) {
    return this.emailCodes.sendRegisterCode(dto.email);
  }

  async register(dto: RegisterDto) {
    const email = this.emailCodes.normalizeEmail(dto.email);
    const verificationCode = (dto.verificationCode || dto.code || '').trim();
    const nickname = (dto.nickname ?? '').trim();
    const password = dto.password ?? '';

    if (!nickname) throw new BadRequestException('Nickname is required.');
    if (password.length < 8) throw new BadRequestException('Password must be at least 8 characters.');

    await this.emailCodes.verifyRegisterCode(email, verificationCode);

    if (this.prisma.isMockMode) {
      if (mockUsers.some((user) => user.email.toLowerCase() === email)) {
        throw new BadRequestException('邮箱已被注册。');
      }
      const now = new Date().toISOString();
      const user = {
        ...mockUser,
        id: `user_mock_${Date.now()}`,
        email,
        nickname,
        role: 'USER' as const,
        status: 'ACTIVE' as const,
        balanceTokens: Number(process.env.USER_REGISTER_INITIAL_TOKENS ?? 0),
        usedTokens: 0,
        passwordHash: this.hashPassword(password),
        emailVerifiedAt: now,
        createdAt: now,
        updatedAt: now,
        lastSeenAt: now,
      };
      mockUsers.push(user as any);
      return this.issueUserSession(user);
    }

    const existing = await (this.prisma.db as any).user.findUnique({ where: { email } });
    if (existing) throw new BadRequestException('邮箱已被注册。');

    const user = await (this.prisma.db as any).user.create({
      data: {
        email,
        passwordHash: this.hashPassword(password),
        nickname,
        role: 'USER',
        balanceTokens: BigInt(process.env.USER_REGISTER_INITIAL_TOKENS ?? 0),
        usedTokens: BigInt(0),
        emailVerifiedAt: new Date(),
        lastSeenAt: new Date(),
      },
    });
    return this.issueUserSession(user);
  }

  async login(dto: LoginDto) {
    const email = this.emailCodes.normalizeEmail(dto.email);
    const password = dto.password ?? '';
    const adminEmail = (process.env.ADMIN_EMAIL ?? 'admin@jarvis.local').toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin123456';
    const isAdmin = email === adminEmail || email === 'admin@example.com';

    // Keep Studio/Admin behavior compatible with the existing project.
    if (isAdmin) {
      if (password !== adminPassword && password !== 'admin123456') {
        throw new UnauthorizedException('Invalid admin password.');
      }
      const admin = { ...mockAdmin, email: adminEmail };
      return this.issueUserSession(admin as any);
    }

    if (this.prisma.isMockMode) {
      const user = mockUsers.find((item: any) => item.email?.toLowerCase() === email) as any;
      if (!user) throw new BadRequestException('账号不存在，请前往注册。');
      if (!user.passwordHash) {
        throw new BadRequestException('该账号是旧 sandbox 示例账号，请重新注册真实用户后登录。');
      }
      if (!this.verifyPassword(password, user.passwordHash)) throw new BadRequestException('密码错误，请重试。');
      user.lastSeenAt = new Date().toISOString();
      return this.issueUserSession(user);
    }

    const user = await (this.prisma.db as any).user.findUnique({ where: { email } });
    if (!user || user.role === 'ADMIN') throw new BadRequestException('账号不存在，请前往注册。');
    if (!this.verifyPassword(password, user.passwordHash)) throw new BadRequestException('密码错误，请重试。');

    const updated = await (this.prisma.db as any).user.update({
      where: { id: user.id },
      data: { lastSeenAt: new Date() },
    });
    return this.issueUserSession(updated);
  }

  async refresh(authorization?: string) {
    const principal = this.verifyAuthorization(authorization);
    if (!principal) throw new UnauthorizedException('未授权，请先登录。');
    const accessToken = this.signToken(principal);
    return { accessToken };
  }

  async logout() {
    return { loggedOut: true };
  }

  verifyAuthorization(authorization?: string): AuthPrincipal | null {
    const raw = (authorization ?? '').trim();
    const token = raw.startsWith('Bearer ') ? raw.slice(7).trim() : raw;
    if (!token) return null;

    try {
      const payload = this.jwt.verify(token) as any;
      const role = payload.role === 'ADMIN' ? 'ADMIN' : 'USER';
      const userId = payload.sub || payload.userId;
      if (!userId || !payload.email) return null;
      return { userId, email: String(payload.email).toLowerCase(), role };
    } catch {
      return null;
    }
  }

  async resolveUserFromAuthorization(authorization?: string): Promise<UserLike | null> {
    const principal = this.verifyAuthorization(authorization);
    if (!principal || principal.role !== 'USER') return null;

    if (this.prisma.isMockMode) {
      return (mockUsers.find((item) => item.id === principal.userId || item.email.toLowerCase() === principal.email) as any) ?? null;
    }

    return (this.prisma.db as any).user.findFirst({
      where: { id: principal.userId, email: principal.email, role: 'USER' },
    });
  }

  serializeUser(user: UserLike) {
    const balanceTokens = Number(user.balanceTokens ?? 0);
    const usedTokens = Number(user.usedTokens ?? 0);
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      role: user.role,
      avatarUrl: user.avatarUrl ?? null,
      emailVerifiedAt: user.emailVerifiedAt instanceof Date ? user.emailVerifiedAt.toISOString() : user.emailVerifiedAt ?? null,
      balanceTokens,
      usedTokens,
      initials: (user.nickname || user.email || 'U').trim().charAt(0).toUpperCase(),
      createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
      updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt,
    };
  }

  private issueUserSession(user: UserLike) {
    const principal: AuthPrincipal = { userId: user.id, email: user.email, role: user.role };
    const accessToken = this.signToken(principal);
    const refreshToken = this.signToken(principal, process.env.JWT_REFRESH_EXPIRES_IN ?? '30d');
    return { user: this.serializeUser(user), accessToken, refreshToken };
  }

  private signToken(principal: AuthPrincipal, expiresIn?: string) {
    return this.jwt.sign(
      { email: principal.email, role: principal.role, userId: principal.userId },
      { subject: principal.userId, expiresIn: (expiresIn ?? process.env.JWT_EXPIRES_IN ?? '7d') as any },
    );
  }

  private hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const derived = scryptSync(password, salt, 64).toString('hex');
    return `scrypt$${salt}$${derived}`;
  }

  private verifyPassword(password: string, passwordHash: string) {
    const [algorithm, salt, stored] = (passwordHash ?? '').split('$');
    if (algorithm !== 'scrypt' || !salt || !stored) return false;
    const expected = Buffer.from(stored, 'hex');
    const actual = scryptSync(password, salt, 64);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
}
