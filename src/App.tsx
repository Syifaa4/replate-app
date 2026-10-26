import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppShell } from './components/AppShell';
import { BottomNav } from './components/BottomNav';
import { MobileHeader } from './components/MobileHeader';
import { DesktopHeader } from './components/DesktopHeader';
import { PageBackButton } from './components/PageBackButton';
import { HomeScreen } from './components/screens/HomeScreen';
import { ScanScreen } from './components/screens/ScanScreen';
import { InventoryScreen } from './components/screens/InventoryScreen';
import { UseFirstScreen } from './components/screens/UseFirstScreen';
import { RecipeScreen } from './components/screens/RecipeScreen';
import { ShoppingScreen } from './components/screens/ShoppingScreen';
import { ImpactScreen } from './components/screens/ImpactScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { EditProfileScreen } from './components/screens/EditProfileScreen';
import { OnboardingScreen } from './components/screens/OnboardingScreen';
import { AuthScreen } from './components/screens/AuthScreen';
import type { AuthFailure } from './components/screens/AuthScreen';
import { LandingScreen } from './components/screens/LandingScreen';
import { Ingredient, MainTab, Recipe, UserProfile, UserStats } from './types';
import {
  INITIAL_INGREDIENTS,
  INITIAL_USER_PROFILE,
  MOCK_RECIPES,
} from './data/mockData';
import { sound } from './utils/sound';
import { rankIngredients } from './utils/aiEngine';
import { getUseFirstPriorityIngredients } from './utils/useFirstPriority';
import { getCanonicalIngredientAlias, ingredientsMatch, isActiveIngredient, isRecipeIngredientAvailable } from './utils/recipeMatching';
import { normalizeIngredientInventoryState } from './utils/inventoryStatus';
import { generateSmartRecipesForInventory, getSmartRecipeById } from './utils/smartRecipeEngine';
import { useLanguage } from './i18n';
import { PreferenceSetupScreen } from './components/screens/PreferenceSetupScreen';
import { AppPreferencesDialog } from './components/AppPreferencesDialog';
import { hasCompletedFoodPreferences, normalizeFoodPreferences } from './services/foodPreferences';
import {
  AppPreferences,
  DEFAULT_APP_PREFERENCES,
  loadAppPreferences,
  saveAppPreferences,
} from './services/appPreferences';
import {
  getCurrentAuthProfile,
  LocalAuthError,
  loginLocalAccount,
  logoutLocalAccount,
  registerLocalAccount,
  updateCurrentAuthProfile,
} from './services/localAuthService';
import {
  EMPTY_USER_STATS,
  loadUserData,
  migrateUserDataEmail,
  saveUserData,
} from './services/userDataService';

type AppMode = 'landing' | 'register' | 'login' | 'register-success' | 'onboarding' | 'preferences' | 'app';

const APP_PATHS: Record<AppMode, string> = {
  landing: '/',
  register: '/register',
  login: '/login',
  'register-success': '/register/success',
  onboarding: '/onboarding',
  preferences: '/preferences',
  app: '/home',
};

const getRecipeIdFromUrl = (): string | null =>
  new URLSearchParams(window.location.search).get('recipeId');

const getRecipeIngredientFromUrl = (): string | null =>
  new URLSearchParams(window.location.search).get('ingredient');

const isMainTab = (value: string | null): value is MainTab =>
  value === 'home' ||
  value === 'scan' ||
  value === 'use_first' ||
  value === 'shopping' ||
  value === 'profile' ||
  value === 'inventory' ||
  value === 'recipe' ||
  value === 'impact';

const modeForPath = (path: string, profile: UserProfile | null): AppMode => {
  if (profile) {
    if (!hasCompletedFoodPreferences(profile.foodPreferences)) return 'preferences';
    if (path === '/register/success') return 'register-success';
    if (path === '/onboarding') return 'onboarding';
    return 'app';
  }
  if (path === '/register') return 'register';
  if (path === '/login') return 'login';
  return 'landing';
};

const normalizeStoredIngredients = (items: Ingredient[]): Ingredient[] => {
  return items.map((item) => {
    const normalized = normalizeIngredientInventoryState(item);

    const alias = getCanonicalIngredientAlias(normalized.name);
    if (!alias) return normalized;
    const existingAlias = normalized.canonicalId
      ? getCanonicalIngredientAlias(normalized.canonicalId)
      : null;
    return {
      ...normalized,
      canonicalId: normalized.canonicalId && existingAlias === alias
        ? normalized.canonicalId
        : alias,
    };
  });
};

