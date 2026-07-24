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
import CardResult, { type CardResultHandle } from '../../components/tweet/CardResult';
import { EditSheet, type EditSheetHandle, PEEK_HEIGHT } from '../../components/tweet/editSheet/EditSheet';
import { ThumbnailGeneratorProvider } from '../../components/tweet/thumbnail/ThumbnailGeneratorProvider';
import { Colors, Spacing } from '../../constants/theme';
import { useCard } from '../../context/CardContext';
import ScatteredIcons from '../../utils/scatteredIcons';
import { fetchTweetByUrl } from '../../utils/tweetApi';
import { saveImageToLibrary, shareImage } from '../../components/tweet/exportCard';
import type { ParsedTweetResponse } from '../../types/tweet';

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

  // Card state (tweet, template, quick-adjust values) now lives in
  // CardContext instead of local state here — same fields, same defaults,
  // just readable from any screen (home, and the upcoming Advanced
  // Editor route) via useCard(). selectedTemplate persisting across a new
  // tweet, and quick-adjust values persisting across template switches,
  // are unchanged behaviors — just relocated.
  const {
    tweet,
    setTweet,
    template: selectedTemplate,
    setTemplate: setSelectedTemplate,
    frameBackgroundColor,
    setFrameBackgroundColor,
    cardColorOverride,
    cardRadius,
    setCardRadius,
    cardPadding,
    setCardPadding,
    backgroundImageUri,
    setBackgroundImageUri,
    cardBackgroundImageUri,
    backgroundImageBlur,
    setBackgroundImageBlur,
    cardBackgroundImageBlur,
  } = useCard();

  // TODO (agreed, not yet implemented): switching to a genuinely different
  // template should reset frameBackgroundColor/cardColorOverride/cardRadius
  // /cardPadding back to defaults, with a confirmation prompt — but only
  // when there's actually something to lose (i.e. at least one of these is
  // already non-default). Frame preset/size (owned inside CardResult) should
  // NOT reset — that's a canvas-format choice, a different axis from the
  // card's own visual style.

  const cardResultRef = useRef<CardResultHandle>(null);
  const editSheetRef = useRef<EditSheetHandle>(null);
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


  // Tweet now lives in CardContext (see `tweet`/`setTweet` above) so the
  // Advanced Editor route can read the same one. This effect is just the
  // "derive it from the fetch result" step, run whenever a new fetch
  // resolves.
  useEffect(() => {
    if (!parsed) {
      setTweet(null);
    } else if (parsed.type === 'original') {
      setTweet(parsed.tweet);
    } else {
      const chainTweet = parsed.chain[parsed.chain.length - 1];
      setTweet(chainTweet ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed]);

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
      const image = await cardResultRef.current?.getExportImage();
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
      const image = await cardResultRef.current?.getExportImage();
      if (!image) throw new Error('Card is not ready yet');
      await shareImage(image);
    } catch (e: any) {
      Alert.alert('Could not share', e.message || 'Something went wrong');
    } finally {
      setSharing(false);
    }
  };

  return (
    <ThumbnailGeneratorProvider>
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
              template={selectedTemplate}
              onSave={handleSave}
              onShare={handleShare}
              saving={saving}
              sharing={sharing}
              onReady={handleCardReady}
              frameBackgroundColor={frameBackgroundColor}
              cardColorOverride={cardColorOverride}
              cardRadius={cardRadius}
              cardPadding={cardPadding}
              backgroundImageUri={backgroundImageUri}
              cardBackgroundImageUri={cardBackgroundImageUri}
              backgroundImageBlur={backgroundImageBlur}
              cardBackgroundImageBlur={cardBackgroundImageBlur}
              onOpenAdjust={() => editSheetRef.current?.expand('adjust')}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {tweet && (
        <EditSheet
          ref={editSheetRef}
          tweet={tweet}
          template={selectedTemplate}
          selectedTemplateId={selectedTemplate.id}
          onSelectTemplate={setSelectedTemplate}
          backgroundColor={frameBackgroundColor}
          onBackgroundColorChange={setFrameBackgroundColor}
          cardColor={cardColorOverride}
          cardRadius={cardRadius}
          onCardRadiusChange={setCardRadius}
          cardPadding={cardPadding}
          onCardPaddingChange={setCardPadding}
          backgroundImageUri={backgroundImageUri}
          onBackgroundImageChange={setBackgroundImageUri}
          cardBackgroundImageUri={cardBackgroundImageUri}
          backgroundImageBlur={backgroundImageBlur}
          onBackgroundImageBlurChange={setBackgroundImageBlur}
          cardBackgroundImageBlur={cardBackgroundImageBlur}
        />
      )}
    </View>
    </ThumbnailGeneratorProvider>
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
    paddingBottom: Spacing.xxl + PEEK_HEIGHT,
  },
});
