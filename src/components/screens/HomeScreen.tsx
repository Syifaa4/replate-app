import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Camera,
  Check,
  ChefHat,
  Clock3,
  Leaf,
  PackageOpen,
  Plus,
  RefreshCw,
  ShoppingBasket,
  Sparkles,
  ShoppingCart,
  Wallet,
} from 'lucide-react';
import type { Ingredient, MainTab, Recipe, UserStats } from '../../types';
import { sound } from '../../utils/sound';
import { useLanguage } from '../../i18n';
import { FoodImage } from '../FoodImage';
import { getActiveUseFirstIngredients, getUseFirstPriorityIngredients } from '../../utils/useFirstPriority';
import { isUsedIngredient } from '../../utils/inventoryStatus';
import { getRecipeMatchSummary } from '../../utils/recipeMatching';
import { generateSmartRecipesForInventory } from '../../utils/smartRecipeEngine';
import { getRecipeImage } from '../../utils/imageService';
import { getGreetingTimeBand, getNextGreetingBoundary } from '../../utils/greetingTime';

interface HomeScreenProps {
  stats: UserStats;
  ingredients: Ingredient[];
  userName: string;
  onNavigate: (tab: MainTab) => void;
  onSelectIngredient?: (ingredient: Ingredient) => void;
  onCookRecipe?: (recipeId: string) => void;
  onOpenRecipe?: (recipeId: string) => void;
  showRecipeRecommendations?: boolean;
}

const sectionLinkClass = 'inline-flex min-h-10 items-center gap-1 rounded-xl px-3 text-sm font-bold text-[#246548] transition-colors hover:bg-white hover:text-[#124B3A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3C7454]';

