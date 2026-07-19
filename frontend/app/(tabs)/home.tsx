// app/(tabs)/home.tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
  Dimensions,
  Alert,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import TopNavBar from '../../components/ui/TopNavbar';
import HomeHero from '../../components/tweet/HomeHero';
import CardResult,  { type CardResultHandle } from '../../components/tweet/CardResult';
import { Colors, Spacing } from '../../constants/theme';
import ScatteredIcons from '../../utils/scatteredIcons';
import { fetchTweetByUrl } from '../../utils/tweetApi';
import { saveImageToLibrary, shareImage } from '../../components/tweet/exportCard';
import type { ParsedTweetResponse, Tweet } from '../../types/tweet';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const PREVIEW_WIDTH = SCREEN_WIDTH - Spacing.screen * 2;

export default function Home() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<ParsedTweetResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [isCardReady, setIsCardReady] = useState(false);

  const cardResultRef = useRef<CardResultHandle>(null);
  const scatterFade = useRef(new Animated.Value(0)).current;
  const handleCardReady = useCallback(() => setIsCardReady(true), []);

  useEffect(() => {
    Animated.timing(scatterFade, {
      toValue: 1,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);


  let tweet: Tweet | null;

  if (!parsed) {
    tweet = null;
  } else if (parsed.type === 'original') {
    tweet = parsed.tweet;
  } else {
    const chainTweet = parsed.chain[parsed.chain.length - 1];
    tweet = chainTweet ?? null;
  }

  const handleSubmit = async () => {
    if (!url.trim() || loading) return;
    Keyboard.dismiss();
    setError('');
    setIsCardReady(false);
    setLoading(true);
    try {
      const data = await fetchTweetByUrl(url.trim());
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setParsed(data);
    } catch (e: any) {
      setError(e.message || 'Could not fetch that tweet — check the link and try again');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const image = cardResultRef.current?.getExportImage();
      if (!image) throw new Error('Card is not ready yet');
      await saveImageToLibrary(image);
      Alert.alert('Saved', 'Card saved to your photo library.');
    } catch (e: any) {
      Alert.alert('Could not save', e.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const image = cardResultRef.current?.getExportImage();
      if (!image) throw new Error('Card is not ready yet');
      await shareImage(image);
    } catch (e: any) {
      Alert.alert('Could not share', e.message || 'Something went wrong');
    } finally {
      setSharing(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScatteredIcons fadeIn={scatterFade} />

      <TopNavBar title="Home" showBack={false} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <HomeHero
            url={url}
            onChangeUrl={(text) => {
              setUrl(text);
              if (error) setError('');
            }}
            error={error}
            loading={loading}
            onSubmit={handleSubmit}
            compact={isCardReady}
          />

          {tweet && (
            <CardResult
              key={tweet.id}
              ref={cardResultRef}
              tweet={tweet}
              previewWidth={PREVIEW_WIDTH}
              onSave={handleSave}
              onShare={handleShare}
              saving={saving}
              sharing={sharing}
              onReady={handleCardReady}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.BG_BASE,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
});
