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
  backgroundImageBlur?: number;
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


export const TransformableView = forwardRef<TransformableViewHandle, Props>(
  function TransformableView(
    { children, frameWidth, frameHeight, backgroundColor, backgroundImageUri, backgroundImageBlur = 0, minScale, maxScale, initial, onChange },
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
        {backgroundImageUri && <Image source={{ uri: backgroundImageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" blurRadius={backgroundImageBlur} />}
        <GestureDetector gesture={gesture}>
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