export const HomeScreen: React.FC<HomeScreenProps> = ({
  stats,
  ingredients,
  userName,
  onNavigate,
  onSelectIngredient,
  onCookRecipe,
  onOpenRecipe,
  showRecipeRecommendations = true,
}) => {
  const { t, getFoodDisplayName, getRecipeTitle, getRecipeSubtitle, getStorageTip, formatDays, formatCurrency, formatQuantity } = useLanguage();
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [activeTipIndex, setActiveTipIndex] = useState(0);

  useEffect(() => {
    let timeoutId: number;
    const scheduleNextUpdate = () => {
      const now = new Date();
      const nextBoundary = getNextGreetingBoundary(now);
      timeoutId = window.setTimeout(() => {
        setCurrentTime(new Date());
        scheduleNextUpdate();
      }, Math.max(20, nextBoundary.getTime() - now.getTime() + 20));
    };

    scheduleNextUpdate();
    return () => window.clearTimeout(timeoutId);
  }, []);

  const activeItems = getActiveUseFirstIngredients(ingredients);
  const priorityItems = getUseFirstPriorityIngredients(ingredients);
  const usedItems = ingredients.filter(isUsedIngredient);
  const usedCount = usedItems.length;
  const priorityItem = priorityItems[0] ?? activeItems[0] ?? null;
  const urgencyCount = priorityItems.length;
  const hasInventoryHistory = ingredients.length > 0;
  const recipes = useMemo(
    () => generateSmartRecipesForInventory(ingredients).slice(0, 4),
    [ingredients],
  );
  const tipItems = activeItems.filter((item) => item.storageTip);
  const currentTip = tipItems.length > 0 ? tipItems[activeTipIndex % tipItems.length] : null;

  const timeBand = getGreetingTimeBand(currentTime);
  const firstName = userName.trim().split(/\s+/)[0];
  const greeting = firstName
    ? t(`home.greetingByTime.${timeBand}`, { name: firstName })
    : t(`home.greetingAnonymous.${timeBand}`);
  const contextualMessage = urgencyCount === 1 && priorityItems[0]
    ? t(
        priorityItems[0].daysLeft <= 1 || priorityItems[0].useFirstScore >= 90
          ? 'home.priorityMessageToday'
          : 'home.priorityMessageSoon',
        { name: getFoodDisplayName(priorityItems[0].name) },
      )
    : urgencyCount >= 2 && urgencyCount <= 3
      ? t('home.priorityMessageSeveral')
      : urgencyCount > 3
        ? t('home.priorityMessageMany')
        : t(`home.subGreetingByTime.${timeBand}`);

  const openRecipe = (recipe: Recipe) => {
    sound.playTap();
    if (onOpenRecipe) onOpenRecipe(recipe.id);
    else onNavigate('recipe');
  };

  const openPriority = (item: Ingredient) => {
    sound.playTap();
    if (onSelectIngredient) onSelectIngredient(item);
    else onNavigate('use_first');
  };

  const goTo = (tab: MainTab) => {
    sound.playTap();
    onNavigate(tab);
  };

  const urgencyLabel = (item: Ingredient) => item.useFirstScore >= 75
    ? t('useFirst.urgencyHigh')
    : item.useFirstScore >= 50
      ? t('useFirst.urgencyMedium')
      : t('useFirst.urgencyLow');

  return (
    <div className="home-screen mx-auto w-full max-w-[1800px] flex-1 space-y-6 px-page pb-8 pt-4 md:space-y-8 md:py-7 lg:space-y-9 lg:pb-14">
      <section className="relative isolate overflow-hidden rounded-[28px] border border-[#E3EBDD] bg-[#EAF5EC] px-5 py-6 shadow-[0_8px_30px_rgba(27,67,50,0.05)] sm:px-7 sm:py-8 lg:min-h-[248px] lg:px-10 lg:py-9">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[#D9EBD9]" />
        <div className="pointer-events-none absolute bottom-[-90px] right-[22%] h-44 w-44 rounded-full bg-[#FFF0DC]/80" />
        <Sparkles className="pointer-events-none absolute right-[34%] top-8 h-5 w-5 text-[#75A77E]" aria-hidden="true" />
        <Leaf className="pointer-events-none absolute bottom-8 right-[43%] h-7 w-7 rotate-[-24deg] text-[#7FA984]" aria-hidden="true" />

        <div className="relative z-10 grid min-h-[190px] items-center gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.7fr)]">
          <div className="max-w-3xl">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#D2E5D4] bg-white/70 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#427251]">
              <Leaf className="h-3.5 w-3.5" aria-hidden="true" />
              {t('home.aiFoodSystem').replace(/\bAI\b/gi, '').replace(/\s{2,}/g, ' ').trim()}
            </div>
            <h1 className="font-['Outfit'] text-[30px] font-bold leading-tight tracking-tight text-[#173F32] sm:text-4xl lg:text-[44px]">
              {greeting}
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-[#526F5D] sm:text-base">
              {contextualMessage}
            </p>
            <p className="mt-3 text-xs font-semibold text-[#6F8B72]">
              {t('home.dashboardTagline')}
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => priorityItem ? openPriority(priorityItem) : goTo('scan')}
                className="group inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#145A43] px-4 text-sm font-bold text-white shadow-[0_6px_14px_rgba(20,90,67,0.15)] transition-all hover:-translate-y-0.5 hover:bg-[#1C6B50] hover:shadow-[0_10px_20px_rgba(20,90,67,0.2)]"
              >
                {priorityItem ? t('home.heroCta') : t('home.addFood')}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => goTo('recipe')}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#D1E2D2] bg-white/75 px-4 text-sm font-bold text-[#315E46] transition-colors hover:bg-white"
              >
                <ChefHat className="h-4 w-4" aria-hidden="true" />
                {t('home.smartRecipes')}
              </button>
            </div>
          </div>

          <div className="relative hidden h-[190px] lg:block">
            <div className="absolute right-5 top-1 h-40 w-40 overflow-hidden rounded-[34px] border-[6px] border-white/80 bg-white shadow-[0_18px_40px_rgba(36,78,50,0.16)] rotate-3">
              {priorityItem ? (
                <FoodImage
                  name={priorityItem.name}
                  alt={getFoodDisplayName(priorityItem.name)}
                  className="h-full w-full"
                  imageClassName="transition-transform duration-500 hover:scale-110"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-[#F3F7EE] text-6xl" aria-hidden="true">🥬</div>
              )}
            </div>
            <div className="absolute bottom-2 right-36 flex h-14 w-14 items-center justify-center rounded-[20px] border-4 border-[#EAF5EC] bg-[#FFF0DC] text-3xl shadow-md -rotate-6" aria-hidden="true">
              {priorityItem?.emoji ?? '🍅'}
            </div>
            <div className="absolute right-1 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#E89A5C] shadow-sm" aria-hidden="true">✦</div>
          </div>
        </div>
      </section>

      <section aria-label={t('home.dashboardStatsLabel')} className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {[
          {
            label: t('home.activeIngredients'),
            value: activeItems.length,
            caption: t('home.availableNow'),
            icon: ShoppingBasket,
            tone: 'bg-[#EAF5EC] text-[#2D6A4F]',
            tab: 'inventory' as MainTab,
          },
          {
            label: t('home.usedIngredients'),
            value: usedCount,
            caption: t('home.usedHistory'),
            icon: Check,
            tone: 'bg-[#E8F5FA] text-[#39728A]',
            tab: 'inventory' as MainTab,
          },
          {
            label: t('home.rescuePotential'),
            value: urgencyCount,
            caption: t('home.activePriorities'),
            icon: Leaf,
            tone: 'bg-[#FFF0DC] text-[#B36A3D]',
            tab: 'use_first' as MainTab,
          },
          {
            label: t('home.positiveImpact'),
            value: formatCurrency(stats.moneySavedRp),
            caption: t('home.foodValueSaved'),
            icon: Wallet,
            tone: 'bg-[#F0ECFA] text-[#6A5A9A]',
            tab: 'impact' as MainTab,
          },
        ].map(({ label, value, caption, icon: Icon, tone, tab }) => (
          <button
            key={label}
            type="button"
            onClick={() => goTo(tab)}
            className="group min-h-[132px] rounded-[22px] border border-[#E7EAE1] bg-white p-4 text-left shadow-[0_5px_18px_rgba(28,55,38,0.04)] transition-all duration-200 hover:-translate-y-1 hover:border-[#C9DCCB] hover:shadow-[0_12px_28px_rgba(28,55,38,0.1)] sm:p-5"
          >
            <div className="flex items-start justify-between gap-2">
              <span className={`flex h-10 w-10 items-center justify-center rounded-[14px] ${tone}`}>
                <Icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
              </span>
              <ArrowUpRight className="h-4 w-4 text-[#9AA99A] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
            </div>
            <p className="mt-3 truncate text-[11px] font-bold uppercase tracking-wide text-[#748577]">{label}</p>
            <p className="mt-0.5 truncate font-['Outfit'] text-2xl font-bold text-[#173F32] sm:text-[28px]">{value}</p>
            <p className="mt-0.5 truncate text-[10px] font-medium text-[#93A095]">{caption}</p>
          </button>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {[
          { tab: 'scan' as MainTab, icon: Camera, title: t('navigation.scan'), description: t('home.quickScanDescription'), tone: 'bg-[#EAF5EC] text-[#286044]' },
          { tab: 'inventory' as MainTab, icon: ShoppingBasket, title: t('inventory.title'), description: t('home.quickInventoryDescription'), tone: 'bg-[#E8F5FA] text-[#39728A]' },
          { tab: 'shopping' as MainTab, icon: ShoppingCart, title: t('navigation.shopping'), description: t('home.quickShoppingDescription'), tone: 'bg-[#FFF0E9] text-[#9A5845]' },
        ].map(({ tab, icon: Icon, title, description, tone }) => (
          <button
            key={tab}
            type="button"
            onClick={() => goTo(tab)}
            className="group flex min-h-[76px] items-center gap-3 rounded-2xl border border-[#E7EAE1] bg-white px-4 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D2E2D3] hover:shadow-[0_8px_20px_rgba(28,55,38,0.08)]"
          >
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] ${tone}`}>
              <Icon className="h-5 w-5 transition-transform group-hover:scale-110" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-[#244B36]">{title}</span>
              <span className="mt-0.5 block truncate text-[10px] text-[#849187]">{description}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-[#9AA99A] transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </button>
        ))}
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.9fr)]">
        <section className="min-w-0 rounded-[26px] border border-[#E5EAE2] bg-white p-4 shadow-[0_6px_24px_rgba(28,55,38,0.04)] sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 className="font-['Outfit'] text-xl font-bold text-[#173F32] sm:text-2xl">{t('home.prioritySectionTitle')}</h2>
              <p className="mt-1 text-xs text-[#718275] sm:text-sm">{t('home.prioritySectionSubtitle')}</p>
            </div>
            <button type="button" onClick={() => goTo('use_first')} className={sectionLinkClass}>
              <span className="hidden sm:inline">{t('home.viewAll')}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {activeItems.length > 0 ? (
            <div className="space-y-2.5">
              {(priorityItems.length > 0 ? priorityItems : activeItems).slice(0, 4).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openPriority(item)}
                  className="group flex min-h-[78px] w-full items-center gap-3 rounded-2xl border border-[#EDF0E9] bg-[#FCFDF9] p-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D6E5D7] hover:bg-[#F8FBF6] hover:shadow-sm sm:gap-4 sm:p-3"
                >
                  <FoodImage name={item.name} alt={getFoodDisplayName(item.name)} className="h-14 w-14 shrink-0 rounded-[17px] border border-[#E8EDE4] sm:h-16 sm:w-16" imageClassName="transition-transform duration-300 group-hover:scale-110" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate font-['Outfit'] text-sm font-bold text-[#244B36] sm:text-base">{getFoodDisplayName(item.name)}</span>
                      <span className="shrink-0 rounded-full bg-[#EAF5EC] px-2.5 py-1 text-[9px] font-bold text-[#39724E]">{urgencyLabel(item)}</span>
                    </span>
                    <span className="mt-1 flex items-center gap-2 text-[10px] font-medium text-[#809083]">
                      <span>{formatQuantity(item.quantity)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatDays(item.daysLeft)}</span>
                    </span>
                    <span className="mt-2 flex items-center gap-2">
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E8EEE6]">
                        <span className="block h-full rounded-full bg-[#64A575] transition-[width] duration-500" style={{ width: `${Math.max(8, Math.min(100, item.freshnessPercent))}%` }} />
                      </span>
                      <span className="w-9 text-right text-[10px] font-extrabold text-[#52796F]">{item.useFirstScore}</span>
                    </span>
                  </span>
                  <ArrowRight className="hidden h-4 w-4 shrink-0 text-[#9AA99A] transition-transform group-hover:translate-x-1 sm:block" aria-hidden="true" />
                </button>
              ))}
              {priorityItems.length === 0 && (
                <p className="rounded-xl bg-[#F6F8F3] px-3 py-2 text-[11px] font-medium text-[#6E8372]">{t('home.noUrgentItems')}</p>
              )}
            </div>
          ) : (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#DCE7DA] bg-[#F8FBF6] px-5 py-7 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-white text-[#4E8B5C] shadow-sm"><PackageOpen className="h-7 w-7" aria-hidden="true" /></span>
              <h3 className="mt-3 font-['Outfit'] text-lg font-bold text-[#244B36]">{hasInventoryHistory ? t('home.noActiveFoodTitle') : t('home.emptyTitle')}</h3>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-[#738577]">{hasInventoryHistory ? t('home.noActiveFoodBody') : t('home.emptyBody')}</p>
              <button type="button" onClick={() => goTo('scan')} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#145A43] px-4 text-xs font-bold text-white transition-colors hover:bg-[#1C6B50]">
                <Plus className="h-4 w-4" aria-hidden="true" />{t('home.addFood')}
              </button>
            </div>
          )}
        </section>

        {showRecipeRecommendations && <section className="min-w-0 rounded-[26px] border border-[#E5EAE2] bg-[#F7FAF5] p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 className="font-['Outfit'] text-xl font-bold text-[#173F32] sm:text-2xl">{t('home.recipesForYou')}</h2>
              <p className="mt-1 text-xs text-[#718275] sm:text-sm">{t('home.recipesFromStock')}</p>
            </div>
            <button type="button" onClick={() => goTo('recipe')} className={sectionLinkClass}>
              <span className="hidden sm:inline">{t('home.viewAll')}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {recipes.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {recipes.map((recipe) => {
                const match = getRecipeMatchSummary(recipe, activeItems);
                return (
                  <button
                    key={recipe.id}
                    type="button"
                    onClick={() => openRecipe(recipe)}
                    className="group flex min-w-0 overflow-hidden rounded-2xl border border-[#E6EBE3] bg-white text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C8DCCB] hover:shadow-[0_10px_24px_rgba(28,55,38,0.1)]"
                  >
                    <span className="relative h-[118px] w-[116px] shrink-0 overflow-hidden bg-[#EDF3E9] sm:h-[132px] sm:w-[126px]">
                      <img src={getRecipeImage(recipe.title)} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <span className="absolute left-2 top-2 rounded-lg bg-white/95 px-2 py-1 text-[9px] font-extrabold text-[#32684A] shadow-sm">{t('home.bestMatch', { score: match.matchScorePercent })}</span>
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col justify-center p-3">
                      <span className="line-clamp-2 font-['Outfit'] text-sm font-bold leading-snug text-[#244B36]">{getRecipeTitle(recipe.id, recipe.title)}</span>
                      <span className="mt-1 line-clamp-1 text-[10px] leading-relaxed text-[#819084]">{getRecipeSubtitle(recipe.id, recipe.subtitle)}</span>
                      <span className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] font-semibold text-[#6E8272]">
                        <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" aria-hidden="true" />{recipe.totalTime ?? recipe.cookTime}</span>
                        <span aria-hidden="true">·</span>
                        <span>{t('home.matchingIngredients', { count: match.availableCount })}</span>
                      </span>
                      {match.neededCount > 0 && <span className="mt-1 text-[9px] font-bold text-[#AA7045]">{t('home.needsMoreIngredients', { count: match.neededCount })}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#DCE7DA] bg-white/70 px-5 py-7 text-center">
              <ChefHat className="h-8 w-8 text-[#739B77]" aria-hidden="true" />
              <p className="mt-3 font-['Outfit'] text-base font-bold text-[#315E46]">{t('home.recipesEmptyTitle')}</p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-[#758577]">{t('home.recipesEmptyBody')}</p>
              <button type="button" onClick={() => goTo('scan')} className="mt-3 text-xs font-bold text-[#2D6A4F] hover:underline">{t('home.addFood')}</button>
            </div>
          )}
        </section>}
      </div>

      <div className="grid items-stretch gap-4 lg:grid-cols-3">
        <section className="relative overflow-hidden rounded-[24px] border border-[#F0E4D2] bg-[#FFF7E9] p-5 sm:p-6">
          <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-[#FBE9CC]" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-[13px] bg-white text-[#C58742] shadow-sm"><Sparkles className="h-4 w-4" aria-hidden="true" /></span>
              <h2 className="mt-3 font-['Outfit'] text-lg font-bold text-[#58462F]">{t('home.tipTitle')}</h2>
            </div>
            {tipItems.length > 1 && (
              <button type="button" aria-label={t('home.nextTip')} onClick={() => setActiveTipIndex((index) => index + 1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#876B46] transition-transform hover:rotate-45">
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
          {currentTip ? (
            <div className="relative mt-4 flex items-center gap-3">
              <FoodImage name={currentTip.name} alt={getFoodDisplayName(currentTip.name)} className="h-16 w-16 shrink-0 rounded-2xl border border-white shadow-sm" />
              <div className="min-w-0">
                <p className="font-['Outfit'] text-sm font-bold text-[#58462F]">{getFoodDisplayName(currentTip.name)}</p>
                <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-[#816F57]">{getStorageTip(currentTip.storageTip)}</p>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-xs leading-relaxed text-[#816F57]">{t('home.tipEmpty')}</p>
          )}
          <div className="relative mt-4 flex justify-center gap-1.5" aria-label={t('home.tipPosition', { current: tipItems.length ? activeTipIndex % tipItems.length + 1 : 0, total: tipItems.length })}>
            {tipItems.slice(0, 3).map((item, index) => (
              <span key={`${item.id}-tip`} className={`h-1.5 rounded-full transition-all ${index === activeTipIndex % 3 ? 'w-5 bg-[#C58B4A]' : 'w-1.5 bg-[#E5D2B4]'}`} />
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[24px] border border-[#DCEADF] bg-[#EAF5EC] p-5 sm:p-6">
          <div className="pointer-events-none absolute -bottom-12 -right-8 h-36 w-36 rounded-full bg-[#D8EAD8]" />
          <div className="relative flex items-center justify-between gap-3">
            <div>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-[13px] bg-white text-[#3B7D54] shadow-sm"><Leaf className="h-4 w-4" aria-hidden="true" /></span>
              <h2 className="mt-3 font-['Outfit'] text-lg font-bold text-[#244B36]">{t('home.impactToday')}</h2>
              <p className="mt-1 text-[11px] text-[#67816B]">{t('home.impactFromYourActivity')}</p>
            </div>
            <span className="relative flex h-16 w-16 items-center justify-center rounded-full border-[5px] border-white/80 bg-[#D7EBD7] text-3xl shadow-sm" aria-hidden="true">🌍</span>
          </div>
          <div className="relative mt-4 flex items-end gap-2">
            <span className="font-['Outfit'] text-3xl font-bold leading-none text-[#1D6045]">{stats.wasteAvoidedKg.toFixed(1)}</span>
            <span className="pb-0.5 text-xs font-bold text-[#4E7659]">kg {t('home.foodRescued')}</span>
          </div>
          <p className="relative mt-2 text-[10px] font-medium text-[#6D8870]">{t('home.co2Reduced', { amount: stats.co2SavedKg.toFixed(1) })}</p>
          <button type="button" onClick={() => goTo('impact')} className="relative mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#286044] hover:underline">
            {t('home.viewImpact')}<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </section>

        <section className="relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-[#E6E2F0] bg-[#F3F0FA] p-5 sm:p-6">
          <div className="pointer-events-none absolute -right-8 -top-9 h-28 w-28 rounded-full bg-[#E8E1F3]" />
          <div className="relative">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-[13px] bg-white text-[#6B5A98] shadow-sm"><ChefHat className="h-4 w-4" aria-hidden="true" /></span>
            <h2 className="mt-3 font-['Outfit'] text-lg font-bold text-[#3F365B]">{t('home.cookFromStockTitle')}</h2>
            <p className="mt-1 max-w-sm text-[11px] leading-relaxed text-[#766F8A]">{t('home.cookFromStockBody')}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              sound.playTap();
              if (priorityItem && onCookRecipe) onCookRecipe(priorityItem.id);
              else onNavigate('recipe');
            }}
            className="group relative mt-5 inline-flex min-h-11 w-fit items-center gap-2 rounded-xl bg-[#6B5A98] px-4 text-xs font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#5C4A89]"
          >
            {t('home.findRecipe')}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </button>
        </section>
      </div>

      {usedItems.length > 0 && (
        <section className="rounded-[24px] border border-[#E5EAE2] bg-white/75 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-['Outfit'] text-base font-bold text-[#244B36]">{t('home.usedHistoryTitle')}</h2>
              <p className="mt-1 text-[11px] text-[#7C8B7E]">{t('home.usedHistoryNotice')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {usedItems.slice(0, 3).map((item) => (
                <span key={item.id} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#E8ECE5] bg-[#FAFBF8] px-2.5 py-1.5">
                  <FoodImage name={item.name} alt="" className="h-7 w-7 rounded-lg" />
                  <span className="min-w-0">
                    <span className="block max-w-32 truncate text-[10px] font-bold text-[#4F6755]">{getFoodDisplayName(item.name)}</span>
                    <span className="block text-[9px] text-[#8B978D]">{formatQuantity(item.quantity)} · {t('inventory.consumed')}</span>
                  </span>
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#E6EBE3] bg-white/75 px-4 py-3 text-xs text-[#78877B]">
        <span>{t('home.activeCountSummary', { count: activeItems.length, used: usedCount })}</span>
        <button type="button" onClick={() => goTo('inventory')} className="inline-flex shrink-0 items-center gap-1 font-bold text-[#2D6A4F] hover:underline">
          {t('inventory.title')}<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
