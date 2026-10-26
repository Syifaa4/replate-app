import type { Ingredient, UserProfile } from '../types';
import { isActiveIngredient } from '../utils/inventoryStatus';

export type RestockStatus = 'buyNow' | 'buySoon' | 'dontBuyYet';

export interface RestockRecommendation {
  id: string;
  ingredientId: string;
  productId: string;
  name: string;
  emoji: string;
  category: Ingredient['category'];
  currentStock: number;
  unit: string;
  currentQuantity: string;
  estimatedDaysLeft: number;
  recommendedQuantity: string;
  packageCount: number;
  status: RestockStatus;
  expiryWarning: boolean;
}

export interface Retailer {
  id: 'alfagift' | 'klikindomaret';
  name: string;
  website: string;
  deliveryFeeRp: number;
  freeDeliveryAtRp: number;
  deliveryTime: string;
}

export interface RetailerOffer {
  retailer: Retailer;
  priceRp: number;
  availability: 'available' | 'limited' | 'unavailable';
  totalRp: number;
}

interface ProductDefinition {
  id: string;
  name: string;
  aliases: string[];
  emoji: string;
  category: Ingredient['category'];
  unit: string;
  dailyUsePerPerson: number;
  packageSize: number;
  packageLabel: string;
  basePriceRp: number;
}

const PRODUCTS: ProductDefinition[] = [
  { id: 'milk', name: 'Milk', aliases: ['milk', 'susu'], emoji: '🥛', category: 'Dairy', unit: 'ml', dailyUsePerPerson: 180, packageSize: 1000, packageLabel: '1 L', basePriceRp: 22000 },
  { id: 'tomato', name: 'Tomato', aliases: ['tomato', 'tomatoes', 'tomat'], emoji: '🍅', category: 'Vegetables', unit: 'pcs', dailyUsePerPerson: 0.5, packageSize: 4, packageLabel: '4 pcs', basePriceRp: 16000 },
  { id: 'eggs', name: 'Eggs', aliases: ['egg', 'eggs', 'telur'], emoji: '🥚', category: 'Protein', unit: 'pcs', dailyUsePerPerson: 0.45, packageSize: 10, packageLabel: '10 pcs', basePriceRp: 30000 },
  { id: 'carrot', name: 'Carrot', aliases: ['carrot', 'carrots', 'wortel'], emoji: '🥕', category: 'Vegetables', unit: 'pcs', dailyUsePerPerson: 0.15, packageSize: 5, packageLabel: '5 pcs', basePriceRp: 14000 },
  { id: 'rice', name: 'Rice', aliases: ['rice', 'beras', 'nasi'], emoji: '🍚', category: 'Others', unit: 'g', dailyUsePerPerson: 150, packageSize: 1000, packageLabel: '1 kg', basePriceRp: 75000 },
  { id: 'chicken', name: 'Chicken', aliases: ['chicken', 'ayam'], emoji: '🍗', category: 'Protein', unit: 'g', dailyUsePerPerson: 100, packageSize: 500, packageLabel: '500 g', basePriceRp: 38000 },
  { id: 'spinach', name: 'Spinach', aliases: ['spinach', 'bayam'], emoji: '🥬', category: 'Vegetables', unit: 'g', dailyUsePerPerson: 30, packageSize: 250, packageLabel: '250 g', basePriceRp: 10000 },
  { id: 'tofu', name: 'Tofu', aliases: ['tofu', 'tahu'], emoji: '🟨', category: 'Protein', unit: 'g', dailyUsePerPerson: 50, packageSize: 300, packageLabel: '300 g', basePriceRp: 12000 },
  { id: 'fish', name: 'Fish', aliases: ['fish', 'ikan'], emoji: '🐟', category: 'Protein', unit: 'g', dailyUsePerPerson: 75, packageSize: 400, packageLabel: '400 g', basePriceRp: 60000 },
];

export const DEMO_RETAILERS: Retailer[] = [
  {
    id: 'alfagift',
    name: 'Alfagift',
    website: 'https://alfagift.id/',
    deliveryFeeRp: 15000,
    freeDeliveryAtRp: 150000,
    deliveryTime: '60–120 min',
  },
  {
    id: 'klikindomaret',
    name: 'Klik Indomaret',
    website: 'https://klikindomaret.com/',
    deliveryFeeRp: 10000,
    freeDeliveryAtRp: 100000,
    deliveryTime: '90–180 min',
  },
];

const DEMO_AVAILABILITY: Record<string, RetailerOffer['availability'][]> = {
  milk: ['available', 'available'],
  tomato: ['limited', 'available'],
  eggs: ['available', 'limited'],
  carrot: ['available', 'available'],
  rice: ['available', 'available'],
  chicken: ['limited', 'available'],
  spinach: ['available', 'unavailable'],
  tofu: ['available', 'available'],
  fish: ['limited', 'available'],
};

const normalize = (value: string) => value.trim().toLocaleLowerCase();

function matchesProductName(name: string, product: ProductDefinition): boolean {
  const normalized = normalize(name);
  return product.aliases.some((alias) => (
    normalized === alias
    || normalized.startsWith(`${alias} `)
    || normalized.endsWith(` ${alias}`)
    || normalized.includes(` ${alias} `)
  ));
}

