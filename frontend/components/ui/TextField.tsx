import { useRef } from 'react';
import { Animated, TextInput, StyleSheet } from 'react-native';
import { Colors, Radius, FontSize, Spacing } from '../../constants/theme';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
};

export default function TextField({ value, onChangeText, placeholder, secureTextEntry }: Props) {
  const focusAnim = useRef(new Animated.Value(0)).current;

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.BORDER, Colors.PRIMARY],
  });

  const handleFocus = () => {
    Animated.timing(focusAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  };

  const handleBlur = () => {
    Animated.timing(focusAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  };

  return (
    <Animated.View style={[styles.wrap, { borderColor }]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        placeholderTextColor={Colors.TEXT_LOW}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={styles.input}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.SURFACE,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
  },
  input: {
    color: Colors.TEXT_HIGH,
    fontSize: FontSize.body,
    paddingVertical: 14,
  },
});