import 'react-native-gesture-handler'; 
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../context/AuthContext';
import { CardProvider } from '../context/CardContext';
import { ToastProvider } from '../context/ToastContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <CardProvider>
          <SafeAreaProvider>
            <ToastProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }} />
            </ToastProvider>
          </SafeAreaProvider>
        </CardProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}