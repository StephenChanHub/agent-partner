import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SendEmailCodeDto } from './dto/send-email-code.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { mockAdmin, mockUser, mockUsers } from '../../mock/mock-data';

@Injectable()
export class AuthService {
  async sendEmailCode(dto: SendEmailCodeDto) {
    return { email: dto.email, ttlSeconds: 300, mockCode: '123456', message: 'Mock email code sent.' };
  }

  async register(dto: RegisterDto) {
    const user = { ...mockUser, id: `user_mock_${Date.now()}`, email: dto.email, nickname: dto.nickname };
    mockUsers.push(user as any);
    return { user, accessToken: 'mock_access_token_user', refreshToken: 'mock_refresh_token_user' };
  }

  async login(dto: LoginDto) {
    const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@jarvis.local';
    const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin123456';
    const isAdmin = dto.email === adminEmail || dto.email === 'admin@example.com';

    if (isAdmin) {
      if (process.env.NODE_ENV === 'sandbox' && dto.password && dto.password !== adminPassword && dto.password !== 'admin123456') {
        throw new UnauthorizedException('Invalid sandbox admin password.');
      }
      return {
        user: { ...mockAdmin, email: adminEmail },
        accessToken: 'mock_access_token_admin',
        refreshToken: 'mock_refresh_token_admin',
      };
    }

    const user = mockUsers.find((item) => item.email === dto.email) ?? { ...mockUser, email: dto.email };
    return { user, accessToken: 'mock_access_token_user', refreshToken: 'mock_refresh_token_user' };
  }

  async refresh() {
    return { accessToken: 'mock_access_token_refreshed' };
  }

  async logout() {
    return { loggedOut: true };
  }
}
