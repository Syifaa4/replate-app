import React, { useState } from 'react';
import {
  Bell,
  Sliders,
  HelpCircle,
  ChevronRight,
  TrendingDown,
  Sprout,
  UsersRound,
  Info,
  ShoppingBag,
  Globe,
  LogOut,
  X,
  Check,
  Pencil,
} from 'lucide-react';
import { MainTab, UserProfile } from '../../types';
import { sound } from '../../utils/sound';
import { SupportedLanguage, useLanguage } from '../../i18n';
import type { AppPreferences } from '../../services/appPreferences';

interface ProfileScreenProps {
  profile: UserProfile;
  onEditProfile: () => void;
  onEditFoodPreferences: () => void;
  onNavigate: (tab: MainTab) => void;
  onResetData: () => void;
  onLoadScenario: (scenario: 'urgent' | 'restocked' | 'empty') => void;
  onReplayOnboarding?: () => void;
  onLogout?: () => void;
  appPreferences: AppPreferences;
  onChangeAppPreferences: (preferences: AppPreferences) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  profile,
  onEditProfile,
  onEditFoodPreferences,
  onNavigate,
  onResetData: _onResetData,
  onLoadScenario,
  onReplayOnboarding,
  onLogout,
  appPreferences,
  onChangeAppPreferences,
}) => {
  const [activeModal, setActiveModal] = useState<
    'patterns' | 'notifications' | 'help' | 'about' | 'language' | null
  >(null);
  const { language, setLanguage, t } = useLanguage();

  const selectLanguage = (nextLanguage: SupportedLanguage) => {
    sound.playTap();
    setLanguage(nextLanguage);
  };

  const profileValueKeys: Record<string, string> = {
    '1 person': 'screens.profile.householdCountSolo',
    '1 person (Solo)': 'screens.profile.householdSolo',
    '2 people': 'screens.profile.householdCouple',
    '2 people (Couple)': 'screens.profile.householdCouple',
    '3-4 people (Family)': 'screens.profile.householdFamily',
    '3–4 people': 'screens.profile.householdCountFamily',
    '5+ people': 'screens.profile.householdCountLarge',
    'Daily as needed': 'screens.profile.frequencyDaily',
    'Weekly on Saturdays': 'screens.profile.frequencyWeekly',
    'Twice a week': 'screens.profile.frequencyTwiceWeekly',
    'Bi-weekly bulk': 'screens.profile.frequencyBiweekly',
    Flexitarian: 'screens.profile.dietFlexitarian',
    'High-Protein': 'screens.profile.dietHighProtein',
    'Low Waste': 'screens.profile.dietLowWaste',
    Spinach: 'screens.profile.foodSpinach',
    Eggs: 'screens.profile.foodEggs',
    Tomatoes: 'screens.profile.foodTomatoes',
    Tofu: 'screens.profile.foodTofu',
    'Processed canned meat': 'screens.profile.dislikeCannedMeat',
    'Bitter melon': 'screens.profile.dislikeBitterMelon',
    indonesian: 'preferenceSetup.options.indonesian',
    asian: 'preferenceSetup.options.asian',
    western: 'preferenceSetup.options.western',
    vegetarian: 'preferenceSetup.options.vegetarian',
    highProtein: 'preferenceSetup.options.highProtein',
    comfortFood: 'preferenceSetup.options.comfortFood',
    quickSimple: 'preferenceSetup.options.quickSimple',
    healthyMeals: 'preferenceSetup.options.healthyMeals',
    homemade: 'preferenceSetup.options.homemade',
    higherProtein: 'preferenceSetup.options.higherProtein',
    lowerSugar: 'preferenceSetup.options.lowerSugar',
    lowerSodium: 'preferenceSetup.options.lowerSodium',
    moreVegetables: 'preferenceSetup.options.moreVegetables',
    balancedNutrition: 'preferenceSetup.options.balancedNutrition',
    seafood: 'preferenceSetup.options.seafood',
    beef: 'preferenceSetup.options.beef',
    chicken: 'preferenceSetup.options.chicken',
    dairy: 'preferenceSetup.options.dairy',
    eggs: 'preferenceSetup.options.eggs',
    spicyFood: 'preferenceSetup.options.spicyFood',
    nuts: 'preferenceSetup.options.nuts',
    gluten: 'preferenceSetup.options.gluten',
  };
  const displayProfileValue = (value: string) => {
    const key = profileValueKeys[value];
    return key ? t(key) : value;
  };
  const favoriteOptions = [
    ['Spinach', 'screens.profile.foodSpinach'],
    ['Eggs', 'screens.profile.foodEggs'],
    ['Tomatoes', 'screens.profile.foodTomato'],
    ['Tofu', 'screens.profile.foodTofu'],
  ] as const;
  const householdCountKey = profile.householdSize.startsWith('1')
    ? 'screens.profile.householdCountSolo'
    : profile.householdSize.startsWith('2')
    ? 'screens.profile.householdCountCouple'
    : profile.householdSize.startsWith('3')
    ? 'screens.profile.householdCountFamily'
    : 'screens.profile.householdCountLarge';
  const householdTypeKey = profile.householdSize.startsWith('1')
    ? 'screens.profile.householdTypeSolo'
    : profile.householdSize.startsWith('2')
    ? 'screens.profile.householdTypeCouple'
    : profile.householdSize.startsWith('3')
    ? 'screens.profile.householdTypeFamily'
    : 'screens.profile.householdTypeLarge';
  const insightPriorityKey = profile.dietaryPreferences.includes('High-Protein')
    ? 'screens.profile.insightHighProtein'
    : profile.dietaryPreferences.includes('Low Waste')
    ? 'screens.profile.insightLowWaste'
    : profile.favoriteIngredients.length > 0
    ? 'screens.profile.insightFavorites'
    : 'screens.profile.insightAvailableFood';
  const profileInsight = t('screens.profile.profileInsight', {
    household: t(householdCountKey),
    priority: t(insightPriorityKey, {
      foods: profile.favoriteIngredients
        .slice(0, 2)
        .map(displayProfileValue)
        .join(', '),
    }),
  });

  const _handleScenarioChange = (s: 'urgent' | 'restocked' | 'empty') => {
    sound.playTap();
    onLoadScenario(s);
  };

  return (
    <div className="px-page grid flex-1 grid-cols-1 space-y-4 pb-8 md:space-y-6 lg:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)] lg:gap-8 lg:space-y-0 lg:pb-12">
      {/* 1. ALEX PROFILE HEADER (Prompt Section 17) */}
      <section className="pt-2 lg:col-span-2">
        <div className="bg-[#EAF1E9] rounded-3xl p-5 border border-[#DDE8DD] text-center lg:flex lg:items-center lg:gap-7 lg:px-8 lg:py-6 lg:text-left">
          {/* Avatar */}
          <div className="relative w-20 h-20 mx-auto mb-3 lg:mx-0 lg:mb-0 lg:h-24 lg:w-24 lg:shrink-0">
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-full h-full rounded-full object-cover ring-2 ring-[#E8F2EC]"
            />
          </div>

          <div className="flex items-center justify-center gap-1.5 lg:justify-start">
            <span className="text-xs font-bold text-[#2D6A4F] tracking-wide uppercase">
              {t('profile.memberBadge')}
            </span>
          </div>
          <h2 className="font-['Outfit'] font-black text-2xl text-[#1B4332] mt-0.5">
            {profile.name}
          </h2>
          <a
            href={`mailto:${profile.email}`}
            className="block w-fit mx-auto text-xs text-[#738B7C] mt-0.5 hover:text-[#2D6A4F] lg:mx-0"
          >
            {profile.email}
          </a>
          <button
            type="button"
            onClick={onEditProfile}
            className="min-h-11 mt-1.5 px-2 mx-auto inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-semibold text-[#2D6A4F] active-press lg:mx-0"
          >
            <Pencil className="w-3.5 h-3.5" />
            {t('screens.profile.editProfileAction')}
          </button>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF3EE] text-[#1B4332] text-xs font-semibold border border-[#D5E5DB] lg:ml-auto">
            <span>{t('screens.profile.household')}: {displayProfileValue(profile.householdSize)}</span>
            <span>·</span>
            <span>{profile.city}</span>
          </div>
        </div>
      </section>

      {/* 2. PERSONAL FOOD PROFILE */}
      <section className="space-y-3 lg:col-start-1">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="font-['Outfit'] font-black text-base text-[#1B4332]">
              {t('screens.profile.foodProfileTitle')}
            </h3>
            <p className="text-[11px] text-[#738B7C] mt-0.5">
              {t('screens.profile.foodProfileSubtitle')}
            </p>
          </div>
          <button
            onClick={onEditFoodPreferences}
            className="min-h-10 px-3 text-xs font-bold text-[#2D6A4F] rounded-xl hover:bg-[#E8F2EC] active-press"
          >
            {t('screens.profile.editPreferencesAction')}
          </button>
        </div>

        <div className="bg-white rounded-3xl p-4 border border-[#EDE8DD] card-shadow space-y-4">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#F0EBE0]">
            <div className="flex items-center gap-2.5 min-w-0">
              <UsersRound className="w-4 h-4 text-[#52796F]" aria-hidden="true" />
              <div>
                <h4 className="text-xs font-bold text-[#1B4332]">
                  {t('screens.profile.foodProfileHousehold')}
                </h4>
                <p className="text-[11px] text-[#738B7C] mt-0.5">
                  {t(householdTypeKey)}
                </p>
              </div>
            </div>
            <span className="shrink-0 px-3 py-1.5 rounded-full bg-[#E8F2EC] text-[#1B4332] text-xs font-bold">
              {t(householdCountKey)}
            </span>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[#1B4332] mb-2">
              {t('screens.profile.foodProfileEating')}
            </h4>
            {profile.dietaryPreferences.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.dietaryPreferences.map((pref) => (
                  <span
                    key={pref}
                    className="px-3 py-1.5 rounded-full bg-[#E8F2EC] text-[#2D6A4F] text-xs font-semibold"
                  >
                    <span aria-hidden="true">✓ </span>{displayProfileValue(pref)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-[#8FA88D]">{t('screens.profile.noProfileChoices')}</p>
            )}
          </div>

          <div className="pt-3 border-t border-[#F0EBE0]">
            <h4 className="text-xs font-bold text-[#1B4332] mb-2">
              {t('screens.profile.foodProfileFavorites')}
            </h4>
            {profile.favoriteIngredients.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.favoriteIngredients.map((ingredient) => {
                  const option = favoriteOptions.find(([value]) => value === ingredient);
                  return (
                    <span
                      key={ingredient}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF8F5] text-[#1B4332] text-xs font-semibold border border-[#F0EBE0]"
                    >
                      {option ? t(option[1]) : displayProfileValue(ingredient)}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-[#8FA88D]">{t('screens.profile.noProfileChoices')}</p>
            )}
          </div>

          <div className="pt-3 border-t border-[#F0EBE0]">
            <h4 className="text-xs font-bold text-[#1B4332] mb-2">
              {t('screens.profile.foodProfileAvoid')}
            </h4>
            {profile.foodDislikes.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.foodDislikes.map((food) => (
                  <span
                    key={food}
                    className="px-3 py-1.5 rounded-full bg-[#FFFAF8] text-[#9B6258] text-xs font-medium border border-[#F1DAD4]"
                  >
                    {displayProfileValue(food)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-[#8FA88D]">{t('screens.profile.noProfileChoices')}</p>
            )}
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-[#F0EBE0]">
            <ShoppingBag className="w-4 h-4 text-[#52796F]" aria-hidden="true" />
            <div>
              <h4 className="text-xs font-bold text-[#1B4332]">
                {t('screens.profile.foodProfileShopping')}
              </h4>
              <p className="text-sm font-bold text-[#2D6A4F] mt-0.5">
                {displayProfileValue(profile.shoppingFrequency)}
              </p>
              <p className="text-[10px] text-[#738B7C] mt-0.5">
                {t('screens.profile.usualShoppingDay')}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-[#E8F2EC] border border-[#D5E5DB] px-4 py-3.5">
          <h4 className="text-xs font-bold text-[#1B4332]">
            {t('screens.profile.aiKnowsYou').replace(/\bAI\b/gi, '').trim()}
          </h4>
          <p className="text-[11px] leading-relaxed text-[#52796F] mt-1.5">
            {profileInsight}
          </p>
        </div>
      </section>

      {/* 3. 5 REQUIRED SECTIONS (Prompt Section 17) */}
      <section className="bg-white rounded-3xl p-2 border border-[#EDE8DD] card-shadow divide-y divide-[#F0EBE0] lg:col-start-2">
        {/* Section 1: My Food Patterns */}
        <button
          onClick={() => {
            sound.playTap();
            setActiveModal('patterns');
          }}
          className="w-full py-3.5 px-3 flex items-center justify-between text-left hover:bg-[#FAF8F5] transition-colors active-press group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-[#1B4332] block">
                {t('profile.sections.patterns')}
              </span>
              <span className="text-[10px] text-[#738B7C]">
                {t('screens.profile.patternsDetail')}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#8FA88D] group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Section 2: Notifications */}
        <button
          onClick={() => {
            sound.playTap();
            setActiveModal('notifications');
          }}
          className="w-full py-3.5 px-3 flex items-center justify-between text-left hover:bg-[#FAF8F5] transition-colors active-press group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#E8F2EC] text-[#2D6A4F] flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-[#1B4332] block">{t('profile.sections.notifications')}</span>
              <span className="text-[10px] text-[#738B7C]">
                {t('screens.profile.notificationsDetail')}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#8FA88D] group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Section 3: Preferences */}
        <button
          onClick={() => {
            sound.playTap();
            onEditFoodPreferences();
          }}
          className="w-full py-3.5 px-3 flex items-center justify-between text-left hover:bg-[#FAF8F5] transition-colors active-press group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#FAF8F5] text-[#2D6A4F] flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-[#1B4332] block">{t('profile.sections.preferences')}</span>
              <span className="text-[10px] text-[#738B7C]">
                {t('screens.profile.preferencesDetail')}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#8FA88D] group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Section 4: Language */}
        <button
          onClick={() => {
            sound.playTap();
            setActiveModal('language');
          }}
          className="w-full py-3.5 px-3 flex items-center justify-between text-left hover:bg-[#FAF8F5] transition-colors active-press group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#E8F2EC] text-[#2D6A4F] flex items-center justify-center">
              <Globe className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <span className="font-bold text-xs text-[#1B4332] block">
                {t('profile.sections.language')}
              </span>
              <span className="flex items-center gap-1.5 text-[10px] text-[#738B7C]">
                {language === 'en' ? (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 60 30"
                    className="h-3 w-5 rounded-[2px]"
                  >
                    <clipPath id="language-row-union-jack-clip">
                      <path d="M0 0h60v30H0z" />
                    </clipPath>
                    <g clipPath="url(#language-row-union-jack-clip)">
                      <path fill="#012169" d="M0 0h60v30H0z" />
                      <path stroke="#fff" strokeWidth="6" d="m0 0 60 30m0-30L0 30" />
                      <path stroke="#c8102e" strokeWidth="2" d="m0 0 60 30m0-30L0 30" />
                      <path stroke="#fff" strokeWidth="10" d="M30 0v30M0 15h60" />
                      <path stroke="#c8102e" strokeWidth="6" d="M30 0v30M0 15h60" />
                    </g>
                  </svg>
                ) : (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 60 30"
                    className="h-3 w-5 rounded-[2px] border border-black/5"
                  >
                    <path fill="#e31b23" d="M0 0h60v15H0z" />
                    <path fill="#fff" d="M0 15h60v15H0z" />
                  </svg>
                )}
                <span>{t(language === 'en' ? 'profile.englishLanguage' : 'profile.indonesianLanguage')}</span>
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#8FA88D] group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Section 4: Help & Support */}
        <button
          onClick={() => {
            sound.playTap();
            setActiveModal('help');
          }}
          className="w-full py-3.5 px-3 flex items-center justify-between text-left hover:bg-[#FAF8F5] transition-colors active-press group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#FAF8F5] text-[#2D6A4F] flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-[#1B4332] block">{t('profile.sections.help')}</span>
              <span className="text-[10px] text-[#738B7C]">
                {t('profile.sections.helpSubtitle')}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#8FA88D] group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Section: Your Impact */}
        <button
          onClick={() => {
            sound.playTap();
            onNavigate('impact');
          }}
          className="w-full py-3.5 px-3 flex items-center justify-between text-left hover:bg-[#FAF8F5] transition-colors active-press group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#E8F2EC] text-[#2D6A4F] flex items-center justify-center">
              <Sprout className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-[#1B4332] block">
                {t('screens.profile.impact')}
              </span>
              <span className="text-[10px] text-[#738B7C]">
                {t('screens.profile.impactDetail')}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#8FA88D] group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Section 5: About REPLATE */}
        <button
          onClick={() => {
            sound.playTap();
            setActiveModal('about');
          }}
          className="w-full py-3.5 px-3 flex items-center justify-between text-left hover:bg-[#FAF8F5] transition-colors active-press group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#E8F2EC] text-[#2D6A4F] flex items-center justify-center">
            <Info className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-[#1B4332] block">
                {t('profile.sections.about')}
              </span>
              <span className="text-[10px] text-[#738B7C]">{t('profile.sections.aboutSubtitle')}</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#8FA88D] group-hover:translate-x-0.5 transition-transform" />
        </button>
      </section>

      {/* 4. ACCOUNT ACTIONS */}
      <section className="space-y-2">
        {/* Replay Onboarding */}
        {onReplayOnboarding && (
          <button
            onClick={() => {
              sound.playTap();
              onReplayOnboarding();
            }}
            className="w-full py-3 px-4 bg-white rounded-2xl border border-[#EDE8DD] text-xs font-bold text-[#1B4332] flex items-center justify-between active-press card-shadow cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Pencil className="w-4 h-4 text-[#52796F]" />
              <span>{t('screens.profile.replay')}</span>
            </div>
            <span className="text-[10px] text-[#738B7C]">{t('screens.profile.replayDetail')}</span>
          </button>
        )}

        {/* Log Out */}
        {onLogout && (
          <button
            onClick={() => {
              sound.playTap();
              onLogout();
            }}
            className="w-full py-3 px-4 bg-[#FDF2F0] rounded-2xl border border-[#FAD2CD] text-xs font-bold text-[#E05342] flex items-center justify-center gap-2 active-press cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('screens.profile.logout')}</span>
          </button>
        )}
      </section>

      {/* FOOTER QUOTE */}
      <footer className="text-center pt-2 pb-4 space-y-1">
        <p className="text-xs font-semibold text-[#1B4332] italic">
          “{t('screens.profile.quote')}”
        </p>
        <p className="text-[10px] text-[#8FA88D]">
          {t('screens.profile.footer').replace(/\bAI\b/gi, '').replace(/\s{2,}/g, ' ').trim()}
        </p>
      </footer>

      {/* ================= MODAL SHEETS ================= */}

      {activeModal === 'language' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in"
          onClick={() => setActiveModal(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="language-modal-title"
            className="w-full max-w-xs bg-[#FAF8F5] rounded-3xl p-5 shadow-2xl border border-[#EDE8DD] space-y-3.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#EDE8DD]">
              <div>
                <h3 id="language-modal-title" className="font-['Outfit'] font-black text-base text-[#1B4332]">
                  {t('profile.languageModalTitle')}
                </h3>
                <p className="text-[11px] text-[#738B7C] mt-0.5">
                  {t('profile.languageModalSubtitle')}
                </p>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                aria-label={t('actions.close')}
                className="w-7 h-7 rounded-full bg-[#EAE4D5] flex items-center justify-center text-[#556D5C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div role="radiogroup" aria-label={t('profile.languageModalTitle')} className="space-y-2">
              {([
                ['en', t('profile.englishLanguage')],
                ['id', t('profile.indonesianLanguage')],
              ] as const).map(([value, label]) => {
                const isSelected = language === value;

                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => selectLanguage(value)}
                    className={`w-full min-h-12 px-3 py-2.5 rounded-xl border flex items-center justify-between text-left transition-colors ${
                      isSelected
                        ? 'bg-[#E8F2EC] border-[#2D6A4F] text-[#1B4332] shadow-[inset_0_0_0_1px_rgba(45,106,79,0.12)]'
                        : 'bg-white border-[#EDE8DD] text-[#1B4332]'
                    }`}
                  >
                    <span className="flex items-center gap-3 font-bold text-sm">
                      {value === 'en' ? (
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 60 30"
                          className="h-4 w-6 rounded-sm"
                        >
                          <clipPath id="union-jack-clip">
                            <path d="M0 0h60v30H0z" />
                          </clipPath>
                          <g clipPath="url(#union-jack-clip)">
                            <path fill="#012169" d="M0 0h60v30H0z" />
                            <path
                              stroke="#fff"
                              strokeWidth="6"
                              d="m0 0 60 30m0-30L0 30"
                            />
                            <path
                              stroke="#c8102e"
                              strokeWidth="2"
                              d="m0 0 60 30m0-30L0 30"
                            />
                            <path stroke="#fff" strokeWidth="10" d="M30 0v30M0 15h60" />
                            <path stroke="#c8102e" strokeWidth="6" d="M30 0v30M0 15h60" />
                          </g>
                        </svg>
                      ) : (
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 60 30"
                          className="h-4 w-6 rounded-sm border border-black/5"
                        >
                          <path fill="#e31b23" d="M0 0h60v15H0z" />
                          <path fill="#fff" d="M0 15h60v15H0z" />
                        </svg>
                      )}
                      <span>{label}</span>
                    </span>

                    {isSelected && <Check className="w-4 h-4 text-[#2D6A4F]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: MY FOOD PATTERNS */}
      {activeModal === 'patterns' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-xs bg-[#FAF8F5] rounded-3xl p-5 shadow-2xl border border-[#EDE8DD] space-y-3.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#EDE8DD] pb-2">
              <h3 className="font-['Outfit'] font-black text-base text-[#1B4332]">
                {t('profile.sections.patterns')}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="w-7 h-7 rounded-full bg-[#EAE4D5] flex items-center justify-center text-[#556D5C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-white rounded-2xl border border-[#EDE8DD] space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#1B4332]">{t('screens.profile.patternsTitle')}</span>
              </div>
              <p className="text-[#52796F] leading-relaxed">
                {t('screens.profile.patternsBody')}
              </p>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 bg-[#1B4332] text-white rounded-xl text-xs font-bold"
            >
              {t('actions.close')}
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: NOTIFICATIONS */}
      {activeModal === 'notifications' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-xs bg-[#FAF8F5] rounded-3xl p-5 shadow-2xl border border-[#EDE8DD] space-y-3.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#EDE8DD] pb-2">
              <h3 className="font-['Outfit'] font-black text-base text-[#1B4332]">
                {t('screens.profile.notificationsTitle')}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="w-7 h-7 rounded-full bg-[#EAE4D5] flex items-center justify-center text-[#556D5C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-[#EDE8DD]">
                <div>
                  <p className="font-bold text-[#1B4332]">{t('screens.profile.dailyAlerts')}</p>
                  <p className="text-[10px] text-[#738B7C]">{t('screens.profile.promptTime')}</p>
                </div>
                <input
                  type="checkbox"
                  checked={appPreferences.ingredientRemindersEnabled}
                  onChange={(e) => onChangeAppPreferences({
                    ...appPreferences,
                    ingredientRemindersEnabled: e.target.checked,
                  })}
                  className="w-5 h-5 accent-[#2D6A4F]"
                />
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#EDE8DD]">
                <div>
                  <p className="font-bold text-[#1B4332]">{t('screens.profile.shoppingTips')}</p>
                  <p className="text-[10px] text-[#738B7C]">{t('screens.profile.noDuplicates')}</p>
                </div>
                <input
                  type="checkbox"
                  checked={appPreferences.notificationsEnabled}
                  onChange={(e) => onChangeAppPreferences({
                    ...appPreferences,
                    notificationsEnabled: e.target.checked,
                  })}
                  className="w-5 h-5 accent-[#2D6A4F]"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-bold text-[#1B4332]">{t('screens.profile.cookNow')}</p>
                  <p className="text-[10px] text-[#738B7C]">{t('screens.profile.expiryRecipes')}</p>
                </div>
                <input
                  type="checkbox"
                  checked={appPreferences.recipeRecommendationsEnabled}
                  onChange={(e) => onChangeAppPreferences({
                    ...appPreferences,
                    recipeRecommendationsEnabled: e.target.checked,
                  })}
                  className="w-5 h-5 accent-[#2D6A4F]"
                />
              </div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 bg-[#1B4332] text-white rounded-xl text-xs font-bold"
            >
              {t('screens.profile.saveNotifications')}
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: PREFERENCES */}
      {/* MODAL 4: HELP & SUPPORT */}
      {activeModal === 'help' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-xs bg-[#FAF8F5] rounded-3xl p-5 shadow-2xl border border-[#EDE8DD] space-y-3.5 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#EDE8DD] pb-2">
              <h3 className="font-['Outfit'] font-black text-base text-[#1B4332]">
                {t('screens.profile.helpTitle')}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="w-7 h-7 rounded-full bg-[#EAE4D5] flex items-center justify-center text-[#556D5C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-[#2C4A38]">
              <div className="p-3 bg-white rounded-2xl border border-[#EDE8DD] space-y-1">
                <p className="font-bold text-[#1B4332]">{t('screens.profile.helpScoreTitle')}</p>
                <p className="text-[11px] text-[#52796F] leading-relaxed">
                  {t('screens.profile.helpScoreBody')}
                </p>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-[#EDE8DD] space-y-1">
                <p className="font-bold text-[#1B4332]">{t('screens.profile.helpScanTitle')}</p>
                <p className="text-[11px] text-[#52796F] leading-relaxed">
                  {t('screens.profile.helpScanBody')}
                </p>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-[#EDE8DD] space-y-1">
                <p className="font-bold text-[#1B4332]">{t('screens.profile.helpAssistanceTitle')}</p>
                <p className="text-[11px] text-[#52796F] leading-relaxed">
                  {t('screens.profile.helpAssistanceBody')} <span className="text-[#2D6A4F] font-bold">help@replate.app</span>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 bg-[#1B4332] text-white rounded-xl text-xs font-bold"
            >
              {t('screens.profile.done')}
            </button>
          </div>
        </div>
      )}

      {/* MODAL 5: ABOUT REPLATE (Philosophy & Identity) */}
      {activeModal === 'about' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-xs bg-[#FAF8F5] rounded-3xl p-5 shadow-2xl border border-[#EDE8DD] space-y-3.5 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-[#E8F2EC] text-[#2D6A4F] flex items-center justify-center mx-auto">
              <Info className="w-5 h-5" />
            </div>

            <div>
              <h3 className="font-['Outfit'] font-black text-xl text-[#1B4332]">
                REPLATE
              </h3>
              <p className="font-['Outfit'] font-bold text-sm text-[#E76F51]">
                {t('screens.profile.aboutTagline')}
              </p>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-[#EDE8DD] text-left text-xs space-y-2">
              <p className="font-bold text-[#1B4332]">
                {t('screens.profile.aboutTitle')}
              </p>
              <p className="text-[#52796F] leading-relaxed">
                {t('screens.profile.aboutBody')}
              </p>
              <div className="p-2.5 bg-[#EBF3EE] rounded-xl text-[#1B4332] font-semibold text-[11px] italic">
                “{t('screens.profile.quote')}”
              </div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 bg-[#1B4332] text-white rounded-xl text-xs font-bold"
            >
              {t('actions.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
