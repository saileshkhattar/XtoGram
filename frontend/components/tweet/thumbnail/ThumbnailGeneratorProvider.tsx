import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useCanvasRef } from '@shopify/react-native-skia';
import { SceneRenderer } from '../scene/ScreenRenderer';
import { getCachedThumbnail, getThumbnailCacheKey, saveThumbnailToCache } from './thumbnailCache';
import type { CardTemplate } from '../scene/types';
import type { Tweet } from '../../../types/tweet';

type QueueItem = {
  key: string;
  template: CardTemplate;
  tweet: Tweet;
  resolve: (uri: string) => void;
  reject: (err: unknown) => void;
};

type ContextValue = {
  requestThumbnail: (template: CardTemplate, tweet: Tweet) => Promise<string>;
};

const ThumbnailGeneratorContext = createContext<ContextValue | null>(null);

// Mounts ONE off-screen (invisible, but genuinely rendered — Skia needs an
// actual paint to snapshot) Canvas that renders templates one at a time
// from a queue, snapshots each, and caches the PNG to disk. Concurrent
// requests for the SAME template share one in-flight promise rather than
// rendering it twice. Wrap this around wherever templates get shown
// (currently just home.tsx) — if templates end up used from another
// screen later (e.g. the advanced editor), move this up to a shared layout
// instead of duplicating it.
export function ThumbnailGeneratorProvider({ children }: { children: React.ReactNode }) {
  const canvasRef = useCanvasRef();
  const queueRef = useRef<QueueItem[]>([]);
  const processingRef = useRef(false);
  const inFlightRef = useRef<Map<string, Promise<string>>>(new Map());

  const [current, setCurrent] = useState<QueueItem | null>(null);
  const [renderedHeight, setRenderedHeight] = useState(0);

  const processNext = useCallback(() => {
    if (processingRef.current) return;
    const next = queueRef.current.shift();
    if (!next) return;
    processingRef.current = true;
    setRenderedHeight(0); // reset before mounting the next template — see the snapshot effect below
    setCurrent(next);
  }, []);

  const finishCurrent = useCallback(() => {
    processingRef.current = false;
    setCurrent(null);
    setRenderedHeight(0);
    processNext();
  }, [processNext]);

  // Once the off-screen SceneRenderer reports a real height, give Skia one
  // extra frame to actually paint before snapshotting (same double-RAF
  // pattern used for the "isRendering" overlay elsewhere).
  useEffect(() => {
    if (!current || !renderedHeight) return;
    let cancelled = false;
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(async () => {
        if (cancelled) return;
        try {
          const canvas = canvasRef.current;
          const image = canvas?.makeImageSnapshot();
          if (!image) throw new Error('Thumbnail snapshot failed');
          const uri = await saveThumbnailToCache(current.key, image);
          current.resolve(uri);
        } catch (e) {
          current.reject(e);
        } finally {
          if (!cancelled) finishCurrent();
        }
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, renderedHeight]);

  const requestThumbnail = useCallback(
    (template: CardTemplate, tweet: Tweet): Promise<string> => {
      const key = getThumbnailCacheKey(template);
      const existing = inFlightRef.current.get(key);
      if (existing) return existing;

      const promise = (async () => {
        const cached = await getCachedThumbnail(key);
        if (cached) return cached;
        return new Promise<string>((resolve, reject) => {
          queueRef.current.push({ key, template, tweet, resolve, reject });
          processNext();
        });
      })();

      inFlightRef.current.set(key, promise);
      promise.finally(() => inFlightRef.current.delete(key));
      return promise;
    },
    [processNext]
  );

  const value = useMemo(() => ({ requestThumbnail }), [requestThumbnail]);

  return (
    <ThumbnailGeneratorContext.Provider value={value}>
      {children}
      {/* Off-screen render target. Positioned off the visible canvas rather
          than opacity:0 or width:0 — those can still skip layout/paint on
          some platforms, and this needs a genuine paint to snapshot. */}
      <View style={styles.offscreen} pointerEvents="none">
        {current && (
          <SceneRenderer
            key={current.key}
            tweet={current.tweet}
            template={current.template}
            canvasRef={canvasRef}
            onHeightComputed={setRenderedHeight}
          />
        )}
      </View>
    </ThumbnailGeneratorContext.Provider>
  );
}

export function useThumbnailGenerator(): ContextValue {
  const ctx = useContext(ThumbnailGeneratorContext);
  if (!ctx) throw new Error('useThumbnailGenerator must be used within a ThumbnailGeneratorProvider');
  return ctx;
}

const styles = StyleSheet.create({
  offscreen: {
    position: 'absolute',
    top: -10000,
    left: -10000,
  },
});