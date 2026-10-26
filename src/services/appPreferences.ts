export interface AppPreferences {
  notificationsEnabled: boolean;
  ingredientRemindersEnabled: boolean;
  recipeRecommendationsEnabled: boolean;
}

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  notificationsEnabled: true,
  ingredientRemindersEnabled: true,
  recipeRecommendationsEnabled: true,
};

const STORAGE_KEY = 'replate_preferences';

const isAppPreferences = (value: unknown): value is AppPreferences =>
  Boolean(
    value &&
    typeof value === 'object' &&
    typeof (value as AppPreferences).notificationsEnabled === 'boolean' &&
    typeof (value as AppPreferences).ingredientRemindersEnabled === 'boolean' &&
    typeof (value as AppPreferences).recipeRecommendationsEnabled === 'boolean',
  );

export const loadAppPreferences = (): AppPreferences => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === null) return DEFAULT_APP_PREFERENCES;

  const parsed: unknown = JSON.parse(stored);
  if (!isAppPreferences(parsed)) {
    throw new Error('Saved REPLATE preferences are invalid.');
  }
  return parsed;
};

export const saveAppPreferences = (preferences: AppPreferences): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
};
