/**
 * REPLATE Food Recognition Service
 *
 * Sends an image to the Google Gemini Vision API and returns structured food ingredients
 * identified in the image.
 *
 * Responsibility: ONLY image understanding — "What food is visible in this image?"
 * USE FIRST scoring, freshness, and inventory decisions are handled separately by
 * the REPLATE AI Decision Engine (src/utils/aiEngine.ts).
 *
 * Supports bilingual recognition (English and Bahasa Indonesia).
 */

import { GEMINI_VISION_MODEL, getEnvironmentGeminiApiKey } from '../config/env';

export interface RecognizedFoodItem {
  name: string;
  confidence: number; // 0.0 to 1.0 (e.g. 0.94)
  quantityEstimate: string; // e.g. "1 whole fish", "3 pieces", "handful"
  category: 'Vegetables' | 'Protein' | 'Dairy' | 'Fruits' | 'Others';
  emoji?: string;
  suggestedDaysLeft?: number;
  canonicalId?: string; // Normalized ID to keep inventory logic language-independent
}

export interface FoodRecognitionResult {
  items: RecognizedFoodItem[];
  rawResponse?: string;
}

export type RecognitionError =
  | { type: 'no_food_detected'; message: string }
  | { type: 'api_error'; message: string; statusCode?: number }
  | { type: 'no_api_key'; message: string }
  | { type: 'image_input_error'; message: string }
  | { type: 'parse_error'; message: string; rawResponse?: string };

export interface RecognitionImageMetadata {
  fileName?: string;
  fileType?: string;
  fileSize?: number;
}

interface PreparedImage {
  data: string;
  mimeType: string;
  byteLength: number;
  width: number | null;
  height: number | null;
  sha256: string | null;
}

const SUPPORTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

function detectImageMimeType(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp';
  }
  if (
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70
  ) {
    const brand = String.fromCharCode(...bytes.slice(8, 12));
    if (brand === 'heic' || brand === 'heix' || brand === 'hevc' || brand === 'hevx') {
      return 'image/heic';
    }
    if (brand === 'mif1' || brand === 'msf1') return 'image/heif';
  }
  return null;
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

async function prepareImage(
  imageData: string,
  metadata?: RecognitionImageMetadata
): Promise<PreparedImage> {
  let blob: Blob;
  let declaredMimeType = metadata?.fileType || '';

  if (imageData.startsWith('data:')) {
    const match = imageData.match(/^data:([^;,]*);base64,([A-Za-z0-9+/=\r\n]+)$/);
    if (!match) throw new Error('The selected image is not a valid base64 data URL.');
    declaredMimeType = declaredMimeType || match[1];
    const binary = atob(match[2].replace(/\s/g, ''));
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    blob = new Blob([bytes], { type: declaredMimeType });
  } else if (/^https?:\/\//i.test(imageData)) {
    const response = await fetch(imageData);
    if (!response.ok) {
      throw new Error(`Image source request failed with status ${response.status}.`);
    }
    blob = await response.blob();
    declaredMimeType = declaredMimeType || blob.type;
  } else {
    const binary = atob(imageData.replace(/\s/g, ''));
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    blob = new Blob([bytes], { type: declaredMimeType });
  }

  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (bytes.length === 0) throw new Error('The selected image is empty.');

  const detectedMimeType = detectImageMimeType(bytes);
  const normalizedDeclaredType = declaredMimeType.toLowerCase() === 'image/jpg'
    ? 'image/jpeg'
    : declaredMimeType.toLowerCase();
  const mimeType = detectedMimeType || normalizedDeclaredType;
  if (!SUPPORTED_IMAGE_TYPES.has(mimeType)) {
    throw new Error(`Unsupported image MIME type: ${normalizedDeclaredType || 'unknown'}.`);
  }

  let width: number | null = null;
  let height: number | null = null;
  try {
    const bitmap = await createImageBitmap(new Blob([bytes], { type: mimeType }));
    width = bitmap.width;
    height = bitmap.height;
    bitmap.close();
  } catch (err) {
    // Keep original image bytes untouched; Gemini also accepts HEIC/HEIF that some browsers cannot decode.
    if (import.meta.env.DEV) {
      console.warn('[Gemini Vision] Browser could not read image dimensions', err);
    }
  }

  let sha256: string | null = null;
  try {
    if (globalThis.crypto?.subtle) {
      const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
      sha256 = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
    }
  } catch (err) {
    // Image recognition does not depend on development-only payload fingerprinting.
    if (import.meta.env.DEV) {
      console.warn('[Gemini Vision] Could not fingerprint the image payload', err);
    }
  }

  return {
    data: toBase64(bytes),
    mimeType,
    byteLength: bytes.length,
    width,
    height,
    sha256,
  };
}

