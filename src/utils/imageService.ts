/**
 * REPLATE Dynamic Food & Recipe Image Service
 *
 * Provides relevant, keyword-matched high resolution food images for:
 * - Ingredients (Mangga, Daging Kambing, Wortel, Telur, dll.)
 * - Recipes (Jus Mangga, Gulai Kambing, Pisang Goreng, Telur Balado, dll.)
 *
 * Includes fallback generators with culinary gradients and clean typography.
 */

import { normalizeIngredientText } from './ingredientCategorizer';

// Curated high quality Unsplash photography for ingredients
const INGREDIENT_PHOTO_MAP: Array<{ keywords: string[]; photoId: string; emoji: string }> = [
  // Fruits
  { keywords: ['mangga', 'mango'], photoId: 'photo-1553279768-865429fa0078', emoji: '🥭' },
  { keywords: ['pisang', 'banana'], photoId: 'photo-1571771894821-ce9b6c11b08e', emoji: '🍌' },
  { keywords: ['apel', 'apple'], photoId: 'photo-1560806887-1e4cd0b6cbd6', emoji: '🍎' },
  { keywords: ['jeruk nipis', 'lime'], photoId: 'photo-1590502593747-42a996133562', emoji: '🍋' },
  { keywords: ['jeruk', 'orange'], photoId: 'photo-1547514701-42782101795e', emoji: '🍊' },
  { keywords: ['semangka', 'watermelon'], photoId: 'photo-1587049352846-4a222e784d38', emoji: '🍉' },
  { keywords: ['melon'], photoId: 'photo-1598170845058-32b9d6a5da37', emoji: '🍈' },
  { keywords: ['pepaya', 'papaya'], photoId: 'photo-1617112848923-cc2234396a8d', emoji: '🍈' },
  { keywords: ['alpukat', 'avocado'], photoId: 'photo-1523049673857-eb18f1d7b578', emoji: '🥑' },
  { keywords: ['nanas', 'pineapple'], photoId: 'photo-1550258987-190a2d41a8ba', emoji: '🍍' },
  { keywords: ['stroberi', 'strawberry'], photoId: 'photo-1464965911861-746a04b4bca6', emoji: '🍓' },
  { keywords: ['anggur', 'grape'], photoId: 'photo-1537640538966-79f369143f8f', emoji: '🍇' },

  // Vegetables
  { keywords: ['kangkung', 'water spinach'], photoId: 'photo-1540420773420-3366772f4999', emoji: '🥬' },
  { keywords: ['bayam', 'spinach'], photoId: 'photo-1576045057995-568f588f82fb', emoji: '🥬' },
  { keywords: ['wortel', 'carrot'], photoId: 'photo-1445282768818-728615cc910a', emoji: '🥕' },
  { keywords: ['kol', 'kubis', 'cabbage'], photoId: 'photo-1594282486552-05b4d80fbb9f', emoji: '🥬' },
  { keywords: ['sawi', 'pakcoy', 'bok choy'], photoId: 'photo-1594282486552-05b4d80fbb9f', emoji: '🥬' },
  { keywords: ['buncis', 'green beans'], photoId: 'photo-1567375698348-5d9d5ae99de0', emoji: '🫘' },
  { keywords: ['kacang panjang', 'long beans'], photoId: 'photo-1567375698348-5d9d5ae99de0', emoji: '🫘' },
  { keywords: ['tomat', 'tomato'], photoId: 'photo-1546094096-0df4bcaaa337', emoji: '🍅' },
  { keywords: ['jagung', 'corn'], photoId: 'photo-1551754655-cd27e38d2076', emoji: '🌽' },
  { keywords: ['terong', 'eggplant'], photoId: 'photo-1615485290382-441e4d049cb5', emoji: '🍆' },
  { keywords: ['tauge', 'sprout'], photoId: 'photo-1540420773420-3366772f4999', emoji: '🌱' },
  { keywords: ['mentimun', 'timun', 'cucumber'], photoId: 'photo-1604977042946-1eecc30f269e', emoji: '🥒' },

  // Meats
  { keywords: ['kambing', 'goat', 'lamb', 'mutton'], photoId: 'photo-1603894584373-5ac82b2ae398', emoji: '🥩' },
  { keywords: ['ayam', 'chicken', 'dada ayam', 'poultry'], photoId: 'photo-1604503468506-a8da13d82791', emoji: '🍗' },
  { keywords: ['sapi', 'beef', 'daging sapi'], photoId: 'photo-1588168333986-5078d3ae3976', emoji: '🥩' },

  // Seafood
  { keywords: ['ikan', 'fish', 'salmon', 'nila', 'lele', 'tongkol'], photoId: 'photo-1519708227418-c8fd9a32b7a2', emoji: '🐟' },
  { keywords: ['udang', 'shrimp', 'prawn'], photoId: 'photo-1565680018434-b513d5e5fd47', emoji: '🦐' },
  { keywords: ['cumi', 'squid'], photoId: 'photo-1544551763-46a013bb70d5', emoji: '🦑' },

  // Eggs & Dairy
  { keywords: ['telur', 'egg', 'eggs'], photoId: 'photo-1506976785307-8732e854ad03', emoji: '🥚' },
  { keywords: ['susu', 'milk'], photoId: 'photo-1563636619-e9143da7973b', emoji: '🥛' },

  // Staples
  { keywords: ['nasi', 'rice', 'beras'], photoId: 'photo-1516684732162-798a0062be99', emoji: '🍚' },
  { keywords: ['mie', 'noodle', 'bihun'], photoId: 'photo-1612927601601-6638404737ce', emoji: '🍜' },
  { keywords: ['kentang', 'potato'], photoId: 'photo-1518977676601-b53f82aba655', emoji: '🥔' },
  { keywords: ['singkong', 'cassava'], photoId: 'photo-1587132137056-bfbf0166836e', emoji: '🍠' },
  { keywords: ['ubi', 'sweet potato'], photoId: 'photo-1596097635121-14b63b7a0c19', emoji: '🍠' },
  { keywords: ['tahu', 'tofu'], photoId: 'photo-1547592180-85f173990554', emoji: '🧊' },
  { keywords: ['tempe', 'tempeh'], photoId: 'photo-1589301760014-d929f3979dbc', emoji: '🫘' },

  // Seasoning / Pantry
  { keywords: ['bawang putih', 'garlic'], photoId: 'photo-1540148426945-6cf22a6b2383', emoji: '🧄' },
  { keywords: ['bawang merah', 'shallot'], photoId: 'photo-1618512496248-a07fe83aa8cb', emoji: '🧅' },
  { keywords: ['bawang bombay', 'onion'], photoId: 'photo-1508747703725-719777637510', emoji: '🧅' },
  { keywords: ['cabai', 'cabe', 'chili'], photoId: 'photo-1588252303782-cb80119abd6d', emoji: '🌶️' },
  { keywords: ['santan', 'coconut milk'], photoId: 'photo-1520072959219-c595dc870360', emoji: '🥥' },
  { keywords: ['gula', 'sugar'], photoId: 'photo-1581441363689-1f3c3c414635', emoji: '🧂' },
  { keywords: ['garam', 'salt'], photoId: 'photo-1518843875459-f738682238a6', emoji: '🧂' },
  { keywords: ['minyak', 'oil'], photoId: 'photo-1474979266404-7eaacbcd87c5', emoji: '🫒' },
  { keywords: ['tepung', 'flour'], photoId: 'photo-1509440159596-0249088772ff', emoji: '🌾' },
  { keywords: ['es batu', 'ice'], photoId: 'photo-1517487881594-2787fef5ebf7', emoji: '🧊' },
  { keywords: ['kecap', 'soy sauce'], photoId: 'photo-1607672632458-9eb56696200b', emoji: '🍶' },
];

