// app/login.tsx
import { useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import AuthScreenShell from '../components/auth/AuthScreenShell';
import TextField from '../components/ui/TextField';
import Button from '../components/ui/Button';
import GoogleButton from '../components/ui/GoogleButton';
import { useAuth } from '../context/AuthContext';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useFadeUpSequence } from '../hooks/useFadeUpSequence';
import { Colors, Spacing, FontSize } from '../constants/theme';

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [f1, f2, f3, f4] = useFadeUpSequence(4);

  const { promptAsync } = useGoogleAuth(async (idToken) => {
    try {
      await loginWithGoogle(idToken);
      router.replace('/(tabs)/home');
    } catch (e: any) {
      setError(e.message || 'Google sign-in failed');
    }
  });

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)/home');
    } catch (e: any) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenShell title="Log In">
      <Animated.View style={f1}>
        <TextField value={email} onChangeText={setEmail} placeholder="Email" />
      </Animated.View>
      <View style={{ height: Spacing.sm }} />
      <Animated.View style={f2}>
        <TextField value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
      </Animated.View>

      <TouchableOpacity onPress={() => router.push('/forgot-password')} style={styles.forgotLink}>
        <Text style={styles.forgotText}>Forgot password?</Text>
      </TouchableOpacity>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={{ height: Spacing.md }} />
      <Animated.View style={f3}>
        <Button label={loading ? 'Logging in...' : 'Log In'} onPress={handleLogin} />
      </Animated.View>
      <View style={{ height: Spacing.sm }} />
      <Animated.View style={f4}>
        <GoogleButton onPress={() => promptAsync()} />
      </Animated.View>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  error: { color: Colors.ERROR, fontSize: FontSize.bodySmall, marginTop: Spacing.sm },
  forgotLink: { alignSelf: 'flex-end', marginTop: Spacing.sm },
  forgotText: { color: Colors.TEXT_LOW, fontSize: FontSize.bodySmall, textDecorationLine: 'underline' },
});