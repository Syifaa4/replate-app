export const GEMINI_VISION_MODEL = 'gemini-2.5-flash';

export function getEnvironmentGeminiApiKey(): string | null {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  return apiKey && apiKey.length > 5 ? apiKey : null;
}
