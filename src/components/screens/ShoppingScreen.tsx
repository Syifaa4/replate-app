import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Clock3,
  ListChecks,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Store,
  Trash2,
  X,
} from 'lucide-react';
import type { Ingredient, MainTab, UserProfile } from '../../types';
import { useLanguage } from '../../i18n';
import { sound } from '../../utils/sound';
import { FoodImage } from '../FoodImage';
import { isActiveIngredient } from '../../utils/inventoryStatus';
import {
  getBestRetailer,
  isRestockFoodAvoided,
  getRetailerOffers,
  getRestockRecommendations,
  type RestockRecommendation,
  type RestockStatus,
  type Retailer,
} from '../../services/restockService';

interface ShoppingScreenProps {
  ingredients: Ingredient[];
  profile: UserProfile;
  userEmail: string;
  onNavigate: (tab: MainTab) => void;
  onRestockItems?: (newIngredients: Array<Omit<Ingredient, 'id'>>) => void;
  pendingBasketItems?: Array<{ name: string; quantity: string }>;
  onBasketItemsQueued?: () => void;
}

interface RestockListItem {
  id: string;
  name: string;
  quantity: string;
  emoji: string;
  category: Ingredient['category'];
  checked: boolean;
}

const storageKey = (email: string) => `replate-shopping-list-${encodeURIComponent(email.trim().toLowerCase())}`;

const dietaryPreferenceKeys: Record<string, string> = {
  Flexitarian: 'screens.profile.dietFlexitarian',
  'High-Protein': 'screens.profile.dietHighProtein',
  'Low Waste': 'screens.profile.dietLowWaste',
  indonesian: 'preferenceSetup.options.indonesian',
  asian: 'preferenceSetup.options.asian',
  western: 'preferenceSetup.options.western',
  vegetarian: 'preferenceSetup.options.vegetarian',
  highProtein: 'preferenceSetup.options.highProtein',
  comfortFood: 'preferenceSetup.options.comfortFood',
  quickSimple: 'preferenceSetup.options.quickSimple',
  healthyMeals: 'preferenceSetup.options.healthyMeals',
  homemade: 'preferenceSetup.options.homemade',
  seafood: 'preferenceSetup.options.seafood',
  beef: 'preferenceSetup.options.beef',
  chicken: 'preferenceSetup.options.chicken',
  dairy: 'preferenceSetup.options.dairy',
  eggs: 'preferenceSetup.options.eggs',
  spicyFood: 'preferenceSetup.options.spicyFood',
  nuts: 'preferenceSetup.options.nuts',
  gluten: 'preferenceSetup.options.gluten',
};

function loadShoppingList(userEmail: string): { items: RestockListItem[]; error: boolean } {
  try {
    const stored = localStorage.getItem(storageKey(userEmail));
    if (!stored) return { items: [], error: false };
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      console.error('The saved shopping list has an invalid format.');
      return { items: [], error: true };
    }
    return {
      items: parsed.filter((item): item is RestockListItem => (
        typeof item?.id === 'string'
        && typeof item?.name === 'string'
        && typeof item?.quantity === 'string'
        && typeof item?.emoji === 'string'
        && typeof item?.checked === 'boolean'
      )),
      error: false,
    };
  } catch (error) {
    console.error('Could not load the saved shopping list.', error);
    return { items: [], error: true };
  }
}

const statusStyles: Record<RestockStatus, string> = {
  buyNow: 'bg-[#FCE8E4] text-[#A84636]',
  buySoon: 'bg-[#FFF2D8] text-[#946414]',
  dontBuyYet: 'bg-[#E8F2EC] text-[#2D6A4F]',
};

