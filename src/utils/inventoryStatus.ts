import type { Ingredient } from '../types';

export const getIngredientQuantityValue = (quantity: string | undefined): number | null => {
  if (!quantity) return null;
  const match = quantity.trim().match(/^(-?\d+(?:[.,]\d+)?)/);
  if (!match) return null;

  const value = Number(match[1].replace(',', '.'));
  return Number.isFinite(value) ? value : null;
};

export const isUsedIngredient = (item: Partial<Ingredient>): boolean => {
  const quantity = getIngredientQuantityValue(item.quantity);
  const status = item.status?.toLowerCase();
  return Boolean(
    item.consumed ||
    status === 'consumed' ||
    status === 'used' ||
    status === 'empty' ||
    (quantity !== null && quantity <= 0),
  );
};

export const isActiveIngredient = (item: Partial<Ingredient>): boolean =>
  !isUsedIngredient(item);

export const normalizeIngredientInventoryState = (item: Ingredient): Ingredient => {
  if (isActiveIngredient(item)) return item;

  return {
    ...item,
    quantity: '0 g',
    consumed: true,
    status: 'consumed',
    useFirstScore: 0,
    useFirstRank: undefined,
    useFirstReason: '',
    scoreBreakdown: {
      freshness: 0,
      quantityRisk: 0,
      consumptionPattern: 0,
      recipeFit: 0,
      wastePrevention: 0,
    },
    urgency: 'Low',
  };
};
