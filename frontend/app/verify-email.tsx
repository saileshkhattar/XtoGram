// app/verify-email.tsx
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import AuthScreenShell from '../components/auth/authScreenShell';
import TextField from '../components/ui/TextField';
import Button from '../components/ui/Button';
import { apiFetch } from '../utils/api';
import { useFadeUpSequence } from '../hooks/useFadeUp';
import { Colors, Spacing, FontSize } from '../constants/theme';

export default function VerifyEmail() {
  const { email, token } = useLocalSearchParams<{ email?: string; token?: string }>();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const [f1, f2, f3] = useFadeUpSequence(3);

  useEffect(() => {
    if (token) {
      (async () => {
        try {
          await apiFetch('/auth/verify-email/link', { method: 'POST', body: JSON.stringify({ token }) });
          router.replace('/(tabs)/home');
        } catch (e: any) {
          setError(e.message || 'Verification failed');
        }
      })();
    }
  }, [token]);

  const handleVerify = async () => {
    setError('');
    setLoading(true);
    try {
      await apiFetch('/auth/verify-email/otp', { method: 'POST', body: JSON.stringify({ email, otp }) });
      router.replace('/(tabs)/home');
    } catch (e: any) {
      setError(e.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResent(false);
    try {
      await apiFetch('/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) });
      setResent(true);
    } catch {
      // stay silent — same reasoning as the backend's generic responses
    }
  };

  // If we arrived via the link, there's nothing to show — the effect
  // above handles everything and redirects automatically.
  if (token) return null;

  return (
    <AuthScreenShell title="Verify Email" showBack={false}>
      <Animated.View style={f1}>
        <Text style={styles.subtitle}>We sent a 6-digit code to {email}</Text>
      </Animated.View>
      <View style={{ height: Spacing.md }} />
      <Animated.View style={f2}>
        <TextField value={otp} onChangeText={setOtp} placeholder="000000" />
      </Animated.View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {resent ? <Text style={styles.success}>Code resent — check your inbox</Text> : null}

      <View style={{ height: Spacing.md }} />
      <Animated.View style={f3}>
        <Button label={loading ? 'Verifying...' : 'Verify'} onPress={handleVerify} />
      </Animated.View>

      <TouchableOpacity onPress={handleResend} style={styles.resendLink}>
        <Text style={styles.resendText}>Didn't get a code? Resend</Text>
      </TouchableOpacity>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  subtitle: { color: Colors.TEXT_MED, fontSize: FontSize.body, textAlign: 'center' },
  error: { color: Colors.ERROR, fontSize: FontSize.bodySmall, marginTop: Spacing.sm },
  success: { color: Colors.SUCCESS, fontSize: FontSize.bodySmall, marginTop: Spacing.sm },
  resendLink: { alignItems: 'center', marginTop: Spacing.md },
  resendText: { color: Colors.TEXT_LOW, fontSize: FontSize.bodySmall, textDecorationLine: 'underline' },
});