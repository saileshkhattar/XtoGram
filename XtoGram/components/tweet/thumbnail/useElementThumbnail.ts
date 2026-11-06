import { useEffect, useMemo, useState } from 'react';
import { useThumbnailGenerator } from './ThumbnailGeneratorProvider';
import { getElementThumbnailCacheKey } from './thumbnailCache';
import { THUMBNAIL_SAMPLE_QUOTE_TWEET, THUMBNAIL_SAMPLE_TWEET } from './sampleTweet';
import type { CardElement, CardTemplate, ElementType, Palette } from '../scene/types';

// This is intentionally narrower than a production card. It causes the real
// variants to reflow for a legible picker preview without cropping avatars or
// text out of a wide snapshot.
const ELEMENT_THUMBNAIL_CARD_WIDTH = 480;

function singleElementTemplate(type: ElementType, variant: string, palette: Palette): CardTemplate {
  const element: CardElement = {
    id: type,
    type,
    variant,
    ...(type === 'quoteEmbed' ? { dataBinding: 'quotedTweet' } : {}),
  };

  return {
    id: `thumbnail-${type}-${variant}`,
    name: variant,
    appliesTo: type === 'quoteEmbed' ? ['quote'] : ['original'],
    palette,
    elements: [element],
  };
}

// A variant thumbnail is rendered by the real scene engine, not a bespoke
// preview. This keeps its measurement, palette, and media/quote binding in
// lockstep with the card renderer.
export function useElementThumbnail(type: ElementType, variant: string, palette: Palette): string | null {
  const { requestThumbnail } = useThumbnailGenerator();
  const [uri, setUri] = useState<string | null>(null);
  const cacheKey = useMemo(
    () => getElementThumbnailCacheKey(type, variant, palette, ELEMENT_THUMBNAIL_CARD_WIDTH),
    [type, variant, palette],
  );
  const template = useMemo(() => singleElementTemplate(type, variant, palette), [type, variant, palette]);
  const sample = type === 'quoteEmbed' ? THUMBNAIL_SAMPLE_QUOTE_TWEET : THUMBNAIL_SAMPLE_TWEET;

  useEffect(() => {
    let cancelled = false;
    setUri(null);
    requestThumbnail(template, sample, cacheKey, ELEMENT_THUMBNAIL_CARD_WIDTH)
      .then((result) => {
        if (!cancelled) setUri(result);
      })
      .catch(() => {
        // The picker remains usable while the thumbnail queue retries on a
        // later mount (for example, after an image becomes reachable).
      });
    return () => {
      cancelled = true;
    };
  }, [cacheKey, requestThumbnail, sample, template]);

  return uri;
}
