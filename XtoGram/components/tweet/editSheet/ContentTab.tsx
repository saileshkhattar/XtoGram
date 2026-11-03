import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, FontSize, Radius, Spacing } from '../../../constants/theme';
import { useCard } from '../../../context/CardContext';
import { useToast } from '../../../context/ToastContext';
import { FIT_AUTO } from '../scene/plan';
import { applyOverrides, isRowLocked, tapRow } from '../../../utils/conversation';
import { TweetEditorModal } from './TweetEditorModal';
import type { Tweet } from '../../../types/tweet';

export function ContentTab() {
  const { conversation, selection, setSelection, visibleNodes, plan, layoutChoice, setLayoutChoice, overrides } = useCard();
  const { showToast } = useToast();
  const [editing, setEditing] = useState<Tweet | null>(null);

  if (!conversation || !selection) return null;

  const { nodes, focusIndex, limits } = conversation;
  const hasQuote = nodes.some((n) => n.quotedTweet);
  const hasDeeper = conversation.more.deeperQuote || nodes.some((n) => n.quotedTweet?.quotedTweet);


  const onRow = (i: number) => {
    const result = tapRow(selection, i, focusIndex, limits.maxNodes);
    if ('blocked' in result) {
      if (result.blocked === 'cap') {
        showToast(limits.tier === 'premium' ? `You can include up to ${limits.maxNodes} tweets.` : 'Premium feature: include more tweets.');
      }
      return;
    }
    setSelection(result.sel);
  };

  const setDepth = (d: number) => setSelection({ ...selection, quoteDepth: d });
  const onDeeper = () => {
    if (limits.quoteDepth < 2) { showToast('Premium feature.'); return; }
    setDepth(selection.quoteDepth >= 2 ? 1 : 2);
  };

  const showLayout = !!plan?.onePage && visibleNodes.length > 1;
  const oneActive = layoutChoice === 'one' || (layoutChoice === 'auto' && plan?.mode === 'one');
  const tooSmall = oneActive && (plan?.fitScale ?? 1) < FIT_AUTO;

  return (
    <View style={s.wrap}>
      <View style={s.section}>
        <Text style={s.title}>{nodes.length > 1 ? 'Tweets to include' : 'Tweet'}</Text>
        {nodes.map((n, i) => {
          const multi = nodes.length > 1;
          const included = i >= selection.start && i <= selection.end;
          const pinned = i === focusIndex;
          const locked = isRowLocked(selection, i, limits.maxNodes);
          const shown = applyOverrides(n, overrides);   // what the user currently sees, with their edits

          return (
            <Pressable
              key={n.id}
              onPress={() => (multi ? onRow(i) : setEditing(n))}
              style={[s.row, locked && { opacity: 0.5 }]}
            >
              {multi && (
                <Feather
                  name={included ? 'check-square' : 'square'}
                  size={18}
                  color={included ? Colors.PRIMARY : Colors.TEXT_LOW}
                />
              )}

              <View style={{ flex: 1 }}>
                <Text style={s.handle}>{n.author.handle}</Text>
                <Text style={s.text} numberOfLines={1}>{shown.text.replace(/\s+/g, ' ')}</Text>
              </View>

              {overrides[n.id] ? <Text style={s.tag}>Edited</Text> : null}
              {pinned && multi ? <Text style={s.tag}>Pasted</Text> : null}
              {locked ? <Feather name="lock" size={14} color={Colors.TEXT_LOW} /> : null}

              <Pressable onPress={() => setEditing(n)} hitSlop={10}>
                <Feather name="edit-2" size={16} color={Colors.TEXT_MED} />
              </Pressable>
            </Pressable>
          );
        })}
      </View>

      {hasQuote && (
        <View style={s.section}>
          <Text style={s.title}>Quoted tweet</Text>
          <View style={s.switchRow}>
            <Text style={s.label}>Show quoted tweet</Text>
            <Switch value={selection.quoteDepth >= 1} onValueChange={(v) => setDepth(v ? 1 : 0)} />
          </View>
          {hasDeeper && selection.quoteDepth >= 1 && (
            <View style={s.switchRow}>
              <Text style={s.label}>Include the quote's quote{limits.quoteDepth < 2 ? '  🔒' : ''}</Text>
              <Switch value={selection.quoteDepth >= 2} onValueChange={onDeeper} />
            </View>
          )}
        </View>
      )}

      {showLayout && (
        <View style={s.section}>
          <Text style={s.title}>Layout</Text>
          <View style={s.segment}>
            <Pressable onPress={() => setLayoutChoice('series')} style={[s.seg, !oneActive && s.segActive]}>
              <Text style={[s.segText, !oneActive && s.segTextActive]}>Carousel</Text>
            </Pressable>
            <Pressable onPress={() => setLayoutChoice('one')} style={[s.seg, oneActive && s.segActive]}>
              <Text style={[s.segText, oneActive && s.segTextActive]}>One card</Text>
            </Pressable>
          </View>
          {tooSmall && <Text style={s.warn}>Everything fits on one card, but the text will be smaller.</Text>}
        </View>
      )}

      <TweetEditorModal node={editing} onClose={() => setEditing(null)} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: Spacing.lg },
  section: { gap: Spacing.sm },
  title: { color: Colors.TEXT_MED, fontSize: FontSize.caption, fontWeight: '600', textTransform: 'uppercase' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.BORDER_SOFT },
  handle: { color: Colors.TEXT_MED, fontSize: FontSize.caption },
  text: { color: Colors.TEXT_HIGH, fontSize: FontSize.bodySmall },
  tag: { color: Colors.TEXT_MED, fontSize: FontSize.caption },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { color: Colors.TEXT_HIGH, fontSize: FontSize.body },
  segment: { flexDirection: 'row', borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.BORDER, overflow: 'hidden' },
  seg: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center' },
  segActive: { backgroundColor: Colors.PRIMARY },
  segText: { color: Colors.TEXT_MED, fontSize: FontSize.bodySmall, fontWeight: '600' },
  segTextActive: { color: '#000' },
  warn: { color: Colors.WARNING, fontSize: FontSize.caption },
});