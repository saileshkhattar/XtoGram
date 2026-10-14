import { ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  message?: string;
};

export default function GuestLock({
  children,
  style,
  message = 'Sign up to use these tools.',
}: Props) {
  const { isGuest } = useAuth();
  const { showToast } = useToast();

  return (
    <View>
      <View
        style={[style, isGuest && { opacity: 0.55 }]}
        pointerEvents={isGuest ? 'none' : 'auto'}
      >
        {children}
      </View>
      {isGuest && (
        <Pressable style={StyleSheet.absoluteFill} onPress={() => showToast(message)} />
      )}
    </View>
  );
}