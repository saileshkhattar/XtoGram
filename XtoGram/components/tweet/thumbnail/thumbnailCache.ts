import * as FileSystem from 'expo-file-system/legacy';
import { ImageFormat, type SkImage } from '@shopify/react-native-skia';
import type { CardTemplate } from '../scene/types';

const CACHE_DIR = `${FileSystem.cacheDirectory}template-thumbnails/`;

async function ensureCacheDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
}

export async function getCachedThumbnail(key: string): Promise<string | null> {
  const path = `${CACHE_DIR}${key}.png`;
  const info = await FileSystem.getInfoAsync(path);
  return info.exists ? path : null;
}

export async function saveThumbnailToCache(key: string, image: SkImage): Promise<string> {
  await ensureCacheDir();
  const path = `${CACHE_DIR}${key}.png`;
  // Same technique exportCard.tsx already uses for the real export — no
  // Buffer polyfill needed. Quality 90 rather than 100: this is a small
  // preview, not the final export.
  const base64 = image.encodeToBase64(ImageFormat.PNG, 90);
  await FileSystem.writeAsStringAsync(path, base64, { encoding: FileSystem.EncodingType.Base64 });
  return path;
}

// Small deterministic string hash (djb2-style) — no hashing library needed
// just to fingerprint a template's content.
function hashString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

// Includes a content hash (palette + elements), not just the template id —
// so if a template's own definition changes later, its cached thumbnail
// naturally invalidates and regenerates instead of silently going stale.
export function getThumbnailCacheKey(template: CardTemplate): string {
  const content = JSON.stringify({ palette: template.palette, elements: template.elements });
  return `${template.id}-${hashString(content)}`;
}