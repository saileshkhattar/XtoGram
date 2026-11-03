import { useEffect, useState } from "react";
import { Skia, type SkImage } from "@shopify/react-native-skia";
import type { Tweet } from "../../../types/tweet";

const cache = new Map<string, SkImage>();
const inflight = new Map<string, Promise<SkImage | null>>();

export function loadImage(uri: string): Promise<SkImage | null> {
  const hit = cache.get(uri);
  if (hit) return Promise.resolve(hit);
  const pending = inflight.get(uri);
  if (pending) return pending;

  const p = (async () => {
    try {
      const data = await Skia.Data.fromURI(uri);
      const image = Skia.Image.MakeImageFromEncoded(data);
      if (image) cache.set(uri, image);
      return image;
    } catch {
      return null;
    } finally {
      inflight.delete(uri);
    }
  })();
  inflight.set(uri, p);
  return p;
}

export function clearImageCache() {
  cache.clear();
}

// Like useImage, but a cached image is available on the very first render.
export function useSkImage(uri?: string): SkImage | null {
  const [image, setImage] = useState<SkImage | null>(() => (uri ? cache.get(uri) ?? null : null));
  useEffect(() => {
    if (!uri) { setImage(null); return; }
    const hit = cache.get(uri);
    if (hit) { setImage(hit); return; }
    let cancelled = false;
    loadImage(uri).then((img) => { if (!cancelled) setImage(img); });
    return () => { cancelled = true; };
  }, [uri]);
  return image;
}

// Everything a tweet needs drawn: avatar, photos, and the same for nested quotes.
export function imageUrisOf(tweet: Tweet): string[] {
  const uris = [tweet.author.avatar, ...tweet.media.map((m) => m.url)].filter(Boolean);
  return tweet.quotedTweet ? [...uris, ...imageUrisOf(tweet.quotedTweet)] : uris;
}