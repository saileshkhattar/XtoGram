import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from './auth';
import { env } from "../config/env";


let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  const res = await fetch(`${env.apiUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    await clearTokens();
    return null;
  }

  const data = await res.json();
  await saveTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

export async function apiFetch(path: string, options: RequestInit = {}, retry = true): Promise<any> {
  const token = await getAccessToken();

  const res = await fetch(`${env.apiUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });


  console.log(res)


  if (res.status === 401 && retry && path !== '/auth/refresh') {
    if (!refreshPromise) refreshPromise = refreshAccessToken();
    const newToken = await refreshPromise;
    refreshPromise = null;

    if (newToken) {
      return apiFetch(path, options, false);
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}


export async function apiGet(path: string, options: RequestInit = {}): Promise<any> {
  return apiFetch(path, { ...options, method: 'GET' });
}