// app/reset-password.tsx
import { useState } from 'react';
import { Text, StyleSheet, Animated, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import AuthScreenShell from '../components/auth/AuthScreenShell';
import TextField from '../components/ui/TextField';
import Button from '../components/ui/Button';
import { apiFetch } from '../lib/api';
import { useFadeUpSequence } from '../hooks/useFadeUpSequence';
import { Colors, Spacing, FontSize } from '../constants/theme';

export default function ResetPassword() {
  // Arrived here via the emailed deep link — token comes from the URL.
  const { token } = useLocalSearchParams<{ token: string }>();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [f1, f2, f3] = useFadeUpSequence(3);

  const handleSubmit = async () => {
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await apiFetch('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) });
      router.replace('/login');
    } catch (e: any) {
      setError(e.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenShell title="Reset Password" showBack={false}>
      <Animated.View style={f1}>
        <TextField value={newPassword} onChangeText={setNewPassword} placeholder="New password" secureTextEntry />
      </Animated.View>
      <View style={{ height: Spacing.sm }} />
      <Animated.View style={f2}>
        <TextField value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm new password" secureTextEntry />
      </Animated.View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={{ height: Spacing.md }} />
      <Animated.View style={f3}>
        <Button label={loading ? 'Resetting...' : 'Reset Password'} onPress={handleSubmit} />
      </Animated.View>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  error: { color: Colors.ERROR, fontSize: FontSize.bodySmall, marginTop: Spacing.sm },
});