// ---------------------------------------------------------------------------
// Prompts for Gemini Vision API with Bilingual instructions
// ---------------------------------------------------------------------------

function getFoodSystemPrompt(language: 'en' | 'id'): string {
  const exampleName = language === 'id' ? 'Ikan' : 'Fish';
  const exampleQuantity = language === 'id' ? '1 ekor ikan' : '1 whole fish';
  const langInstruction =
    language === 'id'
      ? `LANGUAGE REQUIREMENT: Respond in natural Indonesian (Bahasa Indonesia). Use Indonesian for every user-facing text value, including ingredient names and quantity estimates (e.g., "Ikan", "Dada Ayam", "Bayam", "Tomat", "Telur", "Susu Segar", "Wortel", "Nasi Putih", "1 ekor ikan", "2 butir"). Keep category values in the required schema language.`
      : `LANGUAGE REQUIREMENT: Respond in English (e.g., "Fish", "Chicken Breast", "Spinach", "Tomato", "Egg", "Fresh Milk", "Carrot", "Cooked Rice").`;

  return `You are REPLATE's food recognition engine.

Analyze the provided image carefully.

Identify ONLY food ingredients that are visibly present in the image.

STRICT RULES:
- Identify only food ingredients that are genuinely visible and reasonably identifiable.
- Do NOT invent ingredients.
- Do NOT hallucinate pantry staples (e.g., if there is only fish, do NOT return spinach, tomato, or milk).
- If the image contains a whole fish, identify it as "Fish" (or "Ikan" in Indonesian).
- If something cannot be identified with high confidence, use a broader category rather than guessing.
- If the image contains a non-food item, a blurry photo, an empty fridge, or an unrelated object, return an empty items list: {"items": []}.
- ${langInstruction}
- Return JSON strictly adhering to this schema:
{
  "items": [
    {
      "name": "${exampleName}",
      "confidence": 0.94,
      "quantityEstimate": "${exampleQuantity}",
      "category": "Protein",
      "emoji": "🐟"
    }
  ]
}

Categories must be one of: "Vegetables", "Protein", "Dairy", "Fruits", "Others".
Confidence must be a decimal between 0.0 and 1.0.`;
}

function getReceiptSystemPrompt(language: 'en' | 'id'): string {
  const exampleName = language === 'id' ? 'Susu Segar' : 'Fresh Milk';
  const exampleQuantity = language === 'id' ? '1 botol (1 L)' : '1 bottle (1L)';
  const langInstruction =
    language === 'id'
      ? 'LANGUAGE REQUIREMENT: Respond in natural Indonesian (Bahasa Indonesia) for ingredient names and quantity estimates. Keep category values in the required schema language.'
      : 'LANGUAGE REQUIREMENT: Respond in English for item names.';

  return `You are REPLATE's grocery receipt recognition engine.

Analyze the receipt image carefully.
Extract ONLY purchased grocery food ingredients from the receipt lines.
Ignore non-food items (paper towels, shampoo, plastic bags, taxes, subtotal).

STRICT RULES:
- Extract item name and approximate quantity from the receipt.
- ${langInstruction}
- Return JSON strictly adhering to this schema:
{
  "items": [
    {
      "name": "${exampleName}",
      "confidence": 0.95,
      "quantityEstimate": "${exampleQuantity}",
      "category": "Dairy",
      "emoji": "🥛"
    }
  ]
}

Categories must be one of: "Vegetables", "Protein", "Dairy", "Fruits", "Others".
Confidence must be a decimal between 0.0 and 1.0.
If the image is not a readable receipt or contains no food items, return {"items": []}.`;
}

