import type { Ingredient, Recipe } from '../types';
import {
  areIngredientsMatching,
  classifyIngredient,
  normalizeIngredientText,
} from './ingredientCategorizer';
import { isActiveIngredient } from './inventoryStatus';

export const normalizeText = normalizeIngredientText;

export const ingredientsMatch = areIngredientsMatching;

export const getCanonicalIngredientAlias = (value: string): string | null => {
  const classified = classifyIngredient(value);
  return classified.canonicalName;
};

export { isActiveIngredient };

const recipeIngredientOptions = (name: string): string[] =>
  name.split(/\s*\/\s*|\s+or\s+/i).map((option) =>
    normalizeText(option.split(/[,(]/, 1)[0]),
  );

const pantryStapleTerms = new Set([
  'garam',
  'salt',
  'gula',
  'gula pasir',
  'sugar',
  'minyak',
  'minyak goreng',
  'oil',
  'cooking oil',
  'air',
  'water',
  'merica',
  'lada',
  'pepper',
  'es batu',
  'ice',
  'kaldu',
  'broth',
]);

const isPantryStaple = (name: string): boolean =>
  recipeIngredientOptions(name).every((option) =>
    pantryStapleTerms.has(classifyIngredient(option).canonicalName),
  );

export const recipeTitleMatchesIngredient = (recipe: Recipe, ingredient: string): boolean => {
  const normalizedTitle = ` ${normalizeText(recipe.title)} `;
  const canonical = classifyIngredient(ingredient).canonicalName;
  const normIngredient = normalizeText(ingredient);
  return normalizedTitle.includes(` ${canonical} `) || normalizedTitle.includes(` ${normIngredient} `);
};

export const isRecipeIngredientAvailable = (name: string, inventory: Ingredient[]): boolean => {
  const activeItems = inventory.filter(isActiveIngredient);
  return activeItems.some((invItem) =>
    recipeIngredientOptions(name).some((option) =>
      areIngredientsMatching(option, invItem.name),
    ),
  );
};

export interface RecipeMatchSummary {
  availableCount: number;
  meaningfulAvailableCount: number;
  neededCount: number;
  relevanceScore: number;
  matchScorePercent: number;
  availableIngredients: RecipeIngredientMatch[];
  missingIngredients: RecipeIngredientMatch[];
}

export interface RecipeIngredientMatch {
  ingredient: Recipe['ingredients'][number];
  inventoryItem?: Ingredient;
  status: 'available' | 'short' | 'missing' | 'optional';
  shortfall?: string;
}

interface ParsedQuantity {
  amount: number;
  unit: 'mass' | 'volume' | 'count' | 'length' | 'unknown';
  baseUnit: string;
  scale: number;
  displayUnit: string;
}

const parseRecipeQuantity = (value: string, ingredientName: string): ParsedQuantity | null => {
  const matches = [...value.matchAll(/(\d+\s*\/\s*\d+|\d+(?:[.,]\d+)?)\s*([a-zA-Z]+|buah|butir|siung|batang|lembar|ekor|cm)?/gi)];
  if (matches.length === 0) return null;

  let firstUnknown: ParsedQuantity | null = null;
  for (const match of matches) {
    const amountText = match[1].replace(/\s/g, '');
    const amount = amountText.includes('/')
      ? Number(amountText.split('/')[0]) / Number(amountText.split('/')[1])
      : Number(amountText.replace(',', '.'));
    if (!Number.isFinite(amount)) continue;

    const rawUnit = (match[2] ?? '').toLowerCase();
    let parsed: ParsedQuantity;
    if (['kg', 'kilogram', 'kilograms'].includes(rawUnit)) {
      parsed = { amount: amount * 1000, unit: 'mass', baseUnit: 'g', scale: 1000, displayUnit: rawUnit };
    } else if (['g', 'gram', 'grams'].includes(rawUnit)) {
      parsed = { amount, unit: 'mass', baseUnit: 'g', scale: 1, displayUnit: rawUnit };
    } else if (['l', 'liter', 'litre', 'liters', 'litres'].includes(rawUnit)) {
      parsed = { amount: amount * 1000, unit: 'volume', baseUnit: 'ml', scale: 1000, displayUnit: rawUnit };
    } else if (['ml', 'milliliter', 'millilitre', 'milliliters', 'millilitres'].includes(rawUnit)) {
      parsed = { amount, unit: 'volume', baseUnit: 'ml', scale: 1, displayUnit: rawUnit };
    } else if (['sdm', 'tbsp', 'tablespoon', 'tablespoons'].includes(rawUnit)) {
      const scale = isDrySeasoning(ingredientName) ? drySeasoningSpoonMass(ingredientName, 15) : 15;
      parsed = { amount: amount * scale, unit: isDrySeasoning(ingredientName) ? 'mass' : 'volume', baseUnit: isDrySeasoning(ingredientName) ? 'g' : 'ml', scale, displayUnit: rawUnit };
    } else if (['sdt', 'tsp', 'teaspoon', 'teaspoons'].includes(rawUnit)) {
      const scale = isDrySeasoning(ingredientName) ? drySeasoningSpoonMass(ingredientName, 5) : 5;
      parsed = { amount: amount * scale, unit: isDrySeasoning(ingredientName) ? 'mass' : 'volume', baseUnit: isDrySeasoning(ingredientName) ? 'g' : 'ml', scale, displayUnit: rawUnit };
    } else if (rawUnit === 'cm') {
      parsed = { amount, unit: 'length', baseUnit: 'cm', scale: 1, displayUnit: rawUnit };
    } else if (!rawUnit || ['buah', 'butir', 'siung', 'batang', 'lembar', 'ekor', 'pcs', 'pc', 'piece', 'pieces', 'item', 'items'].includes(rawUnit)) {
      parsed = { amount, unit: 'count', baseUnit: 'pcs', scale: 1, displayUnit: rawUnit || 'pcs' };
    } else {
      parsed = { amount, unit: 'unknown', baseUnit: rawUnit, scale: 1, displayUnit: rawUnit };
    }

    if (parsed.unit !== 'unknown') return parsed;
    firstUnknown ??= parsed;
  }
  return firstUnknown;
};

const isDrySeasoning = (name: string): boolean => {
  const normalized = normalizeText(name);
  return ['garam', 'salt', 'gula', 'sugar', 'merica', 'lada', 'pepper'].some((item) => normalized.includes(item));
};

const drySeasoningSpoonMass = (name: string, spoonMl: number): number => {
  const normalized = normalizeText(name);
  const gramsPerTeaspoon = normalized.includes('garam') || normalized.includes('salt')
    ? 5
    : normalized.includes('pepper') || normalized.includes('lada') || normalized.includes('merica')
      ? 2
      : 4;
  return gramsPerTeaspoon * spoonMl / 5;
};

const formatShortfall = (amount: number, baseUnit: string, requestedUnit: string): string => {
  const converted = baseUnit === 'g' && ['kg', 'kilogram'].includes(requestedUnit.toLowerCase())
    ? amount / 1000
    : baseUnit === 'ml' && ['l', 'liter', 'litre'].includes(requestedUnit.toLowerCase())
      ? amount / 1000
      : amount;
  const rounded = Math.round(converted * 100) / 100;
  return `${Number.isInteger(rounded) ? rounded : rounded.toLocaleString('id-ID')} ${requestedUnit}`;
};

const getIngredientMatch = (
  recipeIngredient: Recipe['ingredients'][number],
  inventory: Ingredient[],
): RecipeIngredientMatch => {
  if (recipeIngredient.role === 'optional' || recipeIngredient.required === false) {
    return { ingredient: recipeIngredient, status: 'optional' };
  }
  const inventoryItem = inventory
    .filter(isActiveIngredient)
    .find((item) => recipeIngredientOptions(recipeIngredient.name).some((option) =>
      ingredientsMatch(option, item.name),
    ));
  if (!inventoryItem) return { ingredient: recipeIngredient, status: 'missing' };

  const required = parseRecipeQuantity(recipeIngredient.amount, recipeIngredient.name);
  const available = parseRecipeQuantity(inventoryItem.quantity, recipeIngredient.name);
  if (!required) {
    return {
      ingredient: { ...recipeIngredient, inStock: true, source: 'inventory', availableQuantity: inventoryItem.quantity },
      inventoryItem,
      status: 'available',
    };
  }
  if (!available || required.unit === 'unknown' || available.unit === 'unknown' || required.unit !== available.unit) {
    return {
      ingredient: {
        ...recipeIngredient,
        inStock: false,
        source: 'needs_purchase',
        availableQuantity: inventoryItem.quantity,
      },
      inventoryItem,
      status: 'short',
    };
  }
  if (available.amount >= required.amount) {
    return {
      ingredient: { ...recipeIngredient, inStock: true, source: 'inventory', availableQuantity: inventoryItem.quantity },
      inventoryItem,
      status: 'available',
    };
  }

  const requestedUnit = recipeIngredient.amount.match(/(?:\d+\s*\/\s*\d+|\d+(?:[.,]\d+)?)\s*([a-zA-Z]+|buah|butir|siung|batang|lembar|ekor|cm)?/i)?.[1] ?? required.baseUnit;
  const shortfall = formatShortfall(required.amount - available.amount, required.baseUnit, requestedUnit);
  return {
    ingredient: {
      ...recipeIngredient,
      inStock: false,
      source: 'needs_purchase',
      availableQuantity: inventoryItem.quantity,
      shortfall,
    },
    inventoryItem,
    status: 'short',
    shortfall,
  };
};

export const getRecipeMatchSummary = (
  recipe: Recipe,
  inventory: Ingredient[],
): RecipeMatchSummary => {
  const matches = recipe.ingredients.map((ingredient) => getIngredientMatch(ingredient, inventory));
  const requiredMatches = matches.filter((match) => match.status !== 'optional');
  const availableIngredients = requiredMatches.filter((match) => match.status === 'available');
  const missingIngredients = requiredMatches.filter((match) => match.status !== 'available');
  const mainMatches = requiredMatches.filter((match) => match.ingredient.role === 'main');
  const supportingMatches = requiredMatches.filter((match) => match.ingredient.role === 'supporting');
  const seasoningMatches = requiredMatches.filter((match) => match.ingredient.role === 'seasoning' || !match.ingredient.role);
  const getRatio = (items: RecipeIngredientMatch[]) => items.length
    ? items.filter((match) => match.status === 'available').length / items.length
    : 1;
  const mainAvailability = getRatio(mainMatches);
  const supportAvailability = getRatio(supportingMatches);
  const seasoningAvailability = getRatio(seasoningMatches);
  const matchScorePercent = requiredMatches.length === 0 || availableIngredients.length === 0
    ? 0
    : Math.round(mainAvailability * 50 + supportAvailability * 30 + seasoningAvailability * 20);
  const meaningfulAvailableCount = availableIngredients.filter((match) => !isPantryStaple(match.ingredient.name)).length;
  const totalCount = requiredMatches.length;
  const relevanceScore = totalCount === 0 ? 0 : meaningfulAvailableCount / totalCount;

  return {
    availableCount: availableIngredients.length,
    meaningfulAvailableCount,
    neededCount: missingIngredients.length,
    relevanceScore,
    matchScorePercent,
    availableIngredients,
    missingIngredients,
  };
};

export const getRecipeRemainingQuantities = (
  recipe: Recipe,
  inventory: Ingredient[],
): Record<string, string> => {
  const usedBaseAmounts = new Map<string, number>();
  const inventoryById = new Map<string, Ingredient>();

  for (const match of getRecipeMatchSummary(recipe, inventory).availableIngredients) {
    if (!match.inventoryItem) continue;
    const required = parseRecipeQuantity(match.ingredient.amount, match.ingredient.name);
    const available = parseRecipeQuantity(match.inventoryItem.quantity, match.ingredient.name);
    if (!required || !available || required.unit === 'unknown' || required.unit !== available.unit) continue;
    usedBaseAmounts.set(
      match.inventoryItem.id,
      (usedBaseAmounts.get(match.inventoryItem.id) ?? 0) + required.amount,
    );
    inventoryById.set(match.inventoryItem.id, match.inventoryItem);
  }

  return Object.fromEntries([...usedBaseAmounts].map(([id, usedAmount]) => {
    const item = inventoryById.get(id);
    if (!item) return [id, ''];
    const parsed = parseRecipeQuantity(item.quantity, item.name);
    if (!parsed) return [id, item.quantity];
    const remaining = Math.max(0, parsed.amount - usedAmount);
    const displayedAmount = Math.round((remaining / parsed.scale) * 100) / 100;
    return [id, `${Number.isInteger(displayedAmount) ? displayedAmount : displayedAmount.toLocaleString('id-ID')} ${parsed.displayUnit}`.trim()];
  }));
};

export const rankRecipesForInventory = (recipes: Recipe[], inventory: Ingredient[]): Recipe[] =>
  recipes
    .map((recipe) => ({
      recipe,
      match: getRecipeMatchSummary(recipe, inventory),
      urgentScore: Math.max(
        0,
        ...inventory
          .filter(isActiveIngredient)
          .filter((item) =>
            recipe.ingredients.some((recipeIngredient) =>
              recipeIngredientOptions(recipeIngredient.name).some(
                (option) => areIngredientsMatching(option, item.name),
              ),
            ),
          )
          .map((item) => item.useFirstScore || 0),
      ),
    }))
    .filter(({ recipe, match }) => {
      const primaryIngredients = recipe.ingredients.filter((ingredient) => ingredient.role === 'main');
      const mainAvailable = primaryIngredients.length === 0 ||
        match.availableIngredients.some((ingredient) => ingredient.ingredient.role === 'main');
      return match.meaningfulAvailableCount > 0 && mainAvailable;
    })
    .sort((a, b) =>
      b.match.meaningfulAvailableCount - a.match.meaningfulAvailableCount ||
      b.match.matchScorePercent - a.match.matchScorePercent ||
      b.match.relevanceScore - a.match.relevanceScore ||
      b.match.availableCount - a.match.availableCount ||
      b.urgentScore - a.urgentScore,
    )
    .map(({ recipe }) => recipe);
