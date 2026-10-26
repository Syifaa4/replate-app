import React, { createContext, useContext, useState } from 'react';
import { en } from './en';
import { id } from './id';

export type SupportedLanguage = 'en' | 'id';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (path: string, params?: Record<string, string | number>) => string;
  formatNumber: (val: number, decimals?: number) => string;
  formatDays: (days: number) => string;
  formatKg: (kg: number) => string;
  formatQuantity: (quantity: string) => string;
  formatCurrency: (amount: number) => string;
  getFoodDisplayName: (name: string) => string;
  getFoodCanonicalName: (canonicalId: string | undefined, fallback: string) => string;
  getRecipeTitle: (recipeId: string, fallback: string) => string;
  getRecipeSubtitle: (recipeId: string, fallback: string) => string;
  getRecipeContent: (recipeId: string) => typeof en.recipeContent[keyof typeof en.recipeContent] | undefined;
  getHeaderNotifications: () => typeof en.header.notifications;
  getScanStages: () => typeof en.scan.rotatingStages;
  getStorageTip: (tip: string) => string;
}

const dictionaries = {
  en,
  id,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'replate_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'id' || saved === 'en') {
        return saved;
      }
    } catch {}
    return 'id';
  });

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {}
  };

  /**
   * Helper translation function t("navigation.home") with parameter interpolation
   * e.g. t("impact.mainMessage", { count: 5 }) -> "You marked 5 ingredients as used..."
   */
  const t = (path: string, params?: Record<string, string | number>): string => {
    const currentDict = dictionaries[language];
    const fallbackDict = currentDict;

    const keys = path.split('.');
    let value: any = currentDict;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        // Fallback to English dictionary
        let fallbackVal: any = fallbackDict;
        for (const fKey of keys) {
          if (fallbackVal && typeof fallbackVal === 'object' && fKey in fallbackVal) {
            fallbackVal = fallbackVal[fKey];
          } else {
            fallbackVal = path;
            break;
          }
        }
        value = fallbackVal;
        break;
      }
    }

    if (typeof value !== 'string') {
      return path;
    }

    if (!params) {
      return value;
    }

    // Replace {param} placeholders
    return value.replace(/\{(\w+)\}/g, (_, match) => {
      return match in params ? String(params[match]) : `{${match}}`;
    });
  };

  /**
   * Decimal number formatting:
   * en: 1.2
   * id: 1,2
   */
  const formatNumber = (val: number, decimals = 1): string => {
    const fixed = val.toFixed(decimals);
    if (language === 'id') {
      return fixed.replace('.', ',');
    }
    return fixed;
  };

  const formatDays = (days: number): string => {
    if (language === 'id') {
      return `${days} hari`;
    }
    return days === 1 ? '1 day' : `${days} days`;
  };

  const formatKg = (kg: number): string => {
    const formatted = formatNumber(kg, 1);
    return `${formatted} kg`;
  };

  const formatQuantity = (quantity: string): string =>
    quantity.replace(/(\d+(?:\.\d+)?)\s*(pieces?|pcs?|bottles?|glasses?|bunches?|bulbs?|cloves?|items?)/gi, (_, amount: string, rawUnit: string) => {
      const unit = rawUnit.toLowerCase();
      const unitKey = unit.startsWith('piece') || unit.startsWith('pc')
        ? (amount === '1' ? 'piece' : 'pieces')
        : unit.startsWith('bottle')
        ? 'bottle'
        : unit.startsWith('glass')
        ? 'glass'
        : unit.startsWith('bunch')
        ? 'bunch'
        : unit.startsWith('bulb') || unit.startsWith('clove')
        ? (amount === '1' ? 'clove' : 'cloves')
        : (amount === '1' ? 'item' : 'items');
      const localizedAmount = language === 'id' ? amount.replace('.', ',') : amount;
      return `${localizedAmount} ${t(`units.${unitKey}`)}`;
    }).replace(/\b(\d+)\.(\d+)\b/g, (_, whole: string, decimal: string) =>
      language === 'id' ? `${whole},${decimal}` : `${whole}.${decimal}`
    ).replace(/\b(diced|minced|whisked|sliced|cubed)\b/gi, (word) => {
      if (language !== 'id') return word;
      const translations: Record<string, string> = {
        diced: 'potong dadu',
        minced: 'cincang',
        whisked: 'dikocok',
        sliced: 'iris',
        cubed: 'potong dadu',
      };
      return translations[word.toLowerCase()] || word;
    }).replace(/\b(buah|butir|ikat|siung|mangkuk)\b/gi, (unit) => {
      if (language === 'id') return unit;
      const translations: Record<string, string> = {
        buah: 'pcs',
        butir: 'pcs',
        ikat: 'bunch',
        siung: 'cloves',
        mangkuk: 'bowl',
      };
      return translations[unit.toLowerCase()] || unit;
    }).replace(/\b(\d+) buah tomat\b/gi, (_, amount: string) =>
      language === 'id' ? `${amount} buah tomat` : `${amount} tomatoes`
    ).replace(/\b(\d+) ekor ikan\b/gi, (_, amount: string) =>
      language === 'id' ? `${amount} ekor ikan` : `${amount} whole fish`
    ).replace(/\bfillet ayam\b/gi, language === 'id' ? 'fillet ayam' : 'chicken fillets')
      .replace(/\bwhole fish\b/gi, language === 'id' ? 'ikan utuh' : 'whole fish');

  const formatCurrency = (amount: number): string => {
    // Both English and Indonesian common display in Jakarta: Rp87.000
    return `Rp${amount.toLocaleString('id-ID')}`;
  };

  /**
   * Canonical food display names adaptation:
   * Internal representation stays clean, display adapts to user language
   */
  const getFoodDisplayName = (name: string): string => {
    if (!name) return '';
    const lower = name.toLowerCase().trim();

    if (language === 'id') {
      if (lower.includes('spring onion') || lower.includes('green onion') || lower.includes('scallion') || lower.includes('daun bawang')) return 'Daun Bawang';
      if (lower.includes('potato') || lower.includes('kentang')) return 'Kentang';
      if (lower.includes('goat') || lower.includes('lamb') || lower.includes('mutton') || lower.includes('kambing')) return 'Daging Kambing';
      if (lower.includes('chili') || lower.includes('chilli') || lower.includes('cabai') || lower.includes('cabe')) return 'Cabai';
      if (lower.includes('radish') || lower.includes('lobak')) return 'Lobak';
      if (lower.includes('asparagus')) return 'Asparagus';
      if (lower.includes('baby corn') || lower.includes('jagung muda')) return 'Jagung Muda';
      if (lower.includes('mini bell pepper') || lower.includes('mini pepper')) return 'Paprika Mini';
      if (lower.includes('bell pepper') || lower.includes('paprika')) return 'Paprika';
      if (lower.includes('broccolini')) return 'Brokolini';
      if (lower.includes('broccoli') || lower.includes('brokoli')) return 'Brokoli';
      if (lower.includes('snow pea') || lower.includes('mangetout') || lower.includes('kacang kapri')) return 'Kacang Kapri';
      if (lower.includes('chicken breast') || lower.includes('dada ayam')) return 'Dada Ayam';
      if (lower.includes('chicken') || lower.includes('ayam')) return 'Daging Ayam';
      if (lower.includes('spinach') || lower.includes('bayam')) return 'Bayam';
      if (lower.includes('tomato') || lower.includes('tomat')) return 'Tomat';
      if (lower.includes('milk') || lower.includes('susu')) return 'Susu Segar';
      if (lower.includes('egg') || lower.includes('telur')) return 'Telur';
      if (lower.includes('carrot') || lower.includes('wortel')) return 'Wortel';
      if (lower.includes('garlic') || lower.includes('bawang putih')) return 'Bawang Putih';
      if (lower.includes('salmon')) return 'Fillet Salmon';
      if (lower.includes('fish') || lower.includes('ikan')) return 'Ikan';
      if (lower.includes('rice') || lower.includes('nasi')) return 'Nasi Putih';
      if (lower.includes('greens') || lower.includes('sayuran')) return 'Sayuran Hijau';
      if (lower.includes('avocado') || lower.includes('alpukat')) return 'Alpukat Matang';
      if (lower.includes('tofu') || lower.includes('tahu')) return 'Tahu Segar';
      if (lower.includes('beef') || lower.includes('sapi')) return 'Daging Sapi';
      if (lower.includes('bread') || lower.includes('roti')) return 'Roti';
      if (lower.includes('cheese') || lower.includes('keju')) return 'Keju';
      if (lower.includes('onion') || lower.includes('bawang bombai')) return 'Bawang Bombai';
      if (lower.includes('shallot') || lower.includes('bawang merah')) return 'Bawang Merah';
      if (lower.includes('coconut milk') || lower.includes('santan')) return 'Santan';
      if (lower.includes('cabbage') || lower.includes('kol')) return 'Kol';
      if (lower.includes('corn') || lower.includes('jagung')) return 'Jagung';
      if (lower.includes('broth') || lower.includes('stock') || lower.includes('water')) return 'Kaldu / Air';
      if (lower.includes('soy sauce') || lower.includes('kecap')) return 'Kecap';
      if (lower.includes('cooking oil')) return 'Minyak Goreng';
      if (lower.includes('olive oil') || lower.includes('butter') || lower.includes('minyak')) return 'Minyak Zaitun / Mentega';
    } else {
      if (lower.includes('dada ayam') || lower.includes('chicken breast')) return 'Chicken Breast';
      if (lower.includes('ayam') || lower.includes('chicken')) return 'Chicken';
      if (lower.includes('bayam') || lower.includes('spinach')) return 'Spinach';
      if (lower.includes('tomat') || lower.includes('tomato')) return 'Tomato';
      if (lower.includes('susu') || lower.includes('milk')) return 'Fresh Milk';
      if (lower.includes('telur') || lower.includes('egg')) return 'Egg';
      if (lower.includes('wortel') || lower.includes('carrot')) return 'Carrot';
      if (lower.includes('bawang putih') || lower.includes('garlic')) return 'Garlic';
      if (lower.includes('salmon')) return 'Salmon Fillet';
      if (lower.includes('ikan') || lower.includes('fish')) return 'Fish';
      if (lower.includes('nasi') || lower.includes('rice')) return 'Cooked Rice';
      if (lower.includes('sayuran') || lower.includes('greens')) return 'Mixed Greens';
      if (lower.includes('alpukat') || lower.includes('avocado')) return 'Ripe Avocado';
      if (lower.includes('tahu') || lower.includes('tofu')) return 'Fresh Tofu';
      if (lower.includes('sapi') || lower.includes('beef')) return 'Beef';
    }

    return name;
  };

  const getFoodCanonicalName = (canonicalId: string | undefined, fallback: string): string => {
    if (!canonicalId) return fallback;
    const canonicalNames: Record<string, string> = {
      spinach: 'Spinach',
      chicken_breast: 'Chicken Breast',
      chicken: 'Chicken',
      tomato: 'Tomato',
      milk: 'Fresh Milk',
      egg: 'Egg',
      carrot: 'Carrot',
      garlic: 'Garlic',
      fish: 'Fish',
      salmon: 'Salmon Fillet',
      rice: 'Cooked Rice',
      greens: 'Mixed Greens',
      mixed_greens: 'Mixed Greens',
      avocado: 'Ripe Avocado',
      tofu: 'Fresh Tofu',
      beef: 'Beef',
      bread: 'Bread',
      cheese: 'Cheese',
    };
    return canonicalNames[canonicalId] || fallback;
  };

  /**
   * Canonical Recipe Title translation
   */
  const getRecipeTitle = (recipeId: string, fallback: string): string => {
    if (language === 'id') {
      if (recipeId === 'rec-1') return 'Tumis Bayam Telur';
      if (recipeId === 'rec-2') return 'Sup Tomat Telur Sutra';
      if (recipeId === 'rec-3') return 'Tumis Ayam Wortel Gurih';
      if (recipeId === 'rec-4') return 'Ikan Panggang Bawang Herbal';
      if (recipeId === 'rec-5') return 'Sup Ikan Tomat Segar Hangat';
      if (recipeId === 'rec-6') return 'Gulai Kambing';
      if (recipeId === 'rec-7') return 'Sop Kambing';
      if (recipeId === 'rec-8') return 'Tongseng Kambing';
      if (recipeId === 'rec-9') return 'Sayur Bayam';
      if (recipeId === 'rec-10') return 'Sup Bayam Tahu';
      if (recipeId === 'rec-11') return 'Sup Kentang Wortel';
      if (recipeId === 'rec-12') return 'Telur Dadar Kentang';
      if (recipeId === 'rec-13') return 'Kentang Balado';
    } else {
      if (recipeId === 'rec-1') return 'Spinach Egg Stir-Fry';
      if (recipeId === 'rec-2') return 'Tomato Egg Drop Soup';
      if (recipeId === 'rec-3') return 'Chicken & Carrot Stir-Fry';
      if (recipeId === 'rec-4') return 'Pan-Seared Herb Fish';
      if (recipeId === 'rec-5') return 'Clear Fish & Tomato Broth';
      if (recipeId === 'rec-6') return 'Goat Curry';
      if (recipeId === 'rec-7') return 'Goat Soup';
      if (recipeId === 'rec-8') return 'Goat Tongseng';
      if (recipeId === 'rec-9') return 'Spinach Vegetable Soup';
      if (recipeId === 'rec-10') return 'Spinach Tofu Soup';
      if (recipeId === 'rec-11') return 'Potato Carrot Soup';
      if (recipeId === 'rec-12') return 'Potato Omelette';
      if (recipeId === 'rec-13') return 'Balado Potatoes';
    }
    return fallback;
  };

  const getRecipeSubtitle = (recipeId: string, fallback: string): string => {
    if (language === 'id') {
      if (recipeId === 'rec-1') return '12 menit · Mudah';
      if (recipeId === 'rec-2') return '15 menit · Mudah';
      if (recipeId === 'rec-3') return '20 menit · Sedang';
      if (recipeId === 'rec-4') return '15 menit · Mudah';
      if (recipeId === 'rec-5') return '18 menit · Mudah';
      if (recipeId === 'rec-6') return '55 menit · Sedang';
      if (recipeId === 'rec-7') return '60 menit · Sedang';
      if (recipeId === 'rec-8') return '45 menit · Sedang';
      if (recipeId === 'rec-9') return '20 menit · Mudah';
      if (recipeId === 'rec-10') return '18 menit · Mudah';
      if (recipeId === 'rec-11') return '30 menit · Mudah';
      if (recipeId === 'rec-12') return '25 menit · Mudah';
      if (recipeId === 'rec-13') return '35 menit · Sedang';
    } else {
      if (recipeId === 'rec-1') return '12 min · Easy';
      if (recipeId === 'rec-2') return '15 min · Easy';
      if (recipeId === 'rec-3') return '20 min · Medium';
      if (recipeId === 'rec-4') return '15 min · Easy';
      if (recipeId === 'rec-5') return '18 min · Easy';
      if (recipeId === 'rec-6') return '55 min · Intermediate';
      if (recipeId === 'rec-7') return '60 min · Intermediate';
      if (recipeId === 'rec-8') return '45 min · Medium';
      if (recipeId === 'rec-9') return '20 min · Easy';
      if (recipeId === 'rec-10') return '18 min · Easy';
      if (recipeId === 'rec-11') return '30 min · Easy';
      if (recipeId === 'rec-12') return '25 min · Easy';
      if (recipeId === 'rec-13') return '35 min · Medium';
    }
    return fallback;
  };

  const getRecipeContent = (recipeId: string) =>
    recipeId in dictionaries[language].recipeContent
      ? dictionaries[language].recipeContent[recipeId as keyof typeof en.recipeContent]
      : undefined;

  const getHeaderNotifications = () => dictionaries[language].header.notifications;
  const getScanStages = () => dictionaries[language].scan.rotatingStages;

  const getStorageTip = (tip: string): string => {
    if (language !== 'id') return tip;
    const normalizedTip = tip.toLowerCase();

    if (normalizedTip.includes('recently restocked')) return 'Baru saja ditambahkan ke stok.';
    if (normalizedTip.includes('paper towel') && normalizedTip.includes('airtight')) return 'Bungkus dengan tisu dapur kering, lalu simpan dalam wadah kedap udara di laci sayur.';
    if (normalizedTip.includes('paper towel')) return 'Bungkus atau simpan dalam wadah beralas tisu dapur kering.';
    if (normalizedTip.includes('stem-down') || normalizedTip.includes('stem down')) return 'Simpan tomat pada suhu ruang dengan posisi batang di bawah sampai matang.';
    if (normalizedTip.includes('room temperature') || normalizedTip.includes('room temp')) return 'Simpan pada suhu ruang sampai matang.';
    if (normalizedTip.includes('door vibrations')) return 'Simpan di bagian utama kulkas, jauh dari pintu. Habiskan dalam 4 hari setelah dibuka.';
    if (normalizedTip.includes('not door shelves')) return 'Simpan di bagian utama kulkas, bukan di pintu, agar suhunya tetap stabil.';
    if (normalizedTip.includes('2-4°c') || normalizedTip.includes('below 4°c')) return 'Simpan di kulkas pada suhu 2–4°C.';
    if (normalizedTip.includes('coldest bottom shelf')) return 'Simpan di rak paling bawah kulkas. Masak hari ini atau bekukan dalam porsi kecil.';
    if (normalizedTip.includes('coldest shelf')) return 'Simpan di bagian paling dingin dalam kulkas dan segera gunakan.';
    if (normalizedTip.includes('crisper')) return 'Simpan di laci sayur kulkas dan segera gunakan.';
    if (normalizedTip.includes('perforated bag')) return 'Simpan dalam kantong berlubang di kulkas.';
    if (normalizedTip.includes('main fridge compartment')) return 'Simpan di bagian utama kulkas.';
    if (normalizedTip.includes('keep chilled')) return 'Simpan dalam keadaan dingin di bagian utama kulkas.';
    if (normalizedTip.includes('dry, dark')) return 'Simpan di tempat yang kering, gelap, dan memiliki sirkulasi udara. Jangan dinginkan bawang putih utuh.';
    if (normalizedTip.includes('cook soon or freeze') || normalizedTip.includes('consume promptly')) return 'Segera masak atau bekukan agar tetap segar.';
    if (normalizedTip.includes('bottom shelf')) return 'Simpan di rak paling bawah kulkas.';
    if (normalizedTip.includes('refrigerator')) return 'Simpan di kulkas dan segera gunakan.';
    if (/\b(store|keep|wrap|refrigerate|consume|cook|trim)\b/.test(normalizedTip)) return 'Simpan bahan ini sesuai petunjuk pada kemasan.';
    return tip;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        formatNumber,
        formatDays,
        formatKg,
        formatQuantity,
        formatCurrency,
        getFoodDisplayName,
        getFoodCanonicalName,
        getRecipeTitle,
        getRecipeSubtitle,
        getRecipeContent,
        getHeaderNotifications,
        getScanStages,
        getStorageTip,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const useTranslation = () => {
  const { t, language } = useLanguage();
  return { t, language };
};
