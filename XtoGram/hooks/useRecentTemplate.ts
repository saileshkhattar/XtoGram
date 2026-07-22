import { useCallback, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

// expo-secure-store is already a dependency (used for auth tokens) — reused
// here rather than adding a new storage package, since this is just a small
// array of ids. Worth switching to something like AsyncStorage/MMKV later
// if recent-item tracking grows beyond this.
const STORAGE_KEY = 'xtogram.recentTemplateIds';
const MAX_RECENT = 7;

export function useRecentTemplates() {
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    SecureStore.getItemAsync(STORAGE_KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setRecentIds(parsed);
        } catch {
          // corrupt/old value — ignore and start fresh rather than crash
        }
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const recordTemplateUsed = useCallback((templateId: string) => {
    setRecentIds((prev) => {
      const next = [templateId, ...prev.filter((id) => id !== templateId)].slice(0, MAX_RECENT);
      SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(next)).catch(() => {
        // best-effort — a failed write just means recents don't survive an app restart
      });
      return next;
    });
  }, []);

  return { recentIds, recordTemplateUsed, loaded };
}