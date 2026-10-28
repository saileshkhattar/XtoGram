import type { Tweet } from '../types/tweet';
import type { TweetType } from '../components/tweet/scene/types';

export function getShape(nodes: Tweet[]): TweetType {
  if (nodes.length === 0) return 'original';
  if (nodes.length === 1) return nodes[0].quotedTweet ? 'quote' : 'original';
  const first = nodes[0].author.handle.toLowerCase();
  return nodes.every((n) => n.author.handle.toLowerCase() === first) ? 'thread' : 'reply';
}

// Returns a copy of the tweet with its quote chain cut to `depth` levels.
export function trimQuoteDepth(tweet: Tweet, depth: number): Tweet {
  if (!tweet.quotedTweet) return tweet;
  if (depth <= 0) return { ...tweet, quotedTweet: null };
  return { ...tweet, quotedTweet: trimQuoteDepth(tweet.quotedTweet, depth - 1) };
}