// Curated high quality Unsplash photography for recipe dishes
const RECIPE_PHOTO_MAP: Array<{ keywords: string[]; photoId: string; emoji: string }> = [
  // Mango drinks & Fruit Desserts
  { keywords: ['jus mangga', 'mango juice'], photoId: 'photo-1623065422902-30a2d299bbe4', emoji: '🥭' },
  { keywords: ['es mangga'], photoId: 'photo-1513558161293-cdaf765ed2fd', emoji: '🍹' },
  { keywords: ['es buah', 'fruit soup', 'es campur'], photoId: 'photo-1563805042-7684c019e1cb', emoji: '🍧' },
  { keywords: ['pisang goreng', 'fried banana'], photoId: 'photo-1596797038530-2c107229654b', emoji: '🍌' },
  { keywords: ['kolak pisang'], photoId: 'photo-1578985545062-69928b1d9587', emoji: '🥣' },
  { keywords: ['salad buah', 'fruit salad'], photoId: 'photo-1540420773420-3366772f4999', emoji: '🥗' },
  { keywords: ['rujak', 'rujak buah'], photoId: 'photo-1546069901-ba9599a7e63c', emoji: '🍍' },
  { keywords: ['jus alpukat', 'avocado juice'], photoId: 'photo-1601039641847-7857b994d704', emoji: '🥑' },
  { keywords: ['smoothie pisang'], photoId: 'photo-1553530666-ba11a7da3888', emoji: '🥤' },

  // Goat dishes
  { keywords: ['gulai kambing', 'goat curry'], photoId: 'photo-1546833999-b9f581a1996d', emoji: '🥘' },
  { keywords: ['tongseng kambing', 'tongseng'], photoId: 'photo-1547592180-85f173990554', emoji: '🍲' },
  { keywords: ['sate kambing', 'goat satay'], photoId: 'photo-1555939594-58d7cb561ad1', emoji: '🍢' },
  { keywords: ['sop kambing', 'goat soup'], photoId: 'photo-1547592166-23ac45744acd', emoji: '🥣' },
  { keywords: ['semur kambing'], photoId: 'photo-1589301760014-d929f3979dbc', emoji: '🍲' },

  // Chicken dishes
  { keywords: ['ayam goreng', 'fried chicken'], photoId: 'photo-1626082927389-6cd097cdc6ec', emoji: '🍗' },
  { keywords: ['ayam kecap'], photoId: 'photo-1604908176997-125f25cc6f3d', emoji: '🍗' },
  { keywords: ['opor ayam'], photoId: 'photo-1603894584373-5ac82b2ae398', emoji: '🥘' },
  { keywords: ['soto ayam'], photoId: 'photo-1569718212165-3a8278d5f624', emoji: '🍜' },
  { keywords: ['sup ayam', 'chicken soup'], photoId: 'photo-1547592166-23ac45744acd', emoji: '🥣' },
  { keywords: ['ayam bakar', 'grilled chicken'], photoId: 'photo-1598515214211-89d3c73ae83b', emoji: '🍗' },
  { keywords: ['tumis ayam', 'chicken stir fry'], photoId: 'photo-1603133872878-684f208fb84b', emoji: '🍳' },

  // Beef dishes
  { keywords: ['rendang', 'rendang sapi', 'beef rendang'], photoId: 'photo-1546833999-b9f581a1996d', emoji: '🍛' },
  { keywords: ['semur daging', 'semur sapi'], photoId: 'photo-1547592180-85f173990554', emoji: '🍲' },
  { keywords: ['sop daging', 'beef soup', 'sop sapi'], photoId: 'photo-1547592166-23ac45744acd', emoji: '🥣' },
  { keywords: ['tumis daging', 'beef teriyaki'], photoId: 'photo-1504674900247-0877df9cc836', emoji: '🥩' },

  // Egg dishes
  { keywords: ['telur balado', 'balado telur'], photoId: 'photo-1565299585323-38d6b0865b47', emoji: '🍳' },
  { keywords: ['telur kecap'], photoId: 'photo-1525351484163-7529414344d8', emoji: '🍳' },
  { keywords: ['telur dadar', 'omelet', 'omelette'], photoId: 'photo-1510693206972-df098062cb71', emoji: '🍳' },
  { keywords: ['sup tomat telur', 'tomato egg soup'], photoId: 'photo-1547592166-23ac45744acd', emoji: '🍲' },
  { keywords: ['telur ceplok'], photoId: 'photo-1525351484163-7529414344d8', emoji: '🍳' },

  // Seafood dishes
  { keywords: ['ikan goreng', 'fried fish'], photoId: 'photo-1534422298391-e4f8c172dddb', emoji: '🐟' },
  { keywords: ['ikan bakar', 'grilled fish'], photoId: 'photo-1519708227418-c8fd9a32b7a2', emoji: '🐟' },
  { keywords: ['udang balado', 'sambal udang'], photoId: 'photo-1565680018434-b513d5e5fd47', emoji: '🦐' },
  { keywords: ['cumi asam manis'], photoId: 'photo-1544551763-46a013bb70d5', emoji: '🦑' },

  // Vegetables
  { keywords: ['tumis kangkung'], photoId: 'photo-1540420773420-3366772f4999', emoji: '🥬' },
  { keywords: ['sayur bening', 'sayur bayam', 'spinach soup'], photoId: 'photo-1576045057995-568f588f82fb', emoji: '🥬' },
  { keywords: ['sop sayur', 'vegetable soup'], photoId: 'photo-1547592166-23ac45744acd', emoji: '🥣' },
  { keywords: ['capcay'], photoId: 'photo-1512621776951-a57141f2eefd', emoji: '🥦' },
  { keywords: ['sayur lodeh'], photoId: 'photo-1546833999-b9f581a1996d', emoji: '🥘' },

  // Staples
  { keywords: ['nasi goreng', 'fried rice'], photoId: 'photo-1603133872878-684f208fb84b', emoji: '🍚' },
  { keywords: ['mie goreng', 'fried noodles'], photoId: 'photo-1612927601601-6638404737ce', emoji: '🍜' },
  { keywords: ['mie kuah', 'mie nyemek'], photoId: 'photo-1569718212165-3a8278d5f624', emoji: '🍜' },
  { keywords: ['perkedel kentang', 'perkedel'], photoId: 'photo-1541544741938-0af808871cc0', emoji: '🥔' },
  { keywords: ['sambal goreng kentang', 'kentang balado'], photoId: 'photo-1518977676601-b53f82aba655', emoji: '🥔' },
  { keywords: ['kolak singkong'], photoId: 'photo-1587132137056-bfbf0166836e', emoji: '🍠' },
];

