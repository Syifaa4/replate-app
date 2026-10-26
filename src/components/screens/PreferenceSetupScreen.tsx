import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CookingPot,
  Drumstick,
  HeartPulse,
  House,
  Leaf,
  Plus,
  Sandwich,
  Soup,
  Timer,
  Utensils,
} from 'lucide-react';
import type { FoodPreferences } from '../../types';
import { createEmptyFoodPreferences } from '../../services/foodPreferences';
import { sound } from '../../utils/sound';
import { useLanguage } from '../../i18n';
import { ReplateLogo } from '../ReplateLogo';
import { FoodImage } from '../FoodImage';

type PreferenceStep = 1 | 2 | 3 | 4;
type PreferenceMode = 'onboarding' | 'edit';

interface PreferenceSetupScreenProps {
  initialPreferences: FoodPreferences;
  mode: PreferenceMode;
  userName?: string;
  onSave: (preferences: FoodPreferences) => boolean;
  onComplete: () => void;
  onCancel?: () => void;
}

const categoryOptions = [
  'indonesian', 'asian', 'western', 'vegetarian', 'highProtein',
  'comfortFood', 'quickSimple', 'healthyMeals', 'homemade',
] as const;
const avoidedFoodOptions = [
  'seafood', 'beef', 'chicken', 'dairy', 'eggs', 'spicyFood', 'nuts', 'gluten',
] as const;
const frequencyOptions = ['almostDaily', 'fewTimesWeek', 'rarely', 'mostlyOutside'] as const;
const cookingStyleOptions = ['quickMeals', 'simpleRecipes', 'mealPrep', 'tryNewRecipes'] as const;
const cookingTimeOptions = ['under15', '15to30', '30to60', 'noRush'] as const;
const goalOptions = [
  'useBeforeSpoiling', 'saveMoney', 'decideWhatToCook', 'balancedMeals',
  'reduceWaste', 'shopWisely', 'easierCooking',
] as const;
const nutritionOptions = ['higherProtein', 'lowerSugar', 'lowerSodium', 'moreVegetables', 'balancedNutrition'] as const;
const categoryIcons: Record<string, typeof Utensils> = {
  indonesian: CookingPot,
  asian: Soup,
  western: Sandwich,
  vegetarian: Leaf,
  highProtein: Drumstick,
  comfortFood: Soup,
  quickSimple: Timer,
  healthyMeals: HeartPulse,
  homemade: House,
};

