import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null; // or a splash/loading view
  return <Redirect href={user ? '/(tabs)/home' : '/landing'} />;
}