import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const { user, isGuest, isLoading } = useAuth();

  if (isLoading) return null;
  return <Redirect href={user || isGuest ? '/(tabs)/home' : '/landing'} />;
}