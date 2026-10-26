import type { Ingredient, Recipe } from '../types';
import {
  generateSmartRecipesForInventory,
  synthesizeRecipeForIngredient,
} from './smartRecipeEngine';
import { validateRecipeFeasibility } from './recipeValidator';
import { areIngredientsMatching } from './ingredientCategorizer';
import { isActiveIngredient } from './inventoryStatus';

export const validateGeneratedRecipe = (
  recipe: Recipe,
  _ingredient: Ingredient,
  _inventory: Ingredient[],
): { isValid: boolean; issues: string[]; qualityScore: number } => {
  return validateRecipeFeasibility(recipe);
};

export const getRecipesForIngredient = (
  recipes: Recipe[],
  ingredient: Ingredient,
  inventory: Ingredient[],
): Recipe[] => {
  if (!isActiveIngredient(ingredient)) return [];

  // First, look for matching recipes from smart recipe engine
  const smartMatches = generateSmartRecipesForInventory(inventory, ingredient.name);
  if (smartMatches.length > 0) {
    return smartMatches;
  }

  // Next, look in existing recipes provided
  const matchingRecipes = recipes.filter((recipe) =>
    recipe.ingredients.some((recipeIngredient) =>
      areIngredientsMatching(recipeIngredient.name, ingredient.name),
    ),
  );

  const validExisting = matchingRecipes.filter((r) => validateRecipeFeasibility(r).isValid);
  if (validExisting.length > 0) {
    return validExisting;
  }

  // Synthesize a culinary-sound recipe for this specific ingredient
  const synthesized = synthesizeRecipeForIngredient(ingredient, inventory);
  return [synthesized];
};
