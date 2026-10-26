import React, { useState } from 'react';
import { Search, Camera, X, Check, ChevronRight, ArrowRight, PackageOpen, Sparkles } from 'lucide-react';
import { InventoryFilter, Ingredient, MainTab } from '../../types';
import { sound } from '../../utils/sound';
import { IngredientDetailSheet } from '../IngredientDetailSheet';
import { useLanguage } from '../../i18n';
import { FoodImage } from '../FoodImage';
import { getUseFirstPriorityIngredients } from '../../utils/useFirstPriority';
import { isActiveIngredient, isUsedIngredient } from '../../utils/inventoryStatus';

interface InventoryScreenProps {
  ingredients: Ingredient[];
  onNavigate: (tab: MainTab) => void;
  onConsumeIngredient: (id: string) => void;
  onRemoveIngredient: (id: string) => void;
  onCookWithIngredient: (ingredient: Ingredient) => void;
}

export const InventoryScreen: React.FC<InventoryScreenProps> = ({
  ingredients,
  onNavigate,
  onConsumeIngredient,
  onRemoveIngredient: _onRemoveIngredient,
  onCookWithIngredient,
}) => {
  const { t, getFoodDisplayName, getStorageTip, formatQuantity } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<InventoryFilter>('All');
  const [selectedItem, setSelectedItem] = useState<Ingredient | null>(null);

  const filterLabels: Record<InventoryFilter, string> = {
    All: t('inventory.filterAll'),
    Fresh: t('inventory.filterFresh'),
    'Use Soon': t('inventory.filterUseSoon'),
    Expired: t('inventory.filterExpired'),
  };

  const filters: InventoryFilter[] = ['All', 'Fresh', 'Use Soon', 'Expired'];

  const isConsumed = isUsedIngredient;

  const isExpired = (i: Ingredient) =>
    !isConsumed(i) && i.daysLeft <= 0;

  const isUrgent = (i: Ingredient) => getUseFirstPriorityIngredients([i]).length > 0;

  const isFresh = (i: Ingredient) =>
    !isConsumed(i) && i.daysLeft > 3;

  // Real data counts for "Kitchen at a glance"
  const totalCount = ingredients.filter(isActiveIngredient).length;
  const freshCount = ingredients.filter(isFresh).length;
  const useSoonCount = ingredients.filter(isUrgent).length;
  const expiredCount = ingredients.filter(isExpired).length;

  // Filter items matching search and selected category
  const filteredItems = ingredients
    .filter((item) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        query === '' ||
        item.name.toLowerCase().includes(query) ||
        getFoodDisplayName(item.name).toLowerCase().includes(query);

      if (!matchesSearch) return false;

      if (activeFilter === 'All') return true;
      if (activeFilter === 'Use Soon') return isUrgent(item);
      if (activeFilter === 'Fresh') return isFresh(item);
      if (activeFilter === 'Expired') return isExpired(item);

      return true;
    })
    .sort((a, b) => {
      // In "All", active items first, then consumed items
      const aConsumed = isConsumed(a);
      const bConsumed = isConsumed(b);
      if (aConsumed && !bConsumed) return 1;
      if (!aConsumed && bConsumed) return -1;
      return b.useFirstScore - a.useFirstScore;
    });

  const handleItemPress = (item: Ingredient) => {
    sound.playTap();
    setSelectedItem(item);
  };

  // Generate dynamic contextual insight based on actual real data
  const getContextualInsight = () => {
    const active = ingredients.filter(isActiveIngredient);
    if (active.length === 0) {
      return {
        message: t('inventory.insightEmpty'),
        subtext: t('inventory.emptyKitchenSubtitle'),
      };
    }

    const sortedActive = [...active].sort((a, b) => b.useFirstScore - a.useFirstScore);
    const topItem = sortedActive[0];

    if (useSoonCount > 0 && topItem) {
      const itemName = getFoodDisplayName(topItem.name);
      return {
        message: t('inventory.insightUrgentSingle', { name: itemName }),
        subtext: t('inventory.insightUrgentSubtext', {
          days: topItem.daysLeft,
          score: topItem.useFirstScore,
        }),
      };
    }

    if (active.length === 1 && topItem) {
      const itemName = getFoodDisplayName(topItem.name);
      return {
        message: t('inventory.insightFreshSingle', { name: itemName }),
        subtext: t('inventory.insightFreshSingleSubtext'),
      };
    }

    return {
      message: t('inventory.insightAllFine'),
      subtext: t('inventory.insightAllFineSubtext', { count: active.length }),
    };
  };

  const insight = getContextualInsight();

  return (
    <div className="px-page flex-1 py-5 md:py-8 space-y-6">
      {/* 1. HEADER / PAGE INTRO */}
      <section className="flex flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-['Outfit'] font-black text-[#1B4332] tracking-tight">
            {t('inventory.title')}
          </h1>
          <p className="text-xs sm:text-sm text-[#52796F] font-medium mt-0.5">
            {t('inventory.headerSubtitle')}
          </p>
        </div>

        <button
          onClick={() => {
            sound.playTap();
            onNavigate('scan');
          }}
          className="h-10 sm:h-11 px-4 sm:px-5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs active-press cursor-pointer transition-colors shrink-0"
        >
          <Camera className="w-4 h-4" />
          <span>{t('inventory.scanFoodBtn')}</span>
        </button>
      </section>

      {/* 2. KITCHEN AT A GLANCE (Compact Summary Cards) */}
      <section aria-label={t('inventory.summaryLabel')}>
        <div className="grid grid-cols-2 overflow-hidden rounded-2xl bg-[#EEF2EB] sm:grid-cols-4">
          {([
            { filter: 'All', value: totalCount, label: t('inventory.totalItems'), valueTone: 'text-[#173F32]' },
            { filter: 'Fresh', value: freshCount, label: t('inventory.freshItems'), valueTone: 'text-[#356A4A]' },
            { filter: 'Use Soon', value: useSoonCount, label: t('inventory.useSoonItems'), valueTone: 'text-[#B65A43]' },
            { filter: 'Expired', value: expiredCount, label: t('inventory.expiredItems'), valueTone: 'text-[#8B5547]' },
          ] as const).map((metric, index) => {
            const selected = activeFilter === metric.filter;
            return (
              <button
                key={metric.filter}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  sound.playTap();
                  setActiveFilter(metric.filter === 'All' || selected ? 'All' : metric.filter);
                }}
                className={`relative flex min-h-[76px] flex-col justify-center px-4 py-3 text-left transition-colors ${
                  selected ? 'bg-white/75' : 'hover:bg-white/45'
                } ${index % 4 !== 0 ? 'border-l border-[#DCE4D9]' : ''} ${index >= 2 ? 'border-t border-[#DCE4D9] sm:border-t-0' : ''}`}
              >
                <span className={`font-['Outfit'] text-2xl font-bold leading-none ${metric.valueTone}`}>{metric.value}</span>
                <span className="mt-1.5 text-[10px] font-semibold leading-tight text-[#65796D] sm:text-xs">{metric.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. SEARCH & 4. FILTERS SECTION (Comfortable desktop width, tightly spaced) */}
      {ingredients.length > 0 && (
        <section className="space-y-3">
          {/* Search bar */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#8FA88D] absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder={t('inventory.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 sm:h-12 pl-10 pr-9 bg-white rounded-2xl border border-[#EDE8DD] focus:border-[#2D6A4F] outline-hidden text-xs sm:text-sm text-[#1B4332] font-semibold placeholder-[#8FA88D] transition-colors card-shadow"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 w-5 h-5 rounded-full bg-[#EAE4D5] flex items-center justify-center text-[#556D5C] hover:bg-[#D5CEBD] transition-colors"
                aria-label={t('inventory.clearSearch')}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filter chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {filters.map((filter) => {
              const isSelected = activeFilter === filter;
              let count = 0;
              if (filter === 'All') count = ingredients.length;
              else if (filter === 'Use Soon') count = useSoonCount;
              else if (filter === 'Fresh') count = freshCount;
              else if (filter === 'Expired') count = expiredCount;

              return (
                <button
                  key={filter}
                  onClick={() => {
                    sound.playTap();
                    setActiveFilter(filter);
                  }}
                  className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-150 active-press shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[#1B4332] text-white shadow-xs'
                      : 'bg-white text-[#52796F] border border-[#EDE8DD] hover:bg-[#F3EFE6]'
                  }`}
                >
                  <span>{filterLabels[filter]}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-[#EAE4D5] text-[#52796F]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. INVENTORY SECTION HEADING ("Your Food") */}
      <section className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
          <div>
            <h2 className="text-lg sm:text-xl font-['Outfit'] font-black text-[#1B4332] tracking-tight">
              {t('inventory.sectionTitle')}
            </h2>
            <p className="text-xs text-[#6B8573] font-medium">
              {t('inventory.sectionSubtitle')}
            </p>
          </div>
          {filteredItems.length > 0 && (
            <span className="text-[11px] font-semibold text-[#84978B]">
              {t('inventory.activeCount', { count: filteredItems.filter(isActiveIngredient).length })}
            </span>
          )}
        </div>

        {/* 6. & 7. INVENTORY CARDS (Wider, informative, decision-support layout) */}
        {filteredItems.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => {
              const itemConsumed = isConsumed(item);
              const itemExpired = isExpired(item);
              const itemUrgent = isUrgent(item);
              const isHigh = item.useFirstScore >= 75;
              const isMed = item.useFirstScore >= 50 && item.useFirstScore < 75;

              // Consumed card
              if (itemConsumed) {
                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemPress(item)}
                    className="bg-white/75 rounded-2xl p-4 sm:p-5 border border-[#EDE8DD] cursor-pointer active-press hover:border-[#2D6A4F] transition-all flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                      <FoodImage
                        name={item.name}
                        alt={getFoodDisplayName(item.name)}
                        className="h-12 w-12 shrink-0 rounded-2xl border border-[#EDE8DD] sm:h-14 sm:w-14"
                        imageClassName="grayscale"
                      />

                      <div className="min-w-0">
                        <h3 className="font-['Outfit'] font-black text-base sm:text-lg text-[#1B4332] truncate">
                          {getFoodDisplayName(item.name)}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs text-[#738B7C] font-medium">
                            {formatQuantity(item.quantity)}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E8F2EC] text-[#2D6A4F] border border-[#D5E5DB] text-[11px] font-bold">
                            <Check className="w-3 h-3 stroke-[2.5]" />
                            <span>{t('inventory.consumed')}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-9 h-9 rounded-xl bg-[#FAF8F5] border border-[#EDE8DD] flex items-center justify-center text-[#8FA88D]">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              }

              const scoreTone = isHigh || isMed
                ? 'bg-[#FFF0E9] text-[#B65A43]'
                : 'bg-[#EAF2E9] text-[#356A4A]';
              const statusTone = itemExpired
                ? 'bg-[#F8E8E2] text-[#9E4F3D]'
                : itemUrgent
                ? 'bg-[#FFF0E9] text-[#B65A43]'
                : 'bg-[#EAF2E9] text-[#356A4A]';

              return (
                <div
                  key={item.id}
                  onClick={() => handleItemPress(item)}
                  className="group overflow-hidden rounded-2xl border border-[#E5EAE2] bg-white transition-colors duration-200 hover:border-[#9FBCA7] cursor-pointer active-press"
                >
                  <div className="relative h-36 overflow-hidden bg-[#EAF1E9] sm:h-44">
                    <FoodImage
                      name={item.name}
                      alt={getFoodDisplayName(item.name)}
                      className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    <span className={`absolute left-3 top-3 rounded-lg px-2.5 py-1 text-[10px] font-bold ${statusTone}`}>
                      {itemExpired ? t('inventory.statusExpired') : itemUrgent ? t('inventory.statusUseSoon') : t('inventory.statusFresh')}
                    </span>
                    <span className={`absolute bottom-3 right-3 flex items-baseline gap-1.5 rounded-xl px-3 py-2 ${scoreTone}`}>
                      <span className="text-[9px] font-extrabold uppercase tracking-wide">{t('inventory.useFirstBadge')}</span>
                      <span className="font-['Outfit'] text-2xl font-bold leading-none">{item.useFirstScore}</span>
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-['Outfit'] text-lg font-bold tracking-tight text-[#173F32]">
                          {getFoodDisplayName(item.name)}
                        </h3>
                        <p className="mt-1 text-xs font-medium text-[#65796D]">{formatQuantity(item.quantity)}</p>
                      </div>
                      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#78907D] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </div>
                    <p className={`mt-3 border-t border-[#EDF0E9] pt-3 text-xs font-semibold ${itemExpired ? 'text-[#9E4F3D]' : itemUrgent ? 'text-[#B65A43]' : 'text-[#52796F]'}`}>
                      {item.daysLeft <= 0
                        ? t('inventory.statusExpired')
                        : item.daysLeft === 1
                        ? t('inventory.useWithinDay', { days: 1 })
                        : t('inventory.useWithinDays', { days: item.daysLeft })}
                    </p>
                    {item.storageTip && (
                      <p className="mt-1.5 line-clamp-1 text-[11px] leading-relaxed text-[#89968C]">{getStorageTip(item.storageTip)}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 9. EMPTY INVENTORY / FILTER STATE */}
        {ingredients.length === 0 ? (
          <div className="text-center py-12 px-6 bg-white rounded-3xl border border-[#EDE8DD] space-y-4 max-w-lg mx-auto my-4">
            <div className="w-14 h-14 rounded-full bg-[#E8F2EC] flex items-center justify-center mx-auto text-[#2D6A4F]">
              <PackageOpen className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="font-['Outfit'] font-black text-xl text-[#1B4332]">
                {t('inventory.emptyKitchenTitle')}
              </h3>
              <p className="text-xs sm:text-sm text-[#52796F] font-medium leading-relaxed max-w-sm mx-auto">
                {t('inventory.emptyKitchenSubtitle')}
              </p>
            </div>
            <button
              onClick={() => {
                sound.playTap();
                onNavigate('scan');
              }}
              className="h-11 px-6 bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 mx-auto active-press cursor-pointer transition-colors"
            >
              <Camera className="w-4 h-4" />
              <span>{t('inventory.scanFoodBtn')}</span>
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-10 px-4 bg-white rounded-3xl border border-[#EDE8DD] space-y-2 max-w-md mx-auto my-4">
            <PackageOpen className="w-6 h-6 mx-auto text-[#738B7C]" />
            <h3 className="font-bold text-sm text-[#1B4332]">
              {t('inventory.noFoodForFilter')}
            </h3>
            <p className="text-xs text-[#738B7C]">
              {t('inventory.noFoodFilterDescription')}
            </p>
            <button
              onClick={() => {
                sound.playTap();
                setActiveFilter('All');
                setSearchQuery('');
              }}
              className="mt-3 px-4 py-2 bg-[#1B4332] text-white rounded-xl text-xs font-bold active-press cursor-pointer"
            >
              {t('inventory.showAllFood')}
            </button>
          </div>
        ) : null}
      </section>

      {/* 8. REPLATE INSIGHT (Contextual, real-data-driven intelligence card) */}
      <section aria-label={t('inventory.insightAriaLabel')}>
        <div className="bg-[#F5F2EB]/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 border border-[#E3DDD1] transition-all">
          <div className="flex items-center gap-2 text-[#2D6A4F] mb-1.5">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="font-['Outfit'] font-black text-[11px] sm:text-xs tracking-wider uppercase">
              {t('inventory.insightHeading')}
            </span>
          </div>

          <div className="space-y-1">
            <p className="font-bold text-sm sm:text-base text-[#1B4332] leading-snug">
              {insight.message}
            </p>
            {insight.subtext && (
              <p className="text-xs sm:text-sm text-[#52796F] font-medium leading-relaxed">
                {insight.subtext}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* DETAIL BOTTOM SHEET */}
      <IngredientDetailSheet
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onCookWithThis={onCookWithIngredient}
        onConsume={(item) => {
          onConsumeIngredient(item.id);
        }}
      />
    </div>
  );
};
