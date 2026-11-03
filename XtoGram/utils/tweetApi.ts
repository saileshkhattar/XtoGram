// utils/tweetApi.ts
import { apiFetch } from './api';
import type { ConversationResponse } from '../types/tweet';



export async function fetchTweetByUrl(url: string): Promise<ConversationResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 70_000);   
  try {
    return await apiFetch('/api/tweet', {
      method: 'POST',
      body: JSON.stringify({ url }),
      signal: controller.signal,
    });
  } catch (e: any) {
    if (e?.name === 'AbortError') throw new Error('This is taking too long. Please try again.');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}