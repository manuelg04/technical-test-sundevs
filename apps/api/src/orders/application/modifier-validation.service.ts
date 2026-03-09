import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MenuItemDocument } from '../../menu/infrastructure/menu-item.schema';
import {
  OrderItemSnapshot,
  SelectedModifierGroup,
} from '../domain/order.types';

export interface CartItemDraftInput {
  menuItemCode: string;
  quantity: number;
  modifiers?: Record<string, string[]>;
}

@Injectable()
export class ModifierValidationService {
  buildOrderItem(
    menuItem: MenuItemDocument,
    input: CartItemDraftInput,
    existingItemId?: string,
  ): OrderItemSnapshot {
    const normalizedModifiers = input.modifiers ?? {};
    const requestedGroupCodes = Object.keys(normalizedModifiers);
    const allowedGroupCodes = new Set(
      menuItem.modifierGroups.map((group) => group.code),
    );

    for (const groupCode of requestedGroupCodes) {
      if (!allowedGroupCodes.has(groupCode as never)) {
        throw new UnprocessableEntityException(
          `Modifier group ${groupCode} is not valid for ${menuItem.code}`,
        );
      }
    }

    const modifierGroups = menuItem.modifierGroups.map((group) => {
      const requestedSelections = normalizedModifiers[group.code] ?? [];

      if (!Array.isArray(requestedSelections)) {
        throw new UnprocessableEntityException(
          `Modifier group ${group.code} must be an array`,
        );
      }

      const uniqueSelections = Array.from(new Set(requestedSelections));
      if (uniqueSelections.length !== requestedSelections.length) {
        throw new UnprocessableEntityException(
          `Modifier group ${group.code} contains duplicated values`,
        );
      }

      if (
        uniqueSelections.length < group.minSelections ||
        uniqueSelections.length > group.maxSelections
      ) {
        throw new UnprocessableEntityException(
          `Modifier group ${group.code} requires between ${group.minSelections} and ${group.maxSelections} selections`,
        );
      }

      if (group.required && uniqueSelections.length !== 1) {
        throw new UnprocessableEntityException(
          `Modifier group ${group.code} requires exactly one selection`,
        );
      }

      const optionsByCode = new Map(
        group.options.map((option) => [option.code, option]),
      );
      const selections = uniqueSelections.map((selectionCode) => {
        const option = optionsByCode.get(selectionCode);
        if (!option) {
          throw new UnprocessableEntityException(
            `Modifier ${selectionCode} is not valid for group ${group.code}`,
          );
        }

        return {
          code: option.code,
          name: option.name,
          priceCents: option.priceCents,
        };
      });

      return {
        groupCode: group.code,
        groupName: group.name,
        selections,
      } satisfies SelectedModifierGroup;
    });

    const modifiersTotal = modifierGroups.reduce(
      (groupTotal, group) =>
        groupTotal +
        group.selections.reduce(
          (selectionTotal, selection) => selectionTotal + selection.priceCents,
          0,
        ),
      0,
    );

    return {
      itemId: existingItemId ?? randomUUID(),
      menuItemCode: menuItem.code,
      name: menuItem.name,
      quantity: input.quantity,
      basePriceCents: menuItem.basePriceCents,
      lineUnitTotalCents: menuItem.basePriceCents + modifiersTotal,
      modifierGroups,
    };
  }

  validatePersistedItem(menuItem: MenuItemDocument, item: OrderItemSnapshot) {
    const modifiers = Object.fromEntries(
      item.modifierGroups.map((group) => [
        group.groupCode,
        group.selections.map((selection) => selection.code),
      ]),
    );
    this.buildOrderItem(
      menuItem,
      {
        menuItemCode: item.menuItemCode,
        quantity: item.quantity,
        modifiers,
      },
      item.itemId,
    );
  }
}
