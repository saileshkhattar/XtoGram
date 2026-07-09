// components/auth/AuthScreenShell.tsx
import { View, StyleSheet } from 'react-native';
import TopNavBar from '../ui/TopNavBar';
import { Colors, Spacing } from '../../constants/theme';
import type { ReactNode } from 'react';

type Props = {
  title: string;
  showBack?: boolean;
  children: ReactNode;
};

export default function AuthScreenShell({ title, showBack = true, children }: Props) {
  return (
    <View style={styles.root}>
      <TopNavBar title={title} showBack={showBack} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.BG_BASE },
  content: { flex: 1, padding: Spacing.screen },
});