import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, FontSize, Spacing } from '../../constants/theme';
import IconButton from './iconButton';

type Props = {
  title: string;
  showBack?: boolean;
};

export default function TopNavBar({ title, showBack = true }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + Spacing.sm }]}>
      {showBack ? (
        <IconButton name="arrow-left" onPress={() => router.back()} />
      ) : (
        <View style={styles.spacer} />
      )}
      <Text style={styles.title}>{title}</Text>
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screen,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.BG_BASE,
  },
  title: {
    color: Colors.TEXT_HIGH,
    fontSize: FontSize.h2,
    fontWeight: '600',
  },
  spacer: {
    width: 36,
  },
});