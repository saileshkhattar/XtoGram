import { useEffect, useState } from 'react';
import {
  Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, FontSize, Radius, Spacing } from '../../../constants/theme';
import { useCard } from '../../../context/CardContext';
import { useToast } from '../../../context/ToastContext';
import { applyOverrides } from '../../../utils/conversation';
import type { Tweet, TweetMedia } from '../../../types/tweet';

const MAX_PHOTOS = 4;
const MAX_CHARS = 5000;
type Draft = { text: string; media: TweetMedia[] };

const sameMedia = (a: TweetMedia[], b: TweetMedia[]) =>
  a.length === b.length && a.every((m, i) => m.url === b[i].url);

export function TweetEditorModal({ node, onClose }: { node: Tweet | null; onClose: () => void }) {
  const { overrides, setOverride, resetOverride } = useCard();
  const { showToast } = useToast();
  const [target, setTarget] = useState<'tweet' | 'quote'>('tweet');
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

  // Start from what the user currently sees (their earlier edits included).
  useEffect(() => {
    if (!node) return;
    const current = applyOverrides(node, overrides);
    const next: Record<string, Draft> = { [node.id]: { text: current.text, media: current.media } };
    if (current.quotedTweet) {
      next[current.quotedTweet.id] = { text: current.quotedTweet.text, media: current.quotedTweet.media };
    }
    setDrafts(next);
    setTarget('tweet');
  }, [node?.id]);

  if (!node) return null;
  const quote = node.quotedTweet;
  const original = target === 'quote' && quote ? quote : node;
  const draft = drafts[original.id];
  if (!draft) return null;

  const update = (patch: Partial<Draft>) =>
    setDrafts((d) => ({ ...d, [original.id]: { ...d[original.id], ...patch } }));

  const addPhotos = async () => {
    const room = MAX_PHOTOS - draft.media.length;
    if (room <= 0) { showToast(`Up to ${MAX_PHOTOS} photos per tweet.`); return; }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { showToast('Allow photo access to add photos.', 'error'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: room, quality: 1,
    });
    if (result.canceled) return;
    const added = result.assets.map((a) => ({ url: a.uri, width: a.width, height: a.height }));
    update({ media: [...draft.media, ...added].slice(0, MAX_PHOTOS) });
  };

  const done = () => {
    for (const t of quote ? [node, quote] : [node]) {
      const d = drafts[t.id];
      if (!d) continue;
      if (d.text === t.text && sameMedia(d.media, t.media)) resetOverride(t.id);   // back to the original
      else setOverride(t.id, { text: d.text, media: d.media });
    }
    onClose();
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.header}>
          <Pressable onPress={onClose} hitSlop={10}><Text style={s.link}>Cancel</Text></Pressable>
          <Text style={s.title}>Edit tweet</Text>
          <Pressable onPress={done} hitSlop={10}><Text style={[s.link, s.done]}>Done</Text></Pressable>
        </View>

        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
          {quote && (
            <View style={s.segment}>
              {(['tweet', 'quote'] as const).map((k) => (
                <Pressable key={k} onPress={() => setTarget(k)} style={[s.seg, target === k && s.segActive]}>
                  <Text style={[s.segText, target === k && s.segTextActive]}>{k === 'tweet' ? 'Tweet' : 'Quoted tweet'}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <Text style={s.label}>Text</Text>
          <TextInput
            multiline
            value={draft.text}
            onChangeText={(text) => update({ text })}
            maxLength={MAX_CHARS}
            placeholder="Tweet text"
            placeholderTextColor={Colors.TEXT_LOW}
            textAlignVertical="top"
            style={s.input}
          />

          <Text style={s.label}>Photos ({draft.media.length}/{MAX_PHOTOS})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm }}>
            {draft.media.map((m, i) => (
              <View key={`${m.url}-${i}`}>
                <Image source={{ uri: m.url }} style={s.thumb} />
                <Pressable style={s.remove} hitSlop={8} onPress={() => update({ media: draft.media.filter((_, j) => j !== i) })}>
                  <Feather name="x" size={14} color="#fff" />
                </Pressable>
              </View>
            ))}
            {draft.media.length < MAX_PHOTOS && (
              <Pressable onPress={addPhotos} style={[s.thumb, s.add]}>
                <Feather name="plus" size={22} color={Colors.TEXT_MED} />
              </Pressable>
            )}
          </ScrollView>

          <Pressable onPress={() => update({ text: original.text, media: original.media })} style={{ marginTop: Spacing.lg }}>
            <Text style={s.reset}>Reset to original</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.BG_BASE },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  title: { color: Colors.TEXT_HIGH, fontSize: FontSize.body, fontWeight: '700' },
  link: { color: Colors.TEXT_MED, fontSize: FontSize.body },
  done: { color: Colors.PRIMARY, fontWeight: '700' },
  body: { padding: Spacing.lg, gap: Spacing.sm },
  label: { color: Colors.TEXT_MED, fontSize: FontSize.caption, fontWeight: '600', textTransform: 'uppercase', marginTop: Spacing.md },
  input: { minHeight: 180, color: Colors.TEXT_HIGH, fontSize: FontSize.body, backgroundColor: Colors.SURFACE, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.BORDER },
  thumb: { width: 84, height: 84, borderRadius: Radius.sm, backgroundColor: Colors.SURFACE },
  add: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.BORDER, borderStyle: 'dashed' },
  remove: { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center' },
  reset: { color: Colors.TEXT_MED, fontSize: FontSize.bodySmall, textAlign: 'center' },
  segment: { flexDirection: 'row', borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.BORDER, overflow: 'hidden' },
  seg: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center' },
  segActive: { backgroundColor: Colors.PRIMARY },
  segText: { color: Colors.TEXT_MED, fontSize: FontSize.bodySmall, fontWeight: '600' },
  segTextActive: { color: '#000' },
});