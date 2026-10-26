import type { FoodPreferences } from '../types';

export const createEmptyFoodPreferences = (): FoodPreferences => ({
  favoriteCategories: [],
  avoidedFoods: [],
  customAvoidedFoods: [],
  cookingFrequency: '',
  cookingStyles: [],
  cookingTime: '',
  goals: [],
  nutritionPreferences: [],
  completed: false,
});

export const normalizeFoodPreferences = (value: unknown): FoodPreferences => {
  if (!value || typeof value !== 'object') return createEmptyFoodPreferences();
  const preferences = value as Partial<FoodPreferences>;
  const empty = createEmptyFoodPreferences();
  const stringArray = (items: unknown): string[] =>
    Array.isArray(items) ? items.filter((item): item is string => typeof item === 'string') : [];

  return {
    favoriteCategories: stringArray(preferences.favoriteCategories),
    avoidedFoods: stringArray(preferences.avoidedFoods),
    customAvoidedFoods: stringArray(preferences.customAvoidedFoods),
    cookingFrequency: typeof preferences.cookingFrequency === 'string' ? preferences.cookingFrequency : empty.cookingFrequency,
    cookingStyles: stringArray(preferences.cookingStyles),
    cookingTime: typeof preferences.cookingTime === 'string' ? preferences.cookingTime : empty.cookingTime,
    goals: stringArray(preferences.goals),
    nutritionPreferences: stringArray(preferences.nutritionPreferences),
    completed: preferences.completed === true,
  };
};

export const hasCompletedFoodPreferences = (value: unknown): boolean =>
  normalizeFoodPreferences(value).completed;
