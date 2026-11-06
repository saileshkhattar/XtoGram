import { useEffect, useState } from 'react';
import { useThumbnailGenerator } from './ThumbnailGeneratorProvider';
import { THUMBNAIL_SAMPLE_TWEET, THUMBNAIL_SAMPLE_QUOTE_TWEET } from './sampleTweet';
import type { CardTemplate } from '../scene/types';
import { getThumbnailCacheKey } from './thumbnailCache';

// Returns null until the thumbnail is ready (cached instantly, or
// generated — first time only, then cached for every future mount/app
// open). TemplateThumb falls back to its color-swatch placeholder while
// this is null.
export function useTemplateThumbnail(template: CardTemplate): string | null {
  const { requestThumbnail } = useThumbnailGenerator();
  const [uri, setUri] = useState<string | null>(null);
  const cacheKey = getThumbnailCacheKey(template);
  const usesQuoteSample = template.appliesTo.includes('quote');

  useEffect(() => {
    let cancelled = false;
    setUri(null);
    const sample = usesQuoteSample ? THUMBNAIL_SAMPLE_QUOTE_TWEET : THUMBNAIL_SAMPLE_TWEET;
    requestThumbnail(template, sample)
      .then((result) => {
        if (!cancelled) setUri(result);
      })
      .catch(() => {
        // Generation failed (e.g. offline avatar/media fetch) — swatch
        // fallback stays up, no crash.
      });
    return () => {
      cancelled = true;
    };
  }, [cacheKey, requestThumbnail, usesQuoteSample]);

  return uri;
}
