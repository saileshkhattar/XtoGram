export const env = {
  apiUrl: process.env.EXPO_PUBLIC_BACKEND_BASE_URL,
} as const;

if (!env.apiUrl) {
  throw new Error("Missing EXPO_PUBLIC_BACKEND_BASE_URL");
}