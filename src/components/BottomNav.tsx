import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  ChefHat,
  Clock3,
  Ellipsis,
  Home,
  Leaf,
  ShoppingBag,
} from 'lucide-react';
import type { MainTab } from '../types';
import { sound } from '../utils/sound';
import { useTranslation } from '../i18n';

interface BottomNavProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  urgentCount?: number;
}

const navItems: Array<{ tab: MainTab; icon: typeof Home; label: string }> = [
  { tab: 'home', icon: Home, label: 'navigation.home' },
  { tab: 'scan', icon: Camera, label: 'navigation.scan' },
  { tab: 'use_first', icon: Clock3, label: 'navigation.useFirst' },
  { tab: 'recipe', icon: ChefHat, label: 'navigation.recipes' },
  { tab: 'shopping', icon: ShoppingBag, label: 'navigation.shopping' },
  { tab: 'impact', icon: Leaf, label: 'navigation.impact' },
];

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  urgentCount = 0,
}) => {
  const { t } = useTranslation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const isImpactActive = activeTab === 'impact';

  useEffect(() => {
    if (!isMoreOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setIsMoreOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMoreOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMoreOpen]);

  const renderItem = ({ tab, icon: Icon, label }: (typeof navItems)[number]) => {
    const selected = activeTab === tab;
    const priority = tab === 'use_first' && urgentCount > 0;

    return (
      <button
        key={tab}
        type="button"
        onClick={() => {
          sound.playTap();
          setIsMoreOpen(false);
          onTabChange(tab);
        }}
        aria-current={selected ? 'page' : undefined}
        aria-label={priority ? `${t(label)} (${urgentCount})` : t(label)}
        className={`relative flex min-h-[54px] flex-1 flex-col items-center justify-center gap-1 rounded-[18px] px-1.5 py-1.5 text-center transition-all duration-200 active-press sm:min-w-[92px] sm:flex-none sm:px-2.5 ${
          selected
            ? tab === 'use_first'
              ? 'bg-[#FDE9E1] text-[#A6533F] shadow-[0_6px_14px_rgba(244,122,92,0.15)] ring-1 ring-[#F4B39F]'
              : 'bg-[#E8F0E7] text-[#173F32] shadow-sm'
            : 'text-[#6F8477] hover:bg-[#F4F7F2] hover:text-[#173F32]'
        }`}
      >
        <span className={`relative flex h-8 w-8 items-center justify-center rounded-full ${
          selected ? 'bg-white/80' : priority ? 'bg-[#FFF0E9]' : 'bg-[#F5F8F3]'
        }`}>
          <Icon className={`h-[18px] w-[18px] ${selected ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} aria-hidden="true" />
          {priority && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#F47A5C] px-1 text-[9px] font-bold text-white">
              {urgentCount}
            </span>
          )}
        </span>
        <span className="max-w-full truncate text-[10px] font-semibold">{t(label)}</span>
      </button>
    );
  };

  return (
    <nav
      ref={navRef}
      aria-label={t('navigation.mobileNavLabel')}
      className="relative flex min-h-[72px] w-full max-w-[560px] items-center justify-center rounded-[24px] border border-[#E7E2D7] bg-[#FAF9F5]/95 px-2 py-2 shadow-[0_12px_36px_rgba(18,55,38,0.16)] backdrop-blur-md sm:min-h-[76px] sm:w-fit sm:max-w-[calc(100vw-32px)] sm:rounded-[28px] sm:px-3"
    >
      <div className="hidden w-fit max-w-full items-center justify-center gap-1.5 sm:flex">
        {navItems.map((item) => (
          <div key={item.tab} className="flex min-w-0 flex-none justify-center">
            {renderItem(item)}
          </div>
        ))}
      </div>

      <div className="flex w-full items-center justify-around gap-0.5 sm:hidden">
        {navItems.filter(({ tab }) => tab !== 'impact').map((item) => (
          <div key={item.tab} className="flex min-w-0 flex-1 justify-center">
            {renderItem(item)}
          </div>
        ))}
        <div className="relative flex min-w-0 flex-1 justify-center">
          {isMoreOpen && (
            <div
              id="mobile-impact-menu"
              className="absolute bottom-[calc(100%+12px)] right-0 z-50 w-44 rounded-2xl border border-[#E5E9E1] bg-white p-1.5 shadow-[0_12px_36px_rgba(31,57,42,0.14)]"
            >
              <button
                type="button"
                onClick={() => {
                  sound.playTap();
                  setIsMoreOpen(false);
                  onTabChange('impact');
                }}
                aria-current={isImpactActive ? 'page' : undefined}
                className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold ${
                  isImpactActive ? 'bg-[#E8F0E7] text-[#173F32]' : 'text-[#526B5B] hover:bg-[#F5F7F2]'
                }`}
              >
                <Leaf className="h-4 w-4" aria-hidden="true" />
                {t('navigation.impact')}
              </button>
            </div>
          )}
          <button
            type="button"
            aria-label={t('navigation.more')}
            aria-expanded={isMoreOpen}
            aria-controls="mobile-impact-menu"
            onClick={() => {
              sound.playTap();
              setIsMoreOpen((open) => !open);
            }}
            className={`flex min-h-[54px] w-full flex-col items-center justify-center gap-1 rounded-[18px] px-1 py-1.5 text-center transition-colors ${
              isImpactActive || isMoreOpen ? 'bg-[#E8F0E7] text-[#173F32]' : 'text-[#6F8477] hover:bg-[#F4F7F2]'
            }`}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F8F3]">
              <Ellipsis className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <span className="text-[10px] font-semibold">{t('navigation.more')}</span>
          </button>
        </div>
      </div>
    </nav>
  );
};