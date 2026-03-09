import { ConfigService } from '@nestjs/config';
import { PricingService } from './pricing.service';

describe('PricingService', () => {
  it('calculates subtotal, service fee and total in cents', () => {
    const configService = {
      get: jest.fn().mockReturnValue(1000),
    } as unknown as ConfigService;
    const service = new PricingService(configService);

    const pricing = service.calculate([
      { quantity: 2, lineUnitTotalCents: 1390 },
      { quantity: 1, lineUnitTotalCents: 490 },
    ]);

    expect(pricing).toEqual({
      subtotalCents: 3270,
      serviceFeeCents: 327,
      totalCents: 3597,
    });
  });
});
