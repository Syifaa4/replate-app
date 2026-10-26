import type { Ingredient, UserStats } from '../types';

export interface UserData {
  ingredients: Ingredient[];
  stats: UserStats;
  impactStats: UserStats;
}

export const EMPTY_USER_STATS: UserStats = {
  foodManaged: 0,
  potentiallySaved: 0,
  moneySavedRp: 0,
  wasteAvoidedKg: 0,
  co2SavedKg: 0,
  weekSavedCount: 0,
};

const storageKey = (email: string, data: 'ingredients' | 'stats' | 'impact_stats') =>
  `replate_user_${encodeURIComponent(email.trim().toLowerCase())}_${data}`;

const readJson = <T,>(key: string, fallback: T, isValid: (value: unknown) => value is T): T => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return fallback;
    const parsed: unknown = JSON.parse(stored);
    if (!isValid(parsed)) {
      console.error(`Saved REPLATE data is invalid for ${key}. Using an empty value.`);
      return fallback;
    }
    return parsed;
  } catch (error) {
    console.error(`Could not load REPLATE data for ${key}.`, error);
    return fallback;
  }
};

const isIngredientArray = (value: unknown): value is Ingredient[] =>
  Array.isArray(value) && value.every((item) =>
    item &&
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    typeof item.quantity === 'string',
  );

const isUserStats = (value: unknown): value is UserStats =>
  Boolean(
    value &&
    typeof value === 'object' &&
    ['foodManaged', 'potentiallySaved', 'moneySavedRp', 'wasteAvoidedKg', 'co2SavedKg', 'weekSavedCount']
      .every((key) => typeof (value as Record<string, unknown>)[key] === 'number'),
  );

export const loadUserData = (email: string): UserData => ({
  ingredients: readJson(storageKey(email, 'ingredients'), [], isIngredientArray),
  stats: readJson(storageKey(email, 'stats'), { ...EMPTY_USER_STATS }, isUserStats),
  impactStats: readJson(storageKey(email, 'impact_stats'), { ...EMPTY_USER_STATS }, isUserStats),
});

export const saveUserData = (email: string, data: UserData): boolean => {
  try {
    localStorage.setItem(storageKey(email, 'ingredients'), JSON.stringify(data.ingredients));
    localStorage.setItem(storageKey(email, 'stats'), JSON.stringify(data.stats));
    localStorage.setItem(storageKey(email, 'impact_stats'), JSON.stringify(data.impactStats));
    return true;
  } catch (error) {
    console.error('Could not save this user’s REPLATE data.', error);
    return false;
  }
};

export const initializeUserData = (email: string): UserData => {
  const data = loadUserData(email);
  if (!saveUserData(email, data)) {
    throw new Error('Could not initialize this user’s REPLATE data.');
  }
  return data;
};

export const migrateUserDataEmail = (oldEmail: string, newEmail: string): boolean => {
  const oldOwner = oldEmail.trim().toLowerCase();
  const newOwner = newEmail.trim().toLowerCase();
  if (oldOwner === newOwner) return true;
  const data = loadUserData(oldOwner);
  if (!saveUserData(newOwner, data)) return false;
  try {
    for (const field of ['ingredients', 'stats', 'impact_stats'] as const) {
      localStorage.removeItem(storageKey(oldOwner, field));
    }
    const oldShoppingKey = `replate-shopping-list-${encodeURIComponent(oldOwner)}`;
    const newShoppingKey = `replate-shopping-list-${encodeURIComponent(newOwner)}`;
    const shoppingList = localStorage.getItem(oldShoppingKey);
    if (shoppingList !== null) {
      localStorage.setItem(newShoppingKey, shoppingList);
      localStorage.removeItem(oldShoppingKey);
    }
    return true;
  } catch (error) {
    console.error('Could not migrate REPLATE data to the updated email.', error);
    return false;
  }
};