function getProductForIngredient(ingredient: Ingredient): ProductDefinition | undefined {
  const canonicalId = ingredient.canonicalId?.trim().toLocaleLowerCase();
  if (canonicalId) {
    const canonicalMatch = PRODUCTS.find((product) =>
      product.id === canonicalId || product.aliases.includes(canonicalId),
    );
    if (canonicalMatch) return canonicalMatch;
  }

  return PRODUCTS.find((product) => matchesProductName(ingredient.name, product));
}

export function isRestockFoodAvoided(name: string, foodsToAvoid: string[]): boolean {
  const product = PRODUCTS.find((candidate) => matchesProductName(name, candidate));
  return foodsToAvoid.some((food) => (
    product ? matchesProductName(food, product) : normalize(name) === normalize(food)
  ));
}

function parseQuantity(quantity: string, product: ProductDefinition): number {
  const match = quantity.match(/(\d+(?:[.,]\d+)?)\s*([a-zA-Z]*)/);
  if (!match) return 0;
  const amount = Number(match[1].replace(',', '.'));
  const unit = match[2].toLowerCase();
  if (!Number.isFinite(amount)) return 0;

  if (product.unit === 'ml') {
    if (unit === 'l' || unit === 'liter' || unit === 'litre') return amount * 1000;
    if (unit === 'glass' || unit === 'glasses' || unit === 'cup' || unit === 'cups') return amount * 250;
    if (unit === 'bottle' || unit === 'bottles') return amount * 1000;
    return amount;
  }
  if (product.unit === 'g') {
    if (unit === 'kg') return amount * 1000;
    if (['whole', 'fillet', 'portion', 'bunch', 'piece', 'pieces', 'pc', 'pcs'].includes(unit)) {
      return amount * product.packageSize;
    }
    return amount;
  }
  if (unit === 'dozen') return amount * 12;
  if (unit === 'pack' || unit === 'packs') return amount * product.packageSize;
  return amount;
}

function shoppingCycleDays(frequency: string): number {
  const value = normalize(frequency);
  if (value.includes('daily') || value.includes('harian')) return 1;
  if (value.includes('twice') || value.includes('2x') || value.includes('dua kali')) return 3.5;
  if (value.includes('biweekly') || value.includes('two weeks') || value.includes('dua minggu')) return 14;
  if (value.includes('monthly') || value.includes('bulanan')) return 30;
  return 7;
}

function householdCount(householdSize: string): number {
  const parsed = Number.parseInt(householdSize, 10);
  return Number.isFinite(parsed) ? Math.max(1, Math.min(parsed, 12)) : 2;
}

export function getRestockRecommendations(
  ingredients: Ingredient[],
  profile: UserProfile,
): RestockRecommendation[] {
  const activeIngredients = ingredients.filter(
    (ingredient) => isActiveIngredient(ingredient) && ingredient.status !== 'expired',
  );
  if (activeIngredients.length === 0) return [];

  const people = householdCount(profile.householdSize);
  const cycleDays = shoppingCycleDays(profile.shoppingFrequency);

  return activeIngredients.flatMap((ingredient) => {
    const product = getProductForIngredient(ingredient);
    if (!product) return [];

    const currentStock = parseQuantity(ingredient.quantity, product);
    const demand = product.dailyUsePerPerson * people * cycleDays;
    const coverage = demand > 0 ? currentStock / demand : 0;
    const daysLeft = product.dailyUsePerPerson * people > 0
      ? currentStock / (product.dailyUsePerPerson * people)
      : 0;
    const expiryWarning = ingredient.daysLeft <= cycleDays;
    const status: RestockStatus = currentStock <= 0 || (coverage <= 0.15 && !expiryWarning)
      ? 'buyNow'
      : coverage <= 0.55
        ? 'buySoon'
        : 'dontBuyYet';
    const needed = Math.max(0, demand - currentStock);
    const packages = needed === 0 ? 0 : Math.ceil(needed / product.packageSize);

    return {
      id: ingredient.id,
      ingredientId: ingredient.id,
      productId: product.id,
      name: ingredient.name,
      emoji: ingredient.emoji,
      category: product.category,
      currentStock,
      unit: product.unit,
      currentQuantity: ingredient.quantity || '0',
      estimatedDaysLeft: Math.floor(daysLeft),
      recommendedQuantity: status !== 'dontBuyYet' && packages > 0 ? `${packages} × ${product.packageLabel}` : '',
      packageCount: status !== 'dontBuyYet' ? packages : 0,
      status,
      expiryWarning,
    };
  });
}

export function getRetailerOffers(recommendation: RestockRecommendation): RetailerOffer[] {
  const product = PRODUCTS.find(({ id }) => id === recommendation.productId);
  if (!product) return [];
  const availability = DEMO_AVAILABILITY[product.id] ?? ['available', 'available'];
  const prices = [product.basePriceRp, Math.round(product.basePriceRp * 0.96)];
  const packageCount = Math.max(1, recommendation.packageCount);

  return DEMO_RETAILERS.map((retailer, index) => {
    const priceRp = prices[index] * packageCount;
    const stock = availability[index] ?? 'available';
    const totalRp = priceRp + (priceRp >= retailer.freeDeliveryAtRp ? 0 : retailer.deliveryFeeRp);
    return { retailer, priceRp, availability: stock, totalRp };
  });
}

export function getBestRetailer(offers: RetailerOffer[]): RetailerOffer | undefined {
  return offers
    .filter((offer) => offer.availability !== 'unavailable')
    .sort((first, second) => first.totalRp - second.totalRp)[0];
}
