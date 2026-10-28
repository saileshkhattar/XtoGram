// utils/tweetApi.ts
import { apiFetch } from './api';
import type { ConversationResponse } from '../types/tweet';



export async function fetchTweetByUrl(url: string): Promise<ConversationResponse> {
  return apiFetch('/api/tweet', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
}