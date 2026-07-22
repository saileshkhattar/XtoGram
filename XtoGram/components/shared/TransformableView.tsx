import { forwardRef, useImperativeHandle } from 'react';
import { Image, View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';
import { useTransformGesture, type TransformState } from '../../hooks/useTransformGesture';

type Props = {
  children: React.ReactNode;
  frameWidth: number;
  frameHeight: number;
  backgroundColor?: string;
  backgroundImageUri?: string;
  minScale?: number;
  maxScale?: number;
  initial?: Partial<TransformState>;
  onChange?: (t: TransformState) => void;
};

export type TransformableViewHandle = {
  getSnapshot: () => TransformState;
  reset: () => void;
  setScale: (value: number) => void;
};

// Content-agnostic: hands pan/pinch/rotate to whatever it wraps, and
// clips it to a fixed frame. Used today for cropping the card inside a
// custom-size frame; reusable later for e.g. repositioning an avatar
// or a text block in the full component editor — it never looks at
// what its children actually are.
export const TransformableView = forwardRef<TransformableViewHandle, Props>(
  function TransformableView(
    { children, frameWidth, frameHeight, backgroundColor, backgroundImageUri, minScale, maxScale, initial, onChange },
    ref
  ) {
    const { gesture, animatedStyle, reset, getSnapshot, setScale } = useTransformGesture({
      minScale,
      maxScale,
      initial,
      onChange,
    });

    useImperativeHandle(
      ref,
      () => ({ getSnapshot, reset, setScale }),
      [getSnapshot, reset, setScale]
    );

    return (
      <View style={[styles.frame, { width: frameWidth, height: frameHeight, backgroundColor }]}>
        {backgroundImageUri && <Image source={{ uri: backgroundImageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />}
        <GestureDetector gesture={gesture}>
          {/* Sized to match the frame exactly, with content centered inside it,
              so scale/rotate pivot around the frame's own center — the same
              center exportFrame.tsx uses when compositing the final image. */}
          <Animated.View
            style={[
              styles.content,
              { width: frameWidth, height: frameHeight },
              animatedStyle,
            ]}
          >
            {children}
          </Animated.View>
        </GestureDetector>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
