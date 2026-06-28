// screens/Home.tsx
import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, FontSize } from '../constants/theme';
import { Screen } from '../App';

const API_BASE = 'http://YOUR_LOCAL_IP:3000'; // ← change this later

type Props = {
  navigate: (to: Screen, data?: any) => void;
};

export default function HomeScreen({ navigate }: Props) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFetch() {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/tweet?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Something went wrong');
      navigate('preview', data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.heading}>New post</Text>
          <Text style={styles.subheading}>Paste a tweet URL to get started</Text>

          <View style={styles.card}>
            <Text style={styles.label}>TWEET URL</Text>
            <TextInput
              style={styles.input}
              placeholder="https://x.com/user/status/..."
              placeholderTextColor={Colors.TEXT_LOW}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={[styles.btnPrimary, loading && { opacity: 0.6 }]}
              onPress={handleFetch}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.btnText}>Fetch tweet</Text>
              }
            </TouchableOpacity>
          </View>

          {loading && (
            <Text style={styles.hint}>This may take a moment…</Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.BG_BASE },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  heading: {
    fontSize: FontSize.h1,
    fontWeight: '700',
    color: Colors.TEXT_HIGH,
    letterSpacing: -0.5,
    marginBottom: Spacing.xs,
  },
  subheading: {
    fontSize: FontSize.body,
    color: Colors.TEXT_LOW,
    marginBottom: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.SURFACE,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.BORDER,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  label: {
    fontSize: FontSize.caption,
    color: Colors.TEXT_LOW,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: Colors.BG_BASE,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.BORDER,
    color: Colors.TEXT_HIGH,
    fontSize: FontSize.body,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  errorText: {
    fontSize: FontSize.caption,
    color: Colors.ERROR,
  },
  btnPrimary: {
    backgroundColor: Colors.PRIMARY,
    borderRadius: Radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: FontSize.label,
    fontWeight: '600',
  },
  hint: {
    marginTop: Spacing.lg,
    textAlign: 'center',
    color: Colors.TEXT_LOW,
    fontSize: FontSize.caption,
  },
});