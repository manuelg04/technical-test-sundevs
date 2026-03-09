import { Module } from '@nestjs/common';
import { PricingService } from './application/pricing.service';

@Module({
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}
