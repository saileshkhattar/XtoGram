import type { Tweet } from '../../../types/tweet';

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
  // A real placeholder image — Avatar.tsx/ImageGrid.tsx already fall back
  // to a neutral gray box if this fails to load (offline, etc.), so this
  // is a quality-of-preview tradeoff, not a reliability risk.
  media: [{ url: 'https://picsum.photos/seed/xtogram/1200/800', width: 1200, height: 800 }],
  hashtags: [],
  mentions: [],
  quotedTweet: null,
  parentTweet: null,
};