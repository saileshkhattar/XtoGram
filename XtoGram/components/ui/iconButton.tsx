import { TouchableOpacity, Animated, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Radius } from '../../constants/theme';
import { usePressScale } from '../../hooks/usePressScale';

type Props = {
  name: keyof typeof Feather.glyphMap;
  onPress: () => void;
  size?: number;
  loading?: boolean;
  disabled?: boolean;
};

export default function IconButton({ name, onPress, size = 20, loading = false, disabled = false }: Props) {
  const { scale, onPressIn, onPressOut } = usePressScale();
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={isDisabled}
      style={[styles.touch, isDisabled && styles.touchDisabled]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {loading ? (
          <ActivityIndicator size="small" color={Colors.TEXT_MED} />
        ) : (
          <Feather name={name} size={size} color={Colors.TEXT_MED} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touch: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.SURFACE_RAISED,
  },
  touchDisabled: {
    opacity: 0.6,
  },
});