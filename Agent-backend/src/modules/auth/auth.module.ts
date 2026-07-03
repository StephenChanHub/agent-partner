import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailCodeService } from './email-code.service';
import { AdminAuthService } from './admin-auth.service';
import { AppConfigModule } from '../../config/app-config.module';
import { AppConfigService } from '../../config/app-config.service';
import { CacheModule } from '../../infrastructure/cache/cache.module';
import { PrismaModule } from '../../infrastructure/database/prisma.module';

@Module({
  imports: [
    AppConfigModule,
    CacheModule,
    PrismaModule,
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        secret: config.value.auth.jwtSecret,
        signOptions: { expiresIn: config.value.auth.jwtExpiresIn as any },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, EmailCodeService, AdminAuthService],
  exports: [AuthService, EmailCodeService],
})
export class AuthModule {}
