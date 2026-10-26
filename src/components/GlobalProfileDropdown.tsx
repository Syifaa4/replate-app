import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Languages, LogOut, SlidersHorizontal, UserRound } from 'lucide-react';
import type { MainTab, UserProfile } from '../types';
import { sound } from '../utils/sound';
import { SupportedLanguage, useLanguage } from '../i18n';

interface GlobalProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  profile: UserProfile;
  onNavigate: (tab: MainTab) => void;
  onOpenPreferences: () => void;
  onLogout: () => void;
}

export const GlobalProfileDropdown: React.FC<GlobalProfileDropdownProps> = ({
  isOpen,
  onClose,
  anchorRef,
  profile,
  onNavigate,
  onOpenPreferences,
  onLogout,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [showLanguages, setShowLanguages] = useState(false);
  const [coords, setCoords] = useState<{ top: number; right: number }>({ top: 76, right: 16 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Position calculation relative to anchor button
  const updatePosition = () => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const right = Math.max(12, Math.min(window.innerWidth - rect.right, window.innerWidth - 312));
    const top = rect.bottom + 8;
    setCoords({ top, right });
  };

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setShowLanguages(false);
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      // If clicking inside panel or anchor button, do nothing
      if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) {
        return;
      }
      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        anchorRef.current?.focus();
      }
    };

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleScrollOrResize, { passive: true });
    window.addEventListener('scroll', handleScrollOrResize, { passive: true, capture: true });

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, { capture: true });
    };
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  const closeAndNavigate = (tab: MainTab) => {
    onClose();
    onNavigate(tab);
  };

  const selectLanguage = (nextLanguage: SupportedLanguage) => {
    sound.playTap();
    setLanguage(nextLanguage);
  };

  const menuContent = (
    <div
      ref={panelRef}
      id="global-profile-dropdown-panel"
      role="menu"
      aria-label={t('header.viewProfile')}
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        right: `${coords.right}px`,
        zIndex: 9999,
      }}
      className="w-[min(300px,calc(100vw-24px))] max-h-[calc(100dvh-24px)] overflow-y-auto rounded-2xl border border-[#E5E9E1] bg-white py-1.5 shadow-[0_16px_40px_rgba(31,57,42,0.18)]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header Info */}
      <div className="flex items-center gap-3 border-b border-[#EDF0E9] px-4 py-3.5">
        <img
          src={profile.avatar}
          alt=""
          className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-[#D8E5D9]"
        />
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-[#173F32]">{profile.name}</span>
          <span className="mt-0.5 block truncate text-[11px] text-[#718377]">{profile.email}</span>
        </span>
      </div>

      {/* Navigation & Action Items */}
      <div className="p-1.5">
        <button
          type="button"
          role="menuitem"
          onClick={() => closeAndNavigate('profile')}
          className="flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-xs font-semibold text-[#425E4A] hover:bg-[#F2F5EF] focus-visible:bg-[#F2F5EF] focus-visible:outline-none"
        >
          <UserRound className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t('navigation.profile')}</span>
        </button>

        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onClose();
            onOpenPreferences();
          }}
          className="flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-xs font-semibold text-[#425E4A] hover:bg-[#F2F5EF] focus-visible:bg-[#F2F5EF] focus-visible:outline-none"
        >
          <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t('profile.appPreferences.menuLabel')}</span>
        </button>

        <button
          type="button"
          role="menuitem"
          aria-expanded={showLanguages}
          onClick={() => setShowLanguages((shown) => !shown)}
          className="flex min-h-10 w-full items-center justify-between rounded-lg px-2.5 text-left text-xs font-semibold text-[#425E4A] hover:bg-[#F2F5EF] focus-visible:bg-[#F2F5EF] focus-visible:outline-none"
        >
          <span className="flex items-center gap-2.5">
            <Languages className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t('profile.sections.language')}</span>
          </span>
          <span className="text-[10px] font-medium text-[#819186]">
            {t(language === 'en' ? 'profile.englishLanguage' : 'profile.indonesianLanguage')}
          </span>
        </button>

        {showLanguages && (
          <div className="ml-7 border-l border-[#E5E9E1] py-1 pl-2">
            {([['en', t('profile.englishLanguage')], ['id', t('profile.indonesianLanguage')]] as const).map(
              ([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={language === value}
                  onClick={() => selectLanguage(value)}
                  className="flex min-h-9 w-full items-center justify-between rounded-md px-2 text-left text-[11px] font-medium text-[#425E4A] hover:bg-[#F2F5EF] focus-visible:bg-[#F2F5EF] focus-visible:outline-none"
                >
                  <span>{label}</span>
                  {language === value && (
                    <Check className="h-3.5 w-3.5 text-[#3C7454] shrink-0" aria-hidden="true" />
                  )}
                </button>
              ),
            )}
          </div>
        )}
      </div>

      {/* Logout Action */}
      <div className="border-t border-[#EDF0E9] p-1.5">
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onClose();
            onLogout();
          }}
          className="flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-xs font-semibold text-[#A45141] hover:bg-[#FFF4F0] focus-visible:bg-[#FFF4F0] focus-visible:outline-none"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t('actions.logOut')}</span>
        </button>
      </div>
    </div>
  );

  return createPortal(menuContent, document.body);
};

export default GlobalProfileDropdown;
