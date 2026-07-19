import { forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';
import { useTransformGesture, type TransformState } from '../../hooks/useTransformGesture';

type Props = {
  children: React.ReactNode;
  frameWidth: number;
  frameHeight: number;
  backgroundColor?: string;
  minScale?: number;
  maxScale?: number;
  initial?: Partial<TransformState>;
  onChange?: (t: TransformState) => void;
};

export type TransformableViewHandle = {
  getSnapshot: () => TransformState;
  reset: () => void;
};

// Content-agnostic: hands pan/pinch/rotate to whatever it wraps, and
// clips it to a fixed frame. Used today for cropping the card inside a
// custom-size frame; reusable later for e.g. repositioning an avatar
// or a text block in the full component editor — it never looks at
// what its children actually are.
export const TransformableView = forwardRef<TransformableViewHandle, Props>(
  function TransformableView(
    { children, frameWidth, frameHeight, backgroundColor, minScale, maxScale, initial, onChange },
    ref
  ) {
    const { gesture, animatedStyle, reset, getSnapshot } = useTransformGesture({
      minScale,
      maxScale,
      initial,
      onChange,
    });

    useImperativeHandle(ref, () => ({ getSnapshot, reset }), [getSnapshot, reset]);

    return (
      <View style={[styles.frame, { width: frameWidth, height: frameHeight, backgroundColor }]}>
        <GestureDetector gesture={gesture}>
          <Animated.View style={animatedStyle}>{children}</Animated.View>
        </GestureDetector>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
  },
});