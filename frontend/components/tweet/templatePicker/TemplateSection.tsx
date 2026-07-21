import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize } from '../../../constants/theme';
import { TemplateThumb } from './TemplateThumb';
import type { CardTemplate } from '../scene/types';

type Props = {
  title: string;
  templates: CardTemplate[];
  selectedId: string;
  onSelect: (template: CardTemplate) => void;
  emptyLabel?: string;
};

export function TemplateSection({ title, templates, selectedId, onSelect, emptyLabel }: Props) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      {templates.length > 0 ? (
        <FlatList
          horizontal
          data={templates}
          keyExtractor={(t) => t.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
          renderItem={({ item }) => (
            <TemplateThumb template={item} selected={item.id === selectedId} onPress={() => onSelect(item)} />
          )}
        />
      ) : (
        <Text style={styles.empty}>{emptyLabel ?? 'Nothing here yet'}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.sm },
  title: { fontSize: FontSize.label, fontWeight: '600', color: Colors.TEXT_HIGH },
  row: { gap: Spacing.sm, paddingRight: Spacing.md },
  empty: { fontSize: FontSize.caption, color: Colors.TEXT_LOW, fontStyle: 'italic' },
});