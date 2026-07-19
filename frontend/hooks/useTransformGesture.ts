import { useCallback } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';

export type TransformState = {
  translateX: number;
  translateY: number;
  scale: number;
  rotation: number; 
};

type Options = {
  minScale?: number;
  maxScale?: number;
  initial?: Partial<TransformState>;
  onChange?: (t: TransformState) => void;
};

// Generic pan + pinch + rotate transform. Deliberately knows nothing
// about tweets, cards, or frames — it just needs *some* view to attach
// its gesture + animated style to. That's what makes it reusable for
// both the frame-crop preview today and the component-level editor
// (repositioning an avatar, a text block, etc.) later.
export function useTransformGesture(options: Options = {}) {
  // A framed card may be intentionally tiny. Keep a small positive floor to
  // avoid a singular transform while allowing it to be reduced substantially.
  const { minScale = 0.05, maxScale = 4, initial, onChange } = options;

  const translateX = useSharedValue(initial?.translateX ?? 0);
  const translateY = useSharedValue(initial?.translateY ?? 0);
  const scale = useSharedValue(initial?.scale ?? 1);
  const rotation = useSharedValue(initial?.rotation ?? 0);

  // Snapshot of values at gesture-start, so pan/pinch/rotate compose
  // from wherever the user left off instead of resetting each time.
  const start = useSharedValue({ x: 0, y: 0, scale: 1, rotation: 0 });

  const notify = useCallback(() => {
    onChange?.({
      translateX: translateX.value,
      translateY: translateY.value,
      scale: scale.value,
      rotation: rotation.value,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onChange]);

  const pan = Gesture.Pan()
    .onStart(() => {
      start.value = { ...start.value, x: translateX.value, y: translateY.value };
    })
    .onUpdate((e) => {
      translateX.value = start.value.x + e.translationX;
      translateY.value = start.value.y + e.translationY;
    })
    .onEnd(() => {
      runOnJS(notify)();
    });

  const pinch = Gesture.Pinch()
    .onStart(() => {
      start.value = { ...start.value, scale: scale.value };
    })
    .onUpdate((e) => {
      const next = start.value.scale * e.scale;
      scale.value = Math.min(maxScale, Math.max(minScale, next));
    })
    .onEnd(() => {
      runOnJS(notify)();
    });

  const rotate = Gesture.Rotation()
    .onStart(() => {
      start.value = { ...start.value, rotation: rotation.value };
    })
    .onUpdate((e) => {
      rotation.value = start.value.rotation + e.rotation;
    })
    .onEnd(() => {
      runOnJS(notify)();
    });

  const gesture = Gesture.Simultaneous(pan, pinch, rotate);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotateZ: `${(rotation.value * 180) / Math.PI}deg` },
    ],
  }));

  const reset = useCallback(() => {
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    scale.value = withTiming(1);
    rotation.value = withTiming(0);
  }, [translateX, translateY, scale, rotation]);

  // Synchronous read for export — call this at save/share time, not
  // during animation.
  const getSnapshot = useCallback(
    (): TransformState => ({
      translateX: translateX.value,
      translateY: translateY.value,
      scale: scale.value,
      rotation: rotation.value,
    }),
    [translateX, translateY, scale, rotation]
  );

  return { gesture, animatedStyle, reset, getSnapshot };
}
