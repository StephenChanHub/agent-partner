import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailCodeService } from './email-code.service';
import { AdminAuthService } from './admin-auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, EmailCodeService, AdminAuthService],
  exports: [AuthService],
})
export class AuthModule {}
