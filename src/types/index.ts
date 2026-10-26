export type UrgencyLevel = 'High' | 'Medium' | 'Low';

export type FoodCategory = 'All' | 'Vegetables' | 'Protein' | 'Dairy' | 'Fruits' | 'Others';

export type InventoryFilter = 'All' | 'Fresh' | 'Use Soon' | 'Expired';

export interface ScoreBreakdown {
  freshness: number;        // Max 40
  quantityRisk: number;     // Max 20
  consumptionPattern: number;// Max 15
  recipeFit: number;        // Max 15
  wastePrevention: number;  // Max 10
}

export type IngredientStatus = 'active' | 'use-soon' | 'fresh' | 'consumed' | 'used' | 'empty' | 'expired';

export interface Ingredient {
  id: string;
  name: string;
  canonicalId?: string;
  emoji: string;
  category: Exclude<FoodCategory, 'All'>;
  quantity: string;
  daysLeft: number;
  urgency: UrgencyLevel;
  storageTip: string;
  estimatedValueRp: number;
  dateAdded: string;
  useFirstScore: number;     // 0 to 100
  useFirstRank?: number;
  useFirstReason?: string;
  scoreBreakdown?: ScoreBreakdown;
  freshnessPercent: number;  // 0 to 100%
  recipeCompatibility?: string;
  consumed?: boolean;
  status?: IngredientStatus;
}

export interface RecipeIngredient {
  name: string;
  amount: string;
  inStock: boolean;
  role?: 'main' | 'supporting' | 'seasoning' | 'optional';
  required?: boolean;
  availableQuantity?: string;
  shortfall?: string;
  urgent?: boolean;
  source?: 'inventory' | 'pantry' | 'needs_purchase';
}

export interface Recipe {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  description?: string;
  cookTime: string;
  prepTime: string;
  totalTime?: string;
  difficulty: 'Easy' | 'Medium' | 'Intermediate';
  costLevel: 'Low cost' | 'Budget friendly' | 'Moderate';
  healthTag: string;
  servings: number;
  calories: number;
  expiringIngredientsCount: number;
  highlight: string;
  whyReplatePicked: string;
  ingredients: RecipeIngredient[];
  steps: string[];
  matchedIngredientIds: string[];
  consumeAmounts?: Record<string, string>; // e.g. { 'ing-1': '0g', 'ing-4': '4 pcs', 'ing-2': '3 pcs' }
  recipeQualityScore?: number;
}

export interface SmartShoppingSectionItem {
  name: string;
  current: string;
  recommended: string;
  note?: string;
  urgency: 'urgent' | 'adjust' | 'stocked';
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  status: 'recommended' | 'in_stock' | 'restock';
  reason: string;
  checked: boolean;
  priceEstimateRp: number;
}

export interface UserStats {
  foodManaged: number;
  potentiallySaved: number;
  moneySavedRp: number;
  wasteAvoidedKg: number;
  co2SavedKg: number;
  weekSavedCount: number;
}

export interface FoodPreferences {
  favoriteCategories: string[];
  avoidedFoods: string[];
  customAvoidedFoods: string[];
  cookingFrequency: string;
  cookingStyles: string[];
  cookingTime: string;
  goals: string[];
  nutritionPreferences: string[];
  completed: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  householdSize: string;
  dietaryPreferences: string[];
  favoriteIngredients: string[];
  foodDislikes: string[];
  shoppingFrequency: string;
  city: string;
  foodPreferences: FoodPreferences;
}

export type MainTab =
  | 'home'
  | 'scan'
  | 'use_first'
  | 'shopping'
  | 'profile'
  | 'inventory'
  | 'recipe'
  | 'impact';
