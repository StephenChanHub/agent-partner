import { Module } from '@nestjs/common';
import { UsageController } from './usage.controller';
import { UsageService } from './usage.service';
import { UsageMeterService } from './usage-meter.service';
import { BillingGuardService } from './billing-guard.service';
import { UsageRepository } from './repositories/usage.repository';
import { PricingService } from './pricing.service';

@Module({
  controllers: [UsageController],
  providers: [UsageService, UsageMeterService, BillingGuardService, UsageRepository, PricingService],
  exports: [UsageService, UsageMeterService, BillingGuardService, PricingService],
})
export class UsageModule {}
