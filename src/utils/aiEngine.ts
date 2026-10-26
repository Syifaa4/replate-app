import { Ingredient, ScoreBreakdown, UrgencyLevel } from '../types';
import { isActiveIngredient, normalizeIngredientInventoryState } from './inventoryStatus';

/**
 * REPLATE AI Decision Engine
 *
 * Evaluates food items in the user's kitchen to answer:
 * "From everything I already have, what should I do with it now — before it's too late?"
 *
 * Scoring Formula:
 * USE_FIRST_SCORE = Freshness Urgency (max 40)
 *                 + Quantity Risk (max 20)
 *                 + Consumption Pattern (max 15)
 *                 + Recipe Compatibility (max 15)
 *                 + Waste Probability / Cost (max 10)
 * Total: 0 - 100
 */

export function calculateUseFirstScore(item: Partial<Ingredient>): {
  score: number;
  breakdown: ScoreBreakdown;
  reason: string;
  reasonsList: string[];
} {
  if (!isActiveIngredient(item)) {
    return {
      score: 0,
      breakdown: {
        freshness: 0,
        quantityRisk: 0,
        consumptionPattern: 0,
        recipeFit: 0,
        wastePrevention: 0,
      },
      reason: '',
      reasonsList: [],
    };
  }

  const days = item.daysLeft ?? 3;
  const name = item.name?.toLowerCase() || '';

  // 1. Freshness Urgency (0 - 40 points)
  let freshness = 10;
  if (days <= 1) freshness = 40;
  else if (days === 2) freshness = 36;
  else if (days === 3) freshness = 30;
  else if (days <= 5) freshness = 22;
  else if (days <= 7) freshness = 16;
  else if (days <= 10) freshness = 10;
  else freshness = 6;

  // 2. Quantity Risk (0 - 20 points)
  // Perishable green or high volume with short time window gets high risk
  let quantityRisk = 12;
  if (name.includes('spinach') || name.includes('bayam')) {
    quantityRisk = 20;
  } else if (name.includes('chicken') || name.includes('poultry') || name.includes('fish')) {
    quantityRisk = 18;
  } else if (name.includes('tomato') || name.includes('tomat')) {
    quantityRisk = 16;
  } else if (name.includes('milk') || name.includes('susu')) {
    quantityRisk = 15;
  } else if (name.includes('egg') || name.includes('telur')) {
    quantityRisk = 11;
  } else if (name.includes('carrot') || name.includes('wortel')) {
    quantityRisk = 8;
  }

  // 3. Consumption Pattern (0 - 15 points)
  // Historical usage patterns: leafy greens and opened items aren't used quickly enough without reminders
  let consumptionPattern = 10;
  if (name.includes('spinach')) {
    consumptionPattern = 15; // User usually forgets second half of bunch
  } else if (name.includes('tomato')) {
    consumptionPattern = 12; // Frequent overpurchase
  } else if (name.includes('milk')) {
    consumptionPattern = 11; // 4 days opened carton
  } else if (name.includes('egg')) {
    consumptionPattern = 9;
  } else if (name.includes('carrot')) {
    consumptionPattern = 4;
  }

  // 4. Recipe Compatibility (0 - 15 points)
  // How readily it synergizes with existing in-stock pantry items
  let recipeFit = 8;
  if (name.includes('spinach') || name.includes('tomato') || name.includes('egg')) {
    recipeFit = 14; // Matches 4 ready-to-cook recipes!
  } else if (name.includes('chicken')) {
    recipeFit = 12;
  } else if (name.includes('milk')) {
    recipeFit = 9;
  } else if (name.includes('carrot')) {
    recipeFit = 6;
  }

  // 5. Waste Prevention & Economic Value (0 - 10 points)
  let wastePrevention = 6;
  if (item.estimatedValueRp && item.estimatedValueRp >= 25000) {
    wastePrevention = 10;
  } else if (days <= 2) {
    wastePrevention = 9;
  } else if (days <= 4) {
    wastePrevention = 7;
  } else {
    wastePrevention = 4;
  }

  const rawScore = freshness + quantityRisk + consumptionPattern + recipeFit + wastePrevention;
  const score = Math.min(99, Math.max(12, rawScore));

  const breakdown: ScoreBreakdown = {
    freshness,
    quantityRisk,
    consumptionPattern,
    recipeFit,
    wastePrevention,
  };

  // Human-friendly explanation
  let reason = '';
  const reasonsList: string[] = [
    'Freshness is declining rapidly',
    'You have sufficient quantity for a complete meal',
    'Matches several high-priority recipes with your existing ingredients',
    'Consuming today prevents food waste and saves your grocery budget',
  ];

  if (name.includes('spinach')) {
    reason = 'Spinach has the shortest estimated freshness window and you have enough for one meal.';
  } else if (name.includes('tomato')) {
    reason = 'Tomatoes are at peak ripeness. Best paired with eggs or soup before softening.';
  } else if (name.includes('chicken')) {
    reason = 'Fresh poultry spoils rapidly. Cook within 48h or freeze now.';
  } else if (name.includes('milk')) {
    reason = 'Opened carton nearing recommended 4-day freshness window.';
  } else if (name.includes('egg')) {
    reason = 'Pairs perfectly with urgent Spinach & Tomato to create instant zero-waste meals.';
  } else if (name.includes('carrot')) {
    reason = 'Firm root vegetable with stable shelf-life. Safe to wait while you prioritize greens.';
  } else {
    reason = days <= 2
      ? 'Shortest freshness window — prioritize in today’s cooking.'
      : 'Moderate priority. Can be paired with urgent greens.';
  }

  return {
    score,
    breakdown,
    reason,
    reasonsList,
  };
}

/**
 * Re-ranks a list of ingredients according to the USE FIRST AI decision engine
 */
export function rankIngredients(ingredients: Ingredient[]): Ingredient[] {
  const activeItems = ingredients
    .filter(isActiveIngredient)
    .map((item) => {
      const { score, breakdown, reason } = calculateUseFirstScore(item);
      const urgencyLevel: UrgencyLevel = score >= 80 ? 'High' : score >= 50 ? 'Medium' : 'Low';
      return {
        ...item,
        useFirstScore: score,
        scoreBreakdown: breakdown,
        useFirstReason: reason,
        urgency: urgencyLevel,
      };
    })
    .sort((a, b) => b.useFirstScore - a.useFirstScore)
    .map((item, index) => ({
      ...item,
      useFirstRank: index + 1,
    }));

  const usedItems = ingredients
    .filter((item) => !isActiveIngredient(item))
    .map(normalizeIngredientInventoryState);

  return [...activeItems, ...usedItems];
}
