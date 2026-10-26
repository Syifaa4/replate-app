import React, { useRef, useState } from 'react';
import { Camera, Mail, Phone, UserRound } from 'lucide-react';
import { UserProfile } from '../../types';
import { sound } from '../../utils/sound';
import { useLanguage } from '../../i18n';

interface EditProfileScreenProps {
  profile: UserProfile;
  onCancel: () => void;
  onSave: (profile: UserProfile) => boolean;
}

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({
  profile,
  onCancel,
  onSave,
}) => {
  const { t } = useLanguage();
  const [draft, setDraft] = useState(profile);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setValidationError(t('screens.profile.editPhotoInvalid'));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setValidationError(t('screens.profile.editPhotoTooLarge'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        setDraft((current) => ({ ...current, avatar: result }));
        setValidationError(null);
      } else {
        setValidationError(t('screens.profile.editPhotoReadError'));
      }
    };
    reader.onerror = () => setValidationError(t('screens.profile.editPhotoReadError'));
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = draft.name.trim();
    const email = draft.email.trim();
    const phone = draft.phone.trim();

    if (!name) {
      setValidationError(t('screens.profile.editNameRequired'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationError(t('screens.profile.editEmailInvalid'));
      return;
    }
    if (phone) {
      const normalizedPhone = phone.replace(/[\s()-]/g, '');
      if (!/^(?:\+?62|0)\d{8,13}$/.test(normalizedPhone)) {
        setValidationError(t('screens.profile.editPhoneInvalid'));
        return;
      }
    }

    sound.playTap();
    const saved = onSave({ ...draft, name, email, phone });
    if (!saved) setValidationError(t('screens.profile.editSaveError'));
  };

  const inputClassName =
    'w-full h-12 pl-11 pr-3 rounded-2xl bg-white border border-[#EDE8DD] text-sm text-[#1B4332] placeholder:text-[#A1B2A6] outline-none focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/10';

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex min-h-0 w-full flex-1 flex-col bg-[#FAF8F5] lg:max-w-[1200px]"
      noValidate
    >
      <div className="mx-auto flex-1 overflow-y-auto px-5 pt-4 pb-5 lg:grid lg:w-full lg:max-w-[1000px] lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start lg:gap-8 lg:px-10 lg:pt-8">
        <section className="bg-white rounded-3xl border border-[#EDE8DD] card-shadow p-5 mb-5 lg:mb-0">
          <h3 className="text-sm font-bold text-[#1B4332] text-center mb-4">
            {t('screens.profile.editProfilePhoto')}
          </h3>
          <img
            src={draft.avatar}
            alt={draft.name}
            className="w-24 h-24 mx-auto rounded-full object-cover ring-4 ring-[#E8F2EC]"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-11 mt-4 mx-auto px-4 rounded-xl bg-[#E8F2EC] text-[#1B4332] text-xs font-bold flex items-center justify-center gap-2 active-press"
          >
            <Camera className="w-4 h-4" />
            {t('screens.profile.editChangePhoto')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </section>

        <section className="space-y-4">
          <label className="block">
            <span className="block text-xs font-bold text-[#1B4332] mb-1.5">
              {t('screens.profile.editFullName')}
            </span>
            <span className="relative block">
              <UserRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8FA88D]" />
              <input
                autoComplete="name"
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                className={inputClassName}
                required
              />
            </span>
          </label>

          <label className="block">
            <span className="block text-xs font-bold text-[#1B4332] mb-1.5">
              {t('screens.profile.editEmail')}
            </span>
            <span className="relative block">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8FA88D]" />
              <input
                type="email"
                autoComplete="email"
                inputMode="email"
                value={draft.email}
                onChange={(event) => setDraft({ ...draft, email: event.target.value })}
                className={inputClassName}
                required
              />
            </span>
          </label>

          <label className="block">
            <span className="block text-xs font-bold text-[#1B4332] mb-1.5">
              {t('screens.profile.editPhone')}
              <span className="font-medium text-[#8FA88D]"> · {t('screens.profile.editOptional')}</span>
            </span>
            <span className="relative block">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8FA88D]" />
              <input
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder="+62 812 3456 7890"
                value={draft.phone}
                onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
                className={inputClassName}
              />
            </span>
          </label>
        </section>

        {validationError && (
          <p role="alert" className="mt-4 text-xs font-semibold text-[#B84D42]">
            {validationError}
          </p>
        )}
      </div>

      <div className="shrink-0 px-5 pt-3 pb-4 bg-[#FAF8F5] border-t border-[#F0EBE0] flex gap-3">
        <button
          type="button"
          onClick={() => {
            sound.playTap();
            onCancel();
          }}
          className="min-h-12 flex-1 rounded-2xl bg-white border border-[#EDE8DD] text-[#1B4332] text-sm font-bold active-press"
        >
          {t('screens.profile.editCancel')}
        </button>
        <button
          type="submit"
          className="min-h-12 flex-[1.3] rounded-2xl bg-[#1B4332] text-white text-sm font-bold shadow-md shadow-[#1B4332]/20 active-press"
        >
          {t('screens.profile.editSaveChanges')}
        </button>
      </div>
    </form>
  );
};
