/**
 * REPLATE Smart Recipe Engine
 *
 * Implements culinary-aware recipe matching, categorization, missing ingredient calculation,
 * and dynamic recipe generation based strictly on available ingredients in user inventory.
 */

import type { Ingredient, Recipe, RecipeIngredient } from '../types';
import {
  classifyIngredient,
  areIngredientsMatching,
  normalizeIngredientText,
  IngredientCategory,
} from './ingredientCategorizer';
import { validateRecipeFeasibility } from './recipeValidator';
import { getRecipeImage } from './imageService';
import { isActiveIngredient } from './inventoryStatus';
import { getRecipeMatchSummary, getRecipeRemainingQuantities } from './recipeMatching';

export interface SmartRecipeTemplate {
  id: string;
  title: string;
  subtitle: string;
  category: IngredientCategory;
  primaryIngredients: string[];
  secondaryIngredients?: string[];
  allIngredients: Array<{
    name: string;
    amount: string;
    isPrimary?: boolean;
    isPantryStaple?: boolean;
    isOptional?: boolean;
  }>;
  steps: string[];
  servings: number;
  prepTime: string;
  cookTime: string;
  difficulty: 'Easy' | 'Medium' | 'Intermediate';
  healthTag: string;
}

/**
 * Standard culinary catalog of authentic, beloved Indonesian home dishes.
 * Carefully constructed so every single dish has:
 * - Proper culinary category (fruit dishes are drinks/desserts, meat has gulai/soto/semur, etc.)
 * - Exact measurements for every single ingredient (garam, gula, etc. NEVER "secukupnya")
 * - Clear, structured cooking steps
 */