const loadUserProfile = (): UserProfile => {
  try {
    const saved = localStorage.getItem('replate_user_profile');
    if (saved) {
      const parsed: Partial<UserProfile> = JSON.parse(saved);
      return {
        ...INITIAL_USER_PROFILE,
        ...parsed,
        phone: typeof parsed.phone === 'string' ? parsed.phone : '',
        dietaryPreferences: Array.isArray(parsed.dietaryPreferences)
          ? parsed.dietaryPreferences
          : INITIAL_USER_PROFILE.dietaryPreferences,
        favoriteIngredients: Array.isArray(parsed.favoriteIngredients)
          ? parsed.favoriteIngredients
          : INITIAL_USER_PROFILE.favoriteIngredients,
        foodDislikes: Array.isArray(parsed.foodDislikes)
          ? parsed.foodDislikes
          : INITIAL_USER_PROFILE.foodDislikes,
        foodPreferences: normalizeFoodPreferences(parsed.foodPreferences),
      };
    }

    const legacyName = localStorage.getItem('replate_user_name');
    return legacyName ? { ...INITIAL_USER_PROFILE, name: legacyName } : INITIAL_USER_PROFILE;
  } catch {
    return INITIAL_USER_PROFILE;
  }
};

export function App() {
  const { t, getFoodDisplayName, getRecipeTitle } = useLanguage();
  const [activeUserEmail, setActiveUserEmail] = useState(
    () => getCurrentAuthProfile()?.email ?? null,
  );
  const [appMode, setAppMode] = useState<AppMode>(() =>
    modeForPath(window.location.pathname, getCurrentAuthProfile()),
  );
  const [userProfile, setUserProfile] = useState<UserProfile>(() =>
    getCurrentAuthProfile() ?? loadUserProfile(),
  );

  const [activeTab, setActiveTab] = useState<MainTab>(() =>
    getRecipeIdFromUrl() || getRecipeIngredientFromUrl() ? 'recipe' : 'home',
  );
  const [history, setHistory] = useState<MainTab[]>(() => {
    const recipeId = getRecipeIdFromUrl();
    const ingredient = getRecipeIngredientFromUrl();
    if (!recipeId && !ingredient) return ['home'];
    const params = new URLSearchParams(window.location.search);
    const from = recipeId
      ? params.get('recipeFrom')
      : params.get('ingredientFrom');
    return isMainTab(from) && from !== 'recipe'
      ? ['home', from, 'recipe']
      : ['home', 'recipe'];
  });
  const historyRef = useRef(history);
  const [isContextualTab, setIsContextualTab] = useState(false);

  const [ingredients, setIngredients] = useState<Ingredient[]>(() => {
    return activeUserEmail
      ? normalizeStoredIngredients(loadUserData(activeUserEmail).ingredients)
      : [];
  });

  const [stats, setStats] = useState<UserStats>(() => {
    return activeUserEmail ? loadUserData(activeUserEmail).stats : { ...EMPTY_USER_STATS };
  });

  const [impactStats, setImpactStats] = useState<UserStats>(() => {
    return activeUserEmail ? loadUserData(activeUserEmail).impactStats : { ...EMPTY_USER_STATS };
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingFoodPreferences, setIsEditingFoodPreferences] = useState(false);
  const [isLogoutConfirmationOpen, setIsLogoutConfirmationOpen] = useState(false);
  const [isAppPreferencesOpen, setIsAppPreferencesOpen] = useState(false);
  const [appPreferences, setAppPreferences] = useState<AppPreferences>(() => {
    try {
      return loadAppPreferences();
    } catch (error) {
      console.error('Could not load REPLATE app preferences.', error);
      return DEFAULT_APP_PREFERENCES;
    }
  });

  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(getRecipeIdFromUrl);
  const [pendingBasketItems, setPendingBasketItems] = useState<Array<{ name: string; quantity: string }>>([]);
  const [recipeReturnTab, setRecipeReturnTab] = useState<MainTab>(() => {
    const from = new URLSearchParams(window.location.search).get('recipeFrom');
    return isMainTab(from) ? from : 'recipe';
  });
  const selectedRecipeIdRef = useRef(selectedRecipeId);
  const [selectedRecipeIngredient, setSelectedRecipeIngredient] = useState<string | null>(getRecipeIngredientFromUrl);
  const [recipeContextReturnTab, setRecipeContextReturnTab] = useState<MainTab>(() => {
    const from = new URLSearchParams(window.location.search).get('ingredientFrom');
    return isMainTab(from) ? from : 'inventory';
  });
  const selectedRecipeIngredientRef = useRef(selectedRecipeIngredient);
  const updateSelectedRecipeId = (recipeId: string | null) => {
    selectedRecipeIdRef.current = recipeId;
    setSelectedRecipeId(recipeId);
  };
  const updateSelectedRecipeIngredient = (ingredient: string | null) => {
    selectedRecipeIngredientRef.current = ingredient;
    setSelectedRecipeIngredient(ingredient);
  };
  const [selectedPriorityIngredientId, setSelectedPriorityIngredientId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  const navigateMode = (mode: AppMode) => {
    window.history.pushState({}, '', APP_PATHS[mode]);
    setAppMode(mode);
  };

  useEffect(() => {
    const syncRoute = () => {
      setAppMode(modeForPath(window.location.pathname, getCurrentAuthProfile()));
      const recipeId = getRecipeIdFromUrl();
      const recipeFrom = new URLSearchParams(window.location.search).get('recipeFrom');
      const recipeIngredient = getRecipeIngredientFromUrl();
      const ingredientFrom = new URLSearchParams(window.location.search).get('ingredientFrom');
      const hadIngredientContext = selectedRecipeIngredientRef.current !== null;
      const hadRecipeContext = selectedRecipeIdRef.current !== null || hadIngredientContext;
      updateSelectedRecipeId(recipeId);
      updateSelectedRecipeIngredient(recipeIngredient);
      if (recipeId) {
        setRecipeReturnTab(isMainTab(recipeFrom) ? recipeFrom : 'recipe');
        setActiveTab('recipe');
        setHistory((prev) => prev.at(-1) === 'recipe' ? prev : [...prev, 'recipe']);
      } else if (recipeIngredient) {
        setRecipeContextReturnTab(
          isMainTab(ingredientFrom) ? ingredientFrom : 'inventory',
        );
        setActiveTab('recipe');
        setHistory((prev) => prev.at(-1) === 'recipe' ? prev : [...prev, 'recipe']);
      } else if (hadRecipeContext) {
        const returnTab = hadIngredientContext
          ? recipeContextReturnTab
          : recipeReturnTab;
        if (returnTab !== 'recipe') {
          setActiveTab(returnTab);
          const currentHistory = historyRef.current;
          const lastRecipeIndex = currentHistory.lastIndexOf('recipe');
          const nextHistory = lastRecipeIndex > 0
            ? currentHistory.slice(0, lastRecipeIndex)
            : [...currentHistory, returnTab];
          setHistory(nextHistory);
          setIsContextualTab(nextHistory.length > 1);
        } else {
          setIsContextualTab(false);
        }
        setRecipeReturnTab('recipe');
        setRecipeContextReturnTab('inventory');
      }
    };
    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
  }, [recipeReturnTab, recipeContextReturnTab]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.pathname !== APP_PATHS[appMode]) {
      url.pathname = APP_PATHS[appMode];
      window.history.replaceState(window.history.state, '', url);
    }
  }, [appMode]);

  useEffect(() => {
    if (!activeUserEmail) return;
    saveUserData(activeUserEmail, { ingredients, stats, impactStats });
  }, [activeUserEmail, ingredients, stats, impactStats]);

  const persistUserProfile = (nextProfile: UserProfile): boolean => {
    const profileToSave = {
      ...nextProfile,
      email: nextProfile.email.trim().toLowerCase(),
    };
    try {
      updateCurrentAuthProfile(profileToSave);
      if (
        activeUserEmail &&
        activeUserEmail.trim().toLowerCase() !== profileToSave.email &&
        !migrateUserDataEmail(activeUserEmail, profileToSave.email)
      ) {
        updateCurrentAuthProfile(userProfile);
        return false;
      }
      localStorage.setItem('replate_user_profile', JSON.stringify(profileToSave));
      setUserProfile(profileToSave);
      setActiveUserEmail(profileToSave.email);
      return true;
    } catch {
      return false;
    }
  };

  const handleAuthSubmit = async (
    mode: 'register' | 'login',
    name: string,
    email: string,
    password: string,
  ): Promise<{ profile: UserProfile } | { error: AuthFailure }> => {
    try {
      const profile = mode === 'register'
        ? await registerLocalAccount(name, email, password)
        : await loginLocalAccount(email, password);
      const userData = loadUserData(profile.email);
      setActiveUserEmail(profile.email);
      setUserProfile(profile);
      setIngredients(normalizeStoredIngredients(userData.ingredients));
      setStats(userData.stats);
      setImpactStats(userData.impactStats);
      setActiveTab('home');
      setHistory(['home']);
      setIsContextualTab(false);
      return { profile };
    } catch (error) {
      if (error instanceof LocalAuthError) {
        return { error: error.code === 'invalid' ? 'invalid' : error.code };
      }
      console.error('Could not complete email/password authentication.', error);
      return { error: 'unexpected' };
    }
  };

  const handleAuthSuccess = (profile: UserProfile, mode: 'register' | 'login') => {
    if (mode === 'register') {
      navigateMode('preferences');
      return;
    }
    if (!hasCompletedFoodPreferences(profile.foodPreferences)) {
      navigateMode('preferences');
      return;
    }
    setActiveTab('home');
    setHistory(['home']);
    setIsContextualTab(false);
    navigateMode('app');
    showToast(t('toasts.welcome', { name: profile.name }));
  };

  const handleLogout = () => {
    try {
      logoutLocalAccount();
    } catch {
      showToast(t('auth.errors.storage'));
      return;
    }
    try {
      localStorage.removeItem('replate_user_profile');
    } catch (error) {
      console.error('Could not clear the cached REPLATE profile during logout.', error);
    }
    setIsEditingProfile(false);
    setIsEditingFoodPreferences(false);
    setActiveTab('home');
    setHistory(['home']);
    setIsContextualTab(false);
    setActiveUserEmail(null);
    setUserProfile(INITIAL_USER_PROFILE);
    setIngredients([]);
    setStats({ ...EMPTY_USER_STATS });
    setImpactStats({ ...EMPTY_USER_STATS });
    setIsLogoutConfirmationOpen(false);
    navigateMode('login');
  };

  const handleAppPreferencesChange = (nextPreferences: AppPreferences): boolean => {
    try {
      saveAppPreferences(nextPreferences);
      setAppPreferences(nextPreferences);
      return true;
    } catch (error) {
      console.error('Could not save REPLATE app preferences.', error);
      showToast(t('profile.appPreferences.saveError'));
      return false;
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleNavigate = (tab: MainTab) => {
    sound.playTap();
    setHistory((prev) => [...prev, tab]);
    setIsContextualTab(true);
    setActiveTab(tab);
    if (tab !== 'recipe') {
      updateSelectedRecipeId(null);
      updateSelectedRecipeIngredient(null);
      const url = new URL(window.location.href);
      url.searchParams.delete('recipeId');
      url.searchParams.delete('recipeFrom');
      url.searchParams.delete('ingredient');
      url.searchParams.delete('ingredientFrom');
      window.history.replaceState(window.history.state, '', url);
    }
  };

  const handlePrimaryNavigate = (tab: MainTab) => {
    sound.playTap();
    setHistory([tab]);
    setIsContextualTab(false);
    setActiveTab(tab);
    updateSelectedRecipeId(null);
    updateSelectedRecipeIngredient(null);
    setRecipeReturnTab('recipe');
    setRecipeContextReturnTab('inventory');
    const url = new URL(window.location.href);
    url.searchParams.delete('recipeId');
    url.searchParams.delete('recipeFrom');
    url.searchParams.delete('ingredient');
    url.searchParams.delete('ingredientFrom');
    window.history.replaceState(window.history.state, '', url);
  };

  const handleCookWithIngredient = (ingredient: Ingredient) => {
    const returnTab = activeTab;
    const url = new URL(window.location.href);
    url.searchParams.delete('recipeId');
    url.searchParams.delete('recipeFrom');
    url.searchParams.set('ingredient', ingredient.name);
    url.searchParams.set('ingredientFrom', returnTab);
    window.history.pushState(
      { ingredient: ingredient.name, ingredientFrom: returnTab, replateContext: true },
      '',
      url,
    );
    updateSelectedRecipeId(null);
    updateSelectedRecipeIngredient(ingredient.name);
    setRecipeContextReturnTab(returnTab);
    setActiveTab('recipe');
    setIsContextualTab(true);
    setHistory((previous) => [...previous, 'recipe']);
  };

  const handleSelectRecipe = (recipeId: string | null) => {
    if (!recipeId) {
      const url = new URL(window.location.href);
      url.searchParams.delete('recipeId');
      url.searchParams.delete('recipeFrom');
      window.history.replaceState(window.history.state, '', url);
      updateSelectedRecipeId(null);
      setRecipeReturnTab('recipe');
      return;
    }

    const returnTab = activeTab;
    const url = new URL(window.location.href);
    url.searchParams.set('recipeId', recipeId);
    url.searchParams.set('recipeFrom', returnTab);
    window.history.pushState(
      { recipeId, recipeFrom: returnTab, replateRecipeDetail: true },
      '',
      url,
    );
    setRecipeReturnTab(returnTab);
    updateSelectedRecipeId(recipeId);
  };

  const handleBack = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop();
      const prevTab = newHistory[newHistory.length - 1];
      setHistory(newHistory);
      setIsContextualTab(newHistory.length > 1);
      setActiveTab(prevTab);
      if (prevTab !== 'recipe') {
        updateSelectedRecipeId(null);
        updateSelectedRecipeIngredient(null);
        const url = new URL(window.location.href);
        url.searchParams.delete('recipeId');
        url.searchParams.delete('recipeFrom');
        url.searchParams.delete('ingredient');
        url.searchParams.delete('ingredientFrom');
        window.history.replaceState(window.history.state, '', url);
      }
    } else {
      setActiveTab('home');
      setIsContextualTab(false);
      updateSelectedRecipeId(null);
      updateSelectedRecipeIngredient(null);
      const url = new URL(window.location.href);
      url.searchParams.delete('recipeId');
      url.searchParams.delete('recipeFrom');
      url.searchParams.delete('ingredient');
      url.searchParams.delete('ingredientFrom');
      window.history.replaceState(window.history.state, '', url);
    }
  };

  const handleRecipeDetailBack = () => {
    if (window.history.state?.replateRecipeDetail === true) {
      window.history.back();
      return;
    }

    const fallbackTab = recipeReturnTab;
    const url = new URL(window.location.href);
    url.searchParams.delete('recipeId');
    url.searchParams.delete('recipeFrom');
    if (fallbackTab !== 'recipe') {
      url.searchParams.delete('ingredient');
      url.searchParams.delete('ingredientFrom');
      updateSelectedRecipeIngredient(null);
    }
    window.history.replaceState({}, '', url);
    updateSelectedRecipeId(null);
    setRecipeReturnTab('recipe');
    if (fallbackTab !== 'recipe') {
      setActiveTab(fallbackTab);
      setIsContextualTab(true);
      setHistory((previous) => previous.at(-1) === fallbackTab
        ? previous
        : [...previous, fallbackTab]);
    }
  };

  const handlePageBack = () => {
    if (selectedRecipeId) {
      handleRecipeDetailBack();
    } else if (selectedRecipeIngredient) {
      if (window.history.state?.replateContext === true) {
        window.history.back();
      } else {
        handleBack();
      }
    } else if (isEditingProfile) {
      setIsEditingProfile(false);
    } else if (isEditingFoodPreferences) {
      setIsEditingFoodPreferences(false);
    } else {
      handleBack();
    }
  };

  const handleAddIngredients = (newItems: Array<Omit<Ingredient, 'id'>>) => {
    const formatted: Ingredient[] = newItems.map((item, idx) => ({
      ...item,
      id: `ing-new-${Date.now()}-${idx}`,
    }));

    setIngredients((prev) => {
      const combined = [...formatted, ...prev];
      return rankIngredients(combined);
    });

    setStats((prev) => ({
      ...prev,
      foodManaged: prev.foodManaged + formatted.length,
    }));
    setImpactStats((prev) => ({
      ...prev,
      foodManaged: prev.foodManaged + formatted.length,
    }));
    showToast(t('toasts.addedToInventory', { count: formatted.length }));
  };

  const handleConsumeIngredient = (id: string) => {
    const target = ingredients.find((i) => i.id === id);
    if (!target || !isActiveIngredient(target)) return;

    setIngredients((prev) => {
      const updated = prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            quantity: '0 g',
            consumed: true,
            status: 'consumed' as const,
            useFirstScore: 0,
            urgency: 'Low' as const,
            daysLeft: 0,
          };
        }
        return item;
      });

      // Recalculate rank for all active items
      const activeItems = updated.filter(isActiveIngredient);
      const rankedActive = rankIngredients(activeItems);
      const consumedItems = updated.filter((item) => !isActiveIngredient(item));

      return [...rankedActive, ...consumedItems];
    });

    setStats((prev) => ({
      ...prev,
      weekSavedCount: prev.weekSavedCount + 1,
    }));

    setImpactStats((prev) => ({
      ...prev,
      weekSavedCount: prev.weekSavedCount + 1,
    }));

    showToast(t('toasts.ingredientConsumed', {
      name: getFoodDisplayName(target.name),
      weight: 0,
    }));
  };

  const handleRemoveIngredient = (id: string) => {
    const target = ingredients.find((i) => i.id === id);
    setIngredients((prev) => {
      const remaining = prev.filter((i) => i.id !== id);
      return rankIngredients(remaining);
    });
    showToast(t('toasts.removedFromInventory', {
      name: target ? getFoodDisplayName(target.name) : t('inventory.title'),
    }));
  };

  const handleCookRecipeComplete = (recipe: Recipe) => {
    sound.playSuccess();
    const usedIngredientIds = ingredients
      .filter((item) =>
        isActiveIngredient(item) &&
        recipe.consumeAmounts?.[item.id] !== undefined &&
        recipe.ingredients.some((recipeIngredient) =>
          isRecipeIngredientAvailable(recipeIngredient.name, [item]),
        ),
      )
      .map((item) => item.id);
    const usedIngredientIdSet = new Set(usedIngredientIds);

    setIngredients((prev) => {
      const updated = prev.map((item) => {
        if (!usedIngredientIdSet.has(item.id)) return item;
        const mappedQuantity = recipe.consumeAmounts?.[item.id];
        if (mappedQuantity === undefined) return item;
        const quantityIsZero = !isActiveIngredient({ ...item, quantity: mappedQuantity });
        return {
          ...item,
          quantity: mappedQuantity,
          consumed: quantityIsZero,
          status: quantityIsZero ? ('consumed' as const) : item.status,
          useFirstScore: quantityIsZero ? 0 : item.useFirstScore,
          urgency: quantityIsZero ? ('Low' as const) : item.urgency,
          daysLeft: quantityIsZero ? 0 : item.daysLeft,
        };
      });

      const activeItems = updated.filter(isActiveIngredient);
      const rankedActive = rankIngredients(activeItems);
      const consumedItems = updated.filter((item) => !isActiveIngredient(item));
      return [...rankedActive, ...consumedItems];
    });

    setStats((prev) => ({
      ...prev,
      weekSavedCount: prev.weekSavedCount + usedIngredientIds.length,
    }));

    setImpactStats((prev) => ({
      ...prev,
      weekSavedCount: prev.weekSavedCount + usedIngredientIds.length,
    }));

    showToast(t('toasts.mealMarkedCooked', {
      title: getRecipeTitle(recipe.id, recipe.title),
      saved: '',
    }));
  };

  const handleCookRecipeFromUseFirst = (recipeId: string) => {
    handleSelectRecipe(recipeId);
    handleNavigate('recipe');
  };

  const handleAddMissingIngredientsToBasket = (items: Array<{ name: string; quantity: string }>) => {
    if (items.length === 0) return;
    setPendingBasketItems(items);
    handleNavigate('shopping');
  };

  const handleBasketItemsQueued = useCallback(() => {
    setPendingBasketItems([]);
  }, []);

  const handleResetData = () => {
    sound.playTap();
    setIngredients([]);
    setStats({ ...EMPTY_USER_STATS });
    setImpactStats({ ...EMPTY_USER_STATS });
    setActiveTab('home');
    setHistory(['home']);
    setIsContextualTab(false);
    showToast(t('toasts.resetDefault'));
  };

  const handleLoadScenario = (scenario: 'urgent' | 'restocked' | 'empty') => {
    if (scenario === 'urgent') {
      setIngredients(INITIAL_INGREDIENTS);
      showToast(t('toasts.scenarioUrgent'));
    } else if (scenario === 'restocked') {
      const restocked = INITIAL_INGREDIENTS.map((item) => ({
        ...item,
        daysLeft: item.daysLeft + 6,
        urgency: 'Low' as const,
        freshnessPercent: 95,
        useFirstScore: Math.max(15, item.useFirstScore - 40),
      }));
      setIngredients(restocked);
      showToast(t('toasts.scenarioRestocked'));
    } else if (scenario === 'empty') {
      setIngredients([]);
      showToast(t('toasts.scenarioEmpty'));
    }
  };

  const priorityItems = getUseFirstPriorityIngredients(ingredients);
  const urgentCount = priorityItems.length;
  const headerPriorityItems = appPreferences.notificationsEnabled && appPreferences.ingredientRemindersEnabled
    ? priorityItems
    : [];
  const recipeContextIngredient = selectedRecipeIngredient
    ? ingredients.find((item) => ingredientsMatch(item.name, selectedRecipeIngredient)) ?? null
    : null;
  const recipesForCurrentContext = React.useMemo(() => {
    const smart = generateSmartRecipesForInventory(
      ingredients,
      selectedRecipeIngredient ?? undefined,
    );
    if (selectedRecipeId && !smart.some((r) => r.id === selectedRecipeId)) {
      const recovered = getSmartRecipeById(selectedRecipeId, ingredients);
      if (recovered) return [recovered, ...smart];
      const fallback = MOCK_RECIPES.find((r) => r.id === selectedRecipeId);
      if (fallback) return [fallback, ...smart];
    }
    return smart;
  }, [ingredients, selectedRecipeIngredient, selectedRecipeId]);
  const handleHeaderSearch = (query: string) => {
    const normalizedQuery = query.toLocaleLowerCase();
    const matchingIngredient = ingredients.find((item) =>
      isActiveIngredient(item) &&
      `${item.name} ${getFoodDisplayName(item.name)}`.toLocaleLowerCase().includes(normalizedQuery),
    );
    if (matchingIngredient) {
      setSelectedPriorityIngredientId(matchingIngredient.id);
      handleNavigate('use_first');
      return;
    }

    const matchingRecipe = recipesForCurrentContext.find((recipe) =>
      `${getRecipeTitle(recipe.id, recipe.title)} ${recipe.ingredients.map((item) => item.name).join(' ')}`
        .toLocaleLowerCase()
        .includes(normalizedQuery),
    );
    if (matchingRecipe) {
      handleNavigate('recipe');
      handleSelectRecipe(matchingRecipe.id);
      return;
    }

    handleNavigate('recipe');
  };

  return (
    <AppShell
      desktopHeader={
        appMode === 'app' ? (
          <DesktopHeader
            profile={userProfile}
            priorityItems={headerPriorityItems}
            onNavigate={(tab) => {
              if (tab === 'profile') {
                setIsEditingProfile(false);
                setIsEditingFoodPreferences(false);
              }
              handlePrimaryNavigate(tab);
            }}
            onSelectPriority={(ingredientId) => {
              setSelectedPriorityIngredientId(ingredientId);
              handleNavigate('use_first');
            }}
            onOpenPreferences={() => setIsAppPreferencesOpen(true)}
            onLogout={() => setIsLogoutConfirmationOpen(true)}
            onSearch={handleHeaderSearch}
          />
        ) : null
      }
      header={
        appMode === 'app' ? (
          <MobileHeader
            onNavigate={(tab) => {
              if (tab === 'profile') {
                setIsEditingProfile(false);
                setIsEditingFoodPreferences(false);
              }
              handlePrimaryNavigate(tab);
            }}
            avatarUrl={userProfile.avatar}
            userName={userProfile.name}
            profile={userProfile}
            onOpenPreferences={() => setIsAppPreferencesOpen(true)}
            onLogout={() => setIsLogoutConfirmationOpen(true)}
            priorityItems={headerPriorityItems}
            onSelectPriority={(ingredientId) => {
              setSelectedPriorityIngredientId(ingredientId);
              handleNavigate('use_first');
            }}
          />
        ) : null
      }
      pageBack={
        appMode === 'app' && (
          selectedRecipeId ||
          selectedRecipeIngredient ||
          isEditingProfile ||
          isEditingFoodPreferences ||
          isContextualTab
        ) ? <PageBackButton onBack={handlePageBack} /> : null
      }
      bottomNav={
        appMode === 'app' && !isEditingProfile && !isEditingFoodPreferences ? (
          <BottomNav
            activeTab={activeTab}
            onTabChange={handlePrimaryNavigate}
            urgentCount={urgentCount}
          />
        ) : null
      }
    >
      {appMode === 'landing' && (
        <LandingScreen
          onRegister={() => navigateMode('register')}
          onLogin={() => navigateMode('login')}
        />
      )}

      {appMode === 'onboarding' && (
        <OnboardingScreen
          onComplete={() => {
            setActiveTab('home');
            setHistory(['home']);
            setIsContextualTab(false);
            navigateMode('app');
          }}
        />
      )}

      {appMode === 'preferences' && (
        <PreferenceSetupScreen
          initialPreferences={userProfile.foodPreferences}
          userName={userProfile.name}
          mode="onboarding"
          onSave={(preferences) => {
            const nextProfile = {
              ...userProfile,
              foodPreferences: preferences,
              dietaryPreferences: [
                ...preferences.favoriteCategories,
                ...preferences.nutritionPreferences.filter((item) => item !== 'noSpecificPreference'),
              ],
              foodDislikes: [...preferences.avoidedFoods.filter((item) => item !== 'none'), ...preferences.customAvoidedFoods],
            };
            if (!persistUserProfile(nextProfile)) return false;
            return true;
          }}
          onComplete={() => {
            setActiveTab('home');
            setHistory(['home']);
            setIsContextualTab(false);
            navigateMode('app');
          }}
        />
      )}

      {(appMode === 'register' || appMode === 'login' || appMode === 'register-success') && (
        <AuthScreen
          mode={
            appMode === 'register-success'
              ? 'success'
              : appMode === 'register'
                ? 'register'
                : 'login'
          }
          onBack={() => navigateMode(appMode === 'register-success' ? 'onboarding' : 'landing')}
          onNavigate={(mode) => navigateMode(mode)}
          onSubmit={handleAuthSubmit}
          onSuccess={handleAuthSuccess}
          onContinue={() => navigateMode('onboarding')}
        />
      )}

      {/* 3. MAIN APP SCREENS */}
      {appMode === 'app' && activeTab === 'home' && (
        <HomeScreen
          stats={{ ...stats, potentiallySaved: priorityItems.length }}
          ingredients={ingredients}
          userName={userProfile.name}
          showRecipeRecommendations={appPreferences.recipeRecommendationsEnabled}
          onNavigate={handleNavigate}
          onSelectIngredient={() => handleNavigate('use_first')}
          onCookRecipe={handleCookRecipeFromUseFirst}
          onOpenRecipe={(recipeId) => {
            handleNavigate('recipe');
            handleSelectRecipe(recipeId);
          }}
        />
      )}

      {appMode === 'app' && activeTab === 'scan' && (
        <ScanScreen
          onAddIngredients={handleAddIngredients}
          onNavigate={handleNavigate}
        />
      )}

      {appMode === 'app' && activeTab === 'use_first' && (
        <UseFirstScreen
          ingredients={ingredients}
          initialPriorityIngredientId={selectedPriorityIngredientId}
          onPriorityItemHandled={() => setSelectedPriorityIngredientId(null)}
          onNavigate={handleNavigate}
          onCookRecipe={handleCookRecipeFromUseFirst}
          onConsumeIngredient={handleConsumeIngredient}
        />
      )}

      {appMode === 'app' && activeTab === 'inventory' && (
        <InventoryScreen
          ingredients={ingredients}
          onNavigate={handleNavigate}
          onConsumeIngredient={handleConsumeIngredient}
          onRemoveIngredient={handleRemoveIngredient}
          onCookWithIngredient={handleCookWithIngredient}
        />
      )}

      {appMode === 'app' && activeTab === 'recipe' && (
        <RecipeScreen
          recipes={recipesForCurrentContext}
          ingredients={ingredients}
          selectedIngredient={recipeContextIngredient}
          selectedRecipeId={selectedRecipeId}
          onSelectRecipe={handleSelectRecipe}
          onNavigate={handleNavigate}
          onCookRecipeComplete={handleCookRecipeComplete}
          onAddMissingIngredients={handleAddMissingIngredientsToBasket}
        />
      )}

      {appMode === 'app' && activeTab === 'shopping' && (
        <ShoppingScreen
          ingredients={ingredients}
          profile={userProfile}
          userEmail={activeUserEmail ?? userProfile.email}
          onNavigate={handleNavigate}
          onRestockItems={handleAddIngredients}
          pendingBasketItems={pendingBasketItems}
          onBasketItemsQueued={handleBasketItemsQueued}
        />
      )}

      {appMode === 'app' && activeTab === 'impact' && (
        <ImpactScreen
          stats={{ ...impactStats, potentiallySaved: priorityItems.length }}
          onNavigate={handleNavigate}
        />
      )}

      {appMode === 'app' && activeTab === 'profile' && isEditingProfile && (
        <EditProfileScreen
          profile={userProfile}
          onCancel={() => setIsEditingProfile(false)}
          onSave={(nextProfile) => {
            if (!persistUserProfile(nextProfile)) return false;
            setIsEditingProfile(false);
            showToast(t('screens.profile.editSuccess'));
            return true;
          }}
        />
      )}

      {appMode === 'app' && activeTab === 'profile' && !isEditingProfile && !isEditingFoodPreferences && (
        <ProfileScreen
          profile={userProfile}
          onEditProfile={() => setIsEditingProfile(true)}
          onEditFoodPreferences={() => setIsEditingFoodPreferences(true)}
          onNavigate={handleNavigate}
          onResetData={handleResetData}
          onLoadScenario={handleLoadScenario}
          onReplayOnboarding={() => navigateMode('onboarding')}
          onLogout={() => setIsLogoutConfirmationOpen(true)}
          appPreferences={appPreferences}
          onChangeAppPreferences={handleAppPreferencesChange}
        />
      )}

      {appMode === 'app' && activeTab === 'profile' && isEditingFoodPreferences && (
        <PreferenceSetupScreen
          initialPreferences={userProfile.foodPreferences}
          userName={userProfile.name}
          mode="edit"
          onSave={(preferences) => persistUserProfile({
            ...userProfile,
            foodPreferences: preferences,
            dietaryPreferences: [
              ...preferences.favoriteCategories,
              ...preferences.nutritionPreferences.filter((item) => item !== 'noSpecificPreference'),
            ],
            foodDislikes: [...preferences.avoidedFoods.filter((item) => item !== 'none'), ...preferences.customAvoidedFoods],
          })}
          onComplete={() => {
            setIsEditingFoodPreferences(false);
            showToast(t('preferenceSetup.savedToast'));
          }}
          onCancel={() => setIsEditingFoodPreferences(false)}
        />
      )}

      {appMode === 'app' && isAppPreferencesOpen && (
        <AppPreferencesDialog
          preferences={appPreferences}
          onChange={handleAppPreferencesChange}
          onClose={() => setIsAppPreferencesOpen(false)}
          onEditFoodPreferences={() => {
            setIsAppPreferencesOpen(false);
            handleNavigate('profile');
            setIsEditingFoodPreferences(true);
          }}
        />
      )}

      {appMode === 'app' && isLogoutConfirmationOpen && (
        <div
          className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
          onClick={() => setIsLogoutConfirmationOpen(false)}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="replate-logout-title"
            className="w-full max-w-sm rounded-3xl border border-[#EDE8DD] bg-[#FAF8F5] p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="replate-logout-title" className="font-['Outfit'] text-lg font-bold text-[#1B4332]">
              {t('profile.logoutConfirmationTitle')}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#738B7C]">
              {t('profile.logoutConfirmationBody')}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                autoFocus
                onClick={() => setIsLogoutConfirmationOpen(false)}
                className="min-h-11 flex-1 rounded-xl border border-[#E3E8DF] bg-white text-sm font-bold text-[#425E4A]"
              >
                {t('actions.cancel')}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="min-h-11 flex-1 rounded-xl bg-[#A45141] text-sm font-bold text-white"
              >
                {t('actions.logOut')}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Native-style Floating Toast Message */}
      {toastMessage && (
        <div className="absolute top-4 inset-x-4 z-50 flex justify-center pointer-events-none animate-bounce">
          <div className="bg-[#1B4332] text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 border border-[#52B788]/40">
            <span className="text-sm">🌱</span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default App;
