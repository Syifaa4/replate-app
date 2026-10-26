import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { sound } from '../../utils/sound';
import { useLanguage } from '../../i18n';
import type { UserProfile } from '../../types';
import { ReplateLogo } from '../ReplateLogo';
import { FoodImage } from '../FoodImage';

export type AuthPageMode = 'register' | 'login' | 'success';
export type AuthFailure = 'invalid' | 'duplicate' | 'storage' | 'unavailable' | 'unexpected';

interface AuthScreenProps {
  mode: AuthPageMode;
  onBack: () => void;
  onNavigate: (mode: 'register' | 'login') => void;
  onSubmit: (
    mode: 'register' | 'login',
    name: string,
    email: string,
    password: string,
  ) => Promise<{ profile: UserProfile } | { error: AuthFailure }>;
  onSuccess: (profile: UserProfile, mode: 'register' | 'login') => void;
  onContinue: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  mode,
  onBack,
  onNavigate,
  onSubmit,
  onSuccess,
  onContinue,
}) => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isRegister = mode === 'register';
  const isSuccess = mode === 'success';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    sound.playTap();
    setError(null);

    if ((isRegister && (!name.trim() || !confirmPassword)) || !email.trim() || !password) {
      setError(t('auth.errors.required'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t('auth.errors.invalidEmail'));
      return;
    }
    if (isRegister && password.length < 8) {
      setError(t('auth.errors.shortPassword'));
      return;
    }
    if (isRegister && password !== confirmPassword) {
      setError(t('auth.errors.passwordMismatch'));
      return;
    }

    setBusy(true);
    let result: Awaited<ReturnType<typeof onSubmit>>;
    try {
      result = await onSubmit(isRegister ? 'register' : 'login', name.trim(), email.trim(), password);
    } catch (submitError) {
      console.error('Email/password authentication failed.', submitError);
      setError(t(isRegister ? 'auth.errors.registrationFailed' : 'auth.errors.loginFailed'));
      setBusy(false);
      return;
    }

    setBusy(false);
    if ('error' in result) {
      const errorKey = result.error === 'invalid'
        ? 'wrongCredentials'
        : result.error === 'duplicate'
          ? 'emailExists'
          : result.error === 'unexpected'
            ? isRegister ? 'registrationFailed' : 'loginFailed'
            : result.error;
      setError(t(`auth.errors.${errorKey}`));
      return;
    }
    sound.playSuccess();
    onSuccess(result.profile, isRegister ? 'register' : 'login');
  };

  const handleBack = () => {
    sound.playTap();
    onBack();
  };

  return (
    <div className="min-h-dvh w-full bg-[#FAF9F4] px-4 pb-6 pt-2.5 text-[#1E2E25] sm:px-6 lg:flex lg:h-dvh lg:min-h-[700px] lg:flex-col lg:overflow-y-auto lg:px-8 lg:py-3">
      <div className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            aria-label={t('auth.back')}
            className="group flex min-h-11 min-w-11 items-center justify-start rounded-xl text-[#52796F] transition-colors hover:text-[#145A43] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F]"
          >
            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
          </button>
          <ReplateLogo variant="full" tagline={t('header.tagline')} className="text-[#124B3A]" />
          <span className="min-w-11" aria-hidden="true" />
        </header>

        {isSuccess ? (
          <main className="mx-auto flex w-full max-w-md flex-1 items-center">
            <section className="w-full rounded-[28px] border border-[#E1E9DE] bg-white p-6 text-center shadow-[0_14px_40px_rgba(31,57,42,0.08)] sm:p-9">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF5EC] text-[#2E8B68]">
                <User className="h-6 w-6" aria-hidden="true" />
              </div>
              <h1 className="mt-5 font-['Outfit'] text-2xl font-black tracking-tight text-[#145A43]">
                {t('auth.registerSuccessTitle')}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-[#52796F]">{t('auth.registerSuccessBody')}</p>
              <button
                type="button"
                onClick={onContinue}
                className="group mt-7 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#145A43] px-5 text-sm font-bold text-white shadow-[0_6px_14px_rgba(20,90,67,0.15)] transition-all hover:-translate-y-0.5 hover:bg-[#1C6B50] hover:shadow-[0_10px_20px_rgba(20,90,67,0.2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F]"
              >
                {t('auth.continue')}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </button>
            </section>
          </main>
        ) : (
          <>
            <main className="mx-auto grid w-full flex-1 content-center gap-4 py-4 lg:max-w-[1160px] lg:grid-cols-[minmax(0,1fr)_minmax(400px,460px)] lg:items-stretch lg:gap-8 lg:py-2 xl:gap-12">
              <aside className="relative hidden min-h-[570px] overflow-hidden rounded-[30px] border border-[#DCEBDD] bg-[#EAF5EC] p-8 shadow-[0_10px_30px_rgba(31,57,42,0.05)] lg:flex lg:flex-col lg:justify-between xl:p-10">
                <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#D9EBD9]" />
                <div className="pointer-events-none absolute -bottom-20 left-[18%] h-52 w-52 rounded-full bg-[#FFF0DC]/80" />
                <div className="relative z-10">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#4C805C]">
                    {t('auth.storyEyebrow')}
                  </p>
                  <h1 className="mt-3 max-w-xl font-['Outfit'] text-4xl font-black leading-[1.08] tracking-tight text-[#145A43] xl:text-[42px]">
                    {t(isRegister ? 'auth.registerStoryTitle' : 'auth.loginStoryTitle')}
                    <span className="mt-1 block text-[#F27A5A]">
                      {t(isRegister ? 'auth.registerStoryAccent' : 'auth.loginStoryAccent')}
                    </span>
                  </h1>
                  <p className="mt-4 max-w-lg text-sm leading-relaxed text-[#526F5D] xl:text-base">
                    {t(isRegister ? 'auth.registerStoryDescription' : 'auth.loginStoryDescription')}
                  </p>
                </div>
                <div className="relative z-10 mx-auto flex h-[250px] w-full max-w-[430px] items-center justify-center">
                  <div className="absolute left-[14%] top-5 h-16 w-16 rounded-[22px] border border-white/80 bg-white/70 shadow-sm rotate-[-9deg]" />
                  <div className="absolute bottom-2 right-[12%] h-20 w-20 rounded-full border border-white/80 bg-[#FFF8E9]/90" />
                  <div className="relative flex items-center justify-center -space-x-5">
                    <FoodImage
                      name="carrot"
                      alt={t('auth.storyCarrotAlt')}
                      className="z-10 h-[156px] w-[134px] -rotate-6 rounded-[24px] border-4 border-white shadow-[0_14px_28px_rgba(31,57,42,0.12)]"
                      imageClassName="object-cover"
                    />
                    <FoodImage
                      name="tomato"
                      alt={t('auth.storyTomatoAlt')}
                      className="z-20 h-[190px] w-[158px] rounded-[26px] border-4 border-white shadow-[0_18px_34px_rgba(31,57,42,0.16)]"
                      imageClassName="object-cover"
                    />
                    <FoodImage
                      name="spinach"
                      alt={t('auth.storyGreensAlt')}
                      className="z-10 h-[156px] w-[134px] rotate-6 rounded-[24px] border-4 border-white shadow-[0_14px_28px_rgba(31,57,42,0.12)]"
                      imageClassName="object-cover"
                    />
                  </div>
                  <span className="absolute right-1 top-0 z-30 rounded-full border border-[#F5D8C7] bg-white px-3 py-1.5 text-[10px] font-bold text-[#B96449] shadow-sm">
                    {t('auth.storyBadge')}
                  </span>
                  <span className="absolute bottom-0 left-1 z-30 rounded-full border border-[#D8E8D8] bg-white/95 px-3 py-1.5 text-[10px] font-bold text-[#397250] shadow-sm">
                    {t('auth.storyTagline')}
                  </span>
                </div>
              </aside>

              <section className="my-auto w-full rounded-[28px] border border-[#E5EAE2] bg-white p-5 shadow-[0_14px_40px_rgba(31,57,42,0.08)] sm:p-7 lg:flex lg:flex-col lg:justify-center lg:p-8 xl:p-9">
                <div className="mb-5 lg:mb-4">
                  <div className="mb-4 flex items-center gap-3 lg:hidden">
                    <FoodImage
                      name="tomato"
                      alt=""
                      className="h-[68px] w-[76px] shrink-0 rounded-2xl"
                      imageClassName="object-contain p-1"
                    />
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#4C805C]">
                        {t('auth.storyEyebrow')}
                      </p>
                      <p className="mt-1 font-['Outfit'] text-base font-extrabold leading-snug text-[#145A43]">
                        {t(isRegister ? 'auth.registerStoryTitle' : 'auth.loginStoryTitle')}
                        <span className="text-[#F27A5A]"> {t(isRegister ? 'auth.registerStoryAccent' : 'auth.loginStoryAccent')}</span>
                      </p>
                    </div>
                  </div>
                  <h2 className="font-['Outfit'] text-[25px] font-black leading-tight tracking-tight text-[#145A43] sm:text-[28px]">
                    {isRegister ? t('auth.registerTitle') : t('auth.loginHeading')}
                  </h2>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#62776A] sm:text-sm">
                    {isRegister ? t('auth.registerSubtitle') : t('auth.loginDescription')}
                  </p>
                </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-3">
              {isRegister && (
                <FormField id="auth-name" label={t('auth.nameLabel')} icon={<User className="h-4 w-4" aria-hidden="true" />}>
                  <input
                    id="auth-name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={t('auth.registerNamePlaceholder')}
                    className={inputClass}
                  />
                </FormField>
              )}

              <FormField id="auth-email" label={t('auth.emailLabel')} icon={<Mail className="h-4 w-4" aria-hidden="true" />}>
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  className={inputClass}
                />
              </FormField>

              <FormField
                id="auth-password"
                label={t('auth.passwordLabel')}
                icon={<Lock className="h-4 w-4" aria-hidden="true" />}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    className="absolute right-2 flex h-10 w-10 items-center justify-center rounded-xl text-[#738B7C] focus-visible:outline-2 focus-visible:outline-[#2D6A4F]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                }
              >
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={isRegister ? t('auth.registerPasswordPlaceholder') : t('auth.loginPasswordPlaceholder')}
                  className={`${inputClass} pr-12`}
                />
              </FormField>

              {isRegister && (
                <FormField
                  id="auth-confirm-password"
                  label={t('auth.confirmPasswordLabel')}
                  icon={<Lock className="h-4 w-4" aria-hidden="true" />}
                  trailing={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((visible) => !visible)}
                      aria-label={showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                      className="absolute right-2 flex h-10 w-10 items-center justify-center rounded-xl text-[#738B7C] focus-visible:outline-2 focus-visible:outline-[#2D6A4F]"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  }
                >
                  <input
                    id="auth-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder={t('auth.confirmPasswordPlaceholder')}
                    className={`${inputClass} pr-12`}
                  />
                </FormField>
              )}

              {error && (
                <p role="alert" className="rounded-xl border border-[#F3D5CF] bg-[#FDF2F0] px-3 py-2.5 text-xs font-medium leading-relaxed text-[#A44737]">
                  {error}
                </p>
              )}

              {!isRegister && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setError(t('auth.errors.forgotPassword'))}
                    className="min-h-10 px-1 text-xs font-semibold text-[#2D6A4F] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F]"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="group mt-1 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#145A43] px-5 text-sm font-bold text-white shadow-[0_6px_14px_rgba(20,90,67,0.15)] transition-all hover:-translate-y-0.5 hover:bg-[#1C6B50] hover:shadow-[0_10px_20px_rgba(20,90,67,0.2)] disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F]"
              >
                {busy ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />
                    {t(isRegister ? 'auth.creatingAccount' : 'auth.loggingIn')}
                  </>
                ) : (
                  <>
                    {isRegister ? t('auth.registerButton') : t('auth.loginButton')}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-[#738B7C]">
              {isRegister ? t('auth.alreadyAccount') : t('auth.noAccountRegister')}{' '}
              <button
                type="button"
                onClick={() => onNavigate(isRegister ? 'login' : 'register')}
                className="min-h-10 px-1 font-bold text-[#1B4332] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F]"
              >
                {isRegister ? t('auth.loginButton') : t('auth.createButton')}
              </button>
            </p>
              </section>
            </main>
            <p className="mx-auto mt-1 hidden max-w-[1160px] pb-1 text-center text-[10px] font-medium text-[#8A9A8D] lg:block">
              {t('auth.storyFooter')}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

const inputClass = 'h-11 w-full rounded-xl border border-[#E5EAE2] bg-[#FFFEFC] pl-10 pr-4 text-sm font-medium text-[#1B4332] outline-none transition-colors placeholder:font-normal placeholder:text-[#A0AA9F] focus:border-[#2E8B68] focus:ring-2 focus:ring-[#2E8B68]/15';

const FormField: React.FC<{
  id: string;
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  trailing?: React.ReactNode;
}> = ({ id, label, icon, children, trailing }) => (
  <div>
    <label htmlFor={id} className="mb-1 block text-[11px] font-bold text-[#1B4332]">
      {label}
    </label>
    <div className="relative flex items-center">
      <span className="pointer-events-none absolute left-3.5 text-[#8FA88D]">{icon}</span>
      {children}
      {trailing}
    </div>
  </div>
);
