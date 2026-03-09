import { ModifierValidationService } from './modifier-validation.service';
import { DEFAULT_MENU } from '../../menu/infrastructure/default-menu';

describe('ModifierValidationService', () => {
  const service = new ModifierValidationService();
  const bowl = DEFAULT_MENU.find(
    (item) => item.code === 'build-your-own-bowl',
  )!;

  it('rejects toppings above the configured maximum', () => {
    expect(() =>
      service.buildOrderItem(bowl as never, {
        menuItemCode: bowl.code,
        quantity: 1,
        modifiers: {
          protein: ['chicken'],
          toppings: ['corn', 'pickled-onion', 'edamame', 'avocado'],
        },
      }),
    ).toThrow('between 0 and 3 selections');
  });
});