/**
 * The API key is intentionally sourced only from Vite configuration so browser
 * storage cannot select a different key in Chrome and the embedded preview.
 */
export function getGeminiApiKey(): string | null {
  return getEnvironmentGeminiApiKey();
}

/**
 * Predefined realistic test sample items for rapid evaluation of the 6 core prompt test cases
 */
export interface DemoTestPreset {
  id: string;
  label: string;
  tag: string;
  imageUrl: string;
  expectedDescription: string;
}

export function getDemoTestPresets(language: 'en' | 'id' = 'id'): DemoTestPreset[] {
  const isId = language === 'id';

  return [
    {
      id: 'test-fish',
      label: isId ? 'Uji 1: Ikan Utuh Segar' : 'Test 1: Whole Fish',
      tag: 'Protein',
      imageUrl: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&w=800&q=80',
      expectedDescription: isId
        ? 'Target: Hanya "Ikan" (Keyakinan 94%) — Tanpa halusinasi sayuran'
        : 'Expected: Only "Fish" (94% conf) — No hallucinated vegetables',
    },
    {
      id: 'test-tomato',
      label: isId ? 'Uji 2: Tomat Segar' : 'Test 2: Fresh Tomatoes',
      tag: isId ? 'Sayuran' : 'Vegetables',
      imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
      expectedDescription: isId
        ? 'Target: "Tomat" (Keyakinan 96%, ~4 butir)'
        : 'Expected: "Tomato" (96% conf, ~4 pcs)',
    },
    {
      id: 'test-chicken',
      label: isId ? 'Uji 3: Dada Ayam Fillet' : 'Test 3: Chicken Breast',
      tag: 'Protein',
      imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=800&q=80',
      expectedDescription: isId
        ? 'Target: "Dada Ayam" (Keyakinan 92%, ~500g)'
        : 'Expected: "Chicken Breast" (92% conf, ~500g)',
    },
    {
      id: 'test-spinach',
      label: isId ? 'Uji 4: Bayam Segar' : 'Test 4: Fresh Spinach',
      tag: isId ? 'Sayuran' : 'Vegetables',
      imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80',
      expectedDescription: isId
        ? 'Target: "Bayam" (Keyakinan 95%, 1 ikat)'
        : 'Expected: "Spinach" (95% conf, 1 bunch)',
    },
    {
      id: 'test-combo-plate',
      label: isId ? 'Uji 5: Menu Salmon + Nasi + Sayuran' : 'Test 5: Fish + Rice + Veggies Plate',
      tag: isId ? 'Menu Lengkap' : 'Combo Meal',
      imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
      expectedDescription: isId
        ? 'Target: Fillet Salmon, Nasi Putih, Sayuran Hijau (hanya komponen yang terlihat)'
        : 'Expected: Fish, Rice, Green Vegetables (identifiable components only)',
    },
    {
      id: 'test-non-food',
      label: isId ? 'Uji 6: Benda Non-Makanan (Kunci & Buku)' : 'Test 6: Non-Food Object (Keys & Notebook)',
      tag: isId ? 'Uji Negatif' : 'Negative Test',
      imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
      expectedDescription: isId
        ? 'Target: Tidak ada makanan terdeteksi (Zero halusinasi)'
        : 'Expected: No food detected error state (Zero hallucination)',
    },
  ];
}

export const DEMO_TEST_PRESETS = getDemoTestPresets('id');

/**
 * Main function: Recognize food or receipt in image using Gemini Vision API
 */
