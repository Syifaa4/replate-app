import React from 'react';
import { Bell, ChefHat, Clock3, SlidersHorizontal, X } from 'lucide-react';
import { useLanguage } from '../i18n';
import type { AppPreferences } from '../services/appPreferences';

interface AppPreferencesDialogProps {
  preferences: AppPreferences;
  onChange: (preferences: AppPreferences) => boolean;
  onClose: () => void;
  onEditFoodPreferences: () => void;
}

export const AppPreferencesDialog: React.FC<AppPreferencesDialogProps> = ({
  preferences,
  onChange,
  onClose,
  onEditFoodPreferences,
}) => {
  const { t } = useLanguage();
  const options = [
    {
      key: 'notificationsEnabled',
      title: t('profile.appPreferences.notifications'),
      description: t('profile.appPreferences.notificationsDescription'),
      icon: Bell,
    },
    {
      key: 'ingredientRemindersEnabled',
      title: t('profile.appPreferences.ingredientReminders'),
      description: t('profile.appPreferences.ingredientRemindersDescription'),
      icon: Clock3,
    },
    {
      key: 'recipeRecommendationsEnabled',
      title: t('profile.appPreferences.recipeRecommendations'),
      description: t('profile.appPreferences.recipeRecommendationsDescription'),
      icon: ChefHat,
    },
  ] as const;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="replate-app-preferences-title"
        className="w-full max-w-md rounded-3xl border border-[#E5E9E1] bg-[#FAF8F5] p-5 shadow-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="mb-4 flex items-start justify-between gap-4 border-b border-[#EDE8DD] pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8F2EC] text-[#2D6A4F]">
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h2 id="replate-app-preferences-title" className="font-['Outfit'] text-lg font-bold text-[#1B4332]">
                {t('profile.appPreferences.title')}
              </h2>
              <p className="text-[11px] text-[#738B7C]">{t('profile.appPreferences.subtitle')}</p>
            </div>
          </div>
          <button
            type="button"
            aria-label={t('actions.close')}
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EFE9DD] text-[#556D5C]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <div className="divide-y divide-[#EDE8DD]">
          {options.map(({ key, title, description, icon: Icon }) => (
            <label key={key} className="flex min-h-[70px] cursor-pointer items-center gap-3 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#2D6A4F]">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-[#1B4332]">{title}</span>
                <span className="mt-0.5 block text-[10px] leading-relaxed text-[#738B7C]">{description}</span>
              </span>
              <input
                type="checkbox"
                checked={preferences[key]}
                onChange={(event) => onChange({ ...preferences, [key]: event.target.checked })}
                className="h-5 w-5 shrink-0 accent-[#2D6A4F]"
              />
            </label>
          ))}
        </div>

        <button
          type="button"
          onClick={onEditFoodPreferences}
          className="mt-3 min-h-11 w-full rounded-xl border border-[#DDE8DD] bg-white px-3 text-left text-xs font-bold text-[#2D6A4F] hover:bg-[#F6F8F3]"
        >
          {t('profile.appPreferences.editFoodPreferences')}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 min-h-11 w-full rounded-xl bg-[#1B4332] text-xs font-bold text-white"
        >
          {t('actions.close')}
        </button>
      </section>
    </div>
  );
};