export const ShoppingScreen: React.FC<ShoppingScreenProps> = ({
  ingredients,
  profile,
  userEmail,
  onNavigate,
  onRestockItems,
  pendingBasketItems = [],
  onBasketItemsQueued,
}) => {
  const { t, getFoodDisplayName, formatCurrency } = useLanguage();
  const [view, setView] = useState<'recommendations' | 'list'>(() =>
    pendingBasketItems.length > 0 ? 'list' : 'recommendations',
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [initialList] = useState(() => loadShoppingList(userEmail));
  const [listItems, setListItems] = useState<RestockListItem[]>(initialList.items);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [handoffRetailer, setHandoffRetailer] = useState<Retailer | null>(null);
  const [savedMessage, setSavedMessage] = useState(false);
  const [storageError, setStorageError] = useState(initialList.error);
  const listItemsRef = useRef(listItems);

  const updateListItems = useCallback((update: (current: RestockListItem[]) => RestockListItem[]) => {
    const nextItems = update(listItemsRef.current);
    listItemsRef.current = nextItems;
    setListItems(nextItems);
    try {
      localStorage.setItem(storageKey(userEmail), JSON.stringify(nextItems));
      setStorageError(false);
    } catch (error) {
      console.error('Could not save the shopping list.', error);
      setStorageError(true);
    }
  }, [userEmail]);

  useEffect(() => {
    if (pendingBasketItems.length === 0) return;
    updateListItems((current) => {
      const next = [...current];
      for (const basketItem of pendingBasketItems) {
        const key = basketItem.name.trim().toLocaleLowerCase();
        if (!key) continue;
        const existingIndex = next.findIndex((item) =>
          item.name.trim().toLocaleLowerCase() === key,
        );
        if (existingIndex >= 0) {
          next[existingIndex] = {
            ...next[existingIndex],
            quantity: basketItem.quantity,
            checked: false,
          };
          continue;
        }
        next.push({
          id: `recipe-${encodeURIComponent(key)}`,
          name: basketItem.name,
          quantity: basketItem.quantity,
          emoji: '🛒',
          category: 'Others',
          checked: false,
        });
      }
      return next;
    });
    onBasketItemsQueued?.();
  }, [pendingBasketItems, onBasketItemsQueued, updateListItems]);

  const recommendations = useMemo(
    () => getRestockRecommendations(ingredients, profile),
    [ingredients, profile],
  );
  const hasActiveIngredients = ingredients.some(
    (item) => isActiveIngredient(item) && item.status !== 'expired',
  );
  const household = profile.householdSize.match(/\d+/)?.[0] || profile.householdSize || '2';
  const displayedPreferences = profile.dietaryPreferences
    .slice(0, 2)
    .map((preference) => {
      const translationKey = dietaryPreferenceKeys[preference];
      return translationKey ? t(translationKey) : preference;
    });
  const favorites = profile.favoriteIngredients.map((name) => name.toLocaleLowerCase());
  const orderedRecommendations = recommendations
    .filter((item) => !isRestockFoodAvoided(item.name, profile.foodDislikes))
    .sort((first, second) => {
      const statusOrder: Record<RestockStatus, number> = { buyNow: 0, buySoon: 1, dontBuyYet: 2 };
      const urgencyDifference = statusOrder[first.status] - statusOrder[second.status];
      if (urgencyDifference !== 0) return urgencyDifference;
      const firstFavorite = favorites.some((name) => name.includes(first.name.toLocaleLowerCase()) || first.name.toLocaleLowerCase().includes(name));
      const secondFavorite = favorites.some((name) => name.includes(second.name.toLocaleLowerCase()) || second.name.toLocaleLowerCase().includes(name));
      return Number(secondFavorite) - Number(firstFavorite);
    });

  const addToList = (recommendation: RestockRecommendation) => {
    sound.playTap();
    updateListItems((current) => {
      const recommendationListId = `restock-${recommendation.ingredientId}`;
      const existing = current.find((item) => item.id === recommendationListId);
      if (existing) {
        return current.map((item) => item.id === existing.id
          ? { ...item, quantity: recommendation.recommendedQuantity }
          : item);
      }
      return [...current, {
        id: recommendationListId,
        name: recommendation.name,
        quantity: recommendation.recommendedQuantity,
        emoji: recommendation.emoji,
        category: recommendation.category,
        checked: false,
      }];
    });
    setView('list');
  };

  const addCustomItem = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newItemName.trim()) return;
    sound.playSuccess();
    updateListItems((current) => [...current, {
      id: `custom-${Date.now()}`,
      name: newItemName.trim(),
      quantity: newItemQuantity.trim() || '1 item',
      emoji: '🛒',
      category: 'Others',
      checked: false,
    }]);
    setNewItemName('');
    setNewItemQuantity('');
    setShowAddForm(false);
  };

  const addPurchasedToInventory = () => {
    const purchased = listItems.filter((item) => item.checked);
    if (purchased.length === 0 || !onRestockItems) return;
    sound.playSuccess();
    onRestockItems(purchased.map((item) => ({
      name: item.name,
      emoji: item.emoji,
      category: item.category,
      quantity: item.quantity,
      daysLeft: 7,
      urgency: 'Low',
      useFirstScore: 25,
      storageTip: 'Recently restocked.',
      estimatedValueRp: 0,
      dateAdded: new Date().toISOString().slice(0, 10),
      freshnessPercent: 95,
    })));
    updateListItems((current) => current.filter((item) => !item.checked));
    setSavedMessage(true);
    window.setTimeout(() => {
      setSavedMessage(false);
      onNavigate('inventory');
    }, 1400);
  };

  const openRetailerHandoff = (retailer: Retailer) => {
    sound.playTap();
    setHandoffRetailer(retailer);
  };

  const continueToRetailer = () => {
    if (!handoffRetailer) return;
    window.open(handoffRetailer.website, '_blank', 'noopener,noreferrer');
    setHandoffRetailer(null);
  };

  const getStatusText = (status: RestockStatus) => t(`shopping.restock.${status}`);
  const getRecommendationReason = (item: RestockRecommendation) => {
    if (item.status === 'dontBuyYet') return t('shopping.restock.reasonEnough', { days: item.estimatedDaysLeft });
    if (item.expiryWarning) return t('shopping.restock.reasonExpiry', { quantity: item.currentQuantity });
    if (item.currentStock <= 0) return t('shopping.restock.reasonEmpty');
    return t('shopping.restock.reasonLow', { quantity: item.currentQuantity, days: item.estimatedDaysLeft });
  };

  return (
    <div className="px-page flex-1 space-y-4 pb-8 md:space-y-6 lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(340px,1fr)] lg:gap-8 lg:space-y-0 lg:pb-12">
      <section className="pt-2 lg:col-span-2">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#52796F]">
          {t('shopping.restock.eyebrow')}
        </div>
        <h1 className="font-['Outfit'] text-2xl font-black tracking-tight text-[#1B4332]">
          {t('shopping.restock.title')}
        </h1>
        <p className="mt-1 text-xs font-medium leading-relaxed text-[#52796F]">
          {t('shopping.restock.subtitle', { people: household })}
        </p>
      </section>

      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-[#E4DED1] bg-[#F1EEE6] p-1 lg:col-span-2 lg:mx-auto lg:w-full lg:max-w-xl">
        <button
          type="button"
          onClick={() => { sound.playTap(); setView('recommendations'); }}
          className={`flex min-h-10 items-center justify-center gap-2 rounded-xl px-2 text-xs font-bold transition-colors ${view === 'recommendations' ? 'bg-white text-[#1B4332] shadow-sm' : 'text-[#6B8573]'}`}
        >
          {t('shopping.restock.recommendations')}
        </button>
        <button
          type="button"
          onClick={() => { sound.playTap(); setView('list'); }}
          className={`flex min-h-10 items-center justify-center gap-2 rounded-xl px-2 text-xs font-bold transition-colors ${view === 'list' ? 'bg-white text-[#1B4332] shadow-sm' : 'text-[#6B8573]'}`}
        >
          <ListChecks className="h-4 w-4" />
          {t('shopping.restock.shoppingList')}
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1B4332] px-1 text-[10px] text-white">
            {listItems.length}
          </span>
        </button>
      </div>

      {view === 'recommendations' ? (
        !hasActiveIngredients ? (
          <section className="rounded-3xl border border-[#EDE8DD] bg-white p-5 text-center">
            <h2 className="font-['Outfit'] text-lg font-black text-[#1B4332]">
              {t('home.emptyTitle')}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-[#738B7C]">{t('home.emptyBody')}</p>
            <button
              type="button"
              onClick={() => onNavigate('scan')}
              className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1B4332] px-4 text-xs font-bold text-white"
            >
              <Plus className="h-4 w-4" />
              {t('home.addFood')}
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              className="mt-1 min-h-11 px-4 text-xs font-bold text-[#2D6A4F] underline-offset-4 hover:underline"
            >
              {t('shopping.restock.shoppingList')}
            </button>
          </section>
        ) : (
        <div className="space-y-3 lg:col-span-2 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0 xl:grid-cols-3">
          <div className="rounded-2xl border border-[#D5E5DB] bg-[#EBF3EE] p-3.5 lg:col-span-2 xl:col-span-3">
              <p className="text-xs font-bold text-[#1B4332]">{t('shopping.restock.personalizedTitle')}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-[#52796F]">
                {t('shopping.restock.personalizedBody', {
                  people: household,
                  preferences: displayedPreferences.join(', ') || t('shopping.restock.yourPreferences'),
                })}
              </p>
          </div>

          {orderedRecommendations.map((item) => {
            const expanded = expandedId === item.id;
            const offers = getRetailerOffers(item);
            const bestOffer = getBestRetailer(offers);
            const statusTone = statusStyles[item.status];
            return (
              <article key={item.id} className="overflow-hidden rounded-2xl border border-[#E5EAE2] bg-white">
                <div className="relative h-36 bg-[#EAF1E9] sm:h-40">
                  <FoodImage
                    name={item.name}
                    alt={getFoodDisplayName(item.name)}
                    className="h-full w-full"
                  />
                  <span className={`absolute left-3 top-3 rounded-lg px-2.5 py-1.5 text-[10px] font-bold ${statusTone}`}>
                    {getStatusText(item.status)}
                  </span>
                  <span className="absolute bottom-3 right-3 rounded-lg bg-white/90 px-2.5 py-1.5 text-[10px] font-semibold text-[#65796D] backdrop-blur-sm">
                    {t(`shopping.restock.category.${item.category.toLowerCase()}`)}
                  </span>
                </div>
                <div className="space-y-3.5 p-4">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="font-['Outfit'] text-lg font-bold text-[#173F32]">
                        {getFoodDisplayName(item.name)}
                      </h2>
                      <p className="mt-0.5 text-[11px] font-medium text-[#738B7C]">
                        {t('shopping.restock.inStock')}: <strong className="text-[#1B4332]">{item.currentQuantity}</strong>
                        {item.estimatedDaysLeft > 0 && <> · {t('shopping.restock.daysLeft', { days: item.estimatedDaysLeft })}</>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-end justify-between gap-2 border-y border-[#E8ECE5] py-3">
                    <span className="text-[11px] font-semibold text-[#65796D]">{t('shopping.restock.suggestedQuantity')}</span>
                    <strong className="text-right font-['Outfit'] text-lg font-bold leading-none text-[#173F32]">
                      {item.recommendedQuantity || t('shopping.restock.holdOff')}
                    </strong>
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : item.id)}
                    className="flex min-h-9 w-full items-center justify-between border-t border-[#F0EBE0] pt-2 text-left text-[11px] font-bold text-[#52796F]"
                  >
                    <span>{t('shopping.restock.whyThis')}</span>
                    {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  {expanded && item.status !== 'dontBuyYet' && (
                    <div className="rounded-xl bg-[#F6F8F4] p-3 text-[11px] leading-relaxed text-[#52796F]">
                      {getRecommendationReason(item)}
                    </div>
                  )}
                  {expanded && item.status === 'dontBuyYet' && (
                    <div className="mx-4 mb-4 rounded-xl bg-[#F6F8F4] p-3 text-[11px] leading-relaxed text-[#52796F]">
                      {getRecommendationReason(item)}
                    </div>
                  )}

                  {item.status !== 'dontBuyYet' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => addToList(item)}
                        className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-[#D5E5DB] bg-[#F5F9F6] px-2 text-[11px] font-bold text-[#2D6A4F] active-press"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        {t('shopping.restock.addToList')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedId(expanded ? null : item.id)}
                        className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-[#1B4332] px-2 text-[11px] font-bold text-white active-press"
                      >
                        <Store className="h-3.5 w-3.5" />
                        {t('shopping.restock.compare')}
                      </button>
                    </div>
                  )}
                </div>

                {expanded && item.status !== 'dontBuyYet' && (
                  <div className="space-y-2 border-t border-[#EDE8DD] bg-[#FCFBF8] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xs font-extrabold text-[#1B4332]">{t('shopping.restock.retailerOptions')}</h3>
                      <span className="rounded-full bg-[#F0EBE0] px-2 py-1 text-[9px] font-bold text-[#6B8573]">
                        {t('shopping.restock.demoLabel')}
                      </span>
                    </div>
                    {offers.map((offer) => {
                      const isBest = bestOffer?.retailer.id === offer.retailer.id;
                      const unavailable = offer.availability === 'unavailable';
                      return (
                        <div key={offer.retailer.id} className="rounded-2xl border border-[#EDE8DD] bg-white p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-xs font-extrabold text-[#1B4332]">{offer.retailer.name}</span>
                                {isBest && (
                                  <span className="rounded-full bg-[#E8F2EC] px-1.5 py-0.5 text-[9px] font-bold text-[#2D6A4F]">
                                    {t('shopping.restock.bestOption')}
                                  </span>
                                )}
                              </div>
                              <p className={`mt-1 text-[10px] font-semibold ${unavailable ? 'text-[#A84636]' : 'text-[#52796F]'}`}>
                                {t(`shopping.restock.availability.${offer.availability}`)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-black text-[#1B4332]">{formatCurrency(offer.priceRp)}</p>
                              <p className="mt-0.5 text-[9px] text-[#738B7C]">
                                {t('shopping.restock.withDelivery', { amount: formatCurrency(offer.totalRp) })}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1 text-[10px] text-[#738B7C]">
                              <Clock3 className="h-3 w-3" /> {offer.retailer.deliveryTime.replace(/\bmin\b/g, t('shopping.restock.minute'))}
                            </span>
                            <button
                              type="button"
                              disabled={unavailable}
                              onClick={() => openRetailerHandoff(offer.retailer)}
                              className="flex min-h-8 items-center gap-1 rounded-lg bg-[#1B4332] px-2.5 text-[10px] font-bold text-white disabled:cursor-not-allowed disabled:bg-[#D8D8D0] disabled:text-[#738B7C]"
                            >
                              {t(unavailable ? 'shopping.restock.unavailableButton' : 'shopping.restock.goToStore')}
                              {!unavailable && <ArrowUpRight className="h-3 w-3" />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    <p className="text-[10px] leading-relaxed text-[#738B7C]">
                      {t('shopping.restock.demoDisclaimer')}
                    </p>
                  </div>
                )}
              </article>
            );
          })}

          <button
            type="button"
            onClick={() => { sound.playTap(); setView('list'); }}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1B4332] text-sm font-bold text-white shadow-lg shadow-[#1B4332]/20 active-press"
          >
            <ShoppingCart className="h-4 w-4" />
            {t('shopping.restock.openList', { count: listItems.length })}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        )
      ) : (
        <div className="space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between gap-2 px-0.5">
            <div>
              <h2 className="font-['Outfit'] text-base font-black text-[#1B4332]">{t('shopping.restock.shoppingList')}</h2>
              <p className="mt-0.5 text-[11px] font-medium text-[#738B7C]">{t('shopping.restock.listSubtitle')}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm((shown) => !shown)}
              className="flex min-h-10 items-center gap-1 rounded-xl px-2 text-xs font-bold text-[#2D6A4F]"
            >
              <Plus className="h-4 w-4" /> {t('shopping.restock.addItem')}
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={addCustomItem} className="space-y-2 rounded-2xl border border-[#D5E5DB] bg-white p-3">
              <input
                value={newItemName}
                onChange={(event) => setNewItemName(event.target.value)}
                placeholder={t('shopping.restock.itemName')}
                aria-label={t('shopping.restock.itemName')}
                className="h-11 w-full rounded-xl border border-[#EDE8DD] bg-[#FAF8F5] px-3 text-sm outline-none focus:border-[#2D6A4F]"
                required
              />
              <div className="flex gap-2">
                <input
                  value={newItemQuantity}
                  onChange={(event) => setNewItemQuantity(event.target.value)}
                  placeholder={t('shopping.restock.quantity')}
                  aria-label={t('shopping.restock.quantity')}
                  className="h-10 min-w-0 flex-1 rounded-xl border border-[#EDE8DD] bg-[#FAF8F5] px-3 text-xs outline-none focus:border-[#2D6A4F]"
                />
                <button type="submit" className="min-h-10 rounded-xl bg-[#1B4332] px-4 text-xs font-bold text-white">
                  {t('shopping.restock.add')}
                </button>
              </div>
            </form>
          )}

          {listItems.length === 0 ? (
            <div className="rounded-3xl border border-[#EDE8DD] bg-white px-5 py-8 text-center card-shadow">
              <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F4F1E9] text-[#2D6A4F]">
                <ShoppingBag className="h-5 w-5" />
              </span>
              <h3 className="text-sm font-bold text-[#1B4332]">{t('shopping.restock.emptyTitle')}</h3>
              <p className="mt-1 text-xs leading-relaxed text-[#738B7C]">{t('shopping.restock.emptyBody')}</p>
              <button
                type="button"
                onClick={() => setView('recommendations')}
                className="mt-4 min-h-10 rounded-xl bg-[#1B4332] px-4 text-xs font-bold text-white"
              >
                {t('shopping.restock.seeRecommendations')}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {listItems.map((item) => (
                <article key={item.id} className="flex items-center gap-2 rounded-2xl border border-[#EDE8DD] bg-white p-3">
                  <button
                    type="button"
                    aria-label={item.checked ? t('shopping.restock.unmarkPurchased') : t('shopping.restock.markPurchased')}
                    onClick={() => updateListItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, checked: !entry.checked } : entry))}
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${item.checked ? 'border-[#2D6A4F] bg-[#2D6A4F] text-white' : 'border-[#CBD5C9] bg-white text-transparent'}`}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <span className="text-xl">{item.emoji}</span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <input
                      value={item.name}
                      aria-label={t('shopping.restock.itemName')}
                      onChange={(event) => updateListItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, name: event.target.value } : entry))}
                      className={`w-full bg-transparent text-sm font-bold outline-none ${item.checked ? 'text-[#738B7C] line-through' : 'text-[#1B4332]'}`}
                    />
                    <input
                      value={item.quantity}
                      aria-label={t('shopping.restock.quantity')}
                      onChange={(event) => updateListItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, quantity: event.target.value } : entry))}
                      className="w-full bg-transparent text-[11px] font-medium text-[#738B7C] outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    aria-label={t('shopping.restock.removeItem')}
                    onClick={() => updateListItems((current) => current.filter((entry) => entry.id !== item.id))}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#8C9A8E] hover:bg-[#FCE8E4] hover:text-[#A84636]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </article>
              ))}
            </div>
          )}

          <section className="space-y-2 rounded-2xl border border-[#EDE8DD] bg-white p-4">
            <div className="flex items-start gap-2">
              <Store className="mt-0.5 h-4 w-4 shrink-0 text-[#2D6A4F]" />
              <div>
                <h3 className="text-xs font-extrabold text-[#1B4332]">{t('shopping.restock.partnerTitle')}</h3>
                <p className="mt-1 text-[10px] leading-relaxed text-[#738B7C]">{t('shopping.restock.partnerBody')}</p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {['Super Indo', 'Alfagift', 'Klik Indomaret'].map((partner) => (
                <div key={partner} className="flex min-h-12 items-center justify-between gap-2 rounded-xl border border-[#EDE8DD] bg-[#FAF8F5] px-3 py-2">
                  <span className="text-[11px] font-bold text-[#1B4332]">{partner}</span>
                  <span className="rounded-full bg-[#F0EBE0] px-2 py-1 text-[9px] font-bold text-[#738B7C]">
                    {t('shopping.restock.partnerComingSoon')}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {listItems.some((item) => item.checked) && (
            <button
              type="button"
              onClick={addPurchasedToInventory}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1B4332] text-sm font-bold text-white shadow-lg shadow-[#1B4332]/20 active-press"
            >
              <Check className="h-4 w-4" />
              {t('shopping.restock.confirmPurchased', { count: listItems.filter((item) => item.checked).length })}
            </button>
          )}
          <div className="flex gap-2 rounded-2xl bg-[#F3F0E7] p-3 text-[10px] leading-relaxed text-[#6B8573]">
            <CircleDollarSign className="mt-0.5 h-4 w-4 shrink-0" />
            {t('shopping.restock.purchaseNote')}
          </div>
        </div>
      )}

      {savedMessage && (
        <div role="status" className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-full bg-[#1B4332] px-4 py-2.5 text-xs font-bold text-white shadow-lg">
          {t('shopping.restock.savedMessage')}
        </div>
      )}
      {storageError && (
        <div role="alert" className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-2xl bg-[#A84636] px-4 py-2.5 text-center text-xs font-bold text-white shadow-lg">
          {t('shopping.restock.storageError')}
        </div>
      )}

      {handoffRetailer && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#183528]/55 p-4 backdrop-blur-[2px] sm:items-center">
          <section role="dialog" aria-modal="true" aria-labelledby="retailer-handoff-title" className="w-full max-w-sm space-y-4 rounded-3xl border border-[#EDE8DD] bg-[#FAF8F5] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E8F2EC] text-[#2D6A4F]">
                <Store className="h-5 w-5" />
              </div>
              <button type="button" aria-label={t('shopping.restock.close')} onClick={() => setHandoffRetailer(null)} className="flex h-9 w-9 items-center justify-center rounded-full text-[#52796F] hover:bg-[#EEE9DF]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div>
              <h2 id="retailer-handoff-title" className="font-['Outfit'] text-lg font-black text-[#1B4332]">
                {t('shopping.restock.handoffTitle', { retailer: handoffRetailer.name })}
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-[#52796F]">{t('shopping.restock.handoffBody')}</p>
            </div>
            <div className="rounded-2xl border border-[#E4DED1] bg-white p-3 text-[11px] leading-relaxed text-[#6B8573]">
              <p>{t('shopping.restock.demoDisclaimer')}</p>
              <p className="mt-2 font-semibold">{t('shopping.restock.noPurchase')}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setHandoffRetailer(null)} className="min-h-11 rounded-xl border border-[#DCD6C7] text-xs font-bold text-[#52796F]">
                {t('shopping.restock.cancel')}
              </button>
              <button type="button" onClick={continueToRetailer} className="flex min-h-11 items-center justify-center gap-1 rounded-xl bg-[#1B4332] text-xs font-bold text-white">
                {t('shopping.restock.continue')}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
