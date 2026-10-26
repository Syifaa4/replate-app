import React, { useState } from 'react';
import { ArrowRight, Refrigerator, CheckCircle2, Info } from 'lucide-react';
import { sound } from '../../utils/sound';
import { useLanguage } from '../../i18n';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onComplete,
}) => {
  const { t } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    sound.playTap();
    if (currentSlide < 2) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      sound.playSuccess();
      onComplete();
    }
  };

  const handleSkip = () => {
    sound.playTap();
    onComplete();
  };

  return (
    <div className="relative flex min-h-full w-full flex-1 flex-col justify-between overflow-hidden bg-[#FAF8F5] px-page py-6 text-[#1E2E25] select-none md:py-10 lg:min-h-[calc(100dvh-76px)] lg:py-10">
      {/* Top Bar with Brand & Skip */}
      <div className="flex items-center justify-between z-10 pt-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#1B4332] text-white flex items-center justify-center">
            <Refrigerator className="w-4 h-4" />
          </div>
          <span className="font-['Outfit'] font-black text-lg tracking-tight text-[#1B4332]">
            REPLATE
          </span>
        </div>

        {currentSlide < 2 && (
          <button
            onClick={handleSkip}
            className="text-xs font-bold text-[#6B8573] hover:text-[#1B4332] py-1.5 px-3 rounded-full hover:bg-[#EAE4D5] transition-colors cursor-pointer"
          >
            {t('actions.skip')}
          </button>
        )}
      </div>

      {/* Slide Content */}
      <div className="my-auto flex flex-1 flex-col items-center justify-center py-6 text-center lg:py-10">
        {/* SLIDE 1: BRAND INTRODUCTION */}
        {currentSlide === 0 && (
          <div className="flex flex-col items-center animate-fade-in space-y-6 max-w-xs lg:max-w-3xl">
            <div className="space-y-2 pt-2">
              <h1 className="text-3xl font-['Outfit'] font-black text-[#1B4332] tracking-tight leading-tight">
                REPLATE
              </h1>
              <p className="text-lg font-['Outfit'] font-extrabold text-[#E76F51] tracking-tight">
                {t('onboarding.tagline')}
              </p>
              <p className="text-sm text-[#52796F] font-medium leading-relaxed max-w-xs pt-1">
                {t('onboarding.subtitle')}
              </p>
            </div>

            <div className="p-3 bg-[#EBF3EE] rounded-2xl border border-[#D5E5DB] text-xs text-[#2D6A4F] font-semibold text-left flex items-start gap-2.5">
              <Info className="w-4 h-4 shrink-0" />
              <p className="leading-snug">
                {t('onboarding.quote')}
              </p>
            </div>
          </div>
        )}

        {/* SLIDE 2: THE PROBLEM */}
        {currentSlide === 1 && (
          <div className="flex flex-col items-center animate-fade-in space-y-5 max-w-xs lg:grid lg:max-w-6xl lg:grid-cols-2 lg:items-center lg:gap-14 lg:space-y-0">
            <div className="w-full bg-white rounded-3xl p-4 border border-[#EDE8DD] card-shadow relative overflow-hidden">
              <div className="flex items-center justify-between pb-2 border-b border-[#F0EBE0] text-xs font-bold text-[#1B4332]">
                <span className="flex items-center gap-1.5">
                  <Refrigerator className="w-4 h-4 text-[#2D6A4F]" />
                  {t('onboarding.slide2.insideFridge')}
                </span>
                <span className="text-[10px] bg-[#E05342]/15 text-[#E05342] px-2 py-0.5 rounded-full font-bold">
                  {t('onboarding.slide2.attentionNeeded')}
                </span>
              </div>

              {/* Realistic Fridge Shelves Illustration */}
              <div className="space-y-2 pt-3">
                <div className="flex items-center justify-between p-2 rounded-xl bg-[#FDF2F0] border border-[#FAD2CD]">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🥬</span>
                    <div className="text-left">
                      <p className="text-xs font-bold text-[#1B4332]">
                        {t('onboarding.slide2.spinachDetail')}
                      </p>
                      <p className="text-[10px] text-[#DC2626] font-semibold">
                        {t('onboarding.slide2.spinachDays')}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black px-2 py-1 bg-[#E05342] text-white rounded-lg">
                    #1 {t('navigation.useFirst')}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-[#FEF3C7]/40 border border-[#FDE68A]">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🍅</span>
                    <div className="text-left">
                      <p className="text-xs font-bold text-[#1B4332]">
                        {t('onboarding.slide2.tomatoDetail')}
                      </p>
                      <p className="text-[10px] text-[#D97706] font-semibold">
                        {t('onboarding.slide2.tomatoDays')}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black px-2 py-1 bg-[#F4A261] text-white rounded-lg">
                    #2 {t('navigation.useFirst')}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-[#F8FAF9] border border-[#EDE8DD]">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🥚</span>
                    <div className="text-left">
                      <p className="text-xs font-bold text-[#1B4332]">
                        {t('onboarding.slide2.eggDetail')}
                      </p>
                      <p className="text-[10px] text-[#52796F] font-semibold">
                        {t('onboarding.slide2.eggDays')}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 bg-[#E8F2EC] text-[#2D6A4F] rounded-lg">
                    {t('recipe.inStock')}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-['Outfit'] font-black text-[#1B4332] tracking-tight leading-snug">
                {t('onboarding.slide2.slideTitle')}
              </h2>
              <p className="text-xs text-[#52796F] font-medium leading-relaxed max-w-xs">
                {t('onboarding.slide2.slideDesc')}
              </p>
            </div>
          </div>
        )}

        {/* SLIDE 3: EXPLAIN USE FIRST */}
        {currentSlide === 2 && (
          <div className="flex flex-col items-center animate-fade-in space-y-5 max-w-xs lg:grid lg:max-w-6xl lg:grid-cols-2 lg:items-center lg:gap-14 lg:space-y-0">
            {/* USE FIRST Decision Badge */}
            <div className="w-full bg-[#1B4332] text-white rounded-3xl p-5 text-left">
              <div className="flex items-center justify-between mb-3">
                <span className="px-3 py-1 rounded-full bg-[#E76F51] text-white text-[10px] font-black tracking-wider uppercase flex items-center gap-1 shadow-sm">
                  {t('onboarding.slide3.useFirstEngine')}
                </span>
                <span className="text-xs font-mono font-bold text-[#74C69D]">
                  91 {t('onboarding.slide3.score')}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-3xl shrink-0">
                  🥬
                </div>
                <div>
                  <h3 className="font-['Outfit'] font-extrabold text-base text-white">
                    {t('onboarding.slide3.spinachDetail')}
                  </h3>
                  <p className="text-xs text-[#A3B899] font-medium">
                    {t('onboarding.slide3.spinachUse')}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-white/15 space-y-1.5 text-[11px] text-[#E8EFEA]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#52B788]" />
                  <span>
                    {t('onboarding.slide3.freshnessDecay')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#52B788]" />
                  <span>
                    {t('onboarding.slide3.matchesMeal')}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-['Outfit'] font-black text-[#1B4332] tracking-tight leading-snug">
                {t('onboarding.slide3.slideTitle')}
              </h2>
              <p className="text-xs text-[#52796F] font-medium leading-relaxed max-w-xs">
                {t('onboarding.slide3.slideDesc')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation & CTA */}
      <div className="mx-auto w-full max-w-6xl space-y-4 pt-2 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10">
        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-2 lg:justify-self-end">
          {[0, 1, 2].map((idx) => (
            <button
              key={idx}
              onClick={() => {
                sound.playTap();
                setCurrentSlide(idx);
              }}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentSlide === idx ? 'w-8 bg-[#1B4332]' : 'w-2 bg-[#D1C7B7]'
              }`}
              aria-label={t('onboarding.goToSlide', { number: idx + 1 })}
            />
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={handleNext}
          className="w-full h-14 bg-[#1B4332] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 active-press transition-colors hover:bg-[#24543E] cursor-pointer lg:min-w-64"
        >
          <span>
            {currentSlide === 0
              ? t('actions.getStarted')
              : currentSlide === 1
              ? t('onboarding.ctaSlide2')
              : t('onboarding.ctaSlide3')}
          </span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
