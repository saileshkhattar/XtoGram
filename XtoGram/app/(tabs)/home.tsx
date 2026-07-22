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
import { darkClassicTemplate } from '../../components/tweet/templates/definations';
import type { CardTemplate } from '../../components/tweet/scene/types';
import { PADDING } from '../../components/tweet/skia/layout';
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
  // Persists across a new tweet being pasted in the same session, same as
  // how Instagram remembers your last-used filter rather than resetting it
  // per photo. Change the default/reset behavior here if that's not the
  // experience you want.
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate>(darkClassicTemplate);

  // Quick-adjust state — lifted up here (rather than living inside
  // CardResult) so it can be shared with EditSheet's Adjust tab and so a
  // future template-switch reset (see TODO below) has one place to act.
  // These persist across template switches for now, same reasoning as
  // selectedTemplate persisting across a new tweet.
  const [frameBackgroundColor, setFrameBackgroundColor] = useState(Colors.SURFACE);
  const [cardColorOverride, setCardColorOverride] = useState<string | undefined>(undefined);
  const [cardRadius, setCardRadius] = useState(0);
  const [cardPadding, setCardPadding] = useState(PADDING);
  // Image URIs stay at the screen level so the card, frame and editor sheet
  // all redraw from one source of truth.
  const [backgroundImageUri, setBackgroundImageUri] = useState<string | undefined>();
  const [cardBackgroundImageUri, setCardBackgroundImageUri] = useState<string | undefined>();

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
          onCardColorChange={setCardColorOverride}
          defaultCardColor={selectedTemplate.palette.cardSurface}
          cardRadius={cardRadius}
          onCardRadiusChange={setCardRadius}
          cardPadding={cardPadding}
          onCardPaddingChange={setCardPadding}
          backgroundImageUri={backgroundImageUri}
          onBackgroundImageChange={setBackgroundImageUri}
          cardBackgroundImageUri={cardBackgroundImageUri}
          onCardBackgroundImageChange={setCardBackgroundImageUri}
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
