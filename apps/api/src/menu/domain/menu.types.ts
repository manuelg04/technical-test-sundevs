export type ModifierGroupCode = 'protein' | 'toppings' | 'sauces';

export interface ModifierOptionDefinition {
  code: string;
  name: string;
  priceCents: number;
}

export interface ModifierGroupDefinition {
  code: ModifierGroupCode;
  name: string;
  required: boolean;
  minSelections: number;
  maxSelections: number;
  options: ModifierOptionDefinition[];
}

export interface MenuItemDefinition {
  code: string;
  category: string;
  name: string;
  description: string;
  basePriceCents: number;
  modifierGroups: ModifierGroupDefinition[];
}
