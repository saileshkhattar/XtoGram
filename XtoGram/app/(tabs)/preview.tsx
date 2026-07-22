// app/preview.tsx
import { useState } from 'react';
import { View, ScrollView, Text, StyleSheet, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useCanvasRef } from '@shopify/react-native-skia';
import TopNavBar from '../../components/ui/TopNavbar';
import Button from '../../components/ui/Button';
import { Colors, Spacing } from '../../constants/theme';
import { RegularCard } from '../../components/tweet/templates/RegularCard';
import { CARD_WIDTH } from '../../components/tweet/skia/layout';
import { saveCardToLibrary, shareCard } from '../../components/tweet/exportCard';
import type {  ParsedTweetResponse,  Tweet } from '../../types/tweet';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PREVIEW_WIDTH = SCREEN_WIDTH - Spacing.screen * 2;
const PREVIEW_SCALE = PREVIEW_WIDTH / CARD_WIDTH;

export default function Preview() {
  const { data } = useLocalSearchParams<{ url: string; data: string }>();
  const canvasRef = useCanvasRef();
  const [cardHeight, setCardHeight] = useState(0);
  const [busy, setBusy] = useState(false);

  let parsed: ParsedTweetResponse | null = null;
  try {
    parsed = data ? JSON.parse(data) : null;
  } catch {
    parsed = null;
  }

  // Only the Regular template exists so far — for a reply chain,
  // preview the focus tweet (last one in the chain) for now. Thread
  // and reply-chain templates come next.
  const tweet: Tweet | null = parsed
    ? parsed.type === 'original'
      ? parsed.tweet
      : parsed.chain[parsed.chain.length - 1] ?? null
    : null;

  const handleSave = async () => {
    setBusy(true);
    try {
      await saveCardToLibrary(canvasRef);
      Alert.alert('Saved', 'Card saved to your photo library.');
    } catch (e: any) {
      Alert.alert('Could not save', e.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    setBusy(true);
    try {
      await shareCard(canvasRef);
    } catch (e: any) {
      Alert.alert('Could not share', e.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  if (!tweet) {
    return (
      <View style={styles.root}>
        <TopNavBar title="Preview" />
        <View style={styles.center}>
          <Text style={styles.errorText}>Couldn't read tweet data.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <TopNavBar title="Preview" />
      <ScrollView contentContainerStyle={styles.content}>
        {/* The actual Canvas always renders at full CARD_WIDTH resolution —
            export quality never depends on screen size. We just visually
            scale it down to fit the screen for on-screen preview. */}
        <View style={{ width: PREVIEW_WIDTH, height: cardHeight * PREVIEW_SCALE }}>
          <View
            style={{
              width: CARD_WIDTH,
              transform: [{ scale: PREVIEW_SCALE }],
              transformOrigin: 'top left',
            }}
          >
            <RegularCard tweet={tweet} canvasRef={canvasRef} onHeightComputed={setCardHeight} />
          </View>
        </View>

        <View style={styles.actions}>
          <Button label="Save to Photos" onPress={handleSave} variant="secondary" />
          <Button
            label={busy ? 'Working…' : 'Share'}
            onPress={handleShare}
            icon={busy ? <ActivityIndicator size="small" color={Colors.BG_BASE} /> : undefined}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.BG_BASE },
  content: { padding: Spacing.screen, alignItems: 'center', gap: Spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: Colors.TEXT_MED },
  actions: { width: '100%', gap: Spacing.sm },
});