/**
 * Creates an elegant SVG fallback image with harmonious culinary background gradient,
 * matching icon emoji, and crisp title.
 */
export const createFoodFallbackSvg = (title: string, emoji = '🍲'): string => {
  const safeTitle = title.replace(/[<>&"']/g, '').slice(0, 28);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520">
      <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#EBF4EE" />
          <stop offset="50%" stop-color="#FDFBF7" />
          <stop offset="100%" stop-color="#E2EDE6" />
        </linearGradient>
      </defs>
      <rect width="800" height="520" fill="url(#bgGrad)" />
      <circle cx="400" cy="230" r="130" fill="#FFFFFF" opacity="0.85" />
      <circle cx="400" cy="230" r="145" fill="none" stroke="#2D6A4F" stroke-width="3" stroke-dasharray="8 6" opacity="0.3" />
      <text x="400" y="275" font-size="110" text-anchor="middle" font-family="'Segoe UI Emoji', 'Apple Color Emoji', sans-serif">${emoji}</text>
      <rect x="150" y="405" width="500" height="58" rx="29" fill="#1B4332" />
      <text x="400" y="442" font-family="'Outfit', -apple-system, sans-serif" font-size="24" font-weight="800" fill="#FFFFFF" text-anchor="middle">${safeTitle}</text>
    </svg>
  `;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

/**
 * Returns dynamic high-resolution photo URL for an ingredient keyword.
 * Fallbacks to SVG if no direct match.
 */
export const getIngredientImage = (ingredientName: string): string => {
  if (!ingredientName) return createFoodFallbackSvg('Bahan');
  const normalized = normalizeIngredientText(ingredientName);

  const matched = INGREDIENT_PHOTO_MAP.find((item) =>
    item.keywords.some((kw) => normalized.includes(kw) || kw.includes(normalized)),
  );

  if (matched) {
    return `https://images.unsplash.com/${matched.photoId}?auto=format&fit=crop&w=720&q=82`;
  }

  return createFoodFallbackSvg(ingredientName, '🥬');
};

/**
 * Returns dynamic high-resolution photo URL for a recipe title.
 */
export const getRecipeImage = (recipeTitle: string, _category?: string): string => {
  if (!recipeTitle) return createFoodFallbackSvg('Resep Spesial');
  const normalized = normalizeIngredientText(recipeTitle);

  // Check specific recipe map first
  const matchedRecipe = RECIPE_PHOTO_MAP.find((item) =>
    item.keywords.some((kw) => normalized.includes(kw)),
  );

  if (matchedRecipe) {
    return `https://images.unsplash.com/${matchedRecipe.photoId}?auto=format&fit=crop&w=1080&q=85`;
  }

  // Check ingredient map as secondary fallback (e.g. "Es Mangga" matching "mangga")
  const matchedIngredient = INGREDIENT_PHOTO_MAP.find((item) =>
    item.keywords.some((kw) => normalized.includes(kw)),
  );

  if (matchedIngredient) {
    return `https://images.unsplash.com/${matchedIngredient.photoId}?auto=format&fit=crop&w=1080&q=85`;
  }

  return createFoodFallbackSvg(recipeTitle, '🍳');
};
