import React, { useRef, useState } from 'react';
import { Bell, ChevronDown, X, Clock3 } from 'lucide-react';
import { Ingredient, MainTab, UserProfile } from '../types';
import { sound } from '../utils/sound';
import { useLanguage } from '../i18n';
import { ReplateLogo } from './ReplateLogo';
import { GlobalProfileDropdown } from './GlobalProfileDropdown';

interface MobileHeaderProps {
  onNavigate: (tab: MainTab) => void;
  avatarUrl: string;
  userName: string;
  priorityItems: Ingredient[];
  onSelectPriority: (ingredientId: string) => void;
  profile?: UserProfile;
  onOpenPreferences?: () => void;
  onLogout?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  onNavigate,
  avatarUrl,
  userName,
  priorityItems,
  onSelectPriority,
  profile,
  onOpenPreferences,
  onLogout,
}) => {
  const { t, getFoodDisplayName } = useLanguage();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const accountButtonRef = useRef<HTMLButtonElement>(null);

  const notifications = priorityItems.map((item) => ({
    item,
    title: t(item.daysLeft <= 1 ? 'header.priorityToday' : 'header.prioritySoon', {
      name: getFoodDisplayName(item.name),
    }),
    description: t('header.priorityDetails', {
      score: item.useFirstScore,
      days: item.daysLeft,
    }),
  }));

  return (
    <>
      <header className="sticky top-0 z-[100] flex min-h-16 w-full shrink-0 items-center justify-between border-b border-[#F0EBE0] bg-[#FAF8F5]/95 px-4 py-2.5 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => {
            sound.playTap();
            onNavigate('home');
          }}
          className="flex items-center text-[#124B3A] active-press"
        >
          <ReplateLogo
            variant="full"
            tagline={t('header.tagline')}
            className="[&_img]:h-8 [&_img]:w-8 [&_span>span:first-child]:text-[17px]"
            taglineClassName="hidden sm:block"
          />
        </button>

        {/* Right Action Icons: Notification & Profile */}
        <div className="flex items-center gap-1.5">
          {/* Notification Button */}
          <button
            onClick={() => {
              sound.playTap();
              setShowNotifications(true);
            }}
            aria-label={priorityItems.length > 0
              ? `${t('header.viewNotifications')} (${priorityItems.length})`
              : t('header.viewNotifications')}
            className="w-9 h-9 rounded-full bg-[#F3EFE6] hover:bg-[#EAE4D5] flex items-center justify-center text-[#2D6A4F] relative active-press transition-colors"
          >
            <Bell className="w-4 h-4 stroke-[2.2]" />
            {priorityItems.length > 0 && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#F47A5C] ring-2 ring-[#FAF8F5]" />}
          </button>

          {/* User Profile Avatar Button */}
          <button
            ref={accountButtonRef}
            type="button"
            onClick={() => {
              sound.playTap();
              if (profile) {
                setShowProfileMenu((current) => !current);
              } else {
                onNavigate('profile');
              }
            }}
            aria-label={t('header.viewProfile')}
            aria-expanded={showProfileMenu}
            aria-controls="global-profile-dropdown-panel"
            className={`flex min-h-11 items-center gap-1.5 rounded-full px-1.5 text-[#254C39] transition-colors hover:bg-[#EAF1E9] active-press ${showProfileMenu ? 'bg-[#EAF1E9]' : ''}`}
          >
            <img
              src={avatarUrl}
              alt={t('header.viewProfile')}
              className="h-8 w-8 rounded-full object-cover ring-1 ring-[#D8E5D9]"
            />
            <span className="hidden max-w-20 truncate text-xs font-semibold sm:block">{userName.trim().split(/\s+/)[0]}</span>
            <ChevronDown className="hidden h-3.5 w-3.5 sm:block" aria-hidden="true" />
          </button>
        </div>

        {/* Global Profile Dropdown */}
        {profile && (
          <GlobalProfileDropdown
            isOpen={showProfileMenu}
            onClose={() => setShowProfileMenu(false)}
            anchorRef={accountButtonRef}
            profile={profile}
            onNavigate={(tab) => {
              setShowProfileMenu(false);
              onNavigate(tab);
            }}
            onOpenPreferences={() => {
              setShowProfileMenu(false);
              onOpenPreferences?.();
            }}
            onLogout={() => {
              setShowProfileMenu(false);
              onLogout?.();
            }}
          />
        )}
      </header>

      {/* Notifications Mobile Modal / Sheet */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
          onClick={() => setShowNotifications(false)}
        >
          <div
            className="w-full max-h-[85%] bg-[#FAF8F5] rounded-t-[32px] p-5 shadow-2xl overflow-y-auto border-t border-[#EAE3D2] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle */}
            <div className="w-12 h-1 bg-[#D9D1BF] rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#1B4332]" />
                <h3 className="font-['Outfit'] font-bold text-lg text-[#1B4332]">
                  {t('header.notificationTitle')}
                </h3>
              </div>
              <button
                onClick={() => setShowNotifications(false)}
                className="w-8 h-8 rounded-full bg-[#EFE9DD] flex items-center justify-center text-[#556D5C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {notifications.length > 0 ? (
              <div className="mb-4 space-y-3">
                {notifications.map(({ item, title: notificationTitle, description }) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => {
                    sound.playTap();
                    setShowNotifications(false);
                      onSelectPriority(item.id);
                    }}
                    className="w-full rounded-2xl border border-[#F0DCD4] bg-[#FFF7F3] p-3.5 text-left active-press transition-colors hover:bg-[#FFF1EA]"
                  >
                    <span className="flex items-start gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FBE2D8] text-[#B85B42]">
                        <Clock3 className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs font-semibold text-[#1B4332]">{notificationTitle}</span>
                          <span className="flex shrink-0 items-center gap-1 text-[10px] text-[#8FA88D]">
                            <Clock3 className="h-2.5 w-2.5" aria-hidden="true" />
                            {t('header.priorityTime')}
                          </span>
                        </span>
                        <span className="mt-1 block text-[11px] leading-relaxed text-[#556D5C]">{description}</span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <p className="text-sm font-semibold text-[#254C39]">{t('header.notificationsEmptyTitle')}</p>
                <p className="mt-1 text-xs text-[#718377]">{t('header.notificationsEmptyBody')}</p>
              </div>
            )}

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  sound.playTap();
                  setShowNotifications(false);
                  onNavigate('use_first');
                }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1B4332] py-3 text-sm font-semibold text-white active-press"
              >
                {t('header.notificationAction')}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
