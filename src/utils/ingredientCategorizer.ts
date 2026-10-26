/**
 * REPLATE Ingredient Categorization & Synonym Normalization Engine
 *
 * Categorizes ingredients into culinary types:
 * - Buah (Fruit)
 * - Sayuran (Vegetables)
 * - Daging (Meat: Goat, Chicken, Beef)
 * - Ikan / Seafood
 * - Telur (Egg)
 * - Bahan Pokok (Carbohydrates / Staples)
 * - Bumbu & Pelengkap (Pantry / Seasoning)
 */

export type IngredientCategory =
  | 'fruit'
  | 'vegetable'
  | 'meat'
  | 'seafood'
  | 'egg'
  | 'staple'
  | 'seasoning_pantry';

export type MeatSubType = 'goat' | 'chicken' | 'beef' | 'other_meat';

export interface IngredientClassification {
  canonical: string;
  canonicalName: string;
  category: IngredientCategory;
  meatSubType?: MeatSubType;
  displayNameId: string;
  displayNameEn: string;
}

export const normalizeIngredientText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

// Synonym and canonical mapping dictionary
const CANONICAL_MAP: Record<string, {
  canonical: string;
  category: IngredientCategory;
  meatSubType?: MeatSubType;
  displayNameId: string;
  displayNameEn: string;
}> = {
  // --- FRUIT (BUAH) ---
  'mangga': { canonical: 'mangga', category: 'fruit', displayNameId: 'Mangga', displayNameEn: 'Mango' },
  'buah mangga': { canonical: 'mangga', category: 'fruit', displayNameId: 'Mangga', displayNameEn: 'Mango' },
  'mango': { canonical: 'mangga', category: 'fruit', displayNameId: 'Mangga', displayNameEn: 'Mango' },
  'mangga harumanis': { canonical: 'mangga', category: 'fruit', displayNameId: 'Mangga', displayNameEn: 'Mango' },

  'pisang': { canonical: 'pisang', category: 'fruit', displayNameId: 'Pisang', displayNameEn: 'Banana' },
  'buah pisang': { canonical: 'pisang', category: 'fruit', displayNameId: 'Pisang', displayNameEn: 'Banana' },
  'banana': { canonical: 'pisang', category: 'fruit', displayNameId: 'Pisang', displayNameEn: 'Banana' },
  'pisang raja': { canonical: 'pisang', category: 'fruit', displayNameId: 'Pisang', displayNameEn: 'Banana' },
  'pisang kepok': { canonical: 'pisang', category: 'fruit', displayNameId: 'Pisang', displayNameEn: 'Banana' },

  'apel': { canonical: 'apel', category: 'fruit', displayNameId: 'Apel', displayNameEn: 'Apple' },
  'buah apel': { canonical: 'apel', category: 'fruit', displayNameId: 'Apel', displayNameEn: 'Apple' },
  'apple': { canonical: 'apel', category: 'fruit', displayNameId: 'Apel', displayNameEn: 'Apple' },
  'apples': { canonical: 'apel', category: 'fruit', displayNameId: 'Apel', displayNameEn: 'Apple' },

  'jeruk': { canonical: 'jeruk', category: 'fruit', displayNameId: 'Jeruk', displayNameEn: 'Orange' },
  'buah jeruk': { canonical: 'jeruk', category: 'fruit', displayNameId: 'Jeruk', displayNameEn: 'Orange' },
  'orange': { canonical: 'jeruk', category: 'fruit', displayNameId: 'Jeruk', displayNameEn: 'Orange' },
  'jeruk manis': { canonical: 'jeruk', category: 'fruit', displayNameId: 'Jeruk', displayNameEn: 'Orange' },

  'semangka': { canonical: 'semangka', category: 'fruit', displayNameId: 'Semangka', displayNameEn: 'Watermelon' },
  'buah semangka': { canonical: 'semangka', category: 'fruit', displayNameId: 'Semangka', displayNameEn: 'Watermelon' },
  'watermelon': { canonical: 'semangka', category: 'fruit', displayNameId: 'Semangka', displayNameEn: 'Watermelon' },

  'melon': { canonical: 'melon', category: 'fruit', displayNameId: 'Melon', displayNameEn: 'Melon' },
  'buah melon': { canonical: 'melon', category: 'fruit', displayNameId: 'Melon', displayNameEn: 'Melon' },

  'pepaya': { canonical: 'pepaya', category: 'fruit', displayNameId: 'Pepaya', displayNameEn: 'Papaya' },
  'buah pepaya': { canonical: 'pepaya', category: 'fruit', displayNameId: 'Pepaya', displayNameEn: 'Papaya' },
  'papaya': { canonical: 'pepaya', category: 'fruit', displayNameId: 'Pepaya', displayNameEn: 'Papaya' },

  'alpukat': { canonical: 'alpukat', category: 'fruit', displayNameId: 'Alpukat', displayNameEn: 'Avocado' },
  'buah alpukat': { canonical: 'alpukat', category: 'fruit', displayNameId: 'Alpukat', displayNameEn: 'Avocado' },
  'avocado': { canonical: 'alpukat', category: 'fruit', displayNameId: 'Alpukat', displayNameEn: 'Avocado' },

  'nanas': { canonical: 'nanas', category: 'fruit', displayNameId: 'Nanas', displayNameEn: 'Pineapple' },
  'buah nanas': { canonical: 'nanas', category: 'fruit', displayNameId: 'Nanas', displayNameEn: 'Pineapple' },
  'pineapple': { canonical: 'nanas', category: 'fruit', displayNameId: 'Nanas', displayNameEn: 'Pineapple' },

  'stroberi': { canonical: 'stroberi', category: 'fruit', displayNameId: 'Stroberi', displayNameEn: 'Strawberry' },
  'strawberry': { canonical: 'stroberi', category: 'fruit', displayNameId: 'Stroberi', displayNameEn: 'Strawberry' },
  'anggur': { canonical: 'anggur', category: 'fruit', displayNameId: 'Anggur', displayNameEn: 'Grape' },
  'grapes': { canonical: 'anggur', category: 'fruit', displayNameId: 'Anggur', displayNameEn: 'Grape' },
  'buah naga': { canonical: 'buah naga', category: 'fruit', displayNameId: 'Buah Naga', displayNameEn: 'Dragon Fruit' },
  'pir': { canonical: 'pir', category: 'fruit', displayNameId: 'Pir', displayNameEn: 'Pear' },

  // --- SAYURAN (VEGETABLES) ---
  'kangkung': { canonical: 'kangkung', category: 'vegetable', displayNameId: 'Kangkung', displayNameEn: 'Water Spinach' },
  'water spinach': { canonical: 'kangkung', category: 'vegetable', displayNameId: 'Kangkung', displayNameEn: 'Water Spinach' },

  'bayam': { canonical: 'bayam', category: 'vegetable', displayNameId: 'Bayam', displayNameEn: 'Spinach' },
  'daun bayam': { canonical: 'bayam', category: 'vegetable', displayNameId: 'Bayam', displayNameEn: 'Spinach' },
  'spinach': { canonical: 'bayam', category: 'vegetable', displayNameId: 'Bayam', displayNameEn: 'Spinach' },

  'wortel': { canonical: 'wortel', category: 'vegetable', displayNameId: 'Wortel', displayNameEn: 'Carrot' },
  'carrot': { canonical: 'wortel', category: 'vegetable', displayNameId: 'Wortel', displayNameEn: 'Carrot' },
  'carrots': { canonical: 'wortel', category: 'vegetable', displayNameId: 'Wortel', displayNameEn: 'Carrot' },

  'kol': { canonical: 'kol', category: 'vegetable', displayNameId: 'Kol', displayNameEn: 'Cabbage' },
  'kubis': { canonical: 'kol', category: 'vegetable', displayNameId: 'Kol', displayNameEn: 'Cabbage' },
  'cabbage': { canonical: 'kol', category: 'vegetable', displayNameId: 'Kol', displayNameEn: 'Cabbage' },

  'sawi': { canonical: 'sawi', category: 'vegetable', displayNameId: 'Sawi', displayNameEn: 'Mustard Greens' },
  'sawi hijau': { canonical: 'sawi', category: 'vegetable', displayNameId: 'Sawi', displayNameEn: 'Mustard Greens' },
  'pakcoy': { canonical: 'sawi', category: 'vegetable', displayNameId: 'Pakcoy', displayNameEn: 'Bok Choy' },
  'bok choy': { canonical: 'sawi', category: 'vegetable', displayNameId: 'Pakcoy', displayNameEn: 'Bok Choy' },

  'buncis': { canonical: 'buncis', category: 'vegetable', displayNameId: 'Buncis', displayNameEn: 'Green Beans' },
  'green beans': { canonical: 'buncis', category: 'vegetable', displayNameId: 'Buncis', displayNameEn: 'Green Beans' },

  'kacang panjang': { canonical: 'kacang panjang', category: 'vegetable', displayNameId: 'Kacang Panjang', displayNameEn: 'Long Beans' },
  'long beans': { canonical: 'kacang panjang', category: 'vegetable', displayNameId: 'Kacang Panjang', displayNameEn: 'Long Beans' },

  'tomat': { canonical: 'tomat', category: 'vegetable', displayNameId: 'Tomat', displayNameEn: 'Tomato' },
  'tomato': { canonical: 'tomat', category: 'vegetable', displayNameId: 'Tomat', displayNameEn: 'Tomato' },
  'tomatoes': { canonical: 'tomat', category: 'vegetable', displayNameId: 'Tomat', displayNameEn: 'Tomato' },

  'brokoli': { canonical: 'brokoli', category: 'vegetable', displayNameId: 'Brokoli', displayNameEn: 'Broccoli' },
  'broccoli': { canonical: 'brokoli', category: 'vegetable', displayNameId: 'Brokoli', displayNameEn: 'Broccoli' },

  'kembang kol': { canonical: 'kembang kol', category: 'vegetable', displayNameId: 'Kembang Kol', displayNameEn: 'Cauliflower' },
  'cauliflower': { canonical: 'kembang kol', category: 'vegetable', displayNameId: 'Kembang Kol', displayNameEn: 'Cauliflower' },

  'jagung': { canonical: 'jagung', category: 'vegetable', displayNameId: 'Jagung', displayNameEn: 'Corn' },
  'jagung manis': { canonical: 'jagung', category: 'vegetable', displayNameId: 'Jagung Manis', displayNameEn: 'Sweet Corn' },
  'corn': { canonical: 'jagung', category: 'vegetable', displayNameId: 'Jagung', displayNameEn: 'Corn' },

  'terong': { canonical: 'terong', category: 'vegetable', displayNameId: 'Terong', displayNameEn: 'Eggplant' },
  'eggplant': { canonical: 'terong', category: 'vegetable', displayNameId: 'Terong', displayNameEn: 'Eggplant' },

  'tauge': { canonical: 'tauge', category: 'vegetable', displayNameId: 'Tauge', displayNameEn: 'Bean Sprouts' },
  'taoge': { canonical: 'tauge', category: 'vegetable', displayNameId: 'Tauge', displayNameEn: 'Bean Sprouts' },
  'bean sprouts': { canonical: 'tauge', category: 'vegetable', displayNameId: 'Tauge', displayNameEn: 'Bean Sprouts' },

  'labu siam': { canonical: 'labu siam', category: 'vegetable', displayNameId: 'Labu Siam', displayNameEn: 'Chayote' },
  'chayote': { canonical: 'labu siam', category: 'vegetable', displayNameId: 'Labu Siam', displayNameEn: 'Chayote' },

  'mentimun': { canonical: 'mentimun', category: 'vegetable', displayNameId: 'Mentimun', displayNameEn: 'Cucumber' },
  'timun': { canonical: 'mentimun', category: 'vegetable', displayNameId: 'Timun', displayNameEn: 'Cucumber' },
  'cucumber': { canonical: 'mentimun', category: 'vegetable', displayNameId: 'Cucumber', displayNameEn: 'Cucumber' },

  'selada': { canonical: 'selada', category: 'vegetable', displayNameId: 'Selada', displayNameEn: 'Lettuce' },
  'lettuce': { canonical: 'selada', category: 'vegetable', displayNameId: 'Selada', displayNameEn: 'Lettuce' },

  'jamur': { canonical: 'jamur', category: 'vegetable', displayNameId: 'Jamur', displayNameEn: 'Mushroom' },
  'mushroom': { canonical: 'jamur', category: 'vegetable', displayNameId: 'Jamur', displayNameEn: 'Mushroom' },

  // --- DAGING (MEAT) ---
  // Kambing
  'daging kambing': { canonical: 'daging kambing', category: 'meat', meatSubType: 'goat', displayNameId: 'Daging Kambing', displayNameEn: 'Goat Meat' },
  'kambing': { canonical: 'daging kambing', category: 'meat', meatSubType: 'goat', displayNameId: 'Daging Kambing', displayNameEn: 'Goat Meat' },
  'goat': { canonical: 'daging kambing', category: 'meat', meatSubType: 'goat', displayNameId: 'Daging Kambing', displayNameEn: 'Goat Meat' },
  'goat meat': { canonical: 'daging kambing', category: 'meat', meatSubType: 'goat', displayNameId: 'Daging Kambing', displayNameEn: 'Goat Meat' },
  'lamb': { canonical: 'daging kambing', category: 'meat', meatSubType: 'goat', displayNameId: 'Daging Kambing', displayNameEn: 'Goat Meat' },
  'mutton': { canonical: 'daging kambing', category: 'meat', meatSubType: 'goat', displayNameId: 'Daging Kambing', displayNameEn: 'Goat Meat' },

  // Ayam
  'daging ayam': { canonical: 'daging ayam', category: 'meat', meatSubType: 'chicken', displayNameId: 'Daging Ayam', displayNameEn: 'Chicken' },
  'ayam': { canonical: 'daging ayam', category: 'meat', meatSubType: 'chicken', displayNameId: 'Daging Ayam', displayNameEn: 'Chicken' },
  'chicken': { canonical: 'daging ayam', category: 'meat', meatSubType: 'chicken', displayNameId: 'Daging Ayam', displayNameEn: 'Chicken' },
  'chicken breast': { canonical: 'daging ayam', category: 'meat', meatSubType: 'chicken', displayNameId: 'Dada Ayam', displayNameEn: 'Chicken Breast' },
  'dada ayam': { canonical: 'daging ayam', category: 'meat', meatSubType: 'chicken', displayNameId: 'Dada Ayam', displayNameEn: 'Chicken Breast' },
  'paha ayam': { canonical: 'daging ayam', category: 'meat', meatSubType: 'chicken', displayNameId: 'Paha Ayam', displayNameEn: 'Chicken Thigh' },
  'fillet ayam': { canonical: 'daging ayam', category: 'meat', meatSubType: 'chicken', displayNameId: 'Fillet Ayam', displayNameEn: 'Chicken Fillet' },

  // Sapi
  'daging sapi': { canonical: 'daging sapi', category: 'meat', meatSubType: 'beef', displayNameId: 'Daging Sapi', displayNameEn: 'Beef' },
  'sapi': { canonical: 'daging sapi', category: 'meat', meatSubType: 'beef', displayNameId: 'Daging Sapi', displayNameEn: 'Beef' },
  'beef': { canonical: 'daging sapi', category: 'meat', meatSubType: 'beef', displayNameId: 'Daging Sapi', displayNameEn: 'Beef' },
  'daging giling': { canonical: 'daging sapi', category: 'meat', meatSubType: 'beef', displayNameId: 'Daging Giling', displayNameEn: 'Minced Beef' },

  // --- IKAN & SEAFOOD ---
  'ikan': { canonical: 'ikan', category: 'seafood', displayNameId: 'Ikan', displayNameEn: 'Fish' },
  'fish': { canonical: 'ikan', category: 'seafood', displayNameId: 'Ikan', displayNameEn: 'Fish' },
  'ikan nila': { canonical: 'ikan', category: 'seafood', displayNameId: 'Ikan Nila', displayNameEn: 'Tilapia' },
  'ikan lele': { canonical: 'ikan', category: 'seafood', displayNameId: 'Ikan Lele', displayNameEn: 'Catfish' },
  'ikan tongkol': { canonical: 'ikan', category: 'seafood', displayNameId: 'Ikan Tongkol', displayNameEn: 'Tuna / Mackerel' },
  'ikan gurame': { canonical: 'ikan', category: 'seafood', displayNameId: 'Ikan Gurame', displayNameEn: 'Gourami' },
  'salmon': { canonical: 'ikan', category: 'seafood', displayNameId: 'Ikan Salmon', displayNameEn: 'Salmon' },

  'udang': { canonical: 'udang', category: 'seafood', displayNameId: 'Udang', displayNameEn: 'Shrimp' },
  'shrimp': { canonical: 'udang', category: 'seafood', displayNameId: 'Udang', displayNameEn: 'Shrimp' },
  'prawn': { canonical: 'udang', category: 'seafood', displayNameId: 'Udang', displayNameEn: 'Prawn' },

  'cumi': { canonical: 'cumi', category: 'seafood', displayNameId: 'Cumi', displayNameEn: 'Squid' },
  'cumi cumi': { canonical: 'cumi', category: 'seafood', displayNameId: 'Cumi', displayNameEn: 'Squid' },
  'squid': { canonical: 'cumi', category: 'seafood', displayNameId: 'Cumi', displayNameEn: 'Squid' },

  // --- TELUR (EGG) ---
  'telur': { canonical: 'telur', category: 'egg', displayNameId: 'Telur', displayNameEn: 'Egg' },
  'telur ayam': { canonical: 'telur', category: 'egg', displayNameId: 'Telur Ayam', displayNameEn: 'Egg' },
  'egg': { canonical: 'telur', category: 'egg', displayNameId: 'Telur', displayNameEn: 'Egg' },
  'eggs': { canonical: 'telur', category: 'egg', displayNameId: 'Telur', displayNameEn: 'Eggs' },
  'telur bebek': { canonical: 'telur', category: 'egg', displayNameId: 'Telur Bebek', displayNameEn: 'Duck Egg' },

  // --- BAHAN POKOK (STAPLES / CARBS) ---
  'nasi': { canonical: 'nasi', category: 'staple', displayNameId: 'Nasi', displayNameEn: 'Rice' },
  'rice': { canonical: 'nasi', category: 'staple', displayNameId: 'Nasi', displayNameEn: 'Rice' },
  'beras': { canonical: 'nasi', category: 'staple', displayNameId: 'Beras', displayNameEn: 'Rice' },

  'mie': { canonical: 'mie', category: 'staple', displayNameId: 'Mie', displayNameEn: 'Noodles' },
  'noodles': { canonical: 'mie', category: 'staple', displayNameId: 'Mie', displayNameEn: 'Noodles' },
  'mie telur': { canonical: 'mie', category: 'staple', displayNameId: 'Mie Telur', displayNameEn: 'Egg Noodles' },
  'mie instan': { canonical: 'mie', category: 'staple', displayNameId: 'Mie Instan', displayNameEn: 'Instant Noodles' },

  'bihun': { canonical: 'bihun', category: 'staple', displayNameId: 'Bihun', displayNameEn: 'Rice Vermicelli' },
  'vermicelli': { canonical: 'bihun', category: 'staple', displayNameId: 'Bihun', displayNameEn: 'Rice Vermicelli' },

  'kentang': { canonical: 'kentang', category: 'staple', displayNameId: 'Kentang', displayNameEn: 'Potato' },
  'potato': { canonical: 'kentang', category: 'staple', displayNameId: 'Kentang', displayNameEn: 'Potato' },
  'potatoes': { canonical: 'kentang', category: 'staple', displayNameId: 'Kentang', displayNameEn: 'Potato' },

  'singkong': { canonical: 'singkong', category: 'staple', displayNameId: 'Singkong', displayNameEn: 'Cassava' },
  'cassava': { canonical: 'singkong', category: 'staple', displayNameId: 'Singkong', displayNameEn: 'Cassava' },

  'ubi': { canonical: 'ubi', category: 'staple', displayNameId: 'Ubi', displayNameEn: 'Sweet Potato' },
  'ubi jalar': { canonical: 'ubi', category: 'staple', displayNameId: 'Ubi', displayNameEn: 'Sweet Potato' },
  'sweet potato': { canonical: 'ubi', category: 'staple', displayNameId: 'Ubi', displayNameEn: 'Sweet Potato' },

  'tahu': { canonical: 'tahu', category: 'staple', displayNameId: 'Tahu', displayNameEn: 'Tofu' },
  'tofu': { canonical: 'tahu', category: 'staple', displayNameId: 'Tahu', displayNameEn: 'Tofu' },
  'tempe': { canonical: 'tempe', category: 'staple', displayNameId: 'Tempe', displayNameEn: 'Tempeh' },
  'tempeh': { canonical: 'tempe', category: 'staple', displayNameId: 'Tempe', displayNameEn: 'Tempeh' },

  // --- BUMBU & PELENGKAP (PANTRY & SEASONING) ---
  'garam': { canonical: 'garam', category: 'seasoning_pantry', displayNameId: 'Garam', displayNameEn: 'Salt' },
  'salt': { canonical: 'garam', category: 'seasoning_pantry', displayNameId: 'Garam', displayNameEn: 'Salt' },

  'gula': { canonical: 'gula', category: 'seasoning_pantry', displayNameId: 'Gula Pasir', displayNameEn: 'Sugar' },
  'gula pasir': { canonical: 'gula', category: 'seasoning_pantry', displayNameId: 'Gula Pasir', displayNameEn: 'Sugar' },
  'sugar': { canonical: 'gula', category: 'seasoning_pantry', displayNameId: 'Gula Pasir', displayNameEn: 'Sugar' },
  'gula merah': { canonical: 'gula merah', category: 'seasoning_pantry', displayNameId: 'Gula Merah', displayNameEn: 'Palm Sugar' },
  'gula jawa': { canonical: 'gula merah', category: 'seasoning_pantry', displayNameId: 'Gula Merah', displayNameEn: 'Palm Sugar' },

  'merica': { canonical: 'merica', category: 'seasoning_pantry', displayNameId: 'Merica', displayNameEn: 'Pepper' },
  'lada': { canonical: 'merica', category: 'seasoning_pantry', displayNameId: 'Merica', displayNameEn: 'Pepper' },
  'pepper': { canonical: 'merica', category: 'seasoning_pantry', displayNameId: 'Merica', displayNameEn: 'Pepper' },

  'kaldu bubuk': { canonical: 'kaldu bubuk', category: 'seasoning_pantry', displayNameId: 'Kaldu Bubuk', displayNameEn: 'Stock Powder' },
  'broth': { canonical: 'kaldu bubuk', category: 'seasoning_pantry', displayNameId: 'Kaldu', displayNameEn: 'Broth' },

  'bawang putih': { canonical: 'bawang putih', category: 'seasoning_pantry', displayNameId: 'Bawang Putih', displayNameEn: 'Garlic' },
  'garlic': { canonical: 'bawang putih', category: 'seasoning_pantry', displayNameId: 'Bawang Putih', displayNameEn: 'Garlic' },

  'bawang merah': { canonical: 'bawang merah', category: 'seasoning_pantry', displayNameId: 'Bawang Merah', displayNameEn: 'Shallot' },
  'shallot': { canonical: 'bawang merah', category: 'seasoning_pantry', displayNameId: 'Bawang Merah', displayNameEn: 'Shallot' },
  'shallots': { canonical: 'bawang merah', category: 'seasoning_pantry', displayNameId: 'Bawang Merah', displayNameEn: 'Shallots' },

  'bawang bombay': { canonical: 'bawang bombay', category: 'seasoning_pantry', displayNameId: 'Bawang Bombay', displayNameEn: 'Onion' },
  'onion': { canonical: 'bawang bombay', category: 'seasoning_pantry', displayNameId: 'Bawang Bombay', displayNameEn: 'Onion' },

  'cabai': { canonical: 'cabai', category: 'seasoning_pantry', displayNameId: 'Cabai Merah', displayNameEn: 'Red Chili' },
  'cabe': { canonical: 'cabai', category: 'seasoning_pantry', displayNameId: 'Cabai Merah', displayNameEn: 'Red Chili' },
  'chili': { canonical: 'cabai', category: 'seasoning_pantry', displayNameId: 'Cabai Merah', displayNameEn: 'Red Chili' },
  'cabe merah': { canonical: 'cabai', category: 'seasoning_pantry', displayNameId: 'Cabai Merah', displayNameEn: 'Red Chili' },
  'cabai merah': { canonical: 'cabai', category: 'seasoning_pantry', displayNameId: 'Cabai Merah', displayNameEn: 'Red Chili' },
  'cabai rawit': { canonical: 'cabai rawit', category: 'seasoning_pantry', displayNameId: 'Cabai Rawit', displayNameEn: 'Bird\'s Eye Chili' },
  'cabe rawit': { canonical: 'cabai rawit', category: 'seasoning_pantry', displayNameId: 'Cabai Rawit', displayNameEn: 'Bird\'s Eye Chili' },

  'santan': { canonical: 'santan', category: 'seasoning_pantry', displayNameId: 'Santan', displayNameEn: 'Coconut Milk' },
  'coconut milk': { canonical: 'santan', category: 'seasoning_pantry', displayNameId: 'Santan', displayNameEn: 'Coconut Milk' },

  'susu': { canonical: 'susu', category: 'seasoning_pantry', displayNameId: 'Susu', displayNameEn: 'Milk' },
  'milk': { canonical: 'susu', category: 'seasoning_pantry', displayNameId: 'Susu', displayNameEn: 'Milk' },

  'kecap': { canonical: 'kecap manis', category: 'seasoning_pantry', displayNameId: 'Kecap Manis', displayNameEn: 'Sweet Soy Sauce' },
  'kecap manis': { canonical: 'kecap manis', category: 'seasoning_pantry', displayNameId: 'Kecap Manis', displayNameEn: 'Sweet Soy Sauce' },
  'sweet soy sauce': { canonical: 'kecap manis', category: 'seasoning_pantry', displayNameId: 'Kecap Manis', displayNameEn: 'Sweet Soy Sauce' },

  'saus tiram': { canonical: 'saus tiram', category: 'seasoning_pantry', displayNameId: 'Saus Tiram', displayNameEn: 'Oyster Sauce' },
  'oyster sauce': { canonical: 'saus tiram', category: 'seasoning_pantry', displayNameId: 'Saus Tiram', displayNameEn: 'Oyster Sauce' },

  'minyak': { canonical: 'minyak goreng', category: 'seasoning_pantry', displayNameId: 'Minyak Goreng', displayNameEn: 'Cooking Oil' },
  'minyak goreng': { canonical: 'minyak goreng', category: 'seasoning_pantry', displayNameId: 'Minyak Goreng', displayNameEn: 'Cooking Oil' },
  'oil': { canonical: 'minyak goreng', category: 'seasoning_pantry', displayNameId: 'Minyak Goreng', displayNameEn: 'Cooking Oil' },
  'cooking oil': { canonical: 'minyak goreng', category: 'seasoning_pantry', displayNameId: 'Minyak Goreng', displayNameEn: 'Cooking Oil' },

  'tepung': { canonical: 'tepung terigu', category: 'seasoning_pantry', displayNameId: 'Tepung Terigu', displayNameEn: 'Flour' },
  'tepung terigu': { canonical: 'tepung terigu', category: 'seasoning_pantry', displayNameId: 'Tepung Terigu', displayNameEn: 'Flour' },
  'flour': { canonical: 'tepung terigu', category: 'seasoning_pantry', displayNameId: 'Tepung Terigu', displayNameEn: 'Flour' },

  'es batu': { canonical: 'es batu', category: 'seasoning_pantry', displayNameId: 'Es Batu', displayNameEn: 'Ice Cubes' },
  'ice': { canonical: 'es batu', category: 'seasoning_pantry', displayNameId: 'Es Batu', displayNameEn: 'Ice Cubes' },
  'es': { canonical: 'es batu', category: 'seasoning_pantry', displayNameId: 'Es Batu', displayNameEn: 'Ice Cubes' },

  'air': { canonical: 'air', category: 'seasoning_pantry', displayNameId: 'Air', displayNameEn: 'Water' },
  'water': { canonical: 'air', category: 'seasoning_pantry', displayNameId: 'Air', displayNameEn: 'Water' },

  'jeruk nipis': { canonical: 'jeruk nipis', category: 'seasoning_pantry', displayNameId: 'Jeruk Nipis', displayNameEn: 'Lime' },
  'lime': { canonical: 'jeruk nipis', category: 'seasoning_pantry', displayNameId: 'Jeruk Nipis', displayNameEn: 'Lime' },

  'serai': { canonical: 'serai', category: 'seasoning_pantry', displayNameId: 'Serai', displayNameEn: 'Lemongrass' },
  'lemongrass': { canonical: 'serai', category: 'seasoning_pantry', displayNameId: 'Serai', displayNameEn: 'Lemongrass' },

  'daun salam': { canonical: 'daun salam', category: 'seasoning_pantry', displayNameId: 'Daun Salam', displayNameEn: 'Bay Leaves' },
  'lengkuas': { canonical: 'lengkuas', category: 'seasoning_pantry', displayNameId: 'Lengkuas', displayNameEn: 'Galangal' },
  'kunyit': { canonical: 'kunyit', category: 'seasoning_pantry', displayNameId: 'Kunyit', displayNameEn: 'Turmeric' },
  'jahe': { canonical: 'jahe', category: 'seasoning_pantry', displayNameId: 'Jahe', displayNameEn: 'Ginger' },
  'daun bawang': { canonical: 'daun bawang', category: 'seasoning_pantry', displayNameId: 'Daun Bawang', displayNameEn: 'Green Onions' },
  'daun pandan': { canonical: 'daun pandan', category: 'seasoning_pantry', displayNameId: 'Daun Pandan', displayNameEn: 'Pandan Leaves' },
};

