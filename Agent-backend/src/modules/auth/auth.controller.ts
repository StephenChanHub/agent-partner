import { Body, Controller, Post } from '@nestjs/common';
import { ok } from '../../common/api-response';
import { AuthService } from './auth.service';
import { SendEmailCodeDto } from './dto/send-email-code.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('email-code/send')
  async sendEmailCode(@Body() dto: SendEmailCodeDto) {
    return ok(await this.service.sendEmailCode(dto));
  }

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return ok(await this.service.register(dto));
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return ok(await this.service.login(dto));
  }

  @Post('refresh')
  async refresh() {
    return ok(await this.service.refresh());
  }

  @Post('logout')
  async logout() {
    return ok(await this.service.logout());
  }
}