export const CANONICAL_RECIPE_TEMPLATES: SmartRecipeTemplate[] = [
  // --- BUAH (FRUIT PREPARATIONS) ---
  {
    id: 'canon-es-mangga',
    title: 'Es Mangga Segar',
    subtitle: 'Minuman dingin manis & menyegarkan',
    category: 'fruit',
    primaryIngredients: ['mangga'],
    secondaryIngredients: ['gula', 'es batu'],
    allIngredients: [
      { name: 'Mangga', amount: '2 buah (potong dadu)', isPrimary: true },
      { name: 'Gula pasir', amount: '2 sdm', isPantryStaple: true },
      { name: 'Es batu', amount: '1 gelas (150 g)', isPantryStaple: true },
      { name: 'Air', amount: '250 ml', isPantryStaple: true },
      { name: 'Jeruk nipis', amount: '1/2 buah (peras)', isPantryStaple: true },
    ],
    steps: [
      'Kupas mangga, ambil daging buahnya dan potong dadu sebagian untuk topping, sebagian untuk diblender.',
      'Larutkan 2 sdm gula pasir dengan 100 ml air hangat hingga larut sepenuhnya.',
      'Masukkan sebagian potongan mangga, air gula, dan sisa air dingin 150 ml ke dalam gelas atau blender.',
      'Tambahkan perasan jeruk nipis untuk memberi sentuhan asam segar yang seimbang.',
      'Masukkan es batu ke dalam gelas saji, tuang sari mangga, lalu beri topping potongan mangga segar di atasnya.',
    ],
    servings: 2,
    prepTime: '5 min',
    cookTime: '5 min',
    difficulty: 'Easy',
    healthTag: 'Kaya Vitamin C · Segar Alami',
  },
  {
    id: 'canon-jus-mangga',
    title: 'Jus Mangga Kental',
    subtitle: 'Jus mangga manis lembut dan dingin',
    category: 'fruit',
    primaryIngredients: ['mangga'],
    secondaryIngredients: ['gula', 'es batu', 'susu'],
    allIngredients: [
      { name: 'Mangga', amount: '2 buah', isPrimary: true },
      { name: 'Gula pasir', amount: '2 sdm', isPantryStaple: true },
      { name: 'Es batu', amount: '1 gelas (150 g)', isPantryStaple: true },
      { name: 'Air', amount: '200 ml', isPantryStaple: true },
    ],
    steps: [
      'Kupas 2 buah mangga matang, cuci bersih, lalu potong-potong daging buahnya.',
      'Masukkan potongan mangga, 2 sdm gula pasir, es batu, dan 200 ml air dingin ke dalam blender.',
      'Haluskan dengan kecepatan sedang selama 45 detik hingga tekstur kental dan lembut merata.',
      'Tuang ke dalam gelas saji dan nikmati segera selagi dingin.',
    ],
    servings: 2,
    prepTime: '5 min',
    cookTime: '3 min',
    difficulty: 'Easy',
    healthTag: 'Tinggi Serat · 100% Buah Asli',
  },
  {
    id: 'canon-es-buah',
    title: 'Es Buah Segar',
    subtitle: 'Perpaduan buah segar dingin dengan kuah manis',
    category: 'fruit',
    primaryIngredients: ['mangga', 'jeruk', 'apel'],
    secondaryIngredients: ['gula', 'es batu'],
    allIngredients: [
      { name: 'Mangga', amount: '1 buah (potong dadu)', isPrimary: true },
      { name: 'Apel', amount: '1 buah (potong dadu)', isPrimary: true },
      { name: 'Jeruk', amount: '2 buah (kupas & buang biji)', isPrimary: true },
      { name: 'Gula pasir', amount: '2 sdm', isPantryStaple: true },
      { name: 'Es batu', amount: '200 gram', isPantryStaple: true },
      { name: 'Air', amount: '300 ml', isPantryStaple: true },
    ],
    steps: [
      'Cuci bersih seluruh buah, kupas dan potong dadu rapi (mangga, apel, dan bulir jeruk).',
      'Larutkan 2 sdm gula pasir ke dalam 300 ml air matang hingga larut sempurna.',
      'Campurkan potongan aneka buah ke dalam mangkuk saji besar.',
      'Tuang air gula ke dalam mangkuk, lalu tambahkan es batu secukupnya.',
      'Aduk perlahan dan sajikan dingin untuk menyegarkan suasana.',
    ],
    servings: 3,
    prepTime: '10 min',
    cookTime: '5 min',
    difficulty: 'Easy',
    healthTag: 'Antioksidan Alami · Tanpa Pengawet',
  },
  {
    id: 'canon-pisang-goreng',
    title: 'Pisang Goreng Crispy',
    subtitle: 'Pisang berbalut adonan renyah keemasan',
    category: 'fruit',
    primaryIngredients: ['pisang'],
    secondaryIngredients: ['tepung', 'gula'],
    allIngredients: [
      { name: 'Pisang', amount: '4 buah (belah kipas)', isPrimary: true },
      { name: 'Tepung terigu', amount: '100 gram', isPantryStaple: true },
      { name: 'Gula pasir', amount: '1 sdm', isPantryStaple: true },
      { name: 'Garam', amount: '1/4 sdt', isPantryStaple: true },
      { name: 'Air', amount: '120 ml', isPantryStaple: true },
      { name: 'Minyak goreng', amount: '250 ml', isPantryStaple: true },
    ],
    steps: [
      'Kupas pisang lalu belah membujur menyerupai kipas agar bentuknya melebar.',
      'Dalam mangkuk, campurkan 100 g tepung terigu, 1 sdm gula pasir, 1/4 sdt garam, dan 120 ml air. Aduk rata hingga adonan kental halus.',
      'Celupkan pisang satu per satu ke dalam adonan tepung hingga terlumuri rata.',
      'Panaskan 250 ml minyak goreng di wajan dengan api sedang.',
      'Goreng pisang selama 4–5 menit sambil sesekali dibalik hingga berwarna kuning keemasan dan renyah.',
      'Angkat, tiriskan minyaknya, dan sajikan selagi hangat.',
    ],
    servings: 3,
    prepTime: '10 min',
    cookTime: '10 min',
    difficulty: 'Easy',
    healthTag: 'Camilan Tradisional Favorit',
  },
  {
    id: 'canon-kolak-pisang',
    title: 'Kolak Pisang Manis Gurih',
    subtitle: 'Pisang manis berkuah santan gula merah harum pandan',
    category: 'fruit',
    primaryIngredients: ['pisang'],
    secondaryIngredients: ['santan', 'gula'],
    allIngredients: [
      { name: 'Pisang', amount: '4 buah (potong serong)', isPrimary: true },
      { name: 'Santan', amount: '400 ml', isPantryStaple: true },
      { name: 'Gula merah', amount: '100 gram (sisir)', isPantryStaple: true },
      { name: 'Gula pasir', amount: '1 sdm', isPantryStaple: true },
      { name: 'Garam', amount: '1/2 sdt', isPantryStaple: true },
      { name: 'Daun pandan', amount: '2 lembar (simpul)', isPantryStaple: true },
      { name: 'Air', amount: '300 ml', isPantryStaple: true },
    ],
    steps: [
      'Didihkan 300 ml air bersama gula merah sisir, gula pasir, dan daun pandan hingga gula larut.',
      'Saring air gula jika perlu, lalu masukkan kembali ke dalam panci.',
      'Masukkan potongan pisang, masak selama 3-4 menit hingga pisang mulai melunak.',
      'Tuangkan 400 ml santan dan 1/2 sdt garam, kecilkan api agar santan tidak pecah.',
      'Aduk perlahan secara berkala hingga kuah kolak mendidih lembut dan meresap.',
      'Sajikan hangat di mangkuk saji.',
    ],
    servings: 3,
    prepTime: '10 min',
    cookTime: '15 min',
    difficulty: 'Easy',
    healthTag: 'Manis Alami Gula Merah',
  },
  {
    id: 'canon-jus-alpukat',
    title: 'Jus Alpukat Kental',
    subtitle: 'Minuman alpukat lembut kaya lemak baik',
    category: 'fruit',
    primaryIngredients: ['alpukat'],
    secondaryIngredients: ['gula', 'es batu', 'susu'],
    allIngredients: [
      { name: 'Alpukat', amount: '1 buah matang', isPrimary: true },
      { name: 'Gula pasir', amount: '1.5 sdm', isPantryStaple: true },
      { name: 'Susu', amount: '100 ml', isPantryStaple: true },
      { name: 'Es batu', amount: '1 gelas (150 g)', isPantryStaple: true },
      { name: 'Air', amount: '100 ml', isPantryStaple: true },
    ],
    steps: [
      'Belah alpukat matang, buang bijinya, lalu keruk daging buahnya dengan sendok.',
      'Masukkan daging alpukat, 1.5 sdm gula pasir, 100 ml susu, 100 ml air, dan es batu ke blender.',
      'Blender dengan kecepatan sedang hingga teksturnya sangat kental dan lembut tanpa gumpalan.',
      'Tuang ke dalam gelas dan sajikan segera selagi dingin.',
    ],
    servings: 2,
    prepTime: '5 min',
    cookTime: '3 min',
    difficulty: 'Easy',
    healthTag: 'Lemak Nabati Baik · Lembut Mengenyangkan',
  },

  // --- DAGING KAMBING (GOAT DISHES) ---
  {
    id: 'canon-gulai-kambing',
    title: 'Gulai Kambing',
    subtitle: 'Daging kambing empuk kuah santan kaya rempah',
    category: 'meat',
    primaryIngredients: ['daging kambing'],
    secondaryIngredients: ['bawang merah', 'bawang putih', 'cabai', 'santan'],
    allIngredients: [
      { name: 'Daging kambing', amount: '500 gram (potong sedang)', isPrimary: true },
      { name: 'Bawang merah', amount: '8 siung', isPantryStaple: true },
      { name: 'Bawang putih', amount: '4 siung', isPantryStaple: true },
      { name: 'Cabai merah', amount: '5 buah', isPantryStaple: true },
      { name: 'Santan', amount: '500 ml', isPantryStaple: true },
      { name: 'Serai', amount: '1 batang (memarkan)', isPantryStaple: true },
      { name: 'Daun salam', amount: '2 lembar', isPantryStaple: true },
      { name: 'Lengkuas', amount: '2 cm (memarkan)', isPantryStaple: true },
      { name: 'Kunyit', amount: '2 cm', isPantryStaple: true },
      { name: 'Garam', amount: '1 sdt', isPantryStaple: true },
      { name: 'Gula', amount: '1/2 sdt', isPantryStaple: true },
      { name: 'Minyak', amount: '2 sdm', isPantryStaple: true },
      { name: 'Air', amount: '300 ml', isPantryStaple: true },
    ],
    steps: [
      'Haluskan bumbu: bawang merah, bawang putih, cabai merah, dan kunyit.',
      'Panaskan 2 sdm minyak di wajan, tumis bumbu halus bersama serai, daun salam, dan lengkuas hingga harum matang.',
      'Masukkan 500 g potongan daging kambing, aduk rata hingga berubah warna dan bumbu meresap ke serat daging (sekitar 5-7 menit).',
      'Tuang 300 ml air, masak dengan api sedang hingga daging mulai empuk.',
      'Tuangkan 500 ml santan, tambahkan 1 sdt garam dan 1/2 sdt gula pasir.',
      'Masak sambil sesekali diaduk agar santan tidak pecah, hingga kuah mengental harum dan daging empuk sempurna (sekitar 35–45 menit).',
      'Angkat dan sajikan hangat bersama taburan bawang goreng.',
    ],
    servings: 3,
    prepTime: '15 min',
    cookTime: '45 min',
    difficulty: 'Intermediate',
    healthTag: 'Tinggi Protein · Kaya Rempah Tradisional',
  },
  {
    id: 'canon-tongseng-kambing',
    title: 'Tongseng Kambing',
    subtitle: 'Daging kambing berpadu kol, tomat, dan kecap pedas manis',
    category: 'meat',
    primaryIngredients: ['daging kambing'],
    secondaryIngredients: ['kol', 'tomat', 'cabai', 'kecap manis'],
    allIngredients: [
      { name: 'Daging kambing', amount: '400 gram (potong dadu)', isPrimary: true },
      { name: 'Kol', amount: '150 gram (iris kasar)', isPrimary: false },
      { name: 'Tomat', amount: '2 buah (potong wedges)', isPrimary: false },
      { name: 'Bawang merah', amount: '6 siung', isPantryStaple: true },
      { name: 'Bawang putih', amount: '3 siung', isPantryStaple: true },
      { name: 'Cabai rawit', amount: '5 buah', isPantryStaple: true },
      { name: 'Kecap manis', amount: '3 sdm', isPantryStaple: true },
      { name: 'Garam', amount: '1 sdt', isPantryStaple: true },
      { name: 'Gula', amount: '1/2 sdt', isPantryStaple: true },
      { name: 'Air', amount: '400 ml', isPantryStaple: true },
      { name: 'Minyak', amount: '2 sdm', isPantryStaple: true },
    ],
    steps: [
      'Iris tipis bawang merah dan haluskan bawang putih.',
      'Panaskan 2 sdm minyak, tumis bawang hingga harum keemasan.',
      'Masukkan potongan daging kambing, masak sambil dibalik hingga berubah warna kecokelatan.',
      'Tuang 400 ml air, bumbui dengan 1 sdt garam, 1/2 sdt gula, dan 3 sdm kecap manis. Masak hingga daging empuk dan kuah menyusut gurih.',
      'Masukkan irisan kol, potongan tomat, dan cabai rawit utuh. Masak sebentar selama 2 menit hingga kol layu tapi tetap renyah.',
      'Koreksi rasa, angkat dan sajikan panas.',
    ],
    servings: 3,
    prepTime: '15 min',
    cookTime: '30 min',
    difficulty: 'Medium',
    healthTag: 'Gurih Segar · Kombinasi Sayur Sehat',
  },
  {
    id: 'canon-sate-kambing',
    title: 'Sate Kambing Bumbu Kecap',
    subtitle: 'Daging kambing panggang empuk dengan acar bumbu kecap',
    category: 'meat',
    primaryIngredients: ['daging kambing'],
    secondaryIngredients: ['kecap manis', 'bawang merah', 'cabai'],
    allIngredients: [
      { name: 'Daging kambing', amount: '500 gram (potong dadu)', isPrimary: true },
      { name: 'Kecap manis', amount: '5 sdm', isPantryStaple: true },
      { name: 'Bawang merah', amount: '6 siung (iris tipis)', isPantryStaple: true },
      { name: 'Cabai rawit', amount: '6 buah (iris)', isPantryStaple: true },
      { name: 'Tomat', amount: '1 buah (potong dadu)', isPantryStaple: true },
      { name: 'Jeruk nipis', amount: '1 buah', isPantryStaple: true },
      { name: 'Garam', amount: '1/2 sdt', isPantryStaple: true },
      { name: 'Merica', amount: '1/4 sdt', isPantryStaple: true },
      { name: 'Minyak', amount: '1 sdm', isPantryStaple: true },
    ],
    steps: [
      'Potong dadu daging kambing. Lumuri dengan 1/2 sdt garam, 1/4 sdt merica, 1 sdm minyak, dan 2 sdm kecap manis. Diamkan 15 menit agar bumbu meresap.',
      'Tusukkan daging ke tusuk sate secara rapat.',
      'Panggang sate di atas wajan panggangan atau arang dengan api sedang, bolak-balik sambil diolesi sisa kecap hingga matang empuk (sekitar 8-10 menit).',
      'Siapkan piring saji: campur sisa 3 sdm kecap manis, irisan bawang merah, irisan cabai rawit, potongan tomat, dan perasan jeruk nipis.',
      'Sajikan sate hangat bersama sambal kecap pedas segar.',
    ],
    servings: 3,
    prepTime: '20 min',
    cookTime: '15 min',
    difficulty: 'Medium',
    healthTag: 'Tinggi Zat Besi · Rendah Minyak',
  },

  // --- DAGING AYAM (CHICKEN DISHES) ---
  {
    id: 'canon-ayam-kecap',
    title: 'Ayam Kecap Manis Gurih',
    subtitle: 'Ayam ungkep kuah kecap pekat beraroma bawang',
    category: 'meat',
    primaryIngredients: ['daging ayam'],
    secondaryIngredients: ['kecap manis', 'bawang merah', 'bawang putih', 'cabai'],
    allIngredients: [
      { name: 'Daging ayam', amount: '500 gram (potong 8 bagian)', isPrimary: true },
      { name: 'Bawang merah', amount: '6 siung (iris)', isPantryStaple: true },
      { name: 'Bawang putih', amount: '4 siung (cincang)', isPantryStaple: true },
      { name: 'Cabai merah', amount: '3 buah (iris serong)', isPantryStaple: true },
      { name: 'Kecap manis', amount: '4 sdm', isPantryStaple: true },
      { name: 'Tomat', amount: '1 buah (potong wedges)', isPantryStaple: true },
      { name: 'Garam', amount: '1 sdt', isPantryStaple: true },
      { name: 'Gula', amount: '1/2 sdt', isPantryStaple: true },
      { name: 'Merica', amount: '1/4 sdt', isPantryStaple: true },
      { name: 'Minyak', amount: '2 sdm', isPantryStaple: true },
      { name: 'Air', amount: '250 ml', isPantryStaple: true },
    ],
    steps: [
      'Cuci bersih potongan ayam, lumuri dengan sedikit garam.',
      'Panaskan 2 sdm minyak di wajan, tumis bawang merah dan bawang putih cincang hingga harum.',
      'Masukkan potongan ayam, masak sambil dibalik hingga permukaan ayam berubah warna dan kencang (sekitar 5 menit).',
      'Tambahkan 4 sdm kecap manis, 1 sdt garam, 1/2 sdt gula, dan 1/4 sdt merica. Aduk rata hingga ayam terkaramelisasi.',
      'Tuang 250 ml air, tutup wajan, dan ungkep dengan api sedang selama 15 menit hingga ayam matang empuk dan kuah mengental.',
      'Masukkan irisan cabai dan tomat, aduk selama 2 menit terakhir. Angkat dan sajikan.',
    ],
    servings: 3,
    prepTime: '10 min',
    cookTime: '20 min',
    difficulty: 'Easy',
    healthTag: 'Tinggi Protein Sehat',
  },
  {
    id: 'canon-ayam-goreng',
    title: 'Ayam Goreng Lengkuas',
    subtitle: 'Ayam ungkep bumbu kuning goreng gurih renyah',
    category: 'meat',
    primaryIngredients: ['daging ayam'],
    secondaryIngredients: ['bawang putih', 'bawang merah', 'kunyit'],
    allIngredients: [
      { name: 'Daging ayam', amount: '500 gram', isPrimary: true },
      { name: 'Bawang putih', amount: '4 siung', isPantryStaple: true },
      { name: 'Bawang merah', amount: '6 siung', isPantryStaple: true },
      { name: 'Kunyit', amount: '2 cm', isPantryStaple: true },
      { name: 'Lengkuas', amount: '40 gram (parut kasar)', isPantryStaple: true },
      { name: 'Serai', amount: '1 batang', isPantryStaple: true },
      { name: 'Daun salam', amount: '2 lembar', isPantryStaple: true },
      { name: 'Garam', amount: '1 sdt', isPantryStaple: true },
      { name: 'Kaldu bubuk', amount: '1/2 sdt', isPantryStaple: true },
      { name: 'Air', amount: '200 ml', isPantryStaple: true },
      { name: 'Minyak goreng', amount: '250 ml', isPantryStaple: true },
    ],
    steps: [
      'Haluskan bumbu: bawang putih, bawang merah, dan kunyit.',
      'Campurkan ayam bersama bumbu halus, parutan lengkuas, serai, daun salam, 1 sdt garam, 1/2 sdt kaldu bubuk, dan 200 ml air di wajan.',
      'Ungkep ayam di atas api sedang selama 15-20 menit hingga air menyusut dan bumbu meresap sempurna.',
      'Panaskan 250 ml minyak goreng dalam wajan cekung dengan api sedang-tinggi.',
      'Goreng ayam dan serundeng lengkuas secara terpisah atau bersamaan hingga berwarna kuning keemasan garing.',
      'Angkat, tiriskan, dan taburkan remahan lengkuas gurih di atas ayam.',
    ],
    servings: 3,
    prepTime: '15 min',
    cookTime: '25 min',
    difficulty: 'Medium',
    healthTag: 'Renyah Gurih Alami',
  },
  {
    id: 'canon-sup-ayam',
    title: 'Sup Ayam Sayur Bening',
    subtitle: 'Kuah kaldu ayam hangat kaya nutrisi sayuran',
    category: 'meat',
    primaryIngredients: ['daging ayam'],
    secondaryIngredients: ['wortel', 'kentang', 'bawang putih'],
    allIngredients: [
      { name: 'Daging ayam', amount: '350 gram (potong kecil)', isPrimary: true },
      { name: 'Wortel', amount: '2 buah (potong bulat)', isPrimary: false },
      { name: 'Kentang', amount: '2 buah (potong dadu)', isPrimary: false },
      { name: 'Bawang putih', amount: '4 siung (geprek cincang)', isPantryStaple: true },
      { name: 'Daun bawang', amount: '1 batang (iris)', isPantryStaple: true },
      { name: 'Garam', amount: '1 sdt', isPantryStaple: true },
      { name: 'Merica', amount: '1/2 sdt', isPantryStaple: true },
      { name: 'Kaldu bubuk', amount: '1/2 sdt', isPantryStaple: true },
      { name: 'Minyak', amount: '1 sdm', isPantryStaple: true },
      { name: 'Air', amount: '800 ml', isPantryStaple: true },
    ],
    steps: [
      'Rebus 350 g potongan ayam dalam 800 ml air dengan api sedang hingga mendidih dan keluar kaldu bening (sekitar 10 menit). Bersihkan buih di permukaan.',
      'Di wajan kecil terpisah, panaskan 1 sdm minyak dan tumis bawang putih geprek hingga harum kecokelatan, lalu tuang tumisan ke dalam panci kuah.',
      'Masukkan potongan kentang dan wortel ke dalam kuah kaldu.',
      'Bumbui dengan 1 sdt garam, 1/2 sdt merica, dan 1/2 sdt kaldu bubuk.',
      'Masak selama 10 menit hingga kentang dan wortel empuk matang.',
      'Terakhir, taburkan irisan daun bawang, matikan api, dan sajikan selagi panas.',
    ],
    servings: 3,
    prepTime: '15 min',
    cookTime: '20 min',
    difficulty: 'Easy',
    healthTag: 'Hangat Menyehatkan · Padat Gizi',
  },

  // --- DAGING SAPI (BEEF DISHES) ---
  {
    id: 'canon-rendang-sapi',
    title: 'Rendang Daging Sapi',
    subtitle: 'Daging sapi masak santan bumbu rempah legendaris',
    category: 'meat',
    primaryIngredients: ['daging sapi'],
    secondaryIngredients: ['santan', 'bawang merah', 'bawang putih', 'cabai'],
    allIngredients: [
      { name: 'Daging sapi', amount: '500 gram (potong searah serat)', isPrimary: true },
      { name: 'Santan', amount: '500 ml', isPantryStaple: true },
      { name: 'Bawang merah', amount: '8 siung', isPantryStaple: true },
      { name: 'Bawang putih', amount: '5 siung', isPantryStaple: true },
      { name: 'Cabai merah', amount: '8 buah', isPantryStaple: true },
      { name: 'Serai', amount: '2 batang (memarkan)', isPantryStaple: true },
      { name: 'Lengkuas', amount: '3 cm (memarkan)', isPantryStaple: true },
      { name: 'Garam', amount: '1 sdt', isPantryStaple: true },
      { name: 'Gula', amount: '1/2 sdt', isPantryStaple: true },
      { name: 'Minyak', amount: '2 sdm', isPantryStaple: true },
    ],
    steps: [
      'Haluskan bawang merah, bawang putih, dan cabai merah.',
      'Panaskan minyak, tumis bumbu halus bersama serai dan lengkuas hingga harum berminyak.',
      'Masukkan potongan daging sapi, aduk rata sampai daging berubah warna kecokelatan.',
      'Tuangkan santan, tambahkan 1 sdt garam dan 1/2 sdt gula.',
      'Kecilkan api, masak perlahan sambil sesekali diaduk agar bagian bawah tidak gosong.',
      'Masak hingga kuah mengering menjadi gulai kental (kalio), lalu teruskan sampai minyak berwarna kecokelatan gelap dan daging sangat empuk.',
    ],
    servings: 4,
    prepTime: '20 min',
    cookTime: '60 min',
    difficulty: 'Intermediate',
    healthTag: 'Kaya Rempah Nusantara',
  },
  {
    id: 'canon-semur-daging',
    title: 'Semur Daging Sapi & Kentang',
    subtitle: 'Daging sapi empuk berpadu kentang kuah kecap rempah',
    category: 'meat',
    primaryIngredients: ['daging sapi'],
    secondaryIngredients: ['kentang', 'bawang merah', 'bawang putih', 'kecap manis'],
    allIngredients: [
      { name: 'Daging sapi', amount: '400 gram (potong tipis melebar)', isPrimary: true },
      { name: 'Kentang', amount: '2 buah (potong dadu & goreng setengah matang)', isPrimary: false },
      { name: 'Bawang merah', amount: '6 siung', isPantryStaple: true },
      { name: 'Bawang putih', amount: '4 siung', isPantryStaple: true },
      { name: 'Kecap manis', amount: '4 sdm', isPantryStaple: true },
      { name: 'Tomat', amount: '1 buah', isPantryStaple: true },
      { name: 'Garam', amount: '1 sdt', isPantryStaple: true },
      { name: 'Gula', amount: '1/2 sdt', isPantryStaple: true },
      { name: 'Merica', amount: '1/4 sdt', isPantryStaple: true },
      { name: 'Minyak', amount: '2 sdm', isPantryStaple: true },
      { name: 'Air', amount: '500 ml', isPantryStaple: true },
    ],
    steps: [
      'Haluskan bawang merah, bawang putih, dan merica.',
      'Panaskan 2 sdm minyak di wajan, tumis bumbu halus hingga harum.',
      'Masukkan potongan daging sapi, aduk sampai daging berubah warna.',
      'Tuangkan 4 sdm kecap manis, 1 sdt garam, 1/2 sdt gula, dan potongan tomat. Aduk rata hingga daging terbalut bumbu.',
      'Tuang 500 ml air, tutup wajan dan ungkep dengan api sedang selama 25 menit sampai daging empuk.',
      'Masukkan kentang goreng, masak kembali 5 menit hingga bumbu meresap ke dalam kentang.',
      'Sajikan hangat bersama nasi putih.',
    ],
    servings: 3,
    prepTime: '15 min',
    cookTime: '30 min',
    difficulty: 'Medium',
    healthTag: 'Gurih Manis Mengenyangkan',
  },

  // --- TELUR (EGG DISHES) ---
  {
    id: 'canon-telur-balado',
    title: 'Telur Balado',
    subtitle: 'Telur rebus goreng berbalut sambal balado merah',
    category: 'egg',
    primaryIngredients: ['telur'],
    secondaryIngredients: ['cabai', 'bawang merah', 'bawang putih', 'tomat'],
    allIngredients: [
      { name: 'Telur', amount: '4 butir (rebus & kupas)', isPrimary: true },
      { name: 'Cabai merah', amount: '8 buah', isPantryStaple: true },
      { name: 'Cabai rawit', amount: '4 buah', isPantryStaple: true },
      { name: 'Bawang merah', amount: '6 siung', isPantryStaple: true },
      { name: 'Bawang putih', amount: '3 siung', isPantryStaple: true },
      { name: 'Tomat', amount: '1 buah', isPantryStaple: true },
      { name: 'Garam', amount: '1 sdt', isPantryStaple: true },
      { name: 'Gula', amount: '1 sdt', isPantryStaple: true },
      { name: 'Minyak', amount: '3 sdm', isPantryStaple: true },
      { name: 'Air', amount: '50 ml', isPantryStaple: true },
    ],
    steps: [
      'Rebus 4 butir telur selama 9 menit, kupas kulitnya, lalu goreng sebentar di minyak panas sampai berkulit tipis keemasan. Tiriskan.',
      'Ulek atau blender kasar bumbu: cabai merah, cabai rawit, bawang merah, bawang putih, dan tomat.',
      'Panaskan 3 sdm minyak di wajan, tumis sambal balado dengan api sedang hingga matang harum dan minyak berwarna kemerahan.',
      'Tambahkan 1 sdt garam, 1 sdt gula pasir, dan 50 ml air. Aduk rata hingga sambal mendidih kental.',
      'Masukkan telur goreng, aduk perlahan hingga seluruh permukaan telur terlumuri sambal balado secara merata.',
      'Angkat dan sajikan hangat.',
    ],
    servings: 2,
    prepTime: '10 min',
    cookTime: '12 min',
    difficulty: 'Easy',
    healthTag: 'Tinggi Protein · Pedas Menggugah Selera',
  },
  {
    id: 'canon-telur-kecap',
    title: 'Telur Kecap Bawang',
    subtitle: 'Telur ceplok/rebus kuah manis gurih bawang merah cabai',
    category: 'egg',
    primaryIngredients: ['telur'],
    secondaryIngredients: ['bawang merah', 'bawang putih', 'cabai', 'kecap manis'],
    allIngredients: [
      { name: 'Telur', amount: '3 butir', isPrimary: true },
      { name: 'Bawang merah', amount: '5 siung (iris)', isPantryStaple: true },
      { name: 'Bawang putih', amount: '3 siung (iris)', isPantryStaple: true },
      { name: 'Cabai rawit', amount: '4 buah (iris serong)', isPantryStaple: true },
      { name: 'Kecap manis', amount: '3 sdm', isPantryStaple: true },
      { name: 'Garam', amount: '1/2 sdt', isPantryStaple: true },
      { name: 'Merica', amount: '1/4 sdt', isPantryStaple: true },
      { name: 'Minyak', amount: '2 sdm', isPantryStaple: true },
      { name: 'Air', amount: '100 ml', isPantryStaple: true },
    ],
    steps: [
      'Goreng telur ceplok satu per satu hingga pinggirannya renyah keemasan tapi kuning telur tetap lembut. Tiriskan.',
      'Gunakan wajan yang sama dengan 1 sdm minyak, tumis irisan bawang merah, bawang putih, dan cabai rawit sampai harum layu.',
      'Tambahkan 3 sdm kecap manis, 1/2 sdt garam, 1/4 sdt merica, dan tuang 100 ml air.',
      'Aduk kuah kecap sampai mendidih berbusa harum.',
      'Masukkan telur ceplok, siram-siramkan kuah ke atas telur selama 1-2 menit agar bumbu meresap.',
      'Angkat dan sajikan dengan nasi hangat.',
    ],
    servings: 2,
    prepTime: '5 min',
    cookTime: '10 min',
    difficulty: 'Easy',
    healthTag: 'Cepat & Praktis · Favorit Keluarga',
  },
  {
    id: 'canon-telur-dadar',
    title: 'Telur Dadar Padang Tebal',
    subtitle: 'Telur dadar gurih tebal berempah harum daun bawang',
    category: 'egg',
    primaryIngredients: ['telur'],
    secondaryIngredients: ['daun bawang', 'bawang merah', 'cabai'],
    allIngredients: [
      { name: 'Telur', amount: '3 butir', isPrimary: true },
      { name: 'Daun bawang', amount: '2 batang (iris halus)', isPrimary: false },
      { name: 'Bawang merah', amount: '4 siung (iris tipis)', isPantryStaple: true },
      { name: 'Cabai merah', amount: '2 buah (cincang)', isPantryStaple: true },
      { name: 'Tepung terigu', amount: '1 sdm (larutkan dengan 2 sdm air)', isPantryStaple: true },
      { name: 'Garam', amount: '1/2 sdt', isPantryStaple: true },
      { name: 'Kaldu bubuk', amount: '1/2 sdt', isPantryStaple: true },
      { name: 'Merica', amount: '1/4 sdt', isPantryStaple: true },
      { name: 'Minyak', amount: '3 sdm', isPantryStaple: true },
    ],
    steps: [
      'Pecahkan 3 butir telur dalam mangkuk besar.',
      'Masukkan irisan daun bawang, bawang merah, cabai cincang, larutan tepung terigu, 1/2 sdt garam, 1/2 sdt kaldu bubuk, dan 1/4 sdt merica.',
      'Kocok lepas secara merata hingga adonan berbusa lembut.',
      'Panaskan 3 sdm minyak di wajan cekung tebal dengan api sedang-kecil.',
      'Tuangkan seluruh adonan telur, biarkan bagian bawah mulai berkulit keemasan.',
      'Balik telur dengan hati-hati saat bagian bawah sudah kokoh, lalu masak sisi baliknya sampai matang tebal kecokelatan.',
      'Angkat, potong-potong, dan sajikan selagi hangat.',
    ],
    servings: 2,
    prepTime: '8 min',
    cookTime: '8 min',
    difficulty: 'Easy',
    healthTag: 'Tinggi Protein Padat',
  },

  // --- SAYURAN (VEGETABLE DISHES) ---
  {
    id: 'canon-tumis-kangkung',
    title: 'Tumis Kangkung Saus Tiram',
    subtitle: 'Kangkung renyah hijau ditumis bawang gurih saus tiram',
    category: 'vegetable',
    primaryIngredients: ['kangkung'],
    secondaryIngredients: ['bawang merah', 'bawang putih', 'cabai', 'saus tiram'],
    allIngredients: [
      { name: 'Kangkung', amount: '1 ikat / 250 gram (petik segar)', isPrimary: true },
      { name: 'Bawang merah', amount: '4 siung (iris tipis)', isPantryStaple: true },
      { name: 'Bawang putih', amount: '3 siung (cincang)', isPantryStaple: true },
      { name: 'Cabai merah', amount: '3 buah (iris serong)', isPantryStaple: true },
      { name: 'Saus tiram', amount: '1 sdm', isPantryStaple: true },
      { name: 'Garam', amount: '1/2 sdt', isPantryStaple: true },
      { name: 'Gula', amount: '1/4 sdt', isPantryStaple: true },
      { name: 'Minyak', amount: '2 sdm', isPantryStaple: true },
      { name: 'Air', amount: '50 ml', isPantryStaple: true },
    ],
    steps: [
      'Petik kangkung, cuci bersih di bawah air mengalir, tiriskan.',
      'Panaskan 2 sdm minyak di wajan dengan api besar.',
      'Tumis bawang merah, bawang putih, dan cabai merah selama 30 detik sampai harum semerbak.',
      'Masukkan kangkung, aduk cepat dengan api besar agar tetap berwarna hijau cerah.',
      'Tambahkan 1 sdm saus tiram, 1/2 sdt garam, 1/4 sdt gula, dan tuang 50 ml air.',
      'Masak cepat sekitar 2-3 menit hingga batang renyah matang tapi tidak layu menghitam.',
      'Angkat segera ke piring saji.',
    ],
    servings: 2,
    prepTime: '8 min',
    cookTime: '5 min',
    difficulty: 'Easy',
    healthTag: 'Tinggi Serat & Zat Besi',
  },
  {
    id: 'canon-sayur-bening-bayam',
    title: 'Sayur Bening Bayam Jagung',
    subtitle: 'Kuah bening bayam dan jagung manis segar alami',
    category: 'vegetable',
    primaryIngredients: ['bayam'],
    secondaryIngredients: ['jagung', 'bawang merah'],
    allIngredients: [
      { name: 'Bayam', amount: '1 ikat / 200 gram (petik daun)', isPrimary: true },
      { name: 'Jagung manis', amount: '1 buah (potong bulat)', isPrimary: false },
      { name: 'Bawang merah', amount: '4 siung (iris tipis)', isPantryStaple: true },
      { name: 'Bawang putih', amount: '2 siung (geprek)', isPantryStaple: true },
      { name: 'Garam', amount: '1 sdt', isPantryStaple: true },
      { name: 'Gula', amount: '1/2 sdt', isPantryStaple: true },
      { name: 'Air', amount: '800 ml', isPantryStaple: true },
    ],
    steps: [
      'Didihkan 800 ml air dalam panci bersama irisan bawang merah dan bawang putih geprek.',
      'Masukkan potongan jagung manis, masak selama 5-7 menit hingga jagung matang empuk dan manisnya meresap ke kuah.',
      'Bumbui dengan 1 sdt garam dan 1/2 sdt gula pasir.',
      'Masukkan daun bayam, aduk rata dan masak singkat selama 1–2 menit saja agar daun bayam tetap hijau cerah bernutrisi.',
      'Matikan api dan sajikan hangat.',
    ],
    servings: 3,
    prepTime: '8 min',
    cookTime: '10 min',
    difficulty: 'Easy',
    healthTag: 'Tanpa Minyak · Kaya Klorofil & Vitamin',
  },
  {
    id: 'canon-sop-sayur',
    title: 'Sop Sayur Bening Sederhana',
    subtitle: 'Wortel, kentang, dan kol dalam kuah kaldu bawang gurih',
    category: 'vegetable',
    primaryIngredients: ['wortel', 'kentang'],
    secondaryIngredients: ['kol', 'buncis', 'bawang putih'],
    allIngredients: [
      { name: 'Wortel', amount: '2 buah (potong bulat)', isPrimary: true },
      { name: 'Kentang', amount: '2 buah (potong dadu)', isPrimary: true },
      { name: 'Kol', amount: '100 gram (potong kasar)', isPrimary: false },
      { name: 'Buncis', amount: '50 gram (potong serong)', isPrimary: false },
      { name: 'Bawang putih', amount: '3 siung (cincang tumis)', isPantryStaple: true },
      { name: 'Daun bawang', amount: '1 batang (iris)', isPantryStaple: true },
      { name: 'Garam', amount: '1 sdt', isPantryStaple: true },
      { name: 'Merica', amount: '1/2 sdt', isPantryStaple: true },
      { name: 'Kaldu bubuk', amount: '1/2 sdt', isPantryStaple: true },
      { name: 'Air', amount: '800 ml', isPantryStaple: true },
      { name: 'Minyak', amount: '1 sdm', isPantryStaple: true },
    ],
    steps: [
      'Panaskan 1 sdm minyak, tumis bawang putih cincang hingga harum keemasan.',
      'Tuangkan 800 ml air ke dalam panci tumisan bawang, biarkan mendidih.',
      'Masukkan potongan kentang dan wortel, masak selama 8 menit sampai mulai empuk.',
      'Tambahkan buncis dan kol.',
      'Bumbui dengan 1 sdt garam, 1/2 sdt merica, dan 1/2 sdt kaldu bubuk.',
      'Masak kembali selama 3-4 menit hingga semua sayuran matang empuk bertekstur.',
      'Taburkan irisan daun bawang, matikan api, dan sajikan selagi panas.',
    ],
    servings: 3,
    prepTime: '12 min',
    cookTime: '15 min',
    difficulty: 'Easy',
    healthTag: 'Kaya Vitamin A & Serat',
  },

  // --- BAHAN POKOK (CARBOHYDRATES & STAPLES) ---
  {
    id: 'canon-nasi-goreng',
    title: 'Nasi Goreng Spesial Telur',
    subtitle: 'Nasi goreng harum kecap dan bumbu bawang gurih',
    category: 'staple',
    primaryIngredients: ['nasi'],
    secondaryIngredients: ['telur', 'bawang merah', 'bawang putih', 'kecap manis'],
    allIngredients: [
      { name: 'Nasi', amount: '400 gram (2 piring nasi pera)', isPrimary: true },
      { name: 'Telur', amount: '2 butir', isPrimary: false },
      { name: 'Bawang merah', amount: '4 siung (iris)', isPantryStaple: true },
      { name: 'Bawang putih', amount: '3 siung (cincang)', isPantryStaple: true },
      { name: 'Cabai merah', amount: '2 buah (iris serong)', isPantryStaple: true },
      { name: 'Kecap manis', amount: '2 sdm', isPantryStaple: true },
      { name: 'Garam', amount: '1/2 sdt', isPantryStaple: true },
      { name: 'Kaldu bubuk', amount: '1/2 sdt', isPantryStaple: true },
      { name: 'Minyak', amount: '2 sdm', isPantryStaple: true },
    ],
    steps: [
      'Panaskan 2 sdm minyak di wajan dengan api sedang-tinggi.',
      'Tumis bawang merah, bawang putih, dan cabai merah sampai harum.',
      'Sisihkan tumisan bumbu ke pinggir wajan, ceplok 2 butir telur di tengah wajan lalu orak-arik cepat sampai matang berbutir.',
      'Masukkan 400 g nasi putih dingin/pera.',
      'Bumbui dengan 2 sdm kecap manis, 1/2 sdt garam, dan 1/2 sdt kaldu bubuk.',
      'Aduk cepat dengan api besar sambil ditekan-tekan agar bumbu merata dan aroma asap wajan meresap (sekitar 3-4 menit).',
      'Angkat dan sajikan panas.',
    ],
    servings: 2,
    prepTime: '5 min',
    cookTime: '10 min',
    difficulty: 'Easy',
    healthTag: 'Energi Cepat Siap Saji',
  },
  {
    id: 'canon-mie-goreng',
    title: 'Mie Goreng Jawa Spesial',
    subtitle: 'Mie kuning kenyal tumis telur dan bumbu gurih manis',
    category: 'staple',
    primaryIngredients: ['mie'],
    secondaryIngredients: ['telur', 'kol', 'sawi', 'kecap manis'],
    allIngredients: [
      { name: 'Mie', amount: '200 gram (rebus & tiriskan)', isPrimary: true },
      { name: 'Telur', amount: '2 butir', isPrimary: false },
      { name: 'Kol', amount: '50 gram (iris tipis)', isPrimary: false },
      { name: 'Sawi', amount: '1 ikat kecil (potong)', isPrimary: false },
      { name: 'Bawang putih', amount: '3 siung (cincang)', isPantryStaple: true },
      { name: 'Bawang merah', amount: '4 siung (iris)', isPantryStaple: true },
      { name: 'Kecap manis', amount: '3 sdm', isPantryStaple: true },
      { name: 'Garam', amount: '1/2 sdt', isPantryStaple: true },
      { name: 'Merica', amount: '1/4 sdt', isPantryStaple: true },
      { name: 'Minyak', amount: '2 sdm', isPantryStaple: true },
    ],
    steps: [
      'Lumuri mie yang sudah direbus tiris dengan 1 sdm kecap manis dan 1/2 sdm minyak agar tidak lengket.',
      'Panaskan minyak di wajan, tumis bawang putih dan bawang merah hingga harum.',
      'Masukkan telur, orak-arik hingga matang.',
      'Masukkan irisan kol dan sawi, aduk selama 1 menit hingga sayur setengah layu.',
      'Masukkan mie, tambahkan sisa 2 sdm kecap manis, 1/2 sdt garam, dan 1/4 sdt merica.',
      'Aduk rata dengan api besar sampai mie matang merata dan bumbu terkaramelisasi gurih.',
      'Angkat dan sajikan hangat.',
    ],
    servings: 2,
    prepTime: '8 min',
    cookTime: '10 min',
    difficulty: 'Easy',
    healthTag: 'Mengenyangkan & Praktis',
  },
  {
    id: 'canon-perkedel-kentang',
    title: 'Perkedel Kentang Lembut',
    subtitle: 'Kentang goreng tumbuk berbumbu dibalut telur renyah',
    category: 'staple',
    primaryIngredients: ['kentang'],
    secondaryIngredients: ['telur', 'bawang merah', 'bawang putih'],
    allIngredients: [
      { name: 'Kentang', amount: '500 gram (kupas & potong)', isPrimary: true },
      { name: 'Telur', amount: '1 butir (kocok lepas)', isPrimary: false },
      { name: 'Bawang merah', amount: '4 siung (iris & goreng)', isPantryStaple: true },
      { name: 'Bawang putih', amount: '2 siung (haluskan)', isPantryStaple: true },
      { name: 'Daun seledri', amount: '1 batang (cincang halus)', isPantryStaple: true },
      { name: 'Garam', amount: '1/2 sdt', isPantryStaple: true },
      { name: 'Merica', amount: '1/4 sdt', isPantryStaple: true },
      { name: 'Minyak goreng', amount: '250 ml', isPantryStaple: true },
    ],
    steps: [
      'Goreng potongan kentang dalam minyak panas hingga matang empuk. Angkat dan segera haluskan selagi masih panas.',
      'Campurkan kentang halus dengan bawang merah goreng, bawang putih halus, seledri cincang, 1/2 sdt garam, dan 1/4 sdt merica. Aduk sampai kalis.',
      'Bentuk adonan menjadi bulatan pipih padat.',
      'Celupkan bulatan perkedel ke dalam kocokan telur hingga terlumuri rata.',
      'Goreng dalam minyak panas dengan api sedang hingga berwarna kuning keemasan di kedua sisi.',
      'Tiriskan dan sajikan hangat.',
    ],
    servings: 3,
    prepTime: '15 min',
    cookTime: '15 min',
    difficulty: 'Easy',
    healthTag: 'Tekstur Lembut Padat',
  },
];

