import React from 'react';
import {
  X,
  ChefHat,
  Check,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { Ingredient } from '../types';
import { sound } from '../utils/sound';
import { useLanguage } from '../i18n';
import { isUsedIngredient } from '../utils/inventoryStatus';

interface IngredientDetailSheetProps {
  item: Ingredient | null;
  onClose: () => void;
  onCookWithThis: (item: Ingredient) => void;
  onConsume: (item: Ingredient) => void;
}

export const IngredientDetailSheet: React.FC<IngredientDetailSheetProps> = ({
  item,
  onClose,
  onCookWithThis,
  onConsume,
}) => {
  const { t, getFoodDisplayName, getStorageTip, formatQuantity } = useLanguage();
  if (!item) return null;

  const isConsumed = isUsedIngredient(item);
  const displayName = getFoodDisplayName(item.name);

  const handleCook = () => {
    sound.playTap();
    onClose();
    onCookWithThis(item);
  };

  const handleMarkConsumed = () => {
    sound.playSuccess();
    onConsume(item);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 mx-auto flex w-full max-w-none flex-col justify-end bg-black/60 backdrop-blur-xs animate-fade-in md:items-center md:justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-h-[86%] bg-[#FAF8F5] rounded-t-[36px] p-5 shadow-2xl overflow-y-auto border-t border-[#EAE3D2] flex flex-col space-y-4 no-scrollbar md:max-w-3xl md:rounded-3xl md:border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-12 h-1.5 bg-[#D9D1BF] rounded-full mx-auto shrink-0 mb-0.5" />

        {/* Header: Emoji, Title, Score & Close Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-4xl p-2 bg-white rounded-2xl border border-[#EDE8DD] shadow-xs shrink-0">
              {item.emoji}
            </span>
            <div className="min-w-0">
              <h3 className="font-['Outfit'] font-black text-2xl text-[#1B4332] leading-tight truncate">
                {isConsumed ? displayName : t('foodDetail.whyUseFirstTitle', { name: displayName })}
              </h3>
              <p className="text-xs text-[#738B7C] font-semibold mt-0.5">
                {formatQuantity(item.quantity)} · {isConsumed ? (
                  <span className="text-[#2D6A4F] font-bold">
                    ✓ {t('inventory.consumed')}
                  </span>
                ) : (
                  <span>
                    {t('home.urgencyScore')}: <strong className="text-[#1B4332]">{item.useFirstScore}</strong>/100
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label={t('actions.close')}
            className="w-8 h-8 rounded-full bg-[#EAE4D5] hover:bg-[#DDD6C5] flex items-center justify-center text-[#556D5C] shrink-0 active-press transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isConsumed && (
          <div className="p-3 bg-[#E8F2EC] rounded-2xl border border-[#D5E5DB] flex items-center gap-2.5 text-xs text-[#1B4332] font-semibold">
            <CheckCircle2 className="w-4 h-4 text-[#2D6A4F] shrink-0" />
            <span>
              {t('foodDetail.consumedNotice')}
            </span>
          </div>
        )}

        {!isConsumed && (
          <>
            <div className="bg-white p-4 rounded-3xl border border-[#EDE8DD] space-y-2.5">
              <p className="text-xs font-bold text-[#1B4332]">
                {t('foodDetail.determinedReason', { name: displayName })}
              </p>
              <div className="space-y-2 text-xs font-medium text-[#2C4A38]">
                <p>{t('foodDetail.reasons.freshnessDeclining')}</p>
                <p>{t('foodDetail.reasons.sufficientQuantity')}</p>
                <p>{t('foodDetail.reasons.notUsedRecently')}</p>
                <p>{t('foodDetail.reasons.matchesMeals')}</p>
                <p>{t('foodDetail.reasons.preventWaste')}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-[#EDE8DD] space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="font-['Outfit'] font-black text-xs uppercase tracking-wider text-[#1B4332]">
                  {t('useFirst.scoreBreakdown')}
                </span>
                <span className="font-mono text-xs font-bold text-[#2D6A4F]">
                  {item.useFirstScore} / 100
                </span>
              </div>

              <div className="space-y-2 text-[11px]">
                <div>
                  <div className="flex justify-between mb-0.5 text-[#52796F]">
                    <span>{t('useFirst.freshnessUrgency')}</span>
                    <span className="font-bold font-mono">{item.scoreBreakdown?.freshness ?? 36} / 40</span>
                  </div>
                  <div className="w-full h-2 bg-[#EDE8DD] rounded-full overflow-hidden">
                    <div className="h-full bg-[#E05342] rounded-full transition-all duration-300" style={{ width: `${((item.scoreBreakdown?.freshness ?? 36) / 40) * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-0.5 text-[#52796F]">
                    <span>{t('useFirst.quantityRisk')}</span>
                    <span className="font-bold font-mono">{item.scoreBreakdown?.quantityRisk ?? 18} / 20</span>
                  </div>
                  <div className="w-full h-2 bg-[#EDE8DD] rounded-full overflow-hidden">
                    <div className="h-full bg-[#F4A261] rounded-full transition-all duration-300" style={{ width: `${((item.scoreBreakdown?.quantityRisk ?? 18) / 20) * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-0.5 text-[#52796F]">
                    <span>{t('useFirst.recipeFit')}</span>
                    <span className="font-bold font-mono">{item.scoreBreakdown?.recipeFit ?? 12} / 15</span>
                  </div>
                  <div className="w-full h-2 bg-[#EDE8DD] rounded-full overflow-hidden">
                    <div className="h-full bg-[#52B788] rounded-full transition-all duration-300" style={{ width: `${((item.scoreBreakdown?.recipeFit ?? 12) / 15) * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-0.5 text-[#52796F]">
                    <span>{t('useFirst.wasteProbability')}</span>
                    <span className="font-bold font-mono">{item.scoreBreakdown?.wastePrevention ?? 8} / 10</span>
                  </div>
                  <div className="w-full h-2 bg-[#EDE8DD] rounded-full overflow-hidden">
                    <div className="h-full bg-[#1B4332] rounded-full transition-all duration-300" style={{ width: `${((item.scoreBreakdown?.wastePrevention ?? 8) / 10) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {item.storageTip && (
              <div className="p-3 bg-[#EBF3EE] rounded-2xl border border-[#D5E5DB] text-xs text-[#1E3A2B] leading-relaxed flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
                <span>
                  <strong>{t('foodDetail.storageTip')}: </strong> {getStorageTip(item.storageTip)}
                </span>
              </div>
            )}

            <div className="space-y-2 pt-1 pb-1">
              <button
                onClick={handleCook}
                className="w-full h-12 bg-[#1B4332] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 active-press cursor-pointer hover:bg-[#24543E] transition-colors"
              >
                <ChefHat className="w-4 h-4" />
                <span>{t('actions.cookWithThis')}</span>
              </button>
              <button
                onClick={handleMarkConsumed}
                className="w-full h-11 text-xs font-bold text-[#2D6A4F] bg-[#FAF8F5] border border-[#2D6A4F] hover:bg-[#E8F2EC] rounded-2xl flex items-center justify-center gap-1.5 active-press transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>{t('actions.markAsConsumed')}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
