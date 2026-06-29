import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailCodeService {
  // TODO(v1.6): implement with Redis + Mailer Adapter.
  // V1 policy:
  // - code purpose: REGISTER
  // - TTL: AUTH_EMAIL_CODE_TTL_SECONDS, default 300
  // - resend cooldown: AUTH_EMAIL_CODE_RESEND_COOLDOWN_SECONDS
  // - max attempts: AUTH_EMAIL_CODE_MAX_ATTEMPTS
  // - delete Redis key after successful verification
}
