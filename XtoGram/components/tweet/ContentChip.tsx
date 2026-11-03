import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import { useCard } from '../../context/CardContext';
import { useOneTimeHint } from '../../hooks/useOneTimeHint';

export function ContentChip({ onPress }: { onPress: () => void }) {
  const { conversation, selection, visibleNodes } = useCard();
  const hint = useOneTimeHint('xtogram.contentHintSeen');

  const multi = !!conversation && conversation.nodes.length > 1;
  const hasQuote = !!conversation?.nodes.some((n) => n.quotedTweet);
  const eligible = !!conversation && !!selection && (multi || hasQuote);

  // The hint only counts down once the chip is actually on screen.
  useEffect(() => {
    if (!eligible || !hint.visible) return;
    const t = setTimeout(hint.dismiss, 8000);
    return () => clearTimeout(t);
  }, [eligible, hint.visible, hint.dismiss]);

  if (!eligible || !conversation || !selection) return null;

  const count = visibleNodes.length;
  const text = multi
    ? `${conversation.kind === 'chain' ? 'Replies' : 'Thread'} · ${count} ${count === 1 ? 'tweet' : 'tweets'}`
    : `Quote · ${selection.quoteDepth >= 1 ? 'shown' : 'hidden'}`;
  const tip = multi ? 'Tap to choose which tweets are included' : 'Tap to show or hide the quoted tweet';

  return (
    <View style={s.wrap}>
      <Pressable
        onPress={() => { hint.dismiss(); onPress(); }}
        style={s.chip}
        hitSlop={8}
      >
        <Text style={s.text}>{text}</Text>
        <Text style={s.edit}>Edit</Text>
        <Feather name="chevron-up" size={14} color={Colors.TEXT_MED} />
      </Pressable>
      {hint.visible && (
        <View style={s.tip}>
          <Text style={s.tipText}>{tip}</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', marginTop: Spacing.lg, gap: Spacing.xs },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.BORDER, backgroundColor: Colors.SURFACE_RAISED,
  },
  text: { color: Colors.TEXT_HIGH, fontSize: FontSize.bodySmall, fontWeight: '600' },
  edit: { color: Colors.TEXT_MED, fontSize: FontSize.bodySmall },
  tip: { backgroundColor: Colors.PRIMARY, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.sm },
  tipText: { color: Colors.BG_BASE, fontSize: FontSize.caption, fontWeight: '600' },
});