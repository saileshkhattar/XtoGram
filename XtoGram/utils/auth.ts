import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const ACCESS_KEY = 'xtogram_access_token';
const REFRESH_KEY = 'xtogram_refresh_token';
const DEVICE_KEY = 'xtogram_device_id';
const GUEST_FLAG_KEY = 'xtogram_guest_mode';

export async function saveTokens(accessToken: string, refreshToken: string) {
  await SecureStore.setItemAsync(ACCESS_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
  await SecureStore.deleteItemAsync(GUEST_FLAG_KEY);
}

export async function getAccessToken() {
  return SecureStore.getItemAsync(ACCESS_KEY);
}

export async function getRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
  await SecureStore.deleteItemAsync(GUEST_FLAG_KEY);
}

export async function getDeviceId(): Promise<string> {
  let id = await SecureStore.getItemAsync(DEVICE_KEY);
  if (!id) {
    id = Crypto.randomUUID();
    await SecureStore.setItemAsync(DEVICE_KEY, id);
  }
  return id;
}

export async function saveGuestToken(accessToken: string) {
  await SecureStore.setItemAsync(ACCESS_KEY, accessToken);
  await SecureStore.setItemAsync(GUEST_FLAG_KEY, '1');
}

export async function isGuestMode(): Promise<boolean> {
  return (await SecureStore.getItemAsync(GUEST_FLAG_KEY)) === '1';
}