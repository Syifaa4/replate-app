import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, CookingPot, Refrigerator, ScanLine, ShoppingBasket } from 'lucide-react';
import { useLanguage } from '../../i18n';
import { sound } from '../../utils/sound';
import { ReplateLogo } from '../ReplateLogo';
import { FoodImage } from '../FoodImage';
import './LandingScreen.css';

interface LandingScreenProps {
  onRegister: () => void;
  onLogin: () => void;
}

const scoreExamples = [
  { name: 'landing.exampleSpinach', status: 'landing.exampleBestToday', score: 91, tone: 'text-[#E76F51]' },
  { name: 'landing.exampleTomato', status: 'landing.exampleUseSoon', score: 67, tone: 'text-[#D97706]' },
  { name: 'landing.exampleEggs', status: 'landing.exampleStillOkay', score: 52, tone: 'text-[#2D6A4F]' },
  { name: 'landing.exampleCarrot', status: 'landing.exampleNoRush', score: 28, tone: 'text-[#738B7C]' },
];

export const LandingScreen: React.FC<LandingScreenProps> = ({ onRegister, onLogin }) => {
  const { t } = useLanguage();
  const landingRef = useRef<HTMLDivElement>(null);
  const [activeExample, setActiveExample] = useState(scoreExamples[0].name);

  useEffect(() => {
    const root = landingRef.current;
    if (!root) return;

    const revealItems = root.querySelectorAll<HTMLElement>('[data-landing-reveal]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || !('IntersectionObserver' in window)) {
      revealItems.forEach((item) => item.setAttribute('data-landing-visible', 'true'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.setAttribute('data-landing-visible', 'true');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -28px 0px' });

    revealItems.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  const handleRegister = () => {
    sound.playTap();
    onRegister();
  };

  const handleLogin = () => {
    sound.playTap();
    onLogin();
  };

  return (
    <div ref={landingRef} className="landing-page w-full flex-1 bg-[#FAF8F5] pb-10 pt-4 text-[#1E2E25]">
      <div className="px-page flex flex-col">
        <header data-landing-enter style={{ '--landing-delay': '0ms' } as React.CSSProperties} className="flex items-center justify-between border-b border-[#EAE4D5] pb-4 lg:py-5">
          <ReplateLogo variant="full" tagline="Before It's Too Late." className="text-[#124B3A]" />
          <nav aria-label={t('landing.navLabel')} className="hidden items-center gap-7 lg:flex">
            <a href="#use-first" className="text-sm font-semibold text-[#52796F] hover:text-[#1B4332]">
              {t('landing.decisionTitle')}
            </a>
            <a href="#how-it-works" className="text-sm font-semibold text-[#52796F] hover:text-[#1B4332]">
              {t('landing.stepsTitle')}
            </a>
            <button
              type="button"
              onClick={handleLogin}
              className="text-sm font-bold text-[#1B4332] hover:text-[#2D6A4F]"
            >
              {t('landing.logIn')}
            </button>
            <button
              type="button"
              onClick={handleRegister}
              className="min-h-10 rounded-xl bg-[#1B4332] px-5 text-sm font-bold text-white hover:bg-[#24543E]"
            >
              {t('landing.start')}
            </button>
          </nav>
        </header>

        <main className="w-full">
          <section className="landing-hero pt-8 md:grid md:grid-cols-2 md:items-center md:gap-10 md:py-12 lg:gap-20 lg:py-20">
            <div className="md:py-6 lg:max-w-2xl">
              <p data-landing-enter style={{ '--landing-delay': '100ms' } as React.CSSProperties} className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#52796F] md:text-xs">
                {t('landing.positioning')}
              </p>
              <h1 data-landing-enter style={{ '--landing-delay': '190ms' } as React.CSSProperties} className="font-['Outfit'] text-[34px] font-black leading-[1.05] tracking-tight text-[#1B4332] md:text-4xl lg:text-5xl xl:text-6xl">
                {t('landing.headline')}
                <span className="mt-1 block text-[#E76F51]">{t('landing.headlineSecond')}</span>
              </h1>
              <p data-landing-enter style={{ '--landing-delay': '300ms' } as React.CSSProperties} className="mt-4 max-w-xl text-sm leading-relaxed text-[#52796F] md:mt-6 md:text-base lg:text-lg">
                {t('landing.description')}
              </p>
              <button
                type="button"
                onClick={handleRegister}
                data-landing-enter
                style={{ '--landing-delay': '430ms' } as React.CSSProperties}
                className="landing-cta mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1B4332] px-5 text-sm font-bold text-white hover:bg-[#24543E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F] md:w-auto md:min-w-48"
              >
                {t('landing.start')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={handleLogin}
                data-landing-enter
                style={{ '--landing-delay': '500ms' } as React.CSSProperties}
                className="mt-2 flex min-h-11 w-full items-center justify-center gap-1 text-xs font-semibold text-[#52796F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F] md:w-auto md:justify-start"
              >
                {t('landing.haveAccount')} <span className="font-bold text-[#1B4332]">{t('landing.logIn')}</span>
              </button>
            </div>

            <div className="landing-hero-visual relative mt-6 md:mt-0 md:px-5 md:py-4">
              <div aria-hidden="true" className="landing-ingredient-float landing-float-tomato absolute -left-1 top-2 z-10 hidden md:block">
                <FoodImage name="Tomato" className="h-10 w-10 rounded-full border-2 border-white shadow-md" />
              </div>
              <div aria-hidden="true" className="landing-ingredient-float landing-float-spinach absolute -right-1 top-12 z-10 hidden md:block">
                <FoodImage name="Spinach" className="h-11 w-11 rounded-full border-2 border-white shadow-md" />
              </div>
              <div aria-hidden="true" className="landing-ingredient-float landing-float-carrot absolute -bottom-1 left-4 z-10 hidden md:block">
                <FoodImage name="Carrot" className="h-10 w-10 rounded-full border-2 border-white shadow-md" />
              </div>
              <div aria-hidden="true" className="landing-ingredient-float landing-float-egg absolute -bottom-1 right-5 z-10 hidden md:block">
                <FoodImage name="Egg" className="h-9 w-9 rounded-full border-2 border-white shadow-md" />
              </div>
              <div data-landing-enter style={{ '--landing-delay': '650ms' } as React.CSSProperties} className="landing-hero-product relative z-0 rounded-[26px] border border-[#E6E2D8] bg-white p-4 shadow-[0_8px_24px_rgba(27,67,50,0.05)] md:rounded-[32px] md:p-7">
              <div className="flex items-start justify-between gap-3 border-b border-[#F0EBE0] pb-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#738B7C]">
                    {t('landing.exampleLabel')}
                  </p>
                  <h2 className="mt-1 font-['Outfit'] text-base font-black text-[#1B4332] md:text-xl">
                    {t('landing.productTitle')}
                  </h2>
                </div>
                <div className="rounded-xl bg-[#F0EEE6] px-2.5 py-1.5 text-center">
                  <p className="font-['Outfit'] text-lg font-black leading-none text-[#1B4332]">0–100</p>
                  <p className="mt-1 text-[8px] font-bold uppercase tracking-wide text-[#738B7C]">
                    {t('landing.scoreLabel')}
                  </p>
                </div>
              </div>

              <div className="pt-1">
                {scoreExamples.map((item, index) => (
                  <button
                    type="button"
                    key={item.name}
                    aria-pressed={activeExample === item.name}
                    onMouseEnter={() => setActiveExample(item.name)}
                    onFocus={() => setActiveExample(item.name)}
                    onClick={() => setActiveExample(item.name)}
                    data-landing-reveal
                    style={{ '--landing-delay': `${index * 70}ms` } as React.CSSProperties}
                    className={`landing-example-row flex w-full items-center gap-3 border-b border-[#F3EFE7] py-3.5 text-left last:border-0 last:pb-1 md:py-4 ${activeExample === item.name ? 'is-selected' : ''}`}
                  >
                    <span className={`landing-example-score w-8 shrink-0 text-right font-['Outfit'] text-xl font-black md:text-2xl ${item.tone}`}>
                      {item.score}
                    </span>
                    <FoodImage name={t(item.name)} alt="" className="landing-food-image h-10 w-10 shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[#1B4332] md:text-base">{t(item.name)}</p>
                      <p className="mt-0.5 text-[10px] text-[#738B7C] md:text-xs">{t(item.status)}</p>
                    </div>
                    <div className="h-1.5 w-14 overflow-hidden rounded-full bg-[#F0EEE6]">
                      <div
                        className={`h-full rounded-full ${item.score >= 75 ? 'bg-[#E76F51]' : item.score >= 50 ? 'bg-[#D9A441]' : 'bg-[#8FA88D]'}`}
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </button>
                ))}
              </div>
              <p aria-live="polite" className="mt-2 min-h-8 rounded-xl bg-[#F4F5EF] px-3 py-2 text-[10px] leading-relaxed text-[#52796F]">
                {t('landing.exampleContext', {
                  name: t(activeExample),
                  score: scoreExamples.find((item) => item.name === activeExample)?.score ?? 0,
                })}
              </p>
              <p className="mt-2 border-t border-[#F0EBE0] pt-3 text-[10px] leading-relaxed text-[#8A9B8A]">
                {t('landing.exampleDisclaimer')}
              </p>
            </div>
            </div>
          </section>

          <section data-landing-reveal className="mt-9 border-t border-[#EAE4D5] pt-7 md:mt-14 md:pt-10 lg:mt-16">
            <h2 data-landing-reveal className="font-['Outfit'] text-2xl font-black tracking-tight text-[#1B4332]">
              {t('landing.cycleTitle')}
            </h2>
            <div className="mt-5 md:grid md:grid-cols-3 md:gap-x-6 lg:grid-cols-6">
              {([
                'landing.cycleBuy',
                'landing.cycleStore',
                'landing.cycleForget',
                'landing.cycleSpoil',
                'landing.cycleWaste',
                'landing.cycleBuyAgain',
              ]).map((key, index) => (
                <div key={key} data-landing-reveal style={{ '--landing-delay': `${index * 75}ms` } as React.CSSProperties} className="flex items-center gap-3 md:items-start md:gap-2 md:border-b md:border-[#EAE4D5] md:py-3 lg:border-b-0">
                  <span className={`w-6 text-center text-[10px] font-bold ${index >= 3 ? 'text-[#E76F51]' : 'text-[#8FA88D]'}`}>
                    {index === 0 ? '01' : `0${index + 1}`}
                  </span>
                  <p className={`flex-1 border-b border-[#EAE4D5] py-3 text-xs font-bold tracking-[0.12em] md:border-0 md:py-0 ${index >= 3 ? 'text-[#1B4332]' : 'text-[#52796F]'}`}>
                    {t(key)}
                  </p>
                </div>
              ))}
            </div>
            <div data-landing-reveal className="mt-5 border-l-2 border-[#E76F51] pl-4">
              <h3 className="font-['Outfit'] text-lg font-black text-[#1B4332]">
                {t('landing.breakCycleTitle')}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-[#52796F]">
                {t('landing.breakCycleBody')}
              </p>
            </div>
          </section>

          <div role="group" aria-label={t('landing.marquee')} className="landing-marquee my-8 md:my-12">
            <div aria-hidden="true" className="landing-marquee-track">
              <span>{t('landing.marquee')}</span>
              <span>{t('landing.marquee')}</span>
            </div>
          </div>

          <section id="use-first" data-landing-reveal className="mt-9 border-t border-[#EAE4D5] pt-7 md:mt-14 md:pt-10 lg:mt-16 lg:grid lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-14">
            <div data-landing-reveal>
              <h2 className="font-['Outfit'] text-2xl font-black leading-tight tracking-tight text-[#1B4332] md:text-3xl lg:text-4xl">
                {t('landing.decisionTitle')}
              </h2>
              <p className="mt-2 max-w-lg text-xs leading-relaxed text-[#52796F] md:text-sm">
                {t('landing.decisionBody')}
              </p>
            </div>
            <div data-landing-reveal className="landing-usefirst-card mt-5 rounded-[26px] bg-[#1B4332] p-4 text-white md:p-7 lg:mt-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C7DCCF]">
                {t('landing.recommendationLabel')}
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-[#D6E5DC]">
                {t('landing.scoreMeaning')}
              </p>
              <div className="mt-2 divide-y divide-white/15">
                {scoreExamples.map((item, index) => (
                  <button type="button" key={item.name} onMouseEnter={() => setActiveExample(item.name)} onFocus={() => setActiveExample(item.name)} onClick={() => setActiveExample(item.name)} data-landing-reveal style={{ '--landing-delay': `${index * 65}ms` } as React.CSSProperties} className={`landing-example-row flex w-full items-center gap-3 py-3 text-left ${activeExample === item.name ? 'is-selected' : ''}`}>
                    <span className="w-7 text-right font-['Outfit'] text-lg font-black text-[#F4A261]">
                      {item.score}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold">{t(item.name)}</p>
                      <p className="mt-0.5 text-[10px] text-[#C7DCCF]">{t(item.status)}</p>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wide text-[#C7DCCF]">
                      {item.score >= 75 ? t('landing.useFirstLabel') : t('landing.priorityLabel')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section id="how-it-works" data-landing-reveal className="mt-9 border-t border-[#EAE4D5] pt-7 md:mt-14 md:pt-10 lg:mt-16">
            <h2 data-landing-reveal className="font-['Outfit'] text-2xl font-black leading-tight tracking-tight text-[#1B4332]">
              {t('landing.stepsTitle')}
            </h2>
            <div className="mt-5 space-y-5 md:grid md:grid-cols-2 md:gap-x-10 md:gap-y-7 md:space-y-0 lg:mt-8 lg:grid-cols-4 lg:gap-7">
              <StepRow number="01" index={0} icon={<ScanLine className="h-4 w-4" aria-hidden="true" />} title={t('landing.stepScanTitle')} body={t('landing.stepScanBody')} />
              <StepRow number="02" index={1} icon={<Refrigerator className="h-4 w-4" aria-hidden="true" />} title={t('landing.stepPrioritizeTitle')} body={t('landing.stepPrioritizeBody')} />
              <StepRow number="03" index={2} icon={<CookingPot className="h-4 w-4" aria-hidden="true" />} title={t('landing.stepCookTitle')} body={t('landing.stepCookBody')} />
              <StepRow number="04" index={3} icon={<ShoppingBasket className="h-4 w-4" aria-hidden="true" />} title={t('landing.stepTrackTitle')} body={t('landing.stepTrackBody')} />
            </div>
          </section>

          <section data-landing-reveal className="mt-9 border-t border-[#EAE4D5] pt-7 md:mt-14 md:pt-10 lg:mt-16">
            <h2 data-landing-reveal className="font-['Outfit'] text-2xl font-black leading-tight tracking-tight text-[#1B4332]">
              {t('landing.valueTitle')}
            </h2>
            <div className="mt-5 divide-y divide-[#EAE4D5] md:grid md:grid-cols-3 md:gap-8 md:divide-y-0 lg:mt-8">
              <BenefitRow index={0} title={t('landing.useFirstTitle')} body={t('landing.useFirstBody')} />
              <BenefitRow index={1} title={t('landing.cookTitle')} body={t('landing.cookBody')} />
              <BenefitRow index={2} title={t('landing.shopTitle')} body={t('landing.shopBody')} />
            </div>
          </section>
        </main>

        <footer data-landing-reveal className="mt-9 rounded-[26px] bg-[#F0EEE6] px-5 py-6 md:mt-14 md:grid md:grid-cols-[1fr_auto] md:items-center md:gap-x-12 md:px-10 md:py-9 lg:mt-16">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#738B7C]">REPLATE</p>
          <h2 className="mt-2 font-['Outfit'] text-2xl font-black leading-tight tracking-tight text-[#1B4332] md:text-3xl">
            {t('landing.closingTitle')}
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-[#52796F] md:col-start-1 md:text-sm">{t('landing.closingBody')}</p>
          <button
            type="button"
            onClick={handleRegister}
            className="landing-cta mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1B4332] px-5 text-sm font-bold text-white hover:bg-[#24543E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F] md:col-start-2 md:row-span-2 md:row-start-1 md:mt-0 md:min-w-48"
          >
            {t('landing.closingCta')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={handleLogin}
            className="mt-2 flex min-h-11 w-full items-center justify-center gap-1 text-xs font-semibold text-[#52796F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F] md:col-start-2 md:row-start-3"
          >
            {t('landing.haveAccount')} <span className="font-bold text-[#1B4332]">{t('landing.logIn')}</span>
          </button>
        </footer>
      </div>
    </div>
  );
};

const StepRow: React.FC<{ number: string; index: number; icon: React.ReactNode; title: string; body: string }> = ({
  number,
  index,
  icon,
  title,
  body,
}) => (
  <div data-landing-reveal style={{ '--landing-delay': `${index * 80}ms` } as React.CSSProperties} className="flex items-start gap-3">
    <span className="w-7 pt-0.5 font-['Outfit'] text-sm font-black text-[#E76F51]">{number}</span>
    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#E8F2EC] text-[#2D6A4F]">
      {icon}
    </span>
    <div className="flex-1">
      <h3 className="text-xs font-bold tracking-wide text-[#1B4332]">{title}</h3>
      <p className="mt-1 text-[11px] leading-relaxed text-[#738B7C]">{body}</p>
    </div>
  </div>
);

const BenefitRow: React.FC<{ index: number; title: string; body: string }> = ({ index, title, body }) => (
  <div data-landing-reveal style={{ '--landing-delay': `${index * 85}ms` } as React.CSSProperties} className="py-4 first:pt-0 last:pb-0">
    <h3 className="text-xs font-bold tracking-wide text-[#1B4332]">{title}</h3>
    <p className="mt-1 text-[11px] leading-relaxed text-[#738B7C]">{body}</p>
  </div>
);
