// app/forgot-password.tsx
import { useState } from 'react';
import { Text, StyleSheet, Animated, View } from 'react-native';
import AuthScreenShell from '../components/auth/AuthScreenShell';
import TextField from '../components/ui/TextField';
import Button from '../components/ui/Button';
import { apiFetch } from '../lib/api';
import { useFadeUpSequence } from '../hooks/useFadeUpSequence';
import { Colors, Spacing, FontSize } from '../constants/theme';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [f1, f2] = useFadeUpSequence(2);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
      setSent(true);
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenShell title="Forgot Password">
      <Animated.View style={f1}>
        <TextField value={email} onChangeText={setEmail} placeholder="Email" />
      </Animated.View>

      {sent ? (
        <Text style={styles.success}>If that email exists, a reset link has been sent.</Text>
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}

      <View style={{ height: Spacing.md }} />
      <Animated.View style={f2}>
        <Button label={loading ? 'Sending...' : 'Send Reset Link'} onPress={handleSubmit} />
      </Animated.View>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  error: { color: Colors.ERROR, fontSize: FontSize.bodySmall, marginTop: Spacing.sm },
  success: { color: Colors.SUCCESS, fontSize: FontSize.bodySmall, marginTop: Spacing.sm },
});