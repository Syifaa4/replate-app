import React, { useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, Search } from 'lucide-react';
import type { Ingredient, MainTab, UserProfile } from '../types';
import { sound } from '../utils/sound';
import { useLanguage } from '../i18n';
import { ReplateLogo } from './ReplateLogo';
import { GlobalProfileDropdown } from './GlobalProfileDropdown';

interface DesktopHeaderProps {
  profile: UserProfile;
  priorityItems: Ingredient[];
  onNavigate: (tab: MainTab) => void;
  onSelectPriority: (ingredientId: string) => void;
  onOpenPreferences: () => void;
  onLogout: () => void;
  onSearch?: (query: string) => void;
}

type OpenPanel = 'notifications' | 'account' | null;

export const DesktopHeader: React.FC<DesktopHeaderProps> = ({
  profile,
  priorityItems,
  onNavigate,
  onSelectPriority,
  onOpenPreferences,
  onLogout,
  onSearch,
}) => {
  const { t, getFoodDisplayName } = useLanguage();
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);

  const notificationTitle = (item: Ingredient) => {
    const name = getFoodDisplayName(item.name);
    if (item.daysLeft <= 0) return t('header.priorityExpired', { name });
    return t(item.daysLeft === 1 ? 'header.priorityToday' : 'header.prioritySoon', { name });
  };

  useEffect(() => {
    if (!openPanel) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      const isInsideProfilePanel = document
        .getElementById('global-profile-dropdown-panel')
        ?.contains(target);
      if (!rootRef.current?.contains(target) && !isInsideProfilePanel) setOpenPanel(null);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpenPanel(null);
      (openPanel === 'notifications' ? notificationButtonRef : accountButtonRef).current?.focus();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openPanel]);

  const togglePanel = (panel: Exclude<OpenPanel, null>) => {
    sound.playTap();
    setOpenPanel((current) => current === panel ? null : panel);
  };

  const closeAndNavigate = (tab: MainTab) => {
    setOpenPanel(null);
    onNavigate(tab);
  };

  return (
    <header className="relative z-[100] w-full border-b border-[#E7EAE3] bg-[#F8F7F2]/92 backdrop-blur-sm">
      <div className="flex min-h-[68px] w-full items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3 text-[#124B3A]">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="shrink-0 text-left"
            aria-label={t('navigation.home')}
          >
            <ReplateLogo variant="full" tagline={t('header.tagline')} />
          </button>
        </div>

        <form
          className="hidden w-full max-w-[min(420px,34vw)] flex-1 items-center lg:flex"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            const query = searchQuery.trim();
            if (!query) return;
            onSearch?.(query);
          }}
        >
          <label className="relative block w-full">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#78907D]" aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t('header.searchPlaceholder')}
              aria-label={t('header.searchPlaceholder')}
              className="h-10 w-full rounded-full border border-[#E3E9E0] bg-white/80 pl-10 pr-4 text-xs font-medium text-[#254C39] outline-none transition-colors placeholder:text-[#91A095] focus:border-[#9EBFA5] focus:bg-white"
            />
          </label>
        </form>

        <div ref={rootRef} className="relative flex items-center gap-2">
          {/* Notifications Button */}
          <button
            ref={notificationButtonRef}
            type="button"
            aria-label={priorityItems.length > 0
              ? `${t('header.viewNotifications')} (${priorityItems.length})`
              : t('header.viewNotifications')}
            aria-expanded={openPanel === 'notifications'}
            aria-controls="desktop-notifications-panel"
            onClick={() => togglePanel('notifications')}
            className={`relative flex h-10 w-10 items-center justify-center rounded-xl text-[#466653] transition-colors hover:bg-[#EAF1E9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3C7454] ${openPanel === 'notifications' ? 'bg-[#EAF1E9]' : ''}`}
          >
            <Bell className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden="true" />
            {priorityItems.length > 0 && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#F47A5C]" aria-hidden="true" />}
          </button>

          {/* Account Profile Button */}
          <button
            ref={accountButtonRef}
            type="button"
            aria-label={`${t('header.viewProfile')}: ${profile.name}`}
            aria-expanded={openPanel === 'account'}
            aria-controls="global-profile-dropdown-panel"
            onClick={() => togglePanel('account')}
            className={`flex h-11 items-center gap-2 rounded-xl px-1.5 text-left transition-colors hover:bg-[#EAF1E9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3C7454] ${openPanel === 'account' ? 'bg-[#EAF1E9]' : ''}`}
          >
            <img
              src={profile.avatar}
              alt=""
              className="h-8 w-8 rounded-full object-cover ring-1 ring-[#D8E5D9]"
            />
            <span className="hidden max-w-32 truncate text-sm font-semibold text-[#254C39] lg:block">
              {profile.name.trim().split(/\s+/)[0]}
            </span>
            <ChevronDown className="hidden h-3.5 w-3.5 text-[#78907D] lg:block" aria-hidden="true" />
          </button>

          {/* Notifications Flyout Panel */}
          {openPanel === 'notifications' && (
            <section
              id="desktop-notifications-panel"
              aria-labelledby="desktop-notifications-title"
              className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-[#E5E9E1] bg-white shadow-[0_12px_36px_rgba(31,57,42,0.12)]"
            >
              <div className="border-b border-[#EDF0E9] px-4 py-3.5">
                <h2 id="desktop-notifications-title" className="font-['Outfit'] text-base font-bold text-[#173F32]">
                  {t('header.notificationTitle')}
                </h2>
              </div>
              {priorityItems.length > 0 ? (
                <div className="max-h-[min(420px,calc(100dvh-120px))] overflow-y-auto py-1">
                  {priorityItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setOpenPanel(null);
                        onSelectPriority(item.id);
                      }}
                      className="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-[#F7F9F5] focus-visible:bg-[#F1F5EF] focus-visible:outline-none"
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FFF0E9] text-[#C85C42]">
                        <Bell className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold leading-snug text-[#254C39]">{notificationTitle(item)}</span>
                        <span className="mt-1 block text-[11px] leading-relaxed text-[#718377]">
                          {t(item.daysLeft <= 0 ? 'header.priorityExpiredDetails' : 'header.priorityDetails', {
                            score: item.useFirstScore,
                            days: item.daysLeft,
                          })}
                        </span>
                        <span className="mt-1.5 block text-[10px] font-medium text-[#96A297]">{t('header.priorityTime')}</span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-5 py-7 text-center">
                  <p className="text-sm font-semibold text-[#254C39]">{t('header.notificationsEmptyTitle')}</p>
                  <p className="mt-1 text-xs text-[#718377]">{t('header.notificationsEmptyBody')}</p>
                </div>
              )}
            </section>
          )}

          {/* Global Profile Dropdown (Mounted as Portal Overlay Layer) */}
          <GlobalProfileDropdown
            isOpen={openPanel === 'account'}
            onClose={() => setOpenPanel(null)}
            anchorRef={accountButtonRef}
            profile={profile}
            onNavigate={closeAndNavigate}
            onOpenPreferences={onOpenPreferences}
            onLogout={onLogout}
          />
        </div>
      </div>
    </header>
  );
};

export default DesktopHeader;