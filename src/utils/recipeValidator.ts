/**
 * REPLATE Recipe Feasibility & Absurdity Validator
 *
 * Ensures all generated or matched recipes adhere to strict culinary logic:
 * - Rejects fruit in savory soups or hot stir-fries (e.g. no "Tumis Mangga", "Sup Semangka", "Gulai Apel")
 * - Rejects meats in sweet dessert beverages (e.g. no "Jus Kambing", "Es Buah Ayam")
 * - Rejects absurd combinations (e.g. "Tumis Mangga Telur", "Pisang Balado")
 * - Ensures all ingredients have explicit, non-vague quantities (no "secukupnya" for essentials)
 */

import { classifyIngredient, normalizeIngredientText } from './ingredientCategorizer';

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  qualityScore: number;
}

const SWEET_FRUIT_NAMES = new Set([
  'mangga',
  'semangka',
  'melon',
  'apel',
  'jeruk',
  'pepaya',
  'nanas',
  'stroberi',
  'anggur',
]);

const SAVORY_DISH_KEYWORDS = [
  'tumis',
  'oseng',
  'sop',
  'sup',
  'gulai',
  'rendang',
  'kari',
  'soto',
  'sayur bening',
  'lodeh',
  'balado',
  'semur',
  'rawon',
  'opor',
];

const BEVERAGE_OR_DESSERT_KEYWORDS = [
  'jus',
  'smoothie',
  'es buah',
  'es campur',
  'puding',
  'kolak',
  'dessert',
];

export const validateRecipeFeasibility = (recipe: {
  title: string;
  ingredients: Array<{ name: string; amount?: string }>;
  steps?: string[];
}): ValidationResult => {
  const issues: string[] = [];
  const normalizedTitle = normalizeIngredientText(recipe.title);
  const stepsText = normalizeIngredientText((recipe.steps || []).join(' '));
  const fullText = `${normalizedTitle} ${stepsText}`;

  // 1. Basic structural checks
  if (!recipe.title || recipe.title.trim().length === 0) {
    issues.push('Recipe title is missing.');
  }

  if (!recipe.ingredients || recipe.ingredients.length === 0) {
    issues.push('Recipe has no ingredients.');
  }

  // 2. Quantity check: every ingredient must have an explicit quantity
  for (const ing of recipe.ingredients) {
    if (!ing.amount || ing.amount.trim() === '') {
      issues.push(`Ingredient "${ing.name}" is missing an explicit quantity.`);
    } else {
      const normAmount = normalizeIngredientText(ing.amount);
      if (
        normAmount.includes('secukupnya') &&
        (normAmount.includes('garam') || ing.name.toLowerCase().includes('garam'))
      ) {
        issues.push('Salt must have an explicit measurement (e.g., 1/2 sdt or 1 sdt), not "secukupnya".');
      }
    }
  }

  // 3. Classify all ingredients in the recipe
  const classifiedIngredients = recipe.ingredients.map((ing) => ({
    name: ing.name,
    classification: classifyIngredient(ing.name),
  }));

  const hasFruit = classifiedIngredients.some(
    (item) => item.classification.category === 'fruit',
  );
  const hasSweetFruit = classifiedIngredients.some(
    (item) => SWEET_FRUIT_NAMES.has(item.classification.canonical),
  );
  const hasMeat = classifiedIngredients.some(
    (item) => item.classification.category === 'meat',
  );
  const hasEgg = classifiedIngredients.some(
    (item) => item.classification.category === 'egg',
  );
  const isSavoryTitle = SAVORY_DISH_KEYWORDS.some((kw) =>
    new RegExp(`(^|\\s)${kw}(\\s|$)`, 'i').test(normalizedTitle),
  );
  const isBeverageDessert = BEVERAGE_OR_DESSERT_KEYWORDS.some((kw) =>
    new RegExp(`(^|\\s)${kw}(\\s|$)`, 'i').test(normalizedTitle),
  );

  // 4. Reject fruit in savory soups or hot stir-fries
  if (hasSweetFruit && isSavoryTitle) {
    issues.push(
      `Absurd combination: Sweet fruit should not be cooked as savory stir-fry or savory soup ("${recipe.title}").`,
    );
  }

  // Explicit title checks for known absurdities
  if (
    /tumis\s+(mangga|semangka|melon|apel|jeruk|pepaya)/i.test(normalizedTitle) ||
    /oseng\s+(mangga|semangka|melon|apel|jeruk|pepaya)/i.test(normalizedTitle) ||
    /s(u|o)p\s+(mangga|semangka|melon|jeruk|alpukat)/i.test(normalizedTitle) ||
    /gulai\s+(apel|mangga|semangka|pisang)/i.test(normalizedTitle) ||
    /mangga\s+goreng/i.test(normalizedTitle)
  ) {
    issues.push(`Culinary absurd dish rejected: "${recipe.title}".`);
  }

  // 5. Reject meat in sweet dessert/beverage
  if (hasMeat && isBeverageDessert) {
    issues.push(
      `Absurd combination: Meat cannot be prepared as beverage or dessert ("${recipe.title}").`,
    );
  }

  if (
    /jus\s+(daging|kambing|sapi|ayam)/i.test(normalizedTitle) ||
    /smoothie\s+(daging|kambing|sapi|ayam)/i.test(normalizedTitle) ||
    /es\s+buah.*(ayam|kambing|sapi)/i.test(normalizedTitle)
  ) {
    issues.push(`Meat beverage or dessert rejected: "${recipe.title}".`);
  }

  // 6. Reject forcing completely incompatible ingredients together
  if (hasFruit && hasMeat && !normalizedTitle.includes('salsa') && !normalizedTitle.includes('salad')) {
    // Only allow delicate salads/salsas where fruit is served raw/fresh beside cooked meat
    if (isSavoryTitle) {
      issues.push(
        `Incompatible combination: Fruit should not be forced into savory meat dish ("${recipe.title}").`,
      );
    }
  }

  if (hasSweetFruit && hasEgg && isSavoryTitle) {
    issues.push(
      `Incompatible combination: Sweet fruit should not be scrambled or stir-fried with eggs ("${recipe.title}").`,
    );
  }

  // 7. Check for avocado being boiled
  if (
    /(sup.*alpukat|alpukat.*sup|rebus.*alpukat|boil.*avocado|simmer.*avocado)/i.test(
      fullText,
    )
  ) {
    issues.push('Ripe avocado cannot be boiled or simmered in hot soup.');
  }

  // 8. Pisang balado as main course check
  if (/pisang\s+balado/i.test(normalizedTitle)) {
    issues.push('Pisang balado is not a standard culinary main recipe.');
  }

  const qualityScore = Math.max(0, 100 - issues.length * 25);

  return {
    isValid: issues.length === 0,
    issues,
    qualityScore,
  };
};
