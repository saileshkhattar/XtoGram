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
  LayoutAnimation,
  UIManager,
  Text, 
  Pressable
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
import { useAuth } from '../../context/AuthContext';
import GuestBanner from '../../components/ui/GuestBanner';
import { useToast } from '../../context/ToastContext';
import { router } from 'expo-router';
import { PagePager } from '../../components/tweet/scene/PagePager';
import IconButton from '../../components/ui/iconButton';
import { ContentChip } from '../../components/tweet/ContentChip';
import { SeriesExporter, type SeriesExporterHandle } from '../../components/tweet/scene/SeriesExporter';


if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const PREVIEW_WIDTH = SCREEN_WIDTH - Spacing.screen * 2;

export default function Home() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [isCardReady, setIsCardReady] = useState(false);

  const {
    tweet,
    setConversation,
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
    conversation, 
    selection, 
    isMulti, 
    pages, 
    pageColor,
  } = useCard();

  const { setGuestRemaining } = useAuth();
  const { showToast } = useToast();



  const cardResultRef = useRef<CardResultHandle>(null);
  const editSheetRef = useRef<EditSheetHandle>(null);
  const scatterFade = useRef(new Animated.Value(0)).current;
  const lastFetch = useRef<{ url: string; at: number } | null>(null);
  const exporterRef = useRef<SeriesExporterHandle>(null);
  const handleCardReady = useCallback(() => setIsCardReady(true), []);

  useEffect(() => {
    Animated.timing(scatterFade, {
      toValue: 1,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
  if (isMulti) setIsCardReady(true);
}, [isMulti, conversation]);

  const handleSubmit = async () => {
    const trimmed = url.trim();
    if (!trimmed || loading) return;
    const last = lastFetch.current;
    if (conversation && last && last.url === trimmed && Date.now() - last.at < 60_000) return;
    Keyboard.dismiss();
    setError('');
    setIsCardReady(false);
    setLoading(true);
    try {
      const data = await fetchTweetByUrl(trimmed);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setConversation(data);
      lastFetch.current = { url: trimmed, at: Date.now() };
      if (data.more.budgetExhausted || data.more.truncatedByPageCap) {
        showToast('Part of this conversation could not be loaded.');
      }
      if (data.guest) {
        setGuestRemaining(data.guest.remaining);
        if (data.guest.limited) {
          showToast('Sign up to see the full thread or quoted tweet.');
        }
      }
    } catch (e: any) {
      if (e.code === 'GUEST_LIMIT_REACHED') {
        setGuestRemaining(0);
        showToast('Free limit reached. Sign up from the banner to keep creating.', 'error');
      } else {
        setError(e.message || 'Could not fetch that tweet — check the link and try again');
      }
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
      showToast('Card saved to your photo library.', 'success');
    } catch (e: any) {
      showToast(e.message || 'Could not save your card.', 'error');
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
      showToast(e.message || 'Could not share your card.', 'error');
    } finally {
      setSharing(false);
    }
  };

  const handleSaveSeries = async () => {
  if (saving || pages.length === 0) return;
  setSaving(true);
  showToast(`Saving ${pages.length} cards…`);
  try {
    await exporterRef.current?.renderAll(pages, selectedTemplate, pageColor, async (image) => {
      await saveImageToLibrary(image);
    });
    showToast(`${pages.length} cards saved to your photo library.`, 'success');
  } catch (e: any) {
    showToast(e.message || 'Could not save your cards.', 'error');
  } finally {
    setSaving(false);
  }
  };

  return (
    <ThumbnailGeneratorProvider>
      <View style={styles.root}>
      <ScatteredIcons fadeIn={scatterFade} />
      <SeriesExporter ref={exporterRef} />

      <TopNavBar title="Home" showBack={false} />
      <GuestBanner />
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

          <ContentChip onPress={() => editSheetRef.current?.expand('content')} />

          {isMulti ? (
  <View style={{ alignItems: 'center', gap: Spacing.md, marginTop: Spacing.lg }}>
    <PagePager
      key={`${conversation?.focusTweetId}-${selection?.start}-${selection?.end}-${pages.length}`}
      pages={pages}
      template={selectedTemplate}
      width={PREVIEW_WIDTH}
      pageColor={pageColor}
    />
    <View style={{ flexDirection: 'row', gap: Spacing.md }}>
      <IconButton name="sliders" onPress={() => editSheetRef.current?.expand('adjust')} />
      <IconButton name="edit-3" onPress={() => showToast('Editing a series is coming soon.')} />
      <IconButton name="download" onPress={handleSaveSeries} />
      <IconButton name="share-2" onPress={() => showToast('Sharing a series is coming soon.')} />
    </View>
  </View>
) : (
  tweet && (
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
))}


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