/**
 * Classifies an ingredient name into its category and canonical representation.
 */
export const classifyIngredient = (name: string): IngredientClassification => {
  const normalized = normalizeIngredientText(name);

  // Direct match in dictionary
  if (CANONICAL_MAP[normalized]) {
    const item = CANONICAL_MAP[normalized];
    return { ...item, canonicalName: item.canonical };
  }

  // Strict check for differences (jeruk nipis != jeruk, santan != susu)
  if (normalized.includes('jeruk nipis') || normalized.includes('lime')) {
    const item = CANONICAL_MAP['jeruk nipis'];
    return { ...item, canonicalName: item.canonical };
  }
  if (normalized.includes('santan') || normalized.includes('coconut milk')) {
    const item = CANONICAL_MAP['santan'];
    return { ...item, canonicalName: item.canonical };
  }

  // Check sub-phrases / keywords in dictionary
  for (const [key, value] of Object.entries(CANONICAL_MAP)) {
    // If the input contains key as a distinct word boundary
    const regex = new RegExp(`(^|\\s)${key}(\\s|$)`, 'i');
    if (regex.test(normalized)) {
      return { ...value, canonicalName: value.canonical };
    }
  }

  // Fallback heuristic classification based on common substrings
  if (/(mangga|pisang|apel|jeruk|semangka|melon|pepaya|alpukat|nanas|stroberi|anggur|pear|kiwi|fruit)/i.test(normalized)) {
    return {
      canonical: normalized,
      canonicalName: normalized,
      category: 'fruit',
      displayNameId: name,
      displayNameEn: name,
    };
  }
  if (/(kambing|goat|lamb|mutton)/i.test(normalized)) {
    return {
      canonical: 'daging kambing',
      canonicalName: 'daging kambing',
      category: 'meat',
      meatSubType: 'goat',
      displayNameId: 'Daging Kambing',
      displayNameEn: 'Goat Meat',
    };
  }
  if (/(ayam|chicken|poultry)/i.test(normalized)) {
    return {
      canonical: 'daging ayam',
      canonicalName: 'daging ayam',
      category: 'meat',
      meatSubType: 'chicken',
      displayNameId: 'Daging Ayam',
      displayNameEn: 'Chicken',
    };
  }
  if (/(sapi|beef|meat)/i.test(normalized)) {
    return {
      canonical: 'daging sapi',
      canonicalName: 'daging sapi',
      category: 'meat',
      meatSubType: 'beef',
      displayNameId: 'Daging Sapi',
      displayNameEn: 'Beef',
    };
  }
  if (/(ikan|fish|salmon|tuna|udang|shrimp|cumi|squid|seafood)/i.test(normalized)) {
    return {
      canonical: normalized,
      canonicalName: normalized,
      category: 'seafood',
      displayNameId: name,
      displayNameEn: name,
    };
  }
  if (/(telur|egg)/i.test(normalized)) {
    return {
      canonical: 'telur',
      canonicalName: 'telur',
      category: 'egg',
      displayNameId: 'Telur',
      displayNameEn: 'Egg',
    };
  }
  if (/(nasi|rice|mie|noodle|bihun|kentang|potato|singkong|ubi)/i.test(normalized)) {
    return {
      canonical: normalized,
      canonicalName: normalized,
      category: 'staple',
      displayNameId: name,
      displayNameEn: name,
    };
  }
  if (/(kangkung|bayam|spinach|wortel|carrot|kol|cabbage|sawi|buncis|tomat|tomato|sayur|veg)/i.test(normalized)) {
    return {
      canonical: normalized,
      canonicalName: normalized,
      category: 'vegetable',
      displayNameId: name,
      displayNameEn: name,
    };
  }

  return {
    canonical: normalized,
    canonicalName: normalized,
    category: 'vegetable',
    displayNameId: name,
    displayNameEn: name,
  };
};

/**
 * Checks whether two ingredient names represent the same culinary item.
 * Preserves strict boundaries:
 * - "jeruk nipis" != "jeruk"
 * - "santan" != "susu"
 * - "bawang merah" != "bawang putih"
 */
export const areIngredientsMatching = (left: string, right: string): boolean => {
  const normLeft = normalizeIngredientText(left);
  const normRight = normalizeIngredientText(right);

  if (normLeft === normRight) return true;

  // Strict distinctions
  if ((normLeft.includes('nipis') && !normRight.includes('nipis')) ||
      (!normLeft.includes('nipis') && normRight.includes('nipis'))) {
    return false;
  }
  if ((normLeft.includes('santan') && normRight.includes('susu')) ||
      (normLeft.includes('susu') && normRight.includes('santan'))) {
    return false;
  }
  if ((normLeft.includes('putih') && normRight.includes('merah')) ||
      (normLeft.includes('merah') && normRight.includes('putih'))) {
    return false;
  }

  const classLeft = classifyIngredient(left);
  const classRight = classifyIngredient(right);

  return classLeft.canonical === classRight.canonical;
};