/**
 * Calculates a reliable culinary match score between a candidate recipe and active inventory.
 * Rules:
 * - Checks whether primary core ingredient(s) are present in user's inventory.
 * - Compares how many ingredients are in stock vs how many need purchase.
 * - Returns a number 0 - 100%.
 */
export const calculateRecipeMatchScore = (
  recipe: Recipe,
  inventory: Ingredient[],
): {
  matchScore: number;
  availableCount: number;
  neededCount: number;
  matchedIngredients: RecipeIngredient[];
  missingIngredients: RecipeIngredient[];
} => {
  const summary = getRecipeMatchSummary(recipe, inventory);
  return {
    matchScore: summary.matchScorePercent,
    availableCount: summary.availableCount,
    neededCount: summary.neededCount,
    matchedIngredients: summary.availableIngredients.map((match) => match.ingredient),
    missingIngredients: summary.missingIngredients.map((match) => match.ingredient),
  };
};

/**
 * Instantiates a concrete Recipe object from a template tailored to the user's active inventory.
 */
export const instantiateRecipeFromTemplate = (
  template: SmartRecipeTemplate,
  inventory: Ingredient[],
): Recipe => {
  const activeItems = inventory.filter(isActiveIngredient);

  const evaluatedIngredients: RecipeIngredient[] = template.allIngredients.map((item) => {
    const normalizedName = normalizeIngredientText(item.name);
    const isSeasoning = [
      'garam', 'salt', 'gula', 'sugar', 'merica', 'lada', 'pepper', 'minyak',
      'oil', 'air', 'water', 'kecap', 'sauce', 'kaldu', 'broth', 'es batu', 'ice',
    ].some((term) => normalizedName.includes(term));
    const role = item.isOptional
      ? 'optional'
      : item.isPrimary
        ? 'main'
        : isSeasoning
          ? 'seasoning'
          : 'supporting';

    return {
      name: item.name,
      amount: item.amount,
      inStock: false,
      role,
      required: !item.isOptional,
      source: 'needs_purchase',
    };
  });

  const recipe: Recipe = {
    id: template.id,
    title: template.title,
    subtitle: template.subtitle,
    image: getRecipeImage(template.title, template.category),
    cookTime: template.cookTime,
    prepTime: template.prepTime,
    difficulty: template.difficulty,
    costLevel: 'Low cost',
    healthTag: template.healthTag,
    servings: template.servings,
    calories: 220,
    expiringIngredientsCount: evaluatedIngredients.filter((i) => i.urgent).length,
    highlight: `Resep ini fokus menggunakan bahan yang tersedia secara masuk akal tanpa memaksakan kombinasi yang tidak lazim.`,
    whyReplatePicked: `Dipilih karena cocok dengan bahan yang kamu punya dan menjaga kualitas rasa serta karakteristik bahan.`,
    ingredients: evaluatedIngredients,
    steps: template.steps,
    matchedIngredientIds: [],
  };

  const validation = validateRecipeFeasibility(recipe);
  recipe.recipeQualityScore = validation.qualityScore;

  return applyInventoryMatch(recipe, activeItems);
};

