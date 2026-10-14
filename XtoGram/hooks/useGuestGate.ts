import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function useGuestGate() {
  const { isGuest } = useAuth();
  const { showToast } = useToast();

  const gate = useCallback(
    (action: () => void, message = 'Sign up to unlock editing tools') => {
      if (isGuest) {
        showToast(message, 'info');
        return;
      }
      action();
    },
    [isGuest, showToast],
  );

  return { isGuest, gate };
}