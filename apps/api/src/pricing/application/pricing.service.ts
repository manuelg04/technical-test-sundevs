import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PricingSummary } from '../domain/pricing.types';

export interface PriceableLine {
  quantity: number;
  lineUnitTotalCents: number;
}

@Injectable()
export class PricingService {
  constructor(private readonly configService: ConfigService) {}

  calculate(lines: PriceableLine[]): PricingSummary {
    const subtotalCents = lines.reduce(
      (total, line) => total + line.lineUnitTotalCents * line.quantity,
      0,
    );
    const serviceFeeBps = this.configService.get<number>(
      'SERVICE_FEE_BPS',
      1000,
    );
    const serviceFeeCents = Math.round(
      (subtotalCents * serviceFeeBps) / 10_000,
    );

    return {
      subtotalCents,
      serviceFeeCents,
      totalCents: subtotalCents + serviceFeeCents,
    };
  }
}
