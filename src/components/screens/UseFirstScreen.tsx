import React, { useState } from 'react';
import {
  ChefHat,
  ArrowRight,
  ChevronRight,
  Flame,
  PackageOpen,
  Plus,
} from 'lucide-react';
import { Ingredient, MainTab } from '../../types';
import { sound } from '../../utils/sound';
import { IngredientDetailSheet } from '../IngredientDetailSheet';
import { useLanguage } from '../../i18n';
import { FoodImage } from '../FoodImage';
import { getActiveUseFirstIngredients } from '../../utils/useFirstPriority';
import { MOCK_RECIPES } from '../../data/mockData';
import { rankRecipesForInventory } from '../../utils/recipeMatching';
import { generateSmartRecipesForInventory } from '../../utils/smartRecipeEngine';

interface UseFirstScreenProps {
  ingredients: Ingredient[];
  onNavigate: (tab: MainTab) => void;
  onCookRecipe?: (recipeId: string) => void;
  onConsumeIngredient?: (id: string) => void;
  initialPriorityIngredientId?: string | null;
  onPriorityItemHandled?: () => void;
}

export const UseFirstScreen: React.FC<UseFirstScreenProps> = ({
  ingredients,
  onNavigate,
  onCookRecipe,
  onConsumeIngredient,
  initialPriorityIngredientId,
  onPriorityItemHandled,
}) => {
  const { t, getFoodDisplayName, getRecipeTitle, getRecipeSubtitle, formatDays, formatQuantity } = useLanguage();
  const [selectedItem, setSelectedItem] = useState<Ingredient | null>(null);

  const sortedItems = getActiveUseFirstIngredients(ingredients);
  const heroItem = sortedItems[0] || null;
  const priorityList = sortedItems;
  const heroRecipe = heroItem
    ? generateSmartRecipesForInventory(ingredients, heroItem.name)[0] || rankRecipesForInventory(MOCK_RECIPES, [heroItem])[0]
    : undefined;
  const heroStatusKey = heroItem?.useFirstScore >= 75
    ? 'useFirst.urgencyHigh'
    : heroItem?.useFirstScore >= 40
    ? 'useFirst.urgencyMedium'
    : 'useFirst.urgencyLow';
  const displayedItem = selectedItem ?? sortedItems.find(
    (item) => item.id === initialPriorityIngredientId,
  ) ?? null;

  const handleItemClick = (item: Ingredient) => {
    sound.playTap();
    setSelectedItem(item);
  };

  const handleCookItem = (item: Ingredient) => {
    sound.playTap();
    if (onCookRecipe) {
      const matchingRecipe = generateSmartRecipesForInventory(ingredients, item.name)[0] ||
        rankRecipesForInventory(MOCK_RECIPES, [item])[0];
      if (matchingRecipe) onCookRecipe(matchingRecipe.id);
      else onNavigate('recipe');
    } else {
      onNavigate('recipe');
    }
  };

  const handleCookHero = () => {
    if (heroItem) {
      handleCookItem(heroItem);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-[1800px] flex-1 grid-cols-1 items-start space-y-5 px-page pb-8 md:space-y-7 lg:grid-cols-[minmax(0,1.45fr)_minmax(340px,1fr)] lg:gap-x-7 lg:gap-y-7 lg:space-y-0 lg:pb-10">
      {/* 1. HEADER (Exact prompt title & subtitle) */}
      <section className="pt-1 lg:col-span-2">
        <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.13em] text-[#52796F]">
          {t('home.aiFoodSystem').replace(/\bAI\b/gi, '').replace(/\s{2,}/g, ' ').trim()}
        </div>
        <h1 className="text-[28px] font-['Outfit'] font-black leading-tight tracking-tight text-[#1B4332] md:text-3xl">
          {t('useFirst.questionTitle')}
        </h1>
        <p className="mt-1 text-sm font-medium leading-relaxed text-[#52796F]">
          {t('useFirst.headerSubtitle')}
        </p>
      </section>

      {/* 2. PROMINENT HERO CARD */}
      {heroItem ? (
        <section className="min-w-0">
          <div className="relative h-auto min-h-[390px] max-h-none overflow-hidden rounded-[26px] bg-[#124B3A] p-5 text-white sm:min-h-[420px] md:min-h-[460px] md:p-7 lg:min-h-[520px] lg:max-h-[560px] lg:p-8">
            <FoodImage
              name={heroItem.name}
              alt={getFoodDisplayName(heroItem.name)}
              className="absolute inset-y-0 right-0 hidden h-full w-[42%] md:block"
            />
            <div className="absolute inset-y-0 right-0 hidden w-[58%] bg-gradient-to-r from-[#124B3A] via-[#124B3A]/25 to-transparent md:block" />
            <div className="relative z-10 max-w-full space-y-3.5 md:max-w-[62%] lg:space-y-3">
              {/* Top Score Badge & Timing */}
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider ${heroItem.useFirstScore >= 40 ? 'bg-[#F47A5C] text-[#173F32]' : 'bg-[#DDEDE3] text-[#315E46]'}`}>
                  <Flame className="w-3.5 h-3.5" />
                  <span>{t(heroStatusKey)}</span>
                </span>
                <span className="font-['Outfit'] text-5xl font-bold leading-none text-[#F47A5C] md:hidden">{heroItem.useFirstScore}</span>
              </div>

              {/* Ingredient identity */}
              <div className="flex items-center gap-3 pt-1">
                <FoodImage
                  name={heroItem.name}
                  alt={getFoodDisplayName(heroItem.name)}
                  className="h-20 w-20 shrink-0 rounded-2xl border border-white/20 sm:h-24 sm:w-24 md:h-16 md:w-16"
                />
                <div>
                  <h2 className="text-2xl font-['Outfit'] font-black text-white tracking-tight">
                    {getFoodDisplayName(heroItem.name).toUpperCase()}
                  </h2>
                  <p className="text-xs text-[#C7E0D2] font-medium">
                    {formatQuantity(heroItem.quantity)} · {formatDays(heroItem.daysLeft)}
                  </p>
                </div>
              </div>

              {/* AI Decision Reason */}
              <div className="py-3 border-y border-white/15 text-xs text-[#E8EFEA] font-medium leading-relaxed">
                {t('useFirst.priorityReason', {
                  name: getFoodDisplayName(heroItem.name),
                  days: heroItem.daysLeft,
                })}
              </div>

              {/* 4 Metadata Points */}
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 pt-0.5 text-xs">
                <div className="py-2.5 pr-2.5">
                  <span className="text-[10px] text-[#A3B899] font-medium block">
                    {t('useFirst.freshnessLabel')}
                  </span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-bold text-white text-xs">
                      {heroItem.freshnessPercent}% {t('inventory.filterFresh').toLowerCase()}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#F47A5C]" />
                  </div>
                </div>

                <div className="py-2.5 pr-2.5">
                  <span className="text-[10px] text-[#A3B899] font-medium block">
                    {t('foodDetail.quantity')}
                  </span>
                  <p className="font-bold text-white text-xs mt-1">{formatQuantity(heroItem.quantity)}</p>
                </div>

                <div className="py-2.5 pr-2.5">
                  <span className="text-[10px] text-[#A3B899] font-medium block">
                    {t('home.estimatedRemaining')}
                  </span>
                  <p className="font-bold text-[#F6C47B] text-xs mt-1">
                    {formatDays(heroItem.daysLeft)}
                  </p>
                </div>

                <div className="py-2.5 pr-2.5">
                  <span className="text-[10px] text-[#A3B899] font-medium block">
                    {t('home.recipeCompatibility')}
                  </span>
                  <p className="font-bold text-white text-[11px] truncate mt-1">
                    {heroRecipe
                      ? `${getRecipeTitle(heroRecipe.id, heroRecipe.title)} (${getRecipeSubtitle(heroRecipe.id, heroRecipe.subtitle)})`
                      : t('recipe.noMatchingTitle')}
                  </p>
                </div>
              </div>

              {/* CTA: Cook With This */}
              <button
                onClick={handleCookHero}
                className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-[13px] bg-[#F47A5C] text-sm font-bold text-[#173F32] transition-colors hover:bg-[#F68B70] active-press"
              >
                <ChefHat className="w-4 h-4 stroke-[2.5]" />
                <span>{t('actions.cookWithThis')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-white rounded-3xl p-8 border border-[#EDE8DD] text-center space-y-3">
          <PackageOpen className="w-8 h-8 text-[#2D6A4F] mx-auto" />
          <h3 className="font-['Outfit'] font-black text-xl text-[#1B4332]">
            {t('home.noPriorityTitle')}
          </h3>
          <p className="text-xs text-[#52796F] font-medium leading-relaxed max-w-xs mx-auto">
            {t('home.noPriorityBody')}
          </p>
          <button
            onClick={() => {
              sound.playTap();
              onNavigate('scan');
            }}
            className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1B4332] px-5 text-xs font-bold text-white active-press cursor-pointer"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('home.addFood')}
          </button>
          <button
            onClick={() => {
              sound.playTap();
              onNavigate('scan');
            }}
            className="mx-auto min-h-11 px-4 text-xs font-bold text-[#2D6A4F] underline-offset-4 hover:underline"
          >
            {t('home.scanFridge')}
          </button>
        </section>
      )}

      {/* 3. YOUR PRIORITY LIST */}
      {priorityList.length > 0 && <section className="min-w-0 space-y-2.5 lg:pt-1">
        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-sm font-['Outfit'] font-black uppercase tracking-wider text-[#1B4332]">
            {t('useFirst.priorityListTitle')}
          </h3>
          <span className="text-[11px] font-bold text-[#52796F]">
            {t('useFirst.tapForBreakdown')}
          </span>
        </div>

        <div className="space-y-2">
          {priorityList.map((item, index) => {
            const rank = index + 1;
            const isHigh = item.useFirstScore >= 75;
            const isMed = item.useFirstScore >= 50 && item.useFirstScore < 75;
            const displayName = getFoodDisplayName(item.name);

            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="flex min-h-[68px] cursor-pointer items-center justify-between rounded-2xl border border-[#EDE8DD] bg-white p-3 transition-all card-shadow hover:border-[#2D6A4F] active-press"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Rank number */}
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-['Outfit'] font-black text-xs shrink-0 ${
                      rank === 1
                        ? 'bg-[#F47A5C] text-[#173F32]'
                        : rank === 2
                        ? 'bg-[#F4D77D] text-[#765B20]'
                        : rank === 3
                        ? 'bg-[#2D6A4F] text-white'
                        : 'bg-[#EDE8DD] text-[#738B7C]'
                    }`}
                  >
                    {rank}
                  </span>

                  <FoodImage
                    name={item.name}
                    alt={getFoodDisplayName(item.name)}
                    className="h-11 w-11 shrink-0 rounded-xl"
                  />

                  <div className="min-w-0">
                    <h4 className="font-extrabold text-sm text-[#1B4332] truncate">
                      {displayName}
                    </h4>
                    <p className="text-[11px] text-[#738B7C] font-medium">
                      {formatQuantity(item.quantity)} · {formatDays(item.daysLeft)}
                    </p>
                  </div>
                </div>

                {/* Score badge & Chevron */}
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className={`px-3 py-1 rounded-xl text-xs font-black font-mono ${
                      isHigh
                        ? 'bg-[#FFF0E9] text-[#B65A43]'
                        : isMed
                        ? 'bg-[#FFF3D9] text-[#765B20]'
                        : 'bg-[#E8F2EC] text-[#2D6A4F]'
                    }`}
                  >
                    {item.useFirstScore}
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8FA88D]" />
                </div>
              </div>
            );
          })}
        </div>
      </section>}

      {/* 4. ITEM DETAIL MODAL */}
      <IngredientDetailSheet
        item={displayedItem}
        onClose={() => {
          setSelectedItem(null);
          onPriorityItemHandled?.();
        }}
        onCookWithThis={handleCookItem}
        onConsume={(item) => {
          if (onConsumeIngredient) onConsumeIngredient(item.id);
        }}
      />
    </div>
  );
};
