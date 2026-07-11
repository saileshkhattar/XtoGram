// utils/tweetApi.ts
import { apiFetch } from './api';


export async function fetchTweetByUrl(url: string): Promise<any> {
  return apiFetch('/api/tweet', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
}