export async function recognizeImageWithGemini(
  imageData: string,
  mode: 'fridge' | 'receipt' = 'fridge',
  language: 'en' | 'id' = 'id',
  imageMetadata?: RecognitionImageMetadata
): Promise<{ result?: FoodRecognitionResult; error?: RecognitionError }> {
  const apiKey = getGeminiApiKey();
  const model = GEMINI_VISION_MODEL;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  let image: PreparedImage;
  try {
    image = await prepareImage(imageData, imageMetadata);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to prepare the selected image.';
    if (import.meta.env.DEV) {
      console.error('[Gemini Vision] Image preparation failed', { message });
    }
    return { error: { type: 'image_input_error', message } };
  }

  if (import.meta.env.DEV) {
    const sourceType = imageMetadata?.fileType ||
      (/^https?:\/\//i.test(imageData)
        ? 'remote URL'
        : imageData.startsWith('data:')
          ? 'data URL/camera'
          : 'base64');
    console.info('[Gemini Vision] IMAGE INPUT', {
      fileName: imageMetadata?.fileName ?? null,
      type: sourceType,
      size: imageMetadata?.fileSize ?? image.byteLength,
      dimensions: image.width !== null && image.height !== null
        ? `${image.width} × ${image.height}`
        : 'unavailable',
      encodedType: image.mimeType,
      base64Length: image.data.length,
      sha256: image.sha256,
      sendingImage: image.data.length > 0,
    });
    console.info('[Gemini Vision] GEMINI_API_KEY available:', Boolean(apiKey));
  }

  if (!apiKey) {
    return {
      error: {
        type: 'no_api_key',
        message:
          language === 'id'
            ? 'Kunci API Gemini belum dikonfigurasi. Atur VITE_GEMINI_API_KEY untuk mengaktifkan pemindaian.'
            : 'Gemini API key is not configured. Set VITE_GEMINI_API_KEY to enable food scanning.',
      },
    };
  }

  const systemPrompt =
    mode === 'receipt' ? getReceiptSystemPrompt(language) : getFoodSystemPrompt(language);

  try {
    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: systemPrompt },
            {
              inline_data: {
                mime_type: image.mimeType,
                data: image.data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        response_mime_type: 'application/json',
        temperature: 0,
      },
    };

    if (import.meta.env.DEV) {
      console.info('[Gemini Vision] REQUEST', {
        endpoint,
        model,
        promptMode: mode,
        language,
        imageMimeType: image.mimeType,
        imageBase64Length: image.data.length,
        imageIncluded: image.data.length > 0,
        temperature: 0,
        responseMimeType: 'application/json',
        promptIncluded: systemPrompt.length > 0,
      });
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(45_000),
    });

    if (!response.ok) {
      const errText = await response.text();
      if (import.meta.env.DEV) {
        console.error('[Gemini Vision] RESPONSE', {
          status: response.status,
          ok: response.ok,
          model,
          body: errText,
        });
      }
      return {
        error: {
          type: 'api_error',
          message: `Gemini API returned status ${response.status}: ${errText.slice(0, 150)}`,
          statusCode: response.status,
        },
      };
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || '')
      .join('')
      .trim() || '';
    if (import.meta.env.DEV) {
      console.info('[Gemini Vision] RESPONSE', {
        status: response.status,
        ok: response.ok,
        model,
        finishReason: data?.candidates?.[0]?.finishReason ?? null,
        responseTextLength: candidateText.length,
      });
    }

    if (!candidateText) {
      return {
        error: {
          type: 'no_food_detected',
          message:
            language === 'id'
              ? 'Tidak ada respons yang dihasilkan dari model vision.'
              : 'No response generated from the vision model.',
        },
      };
    }

    try {
      const parsed: unknown = JSON.parse(candidateText);
      if (
        !parsed ||
        typeof parsed !== 'object' ||
        !('items' in parsed) ||
        !Array.isArray(parsed.items)
      ) {
        throw new Error('Gemini response did not contain an items array.');
      }
      const rawItems = parsed.items;

      if (rawItems.length === 0) {
        return {
          error: {
            type: 'no_food_detected',
            message:
              language === 'id'
                ? 'Kami belum dapat mengenali makanan dalam foto ini. Coba ambil foto dengan pencahayaan yang lebih baik.'
                : "We couldn't identify any food in this photo. Try taking a clearer photo with good lighting.",
          },
        };
      }

      // Sanitize items and attach canonical ID
      const cleanedItems: RecognizedFoodItem[] = rawItems.map((value: unknown) => {
        if (!value || typeof value !== 'object') {
          throw new Error('Gemini returned a malformed food item.');
        }
        const item = value as Record<string, unknown>;
        const name = typeof item.name === 'string' ? item.name.trim() : '';
        const confidence = item.confidence;
        const quantityEstimate =
          typeof item.quantityEstimate === 'string' ? item.quantityEstimate.trim() : '';
        const rawCategory = typeof item.category === 'string' ? item.category : '';
        if (
          !name ||
          typeof confidence !== 'number' ||
          !Number.isFinite(confidence) ||
          confidence < 0 ||
          confidence > 1 ||
          !quantityEstimate ||
          !['Vegetables', 'Protein', 'Dairy', 'Fruits', 'Others'].includes(rawCategory)
        ) {
          throw new Error('Gemini returned incomplete food recognition data.');
        }
        const cat = rawCategory as RecognizedFoodItem['category'];
        const emoji = typeof item.emoji === 'string' ? item.emoji : guessEmoji(name, cat);
        const canonical = getCanonicalId(name);

        return {
          name,
          confidence,
          quantityEstimate,
          category: cat,
          emoji,
          canonicalId: canonical,
        };
      });

      return {
        result: {
          items: cleanedItems,
          rawResponse: candidateText,
        },
      };
    } catch (err) {
      return {
        error: {
          type: 'parse_error',
          message: err instanceof Error
            ? `${language === 'id' ? 'Respons Gemini tidak valid' : 'Gemini returned invalid data'}: ${err.message}`
            :
            language === 'id'
              ? 'Gagal mengurai respons AI ke format data makanan yang terstruktur.'
              : 'Failed to parse AI vision response into structured food data.',
          rawResponse: candidateText,
        },
      };
    }
  } catch (err) {
    const timedOut = err instanceof DOMException && err.name === 'TimeoutError';
    const message = timedOut
      ? 'Gemini request timed out after 45 seconds.'
      : err instanceof Error
        ? err.message
        : 'Unknown network error.';
    if (import.meta.env.DEV) {
      console.error('[Gemini Vision] Request failed', { model, message });
    }
    return {
      error: {
        type: 'api_error',
        message: `Network error while contacting Google Gemini API: ${message}`,
      },
    };
  }
}

