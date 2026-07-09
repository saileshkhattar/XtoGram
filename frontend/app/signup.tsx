// app/signup.tsx
import { useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import AuthScreenShell from '../components/auth/AuthScreenShell';
import TextField from '../components/ui/TextField';
import Button from '../components/ui/Button';
import GoogleButton from '../components/ui/GoogleButton';
import { useAuth } from '../context/AuthContext';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useFadeUpSequence } from '../hooks/useFadeUpSequence';
import { Colors, Spacing, FontSize } from '../constants/theme';

export default function Signup() {
  const { signup, loginWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [f1, f2, f3, f4, f5] = useFadeUpSequence(5);

  const { promptAsync } = useGoogleAuth(async (idToken) => {
    try {
      await loginWithGoogle(idToken);
      router.replace('/(tabs)/home'); // Google accounts are pre-verified, skip verify-email
    } catch (e: any) {
      setError(e.message || 'Google sign-in failed');
    }
  });

  const handleSignup = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required');
      return;
    }
    setLoading(true);
    try {
      await signup(email, password, name);
      router.replace({ pathname: '/verify-email', params: { email } });
    } catch (e: any) {
      setError(e.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenShell title="Sign Up">
      <Animated.View style={f1}><TextField value={name} onChangeText={setName} placeholder="Name" /></Animated.View>
      <View style={{ height: Spacing.sm }} />
      <Animated.View style={f2}><TextField value={email} onChangeText={setEmail} placeholder="Email" /></Animated.View>
      <View style={{ height: Spacing.sm }} />
      <Animated.View style={f3}><TextField value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry /></Animated.View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={{ height: Spacing.md }} />
      <Animated.View style={f4}><Button label={loading ? 'Creating account...' : 'Sign Up'} onPress={handleSignup} /></Animated.View>
      <View style={{ height: Spacing.sm }} />
      <Animated.View style={f5}><GoogleButton onPress={() => promptAsync()} /></Animated.View>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  error: { color: Colors.ERROR, fontSize: FontSize.bodySmall, marginTop: Spacing.sm },
});