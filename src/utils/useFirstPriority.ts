import type { Ingredient } from '../types';
import { isActiveIngredient } from './inventoryStatus';

export const USE_FIRST_ATTENTION_SCORE = 40;

export const getActiveUseFirstIngredients = (ingredients: Ingredient[]): Ingredient[] =>
  ingredients
    .filter(isActiveIngredient)
    .sort((first, second) => second.useFirstScore - first.useFirstScore);

export const getUseFirstPriorityIngredients = (ingredients: Ingredient[]): Ingredient[] =>
  getActiveUseFirstIngredients(ingredients).filter(
    (item) => item.useFirstScore >= USE_FIRST_ATTENTION_SCORE,
  );