const applyInventoryMatch = (recipe: Recipe, inventory: Ingredient[]): Recipe => {
  const summary = getRecipeMatchSummary(recipe, inventory);
  const allMatches = [...summary.availableIngredients, ...summary.missingIngredients];
  recipe.ingredients = recipe.ingredients.map((ingredient) => {
    const match = allMatches.find((entry) =>
      entry.ingredient.name === ingredient.name && entry.ingredient.amount === ingredient.amount,
    );
    if (!match) return ingredient;
    const available = match.status === 'available';
    return {
      ...match.ingredient,
      inStock: available,
      source: available ? 'inventory' : 'needs_purchase',
      urgent: available && match.inventoryItem
        ? match.inventoryItem.daysLeft <= 3 || match.inventoryItem.useFirstScore >= 65
        : false,
    };
  });
  recipe.matchedIngredientIds = [...new Set(summary.availableIngredients
    .map((match) => match.inventoryItem?.id)
    .filter((id): id is string => Boolean(id)))];
  recipe.consumeAmounts = getRecipeRemainingQuantities(recipe, inventory);
  return recipe;
};

/**
 * Dynamically synthesizes a realistic recipe for an uncatalogued primary ingredient.
 * Follows strict culinary category rules:
 * - Fruit: Juices, smoothies, fresh iced drinks, or desserts (NEVER savory soups or stir-fries)
 * - Vegetables: Stir-fry, clear soup, or vegetable soup with garlic & shallot
 * - Goat / Lamb: Gulai, tongseng, or satay with spices & coconut milk
 * - Chicken: Fried, sweet soy braised, soup, or stir-fry
 * - Beef: Stewed, soup, or stir-fry
 * - Seafood: Fried, grilled, or balado
 * - Egg: Balado, sweet soy, or omelet
 * - Staple: Fried rice/noodles, or boiled/fried potato
 */
