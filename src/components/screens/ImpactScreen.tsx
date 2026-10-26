import React from 'react';
import { Camera, Leaf, Share2 } from 'lucide-react';
import { UserStats, MainTab } from '../../types';
import { sound } from '../../utils/sound';
import { useLanguage } from '../../i18n';

interface ImpactScreenProps {
  stats: UserStats;
  onNavigate: (tab: MainTab) => void;
}

export const ImpactScreen: React.FC<ImpactScreenProps> = ({ stats, onNavigate }) => {
  const { t, formatNumber } = useLanguage();
  const hasActivity = Object.values(stats).some((value) => value > 0);
  const metricCount = [
    stats.foodManaged,
    stats.potentiallySaved,
    stats.moneySavedRp,
    stats.wasteAvoidedKg,
  ].filter((value) => value > 0).length;
  const metricGridColumns = metricCount === 1
    ? 'grid-cols-1 md:grid-cols-1'
    : metricCount === 2
    ? 'grid-cols-2 md:grid-cols-2'
    : metricCount === 3
    ? 'grid-cols-2 md:grid-cols-3'
    : 'grid-cols-2 md:grid-cols-4';
  const weeklyActivityMessage = stats.weekSavedCount === 0
    ? t('screens.impact.noWeeklyActivity')
    : t(
      stats.weekSavedCount === 1
        ? 'screens.impact.mainMessageSingle'
        : 'screens.impact.mainMessage',
      { count: stats.weekSavedCount },
    );
  return (
    <div className="px-page flex-1 space-y-4 pb-6 md:space-y-6 lg:space-y-8 lg:pb-12">
      {/* 1. HEADER (Exact title from prompt: Your Impact) */}
      <section className="pt-2">
        <div className="text-[11px] font-bold text-[#52796F] tracking-wide uppercase mb-1">
          {t('screens.impact.tracker').replace(/\bAI\b/gi, '').replace(/\s{2,}/g, ' ').trim()}
        </div>
        <h1 className="text-2xl font-['Outfit'] font-black text-[#1B4332] tracking-tight">
          {t('impact.headerTitle')}
        </h1>
        <p className="text-xs text-[#52796F] mt-0.5 leading-relaxed font-semibold">
          {t('screens.impact.subtitle')}
        </p>
      </section>

      {!hasActivity ? (
        <section className="relative overflow-hidden rounded-3xl border border-[#DDE8DD] bg-[#EAF1E9] p-5 max-w-2xl lg:p-8">
          <Leaf className="absolute -right-2 -top-3 h-20 w-20 rotate-[-18deg] text-[#D6E5D4]" aria-hidden="true" />
          <h2 className="font-['Outfit'] text-lg font-black text-[#1B4332]">
            {t('home.emptyImpactTitle')}
          </h2>
          <p className="mt-1 text-sm font-bold text-[#52796F]">{t('home.emptyImpactBody')}</p>
          <p className="mt-1 text-xs leading-relaxed text-[#738B7C]">
            {t('home.emptyImpactDescription')}
          </p>
          <button
            type="button"
            onClick={() => onNavigate('scan')}
            className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1B4332] px-4 text-xs font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F]"
          >
            <Camera className="h-4 w-4" aria-hidden="true" />
            {t('home.addFood')}
          </button>
        </section>
      ) : (
      <>
      {/* 2. MAIN MESSAGE (Exact quote from prompt Section 16) */}
      <section>
          <div className="relative overflow-hidden bg-[#124B3A] rounded-3xl p-5 text-white">
          <Leaf className="absolute -right-3 -top-5 h-24 w-24 text-white/10" aria-hidden="true" />
          <div>
              <span className="text-[10px] font-black tracking-wider text-[#A3B899] uppercase">
                {t('screens.impact.weeklyMilestone')}
              </span>
              <h3 className="font-['Outfit'] font-black text-base text-white leading-snug mt-0.5">
                {weeklyActivityMessage.replace(/^[✨🎉🌱💡👋]\s*/u, '')}
              </h3>
          </div>

        </div>
      </section>

      {/* 3. MAIN STATISTICS (Exact 4 prompt metrics: 23, 8, Rp87.000, 1.2 kg) */}
      <section className="space-y-2">
        <h3 className="text-[11px] font-black uppercase tracking-wider text-[#738B7C] px-0.5">
          {t('screens.impact.overall')}
        </h3>

        <div className={`grid ${metricGridColumns} overflow-hidden rounded-2xl bg-[#EEF2EB]`}>
          {/* 1. Food Items Managed: 23 */}
          {stats.foodManaged > 0 && <div className="border-r border-b border-[#DCE4D9] bg-white/50 p-4 md:border-b-0">
            <p className="text-4xl font-['Outfit'] font-bold leading-none text-[#173F32]">
              {stats.foodManaged}
            </p>
            <p className="text-xs font-bold text-[#52796F] mt-1">
              {t('screens.impact.foodItemsManaged')}
            </p>
            <span className="text-[10px] text-[#738B7C] mt-0.5 block font-medium">
              {t('screens.impact.trackedInventory')}
            </span>
          </div>}

          {/* 2. Potentially Saved: 8 */}
          {stats.potentiallySaved > 0 && <div className="border-b border-[#DCE4D9] p-4 md:border-b-0 md:border-r">
            <p className="text-4xl font-['Outfit'] font-bold leading-none text-[#356A4A]">
              {stats.potentiallySaved}
            </p>
            <p className="text-xs font-bold text-[#2D6A4F] mt-1">
              {t('impact.potentiallySaved')}
            </p>
            <span className="text-[10px] text-[#738B7C] mt-0.5 block font-medium">
              {t('screens.impact.rescuedExpiry')}
            </span>
          </div>}

          {/* 3. Money Saved */}
          {stats.moneySavedRp > 0 && <div className="border-r border-[#DCE4D9] bg-[#FFF7F3] p-4">
            <p className="text-3xl font-['Outfit'] font-bold leading-none text-[#B65A43]">
              Rp{stats.moneySavedRp.toLocaleString('id-ID')}
            </p>
            <p className="text-xs font-bold text-[#E76F51] mt-1">
              {t('impact.moneySaved')}
            </p>
            <span className="text-[10px] text-[#738B7C] mt-0.5 block font-medium">
              {t('screens.impact.groceriesPreserved')}
            </span>
          </div>}

          {/* 4. Waste Avoided */}
          {stats.wasteAvoidedKg > 0 && <div className="p-4">
            <p className="text-3xl font-['Outfit'] font-bold leading-none text-[#173F32]">
              {formatNumber(stats.wasteAvoidedKg)} kg
            </p>
            <p className="text-xs font-bold text-[#1B4332] mt-1">
              {t('impact.wasteAvoided')}
            </p>
            <span className="text-[10px] text-[#738B7C] mt-0.5 block font-medium">
              ~{formatNumber(stats.co2SavedKg)} {t('screens.impact.co2Offset')}
            </span>
          </div>}
        </div>
      </section>

      {/* Weekly total is based on actual completed use/cook actions. */}
      <section className="bg-white rounded-3xl p-4 border border-[#EDE8DD] card-shadow space-y-3 lg:p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-['Outfit'] font-black text-sm text-[#1B4332]">
            {t('screens.impact.weeklyProgress')}
          </h3>
          <span className="text-[11px] font-bold text-[#2D6A4F] font-mono">
            {stats.weekSavedCount === 0
              ? t('screens.impact.noWeeklyActivity')
              : t(
                stats.weekSavedCount === 1
                  ? 'screens.impact.savedTotalSingle'
                  : 'screens.impact.savedTotal',
                { count: stats.weekSavedCount },
              )}
          </span>
        </div>
      </section>

      {/* Share Impact Button */}
      <button
        onClick={() => {
          sound.playSuccess();
          alert(t('screens.impact.shareMessage', { count: stats.weekSavedCount }).replace(/^[✨🎉🌱💡👋]\s*/u, ''));
        }}
        className="w-full h-12 bg-[#E8F2EC] text-[#1B4332] rounded-2xl font-bold text-xs flex items-center justify-center gap-2 active-press border border-[#D5E5DB] cursor-pointer"
      >
        <Share2 className="w-4 h-4 text-[#2D6A4F]" />
        <span>{t('screens.impact.share')}</span>
      </button>
      </>
      )}
    </div>
  );
};
