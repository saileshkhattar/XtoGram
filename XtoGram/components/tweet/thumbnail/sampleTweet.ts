import type { Tweet } from '../../../types/tweet';
import { Image } from 'react-native';

// Bundled locally so template thumbnails remain stable and render offline.
// Keep these assets square/landscape; ImageGrid crops them consistently.
const SAMPLE_MEDIA = [
  Image.resolveAssetSource(require('../../../assets/placeholders/sample-city.jpg')).uri,
  Image.resolveAssetSource(require('../../../assets/placeholders/sample-mountains.jpg')).uri,
  Image.resolveAssetSource(require('../../../assets/placeholders/sample-desk.jpg')).uri,
];

// Never tied to a real user's tweet, so the same fixture — and therefore
// the same cache key/thumbnail — is reused for every template preview
// regardless of what tweet the user actually has loaded at the time.
export const THUMBNAIL_SAMPLE_TWEET: Tweet = {
  id: 'thumbnail-sample',
  text: 'Small steps every day add up to something big. Keep going.',
  createdAt: new Date().toISOString(),
  lang: 'en',
  url: '',
  isReply: false,
  isQuote: false,
  isRetweet: false,
  inReplyToId: null,
  metrics: { likes: 1204, retweets: 312, replies: 48, quotes: 12, bookmarks: 96 },
  author: {
    name: 'Sample User',
    handle: '@sampleuser',
    avatar: 'https://i.pravatar.cc/300?img=12',
    verified: true,
    verifiedType: 'blue',
    followers: 10234,
  },
  media: SAMPLE_MEDIA.map((url) => ({ url, width: 1200, height: 800 })),
  hashtags: [],
  mentions: [],
  quotedTweet: null,
  parentTweet: null,
};
