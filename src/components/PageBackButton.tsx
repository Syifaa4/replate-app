import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '../i18n';
import { sound } from '../utils/sound';

type PageBackButtonProps =
  | { onBack: () => void; fallbackRoute?: never }
  | { fallbackRoute: string; onBack?: never };

export const PageBackButton: React.FC<PageBackButtonProps> = ({ onBack, fallbackRoute }) => {
  const { t } = useTranslation();

  return (
    <div className="mx-auto w-full max-w-[1800px] px-page pt-3 pb-0 md:pt-4">
      <button
        type="button"
        onClick={() => {
          sound.playTap();
          if (onBack) {
            onBack();
          } else if (
            window.history.state?.replateContext === true ||
            window.history.state?.replateRecipeDetail === true
          ) {
            window.history.back();
          } else {
            window.location.assign(fallbackRoute);
          }
        }}
        aria-label={t('actions.back')}
        className="group inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-lg px-0 text-sm font-medium text-[#315C45] transition-colors hover:text-[#173F32] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3C7454] active-press md:min-w-0"
      >
        <ArrowLeft className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
        <span>{t('actions.back')}</span>
      </button>
    </div>
  );
};
