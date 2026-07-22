// app/preview.tsx
import { ScrollView, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import TopNavBar from '../components/ui/TopNavbar';
import { Colors, Spacing, FontSize } from '../constants/theme';

export default function Preview() {
  const { data } = useLocalSearchParams<{ url: string; data: string }>();

  let parsed: unknown = null;
  try {
    parsed = data ? JSON.parse(data) : null;
  } catch {
    parsed = { error: 'Could not parse tweet data' };
  }

  return (
    <>
      <TopNavBar title="Preview" />
      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        {/* Placeholder — real card preview/template rendering comes next.
            For now this just proves the fetched JSON made it across. */}
        <Text style={styles.json}>{JSON.stringify(parsed, null, 2)}</Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.BG_BASE,
  },
  content: {
    padding: Spacing.screen,
  },
  json: {
    color: Colors.TEXT_MED,
    fontSize: FontSize.caption,
  },
});