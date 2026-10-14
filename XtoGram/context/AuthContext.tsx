import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens, getDeviceId, saveGuestToken, isGuestMode } from '../utils/auth';
import { apiFetch } from '../utils/api';

type User = { id: string; email: string; name: string; emailVerified: boolean } | null;

type AuthContextType = {
  user: User;
  isLoading: boolean;
  signup: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  isGuest: boolean;
  guestRemaining: number | null;
  setGuestRemaining: (n: number | null) => void;
  continueAsGuest: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [guestRemaining, setGuestRemaining] = useState<number | null>(null);

  const continueAsGuest = async () => {
    const deviceId = await getDeviceId();
    const data = await apiFetch('/auth/guest', { method: 'POST', body: JSON.stringify({ deviceId }) });
    await saveGuestToken(data.accessToken);
    setIsGuest(true);
    setGuestRemaining(data.guest.remaining);
  };

  useEffect(() => {
    (async () => {
      const access = await getAccessToken();
      const refresh = await getRefreshToken();
      if (access && refresh) {
        setUser({} as User);
      } else if (await isGuestMode()) {
        try {
          await continueAsGuest();
        } catch {}
      }
      setIsLoading(false);
    })();
  }, []);


  const handleAuthResponse = async (data: any) => {
    await saveTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    setIsGuest(false);
    setGuestRemaining(null);
  };

  const signup = async (email: string, password: string, name: string) => {
    const data = await apiFetch('/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, name }) });
    await handleAuthResponse(data);
  };

  const login = async (email: string, password: string) => {
    const data = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    await handleAuthResponse(data);
  };

  const loginWithGoogle = async (idToken: string) => {
    const data = await apiFetch('/auth/google', { method: 'POST', body: JSON.stringify({ idToken }) });
    await handleAuthResponse(data);
  };

  const logout = async () => {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      await apiFetch('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }).catch(() => {});
    }
    await clearTokens();
    setUser(null);
    setIsGuest(false);
    setGuestRemaining(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isGuest, guestRemaining, setGuestRemaining, continueAsGuest, signup, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}