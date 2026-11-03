import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { PageRenderer } from '../scene/PageRenderer';
import type { Page } from '../scene/plan';
import type { CardTemplate } from '../scene/types';
import { Colors, FontSize, Radius, Spacing } from '../../../constants/theme';

const FRAME = Math.min(Dimensions.get('window').width - Spacing.screen * 2, 392);
const PAGE_H = Math.min(Dimensions.get('window').width - Spacing.screen * 2, 392);
const PAGE_W = PAGE_H * 0.8;

export function DockedPagesPreview({ pages, template, pageColor }: { pages: Page[]; template: CardTemplate; pageColor?: string }) {
  if (!pages[0]) return null;
  return (
    <View style={s.frame}>
        <PageRenderer page={pages[0]} template={template} width={PAGE_W} pageColor={pageColor} />
      {pages.length > 1 && (
        <View style={s.badge}><Text style={s.badgeText}>{pages.length} cards</Text></View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
frame: { width: PAGE_W, height: PAGE_H, alignSelf: 'center', borderRadius: Radius.md, overflow: 'hidden' },
  badge: { position: 'absolute', top: Spacing.sm, right: Spacing.sm, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: Radius.full },
  badgeText: { color: Colors.TEXT_HIGH, fontSize: FontSize.caption, fontWeight: '600' },
});