export const PreferenceSetupScreen: React.FC<PreferenceSetupScreenProps> = ({
  initialPreferences,
  mode,
  userName,
  onSave,
  onComplete,
  onCancel,
}) => {
  const { t } = useLanguage();
  const [preferences, setPreferences] = useState<FoodPreferences>(() => ({
    ...createEmptyFoodPreferences(),
    ...initialPreferences,
  }));
  const [step, setStep] = useState<PreferenceStep>(1);
  const [isComplete, setIsComplete] = useState(false);
  const [customFood, setCustomFood] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const firstName = userName?.trim().split(/\s+/)[0];
  const preferenceHighlights = [
    ...preferences.favoriteCategories.slice(0, 2).map((option) => ({
      label: t(`preferenceSetup.options.${option}`),
      icon: categoryIcons[option] ?? Utensils,
    })),
    ...(preferences.cookingTime ? [{
      label: t(`preferenceSetup.options.${preferences.cookingTime}`),
      icon: Timer,
    }] : []),
    ...preferences.goals.slice(0, 4).map((option) => ({
      label: t(`preferenceSetup.options.${option}`),
      icon: Leaf,
    })),
  ].slice(0, 4);

  const toggleArrayValue = (
    field: 'favoriteCategories' | 'avoidedFoods' | 'cookingStyles' | 'goals' | 'nutritionPreferences',
    value: string,
    exclusiveValue?: string,
  ) => {
    setPreferences((current) => {
      const values = current[field];
      if (exclusiveValue && value === exclusiveValue) {
        const selected = !values.includes(value);
        return {
          ...current,
          [field]: selected ? [value] : [],
          ...(field === 'avoidedFoods' && selected ? { customAvoidedFoods: [] } : {}),
        };
      }
      const withoutExclusive = exclusiveValue ? values.filter((item) => item !== exclusiveValue) : values;
      return {
        ...current,
        [field]: withoutExclusive.includes(value)
          ? withoutExclusive.filter((item) => item !== value)
          : [...withoutExclusive, value],
      };
    });
  };

  const addCustomFood = () => {
    const value = customFood.trim();
    if (!value || preferences.customAvoidedFoods.some((item) => item.toLocaleLowerCase() === value.toLocaleLowerCase())) return;
    setPreferences((current) => ({
      ...current,
      avoidedFoods: current.avoidedFoods.filter((item) => item !== 'none'),
      customAvoidedFoods: [...current.customAvoidedFoods, value],
    }));
    setCustomFood('');
    setShowCustomInput(false);
  };

  const toggleCustomFood = (value: string) => {
    setPreferences((current) => ({
      ...current,
      customAvoidedFoods: current.customAvoidedFoods.filter((item) => item !== value),
    }));
  };

  const finishSetup = () => {
    sound.playTap();
    setSaveError(false);
    const completedPreferences = { ...preferences, completed: true };
    if (!onSave(completedPreferences)) {
      setSaveError(true);
      return;
    }
    setPreferences(completedPreferences);
    setIsComplete(true);
  };

  const toggleOption = (
    field: 'favoriteCategories' | 'avoidedFoods' | 'cookingStyles' | 'goals' | 'nutritionPreferences',
    value: string,
    exclusiveValue?: string,
  ) => {
    sound.playTap();
    toggleArrayValue(field, value, exclusiveValue);
  };

  const renderChoices = (
    fieldsetLabel: string,
    options: readonly string[],
    field: 'favoriteCategories' | 'avoidedFoods' | 'cookingStyles' | 'goals' | 'nutritionPreferences',
    exclusiveValue?: string,
  ) => (
    <fieldset>
      <legend className="mb-2 text-xs font-bold text-[#1B4332]">{fieldsetLabel}</legend>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => {
          const selected = preferences[field].includes(option);
          const Icon = categoryIcons[option] ?? Utensils;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => toggleOption(field, option, exclusiveValue)}
              className={`flex min-h-14 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-[11px] font-semibold transition-colors ${
                selected
                  ? 'border-[#8FAF9A] bg-[#E8F2EC] text-[#1B4332]'
                  : 'border-[#EDE8DD] bg-white text-[#52796F]'
              }`}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${selected ? 'bg-white/75 text-[#315E46]' : 'bg-[#F2F5EF] text-[#728B77]'}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>{t(`preferenceSetup.options.${option}`)}</span>
              </span>
              {selected && <Check className="h-3.5 w-3.5 shrink-0 text-[#2D6A4F]" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </fieldset>
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#738B7C]">
                {t('preferenceSetup.stepLabel', { current: 1 })}
              </p>
              <h1 className="mt-2 font-['Outfit'] text-2xl font-black leading-tight text-[#1B4332]">
                {t('preferenceSetup.questionCategories')}
              </h1>
              <p className="mt-2 text-xs leading-relaxed text-[#52796F]">
                {t('preferenceSetup.intro')}
              </p>
            </div>
            {renderChoices(t('preferenceSetup.multiSelectHint'), categoryOptions, 'favoriteCategories')}
          </div>
        );
      case 2:
        return (
          <div className="space-y-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#738B7C]">
                {t('preferenceSetup.stepLabel', { current: 2 })}
              </p>
              <h1 className="mt-2 font-['Outfit'] text-2xl font-black leading-tight text-[#1B4332]">
                {t('preferenceSetup.questionAvoid')}
              </h1>
              <p className="mt-2 text-xs leading-relaxed text-[#52796F]">
                {t('preferenceSetup.avoidDisclaimer')}
              </p>
            </div>
            <div className="space-y-4">
              {renderChoices(t('preferenceSetup.multiSelectHint'), avoidedFoodOptions, 'avoidedFoods', 'none')}
              <button
                type="button"
                aria-pressed={preferences.avoidedFoods.includes('none')}
                onClick={() => toggleOption('avoidedFoods', 'none', 'none')}
                className={`min-h-11 rounded-xl border px-3 text-xs font-bold ${
                  preferences.avoidedFoods.includes('none')
                    ? 'border-[#8FAF9A] bg-[#E8F2EC] text-[#1B4332]'
                    : 'border-[#EDE8DD] bg-white text-[#52796F]'
                }`}
              >
                {t('preferenceSetup.options.none')}
              </button>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {preferences.customAvoidedFoods.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleCustomFood(item)}
                      aria-label={t('preferenceSetup.removeCustom', { item })}
                      className="min-h-9 rounded-xl border border-[#EBC9C1] bg-[#FFFAF8] px-3 text-[11px] font-semibold text-[#9B6258]"
                    >
                      {item} ×
                    </button>
                  ))}
                </div>
                {showCustomInput ? (
                  <form
                    className="flex gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      addCustomFood();
                    }}
                  >
                    <input
                      autoFocus
                      value={customFood}
                      onChange={(event) => setCustomFood(event.target.value)}
                      placeholder={t('preferenceSetup.customPlaceholder')}
                      className="min-w-0 flex-1 rounded-xl border border-[#EDE8DD] bg-white px-3 text-xs text-[#1B4332] outline-none focus:border-[#2D6A4F]"
                    />
                    <button type="submit" className="min-h-11 rounded-xl bg-[#E8F2EC] px-3 text-xs font-bold text-[#1B4332]">
                      {t('preferenceSetup.add')}
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(true)}
                    className="flex min-h-11 items-center gap-2 text-xs font-bold text-[#2D6A4F]"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    {t('preferenceSetup.addAnother')}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#738B7C]">
                {t('preferenceSetup.stepLabel', { current: 3 })}
              </p>
              <h1 className="mt-2 font-['Outfit'] text-2xl font-black leading-tight text-[#1B4332]">
                {t('preferenceSetup.questionHabits')}
              </h1>
            </div>
            <div className="space-y-4">
              <fieldset>
                <legend className="mb-2 text-xs font-bold text-[#1B4332]">
                  {t('preferenceSetup.cookingFrequency')}
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  {frequencyOptions.map((option) => {
                    const selected = preferences.cookingFrequency === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          sound.playTap();
                          setPreferences((current) => ({
                            ...current,
                            cookingFrequency: selected ? '' : option,
                          }));
                        }}
                        className={`min-h-11 rounded-xl border px-3 py-2 text-left text-[11px] font-semibold ${
                          selected ? 'border-[#8FAF9A] bg-[#E8F2EC] text-[#1B4332]' : 'border-[#EDE8DD] bg-white text-[#52796F]'
                        }`}
                      >
                        {t(`preferenceSetup.options.${option}`)}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              {renderChoices(t('preferenceSetup.cookingStyle'), cookingStyleOptions, 'cookingStyles')}
              <fieldset>
                <legend className="mb-2 text-xs font-bold text-[#1B4332]">
                  {t('preferenceSetup.cookingTime')}
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  {cookingTimeOptions.map((option) => {
                    const selected = preferences.cookingTime === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          sound.playTap();
                          setPreferences((current) => ({ ...current, cookingTime: selected ? '' : option }));
                        }}
                        className={`min-h-11 rounded-xl border px-3 py-2 text-left text-[11px] font-semibold ${
                          selected ? 'border-[#8FAF9A] bg-[#E8F2EC] text-[#1B4332]' : 'border-[#EDE8DD] bg-white text-[#52796F]'
                        }`}
                      >
                        {t(`preferenceSetup.options.${option}`)}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#738B7C]">
                {t('preferenceSetup.stepLabel', { current: 4 })}
              </p>
              <h1 className="mt-2 font-['Outfit'] text-2xl font-black leading-tight text-[#1B4332]">
                {t('preferenceSetup.questionGoals')}
              </h1>
            </div>
            <div className="space-y-4">
              {renderChoices(t('preferenceSetup.multiSelectHint'), goalOptions, 'goals')}
              {renderChoices(t('preferenceSetup.nutritionPrompt'), nutritionOptions, 'nutritionPreferences', 'noSpecificPreference')}
              <button
                type="button"
                aria-pressed={preferences.nutritionPreferences.includes('noSpecificPreference')}
                onClick={() => toggleOption('nutritionPreferences', 'noSpecificPreference', 'noSpecificPreference')}
                className={`min-h-11 rounded-xl border px-3 text-xs font-bold ${
                  preferences.nutritionPreferences.includes('noSpecificPreference')
                    ? 'border-[#8FAF9A] bg-[#E8F2EC] text-[#1B4332]'
                    : 'border-[#EDE8DD] bg-white text-[#52796F]'
                }`}
              >
                {t('preferenceSetup.options.noSpecificPreference')}
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 bg-[#FAF8F5] px-5 pb-4 pt-3 text-[#1E2E25] md:px-8 lg:px-12 lg:py-8">
      <div className={`mx-auto flex min-h-full w-full flex-col ${isComplete ? 'max-w-6xl justify-center' : 'max-w-sm lg:grid lg:max-w-[1200px] lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)] lg:items-start lg:gap-x-16'}`}>
        {isComplete ? (
          <div className="preference-success grid w-full items-center gap-6 py-3 lg:grid-cols-2 lg:gap-x-14 lg:gap-y-5">
            <header className="order-1 flex items-center justify-between lg:col-span-2">
              <ReplateLogo variant="full" tagline="Before It's Too Late." className="text-[#124B3A]" />
            </header>

            <aside className="preference-success-visual relative order-2 min-h-[230px] overflow-hidden rounded-[24px] bg-[#EAF1E9] sm:min-h-[280px] lg:order-3 lg:min-h-[460px]">
              <FoodImage
                name="vegetables"
                alt={t('preferenceSetup.successImageAlt')}
                className="absolute inset-0 h-full w-full"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#173F32]/65 to-transparent px-5 pb-5 pt-16 sm:px-7 sm:pb-7">
                <p className="font-['Outfit'] text-xl font-semibold text-white sm:text-2xl">
                  {t('preferenceSetup.successVisualStatement')}
                </p>
              </div>
            </aside>

            <section className="order-3 py-1 lg:order-2 lg:py-8">
              <h1 className="mt-3 font-['Outfit'] text-4xl font-bold leading-[1.04] tracking-tight text-[#173F32] sm:text-5xl">
                {firstName
                  ? t(mode === 'onboarding' ? 'preferenceSetup.completeTitleNamed' : 'preferenceSetup.savedTitleNamed', { name: firstName })
                  : t(mode === 'onboarding' ? 'preferenceSetup.completeTitle' : 'preferenceSetup.savedTitle')}
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-[#65796D] sm:text-base">
                {t(mode === 'onboarding' ? 'preferenceSetup.completeBody' : 'preferenceSetup.savedBody')}
              </p>

              <div className="mt-6">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#829184]">
                  {t('preferenceSetup.profileSummaryLabel')}
                </h2>
                {preferenceHighlights.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {preferenceHighlights.map(({ label, icon: Icon }, index) => (
                      <li
                        key={`${label}-${index}`}
                        className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#EAF1E9] px-3 py-2 text-xs font-semibold text-[#315E46]"
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {label}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-[#718377]">{t('preferenceSetup.noHighlights')}</p>
                )}
              </div>

              <button
                type="button"
                onClick={onComplete}
                className="mt-7 flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-[#124B3A] px-5 text-sm font-bold text-white transition-colors hover:bg-[#1D624B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3C7454] sm:w-fit sm:min-w-56"
              >
                {t(mode === 'onboarding' ? 'preferenceSetup.startApp' : 'preferenceSetup.done')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </section>
          </div>
        ) : (
          <>
            <header className="mb-5 flex items-center justify-between lg:col-span-2 lg:mb-8">
              {mode === 'edit' ? (
                <button
                  type="button"
                  onClick={onCancel}
                  aria-label={t('preferenceSetup.back')}
                  className="flex min-h-11 min-w-11 items-center text-[#52796F]"
                >
                  <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                </button>
              ) : (
                <div className="min-w-11" aria-hidden="true" />
              )}
              <ReplateLogo variant="full" tagline={t('preferenceSetup.header')} className="text-[#124B3A]" />
              <div className="min-w-11" aria-hidden="true" />
            </header>

            <div className="mb-5 flex gap-1.5 lg:col-span-2 lg:mb-8" aria-label={t('preferenceSetup.progressLabel')}>
              {([1, 2, 3, 4] as const).map((item) => (
                <span
                  key={item}
                  className={`h-1.5 flex-1 rounded-full ${item <= step ? 'bg-[#2D6A4F]' : 'bg-[#E6E2D8]'}`}
                />
              ))}
            </div>

            <aside className="hidden lg:block lg:pt-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#738B7C]">
                {t('preferenceSetup.header')}
              </p>
              <h1 className="mt-3 font-['Outfit'] text-4xl font-black leading-tight text-[#1B4332]">
                {t('preferenceSetup.intro')}
              </h1>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#52796F]">
                {t('preferenceSetup.why')}
              </p>
            </aside>

            <div className="flex-1 pb-5 lg:rounded-3xl lg:border lg:border-[#EDE8DD] lg:bg-white lg:p-8">
              {step === 1 && (
                <div className="mb-5 rounded-2xl border border-[#D5E5DB] bg-[#E8F2EC] px-4 py-3">
                  <p className="text-xs leading-relaxed text-[#2D6A4F]">{t('preferenceSetup.why')}</p>
                </div>
              )}
              {renderStep()}
              {saveError && (
                <p role="alert" className="mt-4 text-xs font-semibold text-[#B44D3E]">
                  {t('preferenceSetup.saveError')}
                </p>
              )}
            </div>

            <footer className="sticky bottom-0 -mx-5 mt-auto border-t border-[#EAE4D5] bg-[#FAF8F5]/95 px-5 pb-2 pt-3 backdrop-blur-sm lg:col-start-2 lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0">
              <div className="flex gap-2">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep((current) => (current - 1) as PreferenceStep)}
                    className="min-h-12 rounded-2xl border border-[#D5E5DB] bg-white px-4 text-xs font-bold text-[#2D6A4F]"
                  >
                    {t('preferenceSetup.back')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => step < 4
                    ? (sound.playTap(), setStep((current) => (current + 1) as PreferenceStep))
                    : finishSetup()}
                  className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1B4332] px-4 text-sm font-bold text-white"
                >
                  {t(step < 4 ? 'preferenceSetup.continue' : mode === 'onboarding' ? 'preferenceSetup.finish' : 'preferenceSetup.save')}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
};