export const synthesizeRecipeForIngredient = (
  primaryIngredient: Ingredient,
  inventory: Ingredient[],
): Recipe => {
  const classification = classifyIngredient(primaryIngredient.name);
  const activeItems = inventory.filter(isActiveIngredient);

  const name = primaryIngredient.name;

  let title = '';
  let subtitle = '';
  let steps: string[] = [];
  const ingredientsList: Array<{ name: string; amount: string }> = [];

  if (classification.category === 'fruit') {
    // Fruit must be a drink / dessert / fresh preparation
    title = `Es ${name} Segar`;
    subtitle = 'Olahan buah segar dingin yang manis dan menyegarkan';
    ingredientsList.push(
      { name: `${name}`, amount: '2 buah (potong dadu)' },
      { name: 'Gula pasir', amount: '2 sdm' },
      { name: 'Es batu', amount: '1 gelas (150 g)' },
      { name: 'Air', amount: '250 ml' },
      { name: 'Jeruk nipis', amount: '1/2 buah' },
    );
    steps = [
      `Kupas ${name}, bersihkan, dan potong daging buah menjadi potongan dadu sedang.`,
      'Larutkan 2 sdm gula pasir dalam 100 ml air hangat sampai larut sempurna.',
      `Campurkan potongan ${name} dan air gula ke dalam wadah atau gelas saji.`,
      'Beri sedikit perasan jeruk nipis untuk menyeimbangkan rasa manis dan memberi aroma segar.',
      'Tambahkan es batu dan sisa air dingin 150 ml, aduk perlahan, lalu sajikan dingin.',
    ];
  } else if (classification.category === 'meat') {
    if (classification.meatSubType === 'goat') {
      title = `Gulai ${name}`;
      subtitle = 'Kambing empuk kuah santan kaya rempah';
      ingredientsList.push(
        { name: `${name}`, amount: '500 gram (potong sedang)' },
        { name: 'Bawang merah', amount: '8 siung' },
        { name: 'Bawang putih', amount: '4 siung' },
        { name: 'Cabai merah', amount: '5 buah' },
        { name: 'Santan', amount: '500 ml' },
        { name: 'Serai', amount: '1 batang' },
        { name: 'Daun salam', amount: '2 lembar' },
        { name: 'Lengkuas', amount: '2 cm' },
        { name: 'Kunyit', amount: '2 cm' },
        { name: 'Garam', amount: '1 sdt' },
        { name: 'Gula', amount: '1/2 sdt' },
        { name: 'Minyak', amount: '2 sdm' },
        { name: 'Air', amount: '300 ml' },
      );
      steps = [
        'Haluskan bawang merah, bawang putih, cabai merah, dan kunyit.',
        'Panaskan minyak, tumis bumbu halus bersama serai, daun salam, dan lengkuas sampai harum semerbak.',
        `Masukkan potongan ${name}, aduk rata selama 5 menit sampai daging berubah warna.`,
        'Tuangkan air dan santan perlahan, tambahkan 1 sdt garam dan 1/2 sdt gula.',
        'Masak dengan api sedang-kecil sambil sesekali diaduk agar santan tidak pecah, hingga daging empuk sempurna.',
        'Sajikan hangat dengan taburan bawang goreng.',
      ];
    } else {
      title = `Ayam Kecap Bawang Gurih`;
      subtitle = 'Ayam empuk kuah kecap bumbu bawang gurih';
      ingredientsList.push(
        { name: `${name}`, amount: '500 gram' },
        { name: 'Bawang merah', amount: '6 siung' },
        { name: 'Bawang putih', amount: '4 siung' },
        { name: 'Cabai merah', amount: '3 buah' },
        { name: 'Kecap manis', amount: '4 sdm' },
        { name: 'Garam', amount: '1 sdt' },
        { name: 'Gula', amount: '1/2 sdt' },
        { name: 'Merica', amount: '1/4 sdt' },
        { name: 'Minyak', amount: '2 sdm' },
        { name: 'Air', amount: '250 ml' },
      );
      steps = [
        `Cuci bersih ${name}, lumuri dengan sedikit garam.`,
        'Panaskan minyak di wajan, tumis bawang merah dan bawang putih sampai harum.',
        `Masukkan ${name}, masak sampai berubah warna di kedua sisinya.`,
        'Tambahkan kecap manis, 1 sdt garam, 1/2 sdt gula, dan 1/4 sdt merica.',
        'Tuang air, tutup wajan, masak selama 15-20 menit hingga daging empuk dan kuah mengental meresap.',
        'Sajikan hangat.',
      ];
    }
  } else if (classification.category === 'egg') {
    title = 'Telur Balado Pedas Manis';
    subtitle = 'Telur berbalut sambal balado merah harum';
    ingredientsList.push(
      { name: 'Telur', amount: '4 butir' },
      { name: 'Cabai merah', amount: '8 buah' },
      { name: 'Bawang merah', amount: '6 siung' },
      { name: 'Bawang putih', amount: '3 siung' },
      { name: 'Tomat', amount: '1 buah' },
      { name: 'Garam', amount: '1 sdt' },
      { name: 'Gula', amount: '1 sdt' },
      { name: 'Minyak', amount: '3 sdm' },
    );
    steps = [
      'Rebus telur hingga matang, kupas kulitnya, lalu goreng sebentar di minyak panas sampai berkulit tipis.',
      'Haluskan cabai merah, bawang merah, bawang putih, dan tomat.',
      'Tumis sambal balado dengan 3 sdm minyak sampai harum dan berminyak.',
      'Bumbui dengan 1 sdt garam dan 1 sdt gula pasir.',
      'Masukkan telur goreng, aduk perlahan sampai terbalur rata oleh sambal balado.',
      'Angkat dan sajikan.',
    ];
  } else if (classification.category === 'seafood') {
    title = `Ikan Goreng Sambal Balado`;
    subtitle = 'Ikan gurih krispi disiram sambal balado segar';
    ingredientsList.push(
      { name: `${name}`, amount: '500 gram' },
      { name: 'Cabai merah', amount: '6 buah' },
      { name: 'Bawang merah', amount: '5 siung' },
      { name: 'Bawang putih', amount: '3 siung' },
      { name: 'Jeruk nipis', amount: '1 buah' },
      { name: 'Garam', amount: '1 sdt' },
      { name: 'Gula', amount: '1/2 sdt' },
      { name: 'Minyak goreng', amount: '200 ml' },
    );
    steps = [
      `Bersihkan ${name}, lumuri dengan perasan jeruk nipis dan 1/2 sdt garam, diamkan 10 menit.`,
      'Goreng ikan dalam minyak panas sampai matang keemasan dan renyah di luar. Angkat dan tiriskan.',
      'Tumis bumbu halus (cabai merah, bawang merah, bawang putih) dengan 2 sdm minyak.',
      'Bumbui sambal dengan 1/2 sdt garam dan 1/2 sdt gula.',
      'Siramkan sambal di atas ikan goreng renyah dan sajikan segera.',
    ];
  } else if (classification.category === 'staple') {
    title = `Nasi Goreng Telur Spesial`;
    subtitle = 'Nasi goreng harum kecap dan bumbu bawang';
    ingredientsList.push(
      { name: 'Nasi', amount: '400 gram' },
      { name: 'Telur', amount: '2 butir' },
      { name: 'Bawang merah', amount: '4 siung' },
      { name: 'Bawang putih', amount: '3 siung' },
      { name: 'Kecap manis', amount: '2 sdm' },
      { name: 'Garam', amount: '1/2 sdt' },
      { name: 'Kaldu bubuk', amount: '1/2 sdt' },
      { name: 'Minyak', amount: '2 sdm' },
    );
    steps = [
      'Panaskan 2 sdm minyak di wajan, tumis bawang merah dan bawang putih cincang hingga harum.',
      'Orak-arik telur di tengah wajan hingga matang berbutir.',
      'Masukkan nasi, bumbui dengan kecap manis, garam 1/2 sdt, dan kaldu bubuk 1/2 sdt.',
      'Aduk cepat dengan api besar hingga nasi tercampur rata dan harum.',
      'Angkat dan sajikan hangat.',
    ];
  } else {
    // Vegetable
    title = `Tumis ${name} Bawang Putih`;
    subtitle = 'Sayuran segar renyah ditumis bawang harum';
    ingredientsList.push(
      { name: `${name}`, amount: '250 gram' },
      { name: 'Bawang putih', amount: '4 siung (cincang)' },
      { name: 'Bawang merah', amount: '4 siung (iris)' },
      { name: 'Cabai merah', amount: '2 buah (iris serong)' },
      { name: 'Garam', amount: '1/2 sdt' },
      { name: 'Gula', amount: '1/4 sdt' },
      { name: 'Minyak', amount: '2 sdm' },
      { name: 'Air', amount: '50 ml' },
    );
    steps = [
      `Cuci bersih ${name} dan potong sesuai selera.`,
      'Panaskan 2 sdm minyak di wajan dengan api sedang-tinggi.',
      'Tumis bawang merah, bawang putih, dan cabai merah sampai harum semerbak.',
      `Masukkan ${name}, aduk cepat agar tetap segar dan renyah.`,
      'Bumbui dengan 1/2 sdt garam, 1/4 sdt gula, dan tuang 50 ml air.',
      'Masak selama 2-3 menit sampai sayur matang pas dan warna tetap cerah.',
      'Angkat dan sajikan hangat.',
    ];
  }

  const recipeIngredients: RecipeIngredient[] = ingredientsList.map((item, index) => {
    const normalizedName = normalizeIngredientText(item.name);
    const isSeasoning = [
      'garam', 'salt', 'gula', 'sugar', 'merica', 'lada', 'pepper', 'minyak',
      'oil', 'air', 'water', 'kecap', 'sauce', 'kaldu', 'broth', 'es batu', 'ice',
    ].some((term) => normalizedName.includes(term));
    return {
      name: item.name,
      amount: item.amount,
      inStock: false,
      role: areIngredientsMatching(item.name, primaryIngredient.name)
        ? 'main'
        : isSeasoning
          ? 'seasoning'
          : index === 0
            ? 'main'
            : 'supporting',
      required: true,
      source: 'needs_purchase',
    };
  });

  const recipeIdSlug = normalizeIngredientText(title).replace(/\s+/g, '-');
  const recipe: Recipe = {
    id: `dyn-${primaryIngredient.id}-${recipeIdSlug}`,
    title,
    subtitle,
    image: getRecipeImage(title, classification.category),
    cookTime: '15 min',
    prepTime: '5 min',
    difficulty: 'Easy',
    costLevel: 'Low cost',
    healthTag: 'Bahan Segar Alami',
    servings: 2,
    calories: 180,
    expiringIngredientsCount: 1,
    highlight: `Resep ini dibuat khusus mengikuti karakteristik alami ${name} tanpa memaksa kombinasi yang tidak lazim.`,
    whyReplatePicked: `Menyesuaikan kategori ${classification.category} agar hidangan masuk akal secara kuliner.`,
    ingredients: recipeIngredients,
    steps,
    matchedIngredientIds: [],
  };

  const validation = validateRecipeFeasibility(recipe);
  recipe.recipeQualityScore = validation.qualityScore;

  return applyInventoryMatch(recipe, activeItems);
};

