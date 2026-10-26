import React, { useState } from 'react';
import {
  ChefHat,
  ArrowRight,
  Check,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import { Recipe, MainTab, Ingredient } from '../../types';
import { MOCK_RECIPES } from '../../data/mockData';
import { sound } from '../../utils/sound';
import { useLanguage } from '../../i18n';
import {
  getRecipeMatchSummary,
  isActiveIngredient,
  isRecipeIngredientAvailable,
  rankRecipesForInventory,
} from '../../utils/recipeMatching';
import { getRecipeImage, createFoodFallbackSvg } from '../../utils/imageService';

interface RecipeScreenProps {
  recipes?: Recipe[];
  ingredients?: Ingredient[];
  onNavigate: (tab: MainTab) => void;
  onCookRecipeComplete?: (recipe: Recipe) => void;
  onAddMissingIngredients?: (items: Array<{ name: string; quantity: string }>) => void;
  selectedRecipeId?: string | null;
  selectedIngredient?: Ingredient | null;
  onSelectRecipe: (recipeId: string | null) => void;
}

const RecipeHeroImage: React.FC<{ recipe: Recipe }> = ({ recipe }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = recipe.image || getRecipeImage(recipe.title);

  if (imageFailed) {
    return (
      <img
        src={createFoodFallbackSvg(recipe.title)}
        alt={recipe.title}
        className="h-full w-full object-cover"
      />
    );
  }

  return (
    <img
      src={imageUrl}
      alt={recipe.title}
      className="h-full w-full object-cover"
      onError={() => setImageFailed(true)}
    />
  );
};

export const RecipeScreen: React.FC<RecipeScreenProps> = ({
  recipes = MOCK_RECIPES,
  ingredients = [],
  onNavigate,
  onCookRecipeComplete,
  onAddMissingIngredients,
  selectedRecipeId = null,
  selectedIngredient = null,
  onSelectRecipe,
}) => {
  const { t, getRecipeTitle, getRecipeSubtitle, getRecipeContent, getFoodDisplayName, formatQuantity } = useLanguage();
  const selectedRecipe = selectedRecipeId
    ? recipes.find((recipe) => recipe.id === selectedRecipeId) ?? null
    : null;
  const [activeStep, setActiveStep] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [missingSelection, setMissingSelection] = useState<{ recipeId: string; keys: string[] } | null>(null);

  // Active inventory items (unconsumed and non-zero)
  const activeItems = ingredients.filter(isActiveIngredient);

  const isIngredientUrgent = (recipeIngName: string): boolean => {
    return activeItems.some((item) =>
      isRecipeIngredientAvailable(recipeIngName, [item]) &&
      (item.daysLeft <= 3 || item.useFirstScore >= 65),
    );
  };

  const sortedRecipes = rankRecipesForInventory(recipes, activeItems);

  const featuredRecipe = sortedRecipes[0];
  const otherRecipes = sortedRecipes.slice(1);
  const featuredMatchSummary = featuredRecipe
    ? getRecipeMatchSummary(featuredRecipe, activeItems)
    : null;
  const selectedMatchSummary = selectedRecipe
    ? getRecipeMatchSummary(selectedRecipe, activeItems)
    : null;

  const selectedAvailableIngredients = selectedRecipe
    ? selectedMatchSummary?.availableIngredients.map((match) => match.ingredient) ?? []
    : [];
  const selectedMissingIngredients = selectedRecipe
    ? selectedMatchSummary?.missingIngredients.map((match) => match.ingredient) ?? []
    : [];
  const defaultMissingKeys = selectedMissingIngredients.map((ingredient) =>
    `${ingredient.name}::${ingredient.amount}`,
  );
  const selectedMissingKeys = selectedRecipe && missingSelection?.recipeId === selectedRecipe.id
    ? missingSelection.keys
    : defaultMissingKeys;

  const featuredInventoryItems = featuredRecipe
    ? [...new Map((featuredMatchSummary?.availableIngredients ?? [])
      .map((match) => match.inventoryItem)
      .filter((item): item is Ingredient => Boolean(item))
      .map((item) => [item.id, item])).values()]
    : [];
  const selectedRecipeContent = selectedRecipe ? getRecipeContent(selectedRecipe.id) : undefined;

  const handleOpenRecipe = (recipe: Recipe) => {
    sound.playTap();
    onSelectRecipe(recipe.id);
    setActiveStep(0);
  };

  const handleAddMissingIngredients = (items = selectedMissingIngredients) => {
    if (!onAddMissingIngredients) return;
    const selectedItems = items.filter((ingredient) =>
      selectedMissingKeys.includes(`${ingredient.name}::${ingredient.amount}`),
    );
    if (selectedItems.length === 0) return;
    sound.playSuccess();
    onAddMissingIngredients(selectedItems.map((ingredient) => ({
      name: ingredient.name,
      quantity: ingredient.shortfall ?? ingredient.amount,
    })));
  };

  const handleMarkAsCooked = () => {
    if (!selectedRecipe || selectedMissingIngredients.length > 0) return;
    sound.playSuccess();
    setShowCelebration(true);

    if (onCookRecipeComplete) {
      onCookRecipeComplete(selectedRecipe);
    }

    setTimeout(() => {
      setShowCelebration(false);
      onSelectRecipe(null);
      onNavigate('home');
    }, 2400);
  };

  return (
    <div className="flex min-h-full w-full flex-1 flex-col bg-[#FAF8F5] text-[#1E2E25]">
      {/* FULL RECIPE DETAIL VIEW (Section 13 & 14) */}
      {selectedRecipe ? (
        <div className="flex flex-1 flex-col pb-6">
          {/* Header Image */}
          <div className="relative h-64 shrink-0 overflow-hidden">
            <RecipeHeroImage key={selectedRecipe.id} recipe={selectedRecipe} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/30" />

            {/* Title & Metadata Banner */}
            <div className="absolute bottom-4 inset-x-4 text-white">
              {selectedMatchSummary && selectedMatchSummary.meaningfulAvailableCount > 0 && (
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E05342] text-white text-[10px] font-black uppercase tracking-wider mb-1.5 shadow-xs">
                  <span>{t('recipe.zeroWastePriority')}</span>
                </div>
              )}
              <h2 className="text-2xl font-['Outfit'] font-black text-white leading-tight">
                {getRecipeTitle(selectedRecipe.id, selectedRecipe.title)}
              </h2>
              <p className="text-xs text-white/80 mt-0.5 font-medium">
                {getRecipeSubtitle(selectedRecipe.id, selectedRecipe.subtitle)} · {selectedRecipe.servings} {t('recipe.servingsLabel')} · {selectedRecipe.cookTime}
              </p>
            </div>
          </div>

          <div className="mx-auto w-full max-w-5xl p-4 space-y-4 md:p-8">
            {/* MATCHING SCORE & AVAILABILITY BANNER */}
            {(() => {
              const inStockCount = selectedAvailableIngredients.length;
              const totalCount = selectedRecipe.ingredients.length;
              const matchPercent = selectedMatchSummary?.matchScorePercent ??
                (totalCount > 0 ? Math.round((inStockCount / totalCount) * 100) : 0);
              const neededCount = selectedMissingIngredients.length;

              return (
                <div className="p-4 bg-[#E8F2EC] rounded-2xl border border-[#D5E5DB] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-[#2D6A4F] text-white text-[11px] font-black rounded-lg tracking-wide shrink-0">
                        {matchPercent}% Cocok
                      </span>
                      <h4 className="font-['Outfit'] font-black text-xs text-[#1B4332]">
                        {t('recipe.matchScoreLabel', { percent: matchPercent })}
                      </h4>
                    </div>
                    <p className="text-[11px] text-[#2D6A4F] font-semibold">
                      {t('recipe.ingredientStatus', { available: inStockCount, needed: neededCount })}
                    </p>
                    <p className="text-[11px] text-[#52796F] font-medium">
                      ⏱ {selectedRecipe.cookTime} · 👥 {selectedRecipe.servings} {t('recipe.servingsLabel')} · 🏷 {selectedRecipe.healthTag}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* SECTION 1: BAHAN YANG KAMU PUNYA (AVAILABLE INVENTORY) */}
            <div className="bg-white p-4 rounded-3xl border border-[#EDE8DD] card-shadow space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2D6A4F]" />
                  <h3 className="font-['Outfit'] font-black text-sm text-[#1B4332]">
                    {t('recipe.availableIngredientsTitle')} ({selectedAvailableIngredients.length})
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-[#2D6A4F] bg-[#E8F2EC] px-2 py-0.5 rounded-md">
                  🟢 Tersedia
                </span>
              </div>

              <div className="space-y-2">
                {selectedAvailableIngredients.map((ing, idx) => {
                  const isUrgent = isIngredientUrgent(ing.name);
                  return (
                    <div
                      key={`avail-${idx}`}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-[#D5E5DB] bg-[#F4FAF6] text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <span className="font-bold text-[#1B4332]">{getFoodDisplayName(ing.name)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-right text-[#2D6A4F] font-bold">
                          {ing.availableQuantity
                            ? t('recipe.availableAndRequired', {
                              available: formatQuantity(ing.availableQuantity),
                              required: formatQuantity(ing.amount),
                            })
                            : formatQuantity(ing.amount)}
                        </span>
                        {isUrgent && (
                          <span className="px-1.5 py-0.5 rounded-full bg-[#FEE2E2] text-[#DC2626] text-[9px] font-bold">
                            {t('recipe.expiringTag')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION 2: BAHAN YANG PERLU DITAMBAHKAN (MISSING INGREDIENTS) */}
            <div className="bg-white p-4 rounded-3xl border border-[#EDE8DD] card-shadow space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
                  <h3 className="font-['Outfit'] font-black text-sm text-[#1B4332]">
                    {t('recipe.missingIngredientsTitle')} ({selectedMissingIngredients.length})
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-[#D97706] bg-[#FEF3C7] px-2 py-0.5 rounded-md">
                  🟡 Perlu Ditambahkan
                </span>
              </div>

              {selectedMissingIngredients.length === 0 ? (
                <div className="p-3 bg-[#E8F2EC] rounded-xl border border-[#D5E5DB] text-xs text-[#2D6A4F] font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{t('recipe.allAvailableNotice')}</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedMissingIngredients.map((ing, idx) => (
                    <div
                      key={`missing-${idx}`}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] flex items-center justify-center shrink-0">
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <span className="font-bold text-[#92400E]">{getFoodDisplayName(ing.name)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[#92400E] font-bold">{formatQuantity(ing.amount)}</span>
                        <span className="text-[10px] font-bold text-[#B45309]">
                          {ing.availableQuantity && ing.shortfall
                            ? t('recipe.shortWithAvailable', {
                              available: formatQuantity(ing.availableQuantity),
                              quantity: formatQuantity(ing.shortfall),
                            })
                            : ing.shortfall
                              ? t('recipe.shortBy', { quantity: formatQuantity(ing.shortfall) })
                              : t('recipe.addRequired')}
                        </span>
                      </div>
                      {onAddMissingIngredients && (
                        <input
                          type="checkbox"
                          checked={selectedMissingKeys.includes(`${ing.name}::${ing.amount}`)}
                          onChange={(event) => {
                            const key = `${ing.name}::${ing.amount}`;
                            setMissingSelection((current) => {
                              const keys = current?.recipeId === selectedRecipe.id
                                ? current.keys
                                : defaultMissingKeys;
                              return {
                                recipeId: selectedRecipe.id,
                                keys: event.target.checked
                                  ? [...keys, key]
                                  : keys.filter((selectedKey) => selectedKey !== key),
                              };
                            });
                          }}
                          aria-label={t('recipe.selectForBasket', { name: getFoodDisplayName(ing.name) })}
                          className="h-4 w-4 accent-[#2D6A4F]"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
              {selectedMissingIngredients.length > 0 && onAddMissingIngredients && (
                <button
                  type="button"
                  onClick={() => handleAddMissingIngredients()}
                  disabled={selectedMissingKeys.length === 0}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1B4332] px-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  {t('recipe.addSelectedToBasket', { count: selectedMissingKeys.length })}
                </button>
              )}
            </div>

            {/* SECTION 3: LANGKAH MEMASAK (COOKING STEPS) */}
            <div className="bg-white p-4 rounded-3xl border border-[#EDE8DD] card-shadow space-y-3">
              <h3 className="font-['Outfit'] font-black text-sm text-[#1B4332]">
                {t('recipe.stepsTitle')}
              </h3>

              <div className="space-y-2.5">
                {(selectedRecipeContent?.steps || selectedRecipe.steps).map((step, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      sound.playTap();
                      setActiveStep(idx);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                      activeStep === idx
                        ? 'bg-[#F4FAF6] border-[#2D6A4F] shadow-xs'
                        : 'bg-[#FAF8F5] border-[#EDE8DD]'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                        activeStep === idx
                          ? 'bg-[#1B4332] text-white'
                          : 'bg-[#EDE8DD] text-[#738B7C]'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <p className="text-xs text-[#1E2E25] font-semibold leading-relaxed">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Inventory Quantity Update Notice */}
            <div className="p-3 bg-[#FEF3C7]/40 rounded-2xl border border-[#FDE68A] text-xs text-[#92400E] space-y-1">
              <p className="font-bold">
                {t('recipe.inventoryNotice')}
              </p>
              <div className="flex flex-wrap gap-2 text-[11px] font-mono font-bold mt-1">
                {activeItems
                  .filter((item) => selectedRecipe.consumeAmounts?.[item.id] !== undefined)
                  .map((item) => (
                    <span
                      key={item.id}
                      className="px-2 py-0.5 bg-white rounded-md border border-[#FDE68A]"
                    >
                      {getFoodDisplayName(item.name)}: {formatQuantity(item.quantity)} → {formatQuantity(selectedRecipe.consumeAmounts?.[item.id] ?? '0 g')}
                    </span>
                  ))}
              </div>
            </div>

            {/* CTA: Mark as Cooked */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleMarkAsCooked}
                disabled={selectedMissingIngredients.length > 0}
                className="w-full h-14 bg-[#1B4332] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 active-press cursor-pointer hover:bg-[#24543E] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check className="w-5 h-5 stroke-[2.5]" />
                <span>{t('actions.markAsCooked')}</span>
              </button>
            </div>
          </div>

          {/* Celebration Feedback Overlay */}
          {showCelebration && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-xs">
              <div className="bg-[#FAF8F5] rounded-3xl p-6 text-center shadow-2xl border border-[#EDE8DD] max-w-xs space-y-3 animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-[#E8F2EC] text-[#2D6A4F] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-['Outfit'] font-black text-xl text-[#1B4332]">
                  {t('recipe.mealCookedTitle')}
                </h3>
                <p className="text-xs text-[#52796F] leading-relaxed font-semibold">
                  {t('recipe.ingredientsUpdated')}
                </p>
                <div className="p-2.5 bg-[#E8F2EC] rounded-xl text-xs font-bold text-[#1B4332]">
                  {t('recipe.savedFromWaste')}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : selectedRecipeId ? (
        <div className="flex-1 px-5 py-10">
          <section className="rounded-3xl border border-[#EDE8DD] bg-white p-5 text-center">
            <h2 className="font-['Outfit'] text-xl font-black text-[#1B4332]">
              {t('recipe.notFoundTitle')}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-[#738B7C]">
              {t('recipe.notFoundBody')}
            </p>
          </section>
        </div>
      ) : activeItems.length === 0 ? (
        <div className="flex-1 px-5 py-10">
          <section className="rounded-3xl border border-[#EDE8DD] bg-white p-5 text-center">
            <h2 className="font-['Outfit'] text-xl font-black text-[#1B4332]">
              {t('home.emptyTitle')}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-[#738B7C]">
              {t('home.emptyBody')}
            </p>
            <button
              type="button"
              onClick={() => onNavigate('scan')}
              className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1B4332] px-4 text-xs font-bold text-white"
            >
              <ChefHat className="h-4 w-4" />
              {t('home.addFood')}
            </button>
          </section>
        </div>
      ) : !featuredRecipe ? (
        <div className="flex-1 px-5 py-10">
          <section className="rounded-3xl border border-[#EDE8DD] bg-white p-5 text-center">
            <h2 className="font-['Outfit'] text-xl font-black text-[#1B4332]">
              {t('recipe.noMatchingTitle')}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-[#738B7C]">
              {t('recipe.noMatchingBody')}
            </p>
            <button
              type="button"
              onClick={() => onNavigate('scan')}
              className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1B4332] px-4 text-xs font-bold text-white"
            >
              <ChefHat className="h-4 w-4" />
              {t('recipe.addIngredients')}
            </button>
          </section>
        </div>
      ) : (
        /* RECIPE LIST OVERVIEW */
        <div className="px-page grid flex-1 grid-cols-1 space-y-5 pb-8 md:space-y-7 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)] lg:gap-x-8 lg:gap-y-7 lg:space-y-0 lg:pb-12">
          {/* Header */}
          <section className="pt-2 lg:col-span-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F2EC] text-[#2D6A4F] text-[11px] font-bold tracking-wide uppercase mb-1">
              <ChefHat className="w-3.5 h-3.5" />
              <span>{t('recipe.smartKitchenAssistant').replace(/\bAI\b/gi, '').replace(/\s{2,}/g, ' ').trim()}</span>
            </div>
            <h1 className="text-2xl font-['Outfit'] font-black text-[#1B4332] tracking-tight">
              {selectedIngredient
                ? t('recipe.contextTitle', { name: getFoodDisplayName(selectedIngredient.name) })
                : t('recipe.headerTitle')}
            </h1>
            <p className="text-xs text-[#52796F] mt-0.5 leading-relaxed font-semibold">
              {selectedIngredient
                ? t('recipe.contextSubtitle', { name: getFoodDisplayName(selectedIngredient.name) })
                : t('recipe.headerSubtitle')}
            </p>
          </section>

          {/* Featured recipe selected from user's matching inventory */}
          <section>
            <div className="overflow-hidden rounded-2xl bg-white border border-[#EDE8DD] card-shadow">
              <div className="relative h-56 w-full sm:h-64 lg:h-[340px]">
                <img
                  src={featuredRecipe.image || getRecipeImage(featuredRecipe.title)}
                  alt={getRecipeTitle(featuredRecipe.id, featuredRecipe.title)}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = createFoodFallbackSvg(featuredRecipe.title);
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-lg bg-[#F47A5C] text-[#173F32] text-[10px] font-extrabold uppercase tracking-wider">
                    {t('recipe.featuredBadge')}
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg bg-[#2D6A4F] text-white text-[10px] font-extrabold">
                    {featuredMatchSummary?.matchScorePercent ?? 85}% Cocok
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-white sm:bottom-5 sm:left-5">
                  <h2 className="text-2xl font-['Outfit'] font-bold leading-tight sm:text-3xl">
                    {getRecipeTitle(featuredRecipe.id, featuredRecipe.title)}
                  </h2>
                  <p className="text-xs text-white/80 mt-0.5 font-semibold">
                    {getRecipeSubtitle(featuredRecipe.id, featuredRecipe.subtitle)} · {featuredRecipe.cookTime}
                  </p>
                </div>
              </div>

              <div className="space-y-4 px-4 py-4 sm:px-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-[#254C39]">
                    {t('recipe.alreadyHaveCard', {
                      have: featuredMatchSummary?.availableCount ?? 0,
                      total: featuredRecipe.ingredients.length,
                    })}
                  </p>
                  <span className="text-xs font-bold text-[#2D6A4F] bg-[#E8F2EC] px-2 py-0.5 rounded-md">
                    {featuredMatchSummary?.matchScorePercent ?? 85}% {t('recipe.readyLabel')}
                  </span>
                </div>

                <p className="text-xs font-medium text-[#738B7C]">
                  {t('recipe.ingredientStatus', {
                    available: featuredMatchSummary?.availableCount ?? 0,
                    needed: featuredMatchSummary?.neededCount ?? 0,
                  })}
                </p>

                {/* Ingredients Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  {featuredInventoryItems.map((item) => {
                    const urgent = isIngredientUrgent(item.name);
                    return (
                      <span
                        key={item.id}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
                          urgent
                            ? 'bg-[#FFF0E9] text-[#B65A43]'
                            : 'bg-[#EAF2E9] text-[#356A4A]'
                        }`}
                      >
                        ✓ {getFoodDisplayName(item.name)}
                      </span>
                    );
                  })}
                </div>

                {/* CTA: Cook This */}
                <button
                  onClick={() => handleOpenRecipe(featuredRecipe)}
                  className="w-full h-12 bg-[#124B3A] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 active-press cursor-pointer hover:bg-[#1D624B] transition-colors"
                >
                  <ChefHat className="w-4 h-4" />
                  <span>{t('recipe.cookThis')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>

          {/* Other Compatible Recipes */}
          <section className="space-y-2.5 lg:row-span-2">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#738B7C] px-0.5">
              {t('recipe.moreInStock')}
            </h3>

            <div className="space-y-2.5 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
              {otherRecipes.map((rec) => {
                const matchSummary = getRecipeMatchSummary(rec, activeItems);
                return (
                  <div
                    key={rec.id}
                    onClick={() => handleOpenRecipe(rec)}
                    className="bg-white rounded-2xl p-3 border border-[#EDE8DD] card-shadow cursor-pointer active-press hover:border-[#2D6A4F] transition-all flex items-center gap-3"
                  >
                    <img
                      src={rec.image || getRecipeImage(rec.title)}
                      alt={getRecipeTitle(rec.id, rec.title)}
                      className="w-20 h-20 rounded-xl object-cover shrink-0"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = createFoodFallbackSvg(rec.title);
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-[#2D6A4F] bg-[#E8F2EC] px-1.5 py-0.5 rounded-md">
                          {matchSummary.matchScorePercent}% Cocok
                        </span>
                        <span className="text-[10px] font-bold text-[#E76F51]">
                          {t('recipe.usesInventoryItems', {
                            count: matchSummary.availableCount,
                          })}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-sm text-[#1B4332] truncate mt-1">
                        {getRecipeTitle(rec.id, rec.title)}
                      </h4>
                      <p className="text-xs text-[#738B7C] font-semibold mt-0.5">
                        {getRecipeSubtitle(rec.id, rec.subtitle)}
                      </p>
                      <p className="text-[10px] text-[#738B7C] font-medium mt-0.5">
                        {t('recipe.ingredientStatus', {
                          available: matchSummary.availableCount,
                          needed: matchSummary.neededCount,
                        })}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#8FA88D] shrink-0" />
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