function getCanonicalId(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('fish') || n.includes('ikan') || n.includes('salmon')) return 'fish';
  if (n.includes('chicken breast') || n.includes('dada ayam')) return 'chicken_breast';
  if (n.includes('chicken') || n.includes('ayam')) return 'chicken';
  if (n.includes('spinach') || n.includes('bayam')) return 'spinach';
  if (n.includes('tomato') || n.includes('tomat')) return 'tomato';
  if (n.includes('egg') || n.includes('telur')) return 'egg';
  if (n.includes('milk') || n.includes('susu')) return 'milk';
  if (n.includes('carrot') || n.includes('wortel')) return 'carrot';
  if (n.includes('garlic') || n.includes('bawang')) return 'garlic';
  if (n.includes('rice') || n.includes('nasi')) return 'rice';
  return n.replace(/\s+/g, '_');
}

function guessEmoji(name: string, category: string): string {
  const n = name.toLowerCase();
  if (n.includes('fish') || n.includes('salmon') || n.includes('ikan')) return '🐟';
  if (n.includes('chicken') || n.includes('ayam') || n.includes('poultry')) return '🍗';
  if (n.includes('spinach') || n.includes('bayam')) return '🥬';
  if (n.includes('tomato') || n.includes('tomat')) return '🍅';
  if (n.includes('egg') || n.includes('telur')) return '🥚';
  if (n.includes('milk') || n.includes('susu')) return '🥛';
  if (n.includes('carrot') || n.includes('wortel')) return '🥕';
  if (n.includes('rice') || n.includes('nasi')) return '🍚';
  if (n.includes('garlic') || n.includes('bawang')) return '🧄';
  if (n.includes('beef') || n.includes('daging') || n.includes('sapi')) return '🥩';
  if (n.includes('cheese') || n.includes('keju')) return '🧀';
  if (n.includes('bread') || n.includes('roti')) return '🍞';
  if (category === 'Vegetables') return '🥗';
  if (category === 'Protein') return '🍖';
  if (category === 'Dairy') return '🥛';
  if (category === 'Fruits') return '🍎';
  return '🍽️';
}