export const getSmartRecipeById = (
  recipeId: string,
  inventory: Ingredient[],
): Recipe | undefined => {
  const activeItems = inventory.filter(isActiveIngredient);
  const generated = generateSmartRecipesForInventory(activeItems);
  const generatedMatch = generated.find((recipe) => recipe.id === recipeId);
  if (generatedMatch) return generatedMatch;

  const dynamicIngredient = [...activeItems]
    .sort((first, second) => second.id.length - first.id.length)
    .find((item) => recipeId.startsWith(`dyn-${item.id}-`));
  if (!dynamicIngredient) return undefined;

  const dynamicRecipe = synthesizeRecipeForIngredient(dynamicIngredient, activeItems);
  if (!validateRecipeFeasibility(dynamicRecipe).isValid) return undefined;
  if (dynamicRecipe.id === recipeId) return dynamicRecipe;

  // Recover dynamic IDs created before they became deterministic.
  return { ...dynamicRecipe, id: recipeId };
};

/**
 * Main Smart Recipe Generator function:
 * Takes the user's active inventory and optional focus ingredient,
 * and produces culinary-sound, ranked candidate recipes.
 */
export const generateSmartRecipesForInventory = (
  inventory: Ingredient[],
  focusIngredientName?: string | null,
): Recipe[] => {
  const activeItems = inventory.filter(isActiveIngredient);
  if (activeItems.length === 0) return [];

  // Filter or prioritize focus ingredient if specified
  const focusItem = focusIngredientName
    ? activeItems.find((item) => areIngredientsMatching(item.name, focusIngredientName))
    : null;

  // 1. Evaluate all canonical templates
  const candidates: Array<{ recipe: Recipe; matchScore: number; primaryMatch: boolean }> = [];

  for (const template of CANONICAL_RECIPE_TEMPLATES) {
    const instantiated = instantiateRecipeFromTemplate(template, activeItems);
    const scoreData = calculateRecipeMatchScore(instantiated, activeItems);

    // Validate culinary feasibility to eliminate absurd combinations
    const validation = validateRecipeFeasibility(instantiated);
    if (!validation.isValid) continue;

    // Check if recipe matches focus ingredient
    if (focusItem) {
      const usesFocus = instantiated.ingredients.some((ing) =>
        areIngredientsMatching(ing.name, focusItem.name),
      );
      if (!usesFocus) continue;
    }

    // Has at least one meaningful active ingredient
    const hasMeaningfulAvailable = instantiated.ingredients.some(
      (ing) =>
        ing.inStock &&
        !['garam', 'gula pasir', 'minyak goreng', 'air', 'es batu'].includes(
          normalizeIngredientText(ing.name),
        ),
    );

    const hasPrimaryIngredient = instantiated.ingredients.some((ingredient) =>
      ingredient.role === 'main' && ingredient.inStock,
    );

    if (hasMeaningfulAvailable && hasPrimaryIngredient) {
      candidates.push({
        recipe: instantiated,
        matchScore: scoreData.matchScore,
        primaryMatch: true,
      });
    }
  }

  // 2. If focus ingredient was requested but not enough canonical recipes exist, synthesize one
  if (focusItem && candidates.length === 0) {
    const synthesized = synthesizeRecipeForIngredient(focusItem, activeItems);
    const scoreData = calculateRecipeMatchScore(synthesized, activeItems);
    if (synthesized.ingredients.some((ingredient) => ingredient.role === 'main' && ingredient.inStock)) {
      candidates.push({
        recipe: synthesized,
        matchScore: scoreData.matchScore,
        primaryMatch: true,
      });
    }
  }

  // 3. For any primary inventory item with high use-first score that has no recipe yet, synthesize if needed
  if (!focusItem && candidates.length < 2) {
    for (const item of activeItems.slice(0, 3)) {
      const alreadyHasRecipe = candidates.some((c) =>
        c.recipe.ingredients.some((ing) => areIngredientsMatching(ing.name, item.name)),
      );
      if (!alreadyHasRecipe) {
        const synthesized = synthesizeRecipeForIngredient(item, activeItems);
        const scoreData = calculateRecipeMatchScore(synthesized, activeItems);
        const val = validateRecipeFeasibility(synthesized);
        if (val.isValid && synthesized.ingredients.some((ingredient) => ingredient.role === 'main' && ingredient.inStock)) {
          candidates.push({
            recipe: synthesized,
            matchScore: scoreData.matchScore,
            primaryMatch: true,
          });
        }
      }
    }
  }

  // 4. Sort candidates:
  // Primary match first, then matchScore descending, then recipeQualityScore
  candidates.sort((a, b) => {
    if (a.primaryMatch !== b.primaryMatch) {
      return a.primaryMatch ? -1 : 1;
    }
    return b.matchScore - a.matchScore || (b.recipe.recipeQualityScore ?? 0) - (a.recipe.recipeQualityScore ?? 0);
  });

  return candidates.map((c) => c.recipe);
};
