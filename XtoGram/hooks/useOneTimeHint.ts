import { useCallback, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

// A hint that shows until it's dismissed once, remembered on the device.
export function useOneTimeHint(key: string) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    SecureStore.getItemAsync(key)
      .then((seen) => { if (!cancelled && !seen) setVisible(true); })
      .catch(() => {});                       // storage failure: just don't show the hint
    return () => { cancelled = true; };
  }, [key]);

  const dismiss = useCallback(() => {
    setVisible(false);
    SecureStore.setItemAsync(key, '1').catch(() => {});
  }, [key]);

  return { visible, dismiss };
}