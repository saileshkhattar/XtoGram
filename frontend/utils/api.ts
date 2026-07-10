import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from './auth';

const BASE_URL = 'http://192.168.1.54:3000';

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
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

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });


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