// components/auth/AuthScreenShell.tsx
import { View, StyleSheet, Animated, Easing, Text } from 'react-native';
import TopNavBar from '../ui/TopNavbar';
import { Colors, Spacing } from '../../constants/theme';
import type { ReactNode } from 'react';
import ScatteredIcons from '../../utils/scatteredIcons';
import { useRef, useEffect } from 'react';


type Props = {
  title: string;
  showBack?: boolean;
  children: ReactNode;
};

export default function AuthScreenShell({ title, showBack = true, children }: Props) {
  const scatterFade = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(scatterFade, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, []);

  return (
    <View style={styles.root}>
      <ScatteredIcons fadeIn={scatterFade} />
      <TopNavBar title={title} showBack={showBack} />
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.BG_BASE},
  content: { flex: 1, padding: Spacing.screen, justifyContent : "center"},
  title: {
  fontSize: 28,
  fontWeight: '700',
  color: Colors.TEXT_HIGH,
  marginBottom: 32,
  alignSelf : "center"
},
});