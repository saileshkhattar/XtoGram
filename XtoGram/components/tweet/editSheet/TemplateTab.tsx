import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Spacing } from '../../../constants/theme';
import { TemplateSection } from '../templatePicker/TemplateSection';
import { useRecentTemplates } from '../../../hooks/useRecentTemplate';
import type { CardTemplate } from '../scene/types';
import { getTemplatesForShape } from '../templates/definations';
import { useCard } from '../../../context/CardContext';

type Props = {
  selectedTemplateId: string;
  onSelect: (template: CardTemplate) => void;
};

export function TemplatesTab({ selectedTemplateId, onSelect }: Props) {
  const { recentIds, recordTemplateUsed } = useRecentTemplates();

  const { shape } = useCard();
  const templates = useMemo(() => getTemplatesForShape(shape), [shape]);

  const recentTemplates = useMemo(() => {
    const byId = new Map(templates.map((t) => [t.id, t]));
    const resolved = recentIds.map((id) => byId.get(id)).filter((t): t is CardTemplate => !!t);
    return resolved.length > 0 ? resolved : templates.slice(0, 5);
  }, [recentIds, templates]);

  const userTemplates: CardTemplate[] = [];
  const storeTemplates: CardTemplate[] = [];

  const handleSelect = (template: CardTemplate) => {
    onSelect(template);
    recordTemplateUsed(template.id);
  };

  return (
    <View style={styles.wrap}>
      <TemplateSection
        title="For you"
        templates={recentTemplates}
        selectedId={selectedTemplateId}
        onSelect={handleSelect}
      />
      <TemplateSection
        title="System templates"
        templates={templates}
        selectedId={selectedTemplateId}
        onSelect={handleSelect}
      />
      <TemplateSection
        title="Your templates"
        templates={userTemplates}
        selectedId={selectedTemplateId}
        onSelect={handleSelect}
        emptyLabel="Templates you save will show up here"
      />
      <TemplateSection
        title="Template store"
        templates={storeTemplates}
        selectedId={selectedTemplateId}
        onSelect={handleSelect}
        emptyLabel="Coming soon — templates shared by other users"
      />
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { gap: Spacing.lg } });