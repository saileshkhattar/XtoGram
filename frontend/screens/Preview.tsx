// screens/Preview.tsx
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, FontSize } from '../constants/theme';
import { Screen } from '../App';

type Props = {
  navigate: (to: Screen) => void;
  tweetData: any;
};

export default function PreviewScreen({ navigate, tweetData }: Props) {
  return (
    <SafeAreaView style={styles.safe}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigate('home')}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>Tweet data</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>

        {tweetData?.type && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{tweetData.type.toUpperCase()}</Text>
          </View>
        )}

        <View style={styles.jsonCard}>
          <Text style={styles.jsonText}>
            {JSON.stringify(tweetData, null, 2)}
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.BG_BASE },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screen,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BORDER,
  },
  backText: {
    color: Colors.PRIMARY,
    fontSize: FontSize.body,
    width: 60,
  },
  heading: {
    fontSize: FontSize.h3,
    fontWeight: '600',
    color: Colors.TEXT_HIGH,
  },
  container: {
    padding: Spacing.screen,
    paddingBottom: Spacing.xxl,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.PRIMARY_DIM,
    borderRadius: Radius.xs,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#4A3A9E',
  },
  badgeText: {
    color: Colors.PRIMARY,
    fontSize: FontSize.caption,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  jsonCard: {
    backgroundColor: Colors.SURFACE,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.BORDER,
    padding: Spacing.md,
  },
  jsonText: {
    color: Colors.TEXT_MED,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 18,
  },
});
