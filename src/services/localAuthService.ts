import type { UserProfile } from '../types';
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { INITIAL_USER_PROFILE } from '../data/mockData';
import { initializeUserData } from './userDataService';
import { createEmptyFoodPreferences, normalizeFoodPreferences } from './foodPreferences';

const STORAGE_KEY = 'replate_local_auth';
const PASSWORD_ITERATIONS = 210_000;

type AuthErrorCode = 'invalid' | 'duplicate' | 'storage' | 'unavailable';

interface LocalAccount {
  email: string;
  name: string;
  salt: string;
  passwordHash: string;
  profile: UserProfile;
}

interface AuthStore {
  accounts: LocalAccount[];
  sessionEmail: string | null;
}

export class LocalAuthError extends Error {
  constructor(readonly code: AuthErrorCode) {
    super(code);
    this.name = 'LocalAuthError';
  }
}

const emptyStore = (): AuthStore => ({ accounts: [], sessionEmail: null });

const isUserProfile = (value: unknown): value is UserProfile => {
  if (!value || typeof value !== 'object') return false;
  const profile = value as Partial<UserProfile>;
  return (
    typeof profile.name === 'string' &&
    typeof profile.email === 'string' &&
    typeof profile.phone === 'string' &&
    typeof profile.avatar === 'string' &&
    typeof profile.householdSize === 'string' &&
    Array.isArray(profile.dietaryPreferences) &&
    Array.isArray(profile.favoriteIngredients) &&
    Array.isArray(profile.foodDislikes) &&
    typeof profile.shoppingFrequency === 'string' &&
    typeof profile.city === 'string'
  );
};

const isBase64OfLength = (value: unknown, byteLength: number): value is string => {
  if (typeof value !== 'string') return false;
  try {
    return atob(value).length === byteLength;
  } catch {
    return false;
  }
};

const isLocalAccount = (value: unknown): value is LocalAccount => {
  if (!value || typeof value !== 'object') return false;
  const account = value as Partial<LocalAccount>;
  return (
    typeof account.email === 'string' &&
    typeof account.name === 'string' &&
    isBase64OfLength(account.salt, 16) &&
    isBase64OfLength(account.passwordHash, 32) &&
    isUserProfile(account.profile)
  );
};

const readStore = (): AuthStore => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid local authentication data');
    }
    const store = parsed as { accounts?: unknown; sessionEmail?: unknown };
    if (
      !Array.isArray(store.accounts) ||
      !store.accounts.every(isLocalAccount) ||
      (store.sessionEmail !== null && typeof store.sessionEmail !== 'string')
    ) {
      throw new Error('Invalid local authentication data');
    }
    return {
      accounts: store.accounts,
      sessionEmail: store.sessionEmail,
    };
  } catch {
    throw new LocalAuthError('storage');
  }
};

const writeStore = (store: AuthStore): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    throw new LocalAuthError('storage');
  }
};

const toBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const fromBase64 = (value: string): Uint8Array => {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

const hashPassword = async (password: string, salt: Uint8Array): Promise<string> => {
  const bits = await pbkdf2Async(sha256, new TextEncoder().encode(password), salt, {
    c: PASSWORD_ITERATIONS,
    dkLen: 32,
  });
  return toBase64(bits);
};

const profilesMatchPassword = (expected: string, actual: string): boolean => {
  const expectedBytes = fromBase64(expected);
  const actualBytes = fromBase64(actual);
  if (expectedBytes.length !== actualBytes.length) return false;
  let difference = 0;
  expectedBytes.forEach((byte, index) => {
    difference |= byte ^ actualBytes[index];
  });
  return difference === 0;
};

const publicProfile = (account: LocalAccount): UserProfile => ({
  ...account.profile,
  name: account.name,
  email: account.email,
  foodPreferences: normalizeFoodPreferences(account.profile.foodPreferences),
});

export const getCurrentAuthProfile = (): UserProfile | null => {
  try {
    const store = readStore();
    if (!store.sessionEmail) return null;
    const account = store.accounts.find((item) => item.email === store.sessionEmail);
    return account ? publicProfile(account) : null;
  } catch {
    return null;
  }
};

export const registerLocalAccount = async (
  name: string,
  email: string,
  password: string,
): Promise<UserProfile> => {
  const store = readStore();
  const normalizedEmail = email.trim().toLowerCase();
  if (store.accounts.some((account) => account.email === normalizedEmail)) {
    throw new LocalAuthError('duplicate');
  }
  if (!globalThis.crypto?.getRandomValues) {
    throw new LocalAuthError('unavailable');
  }

  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const accountName = name.trim();
  const account: LocalAccount = {
    name: accountName,
    email: normalizedEmail,
    salt: toBase64(salt),
    passwordHash: await hashPassword(password, salt),
    profile: {
      ...INITIAL_USER_PROFILE,
      name: accountName,
      email: normalizedEmail,
      householdSize: '1 person',
      dietaryPreferences: [],
      favoriteIngredients: [],
      foodDislikes: [],
      shoppingFrequency: '',
      foodPreferences: createEmptyFoodPreferences(),
    },
  };
  initializeUserData(normalizedEmail);
  writeStore({ accounts: [...store.accounts, account], sessionEmail: normalizedEmail });
  return publicProfile(account);
};

export const loginLocalAccount = async (
  email: string,
  password: string,
): Promise<UserProfile> => {
  const store = readStore();
  const normalizedEmail = email.trim().toLowerCase();
  const account = store.accounts.find((item) => item.email === normalizedEmail);
  if (!account) throw new LocalAuthError('invalid');
  const passwordHash = await hashPassword(password, fromBase64(account.salt));
  if (!profilesMatchPassword(account.passwordHash, passwordHash)) {
    throw new LocalAuthError('invalid');
  }
  const normalizedAccount = {
    ...account,
    profile: {
      ...account.profile,
      foodPreferences: normalizeFoodPreferences(account.profile.foodPreferences),
    },
  };
  writeStore({
    ...store,
    accounts: store.accounts.map((item) => item.email === account.email ? normalizedAccount : item),
    sessionEmail: account.email,
  });
  return publicProfile(normalizedAccount);
};

export const updateCurrentAuthProfile = (profile: UserProfile): void => {
  const store = readStore();
  if (!store.sessionEmail) throw new LocalAuthError('storage');
  const normalizedEmail = profile.email.trim().toLowerCase();
  const currentAccount = store.accounts.find((account) => account.email === store.sessionEmail);
  if (!currentAccount) throw new LocalAuthError('storage');
  if (store.accounts.some((account) =>
    account.email !== currentAccount.email && account.email === normalizedEmail,
  )) {
    throw new LocalAuthError('duplicate');
  }
  const accounts = store.accounts.map((account) =>
    account.email === currentAccount.email
      ? {
          ...account,
          name: profile.name,
          email: normalizedEmail,
          profile: { ...profile, email: normalizedEmail },
        }
      : account,
  );
  writeStore({ accounts, sessionEmail: normalizedEmail });
};

export const logoutLocalAccount = (): void => {
  const store = readStore();
  writeStore({ ...store, sessionEmail: null });
};
