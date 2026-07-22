import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, FontSize, Radius, Spacing } from '../../../constants/theme';
import { DockedCardPreview } from './DockerCardPreview';
import type { Tweet } from '../../../types/tweet';
import type { CardTemplate } from '../scene/types';

type Props = { template: CardTemplate | null; tweet: Tweet; onClose: () => void; onApply: (template: CardTemplate) => void };

/** Lets people inspect a full card before committing a template choice. */
export function TemplatePreviewModal({ template, tweet, onClose, onApply }: Props) {
  if (!template) return null;
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{template.name}</Text>
            <Pressable onPress={onClose} hitSlop={12}><Feather name="x" size={20} color={Colors.TEXT_HIGH} /></Pressable>
          </View>
          <View style={styles.preview}><DockedCardPreview tweet={tweet} template={template} cardRadius={0} cardPadding={48} /></View>
          <Pressable style={styles.apply} onPress={() => onApply(template)}><Text style={styles.applyLabel}>Apply template</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', padding: Spacing.lg },
  sheet: { backgroundColor: Colors.SURFACE_RAISED, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.md, borderWidth: 1, borderColor: Colors.BORDER },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: Colors.TEXT_HIGH, fontSize: FontSize.h3, fontWeight: '700' },
  preview: { minHeight: 160, alignItems: 'center', justifyContent: 'center' },
  apply: { backgroundColor: Colors.PRIMARY, borderRadius: Radius.sm, minHeight: 46, justifyContent: 'center', alignItems: 'center' },
  applyLabel: { color: Colors.BG_BASE, fontSize: FontSize.bodySmall, fontWeight: '700' },
});
